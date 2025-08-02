/*
  # Complete SuperPoultry ERP Database Schema

  1. New Tables
    - `delivery_challans` - Store delivery challan records with vendor details
    - `invoices` - Store invoice records with customer details  
    - `ledger_entries` - Track all financial transactions
    - `cash_flow` - Manage cash and online balance (singleton table)
    - `cage_locks` - Track locked cages during invoice processing
    - `settings` - Store application configuration

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (single-tenant application)

  3. Performance
    - Add indexes for frequently queried columns
    - Optimize for date-based and entity-based queries

  4. Data Integrity
    - Proper constraints and data types
    - JSONB for flexible cage data storage
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS delivery_challans CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS ledger_entries CASCADE;
DROP TABLE IF EXISTS cash_flow CASCADE;
DROP TABLE IF EXISTS cage_locks CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Delivery Challans Table
CREATE TABLE delivery_challans (
  id bigint PRIMARY KEY,
  date date NOT NULL,
  vendor_name text NOT NULL,
  vendor_price numeric(12,2) NOT NULL DEFAULT 0,
  cages jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_birds integer NOT NULL DEFAULT 0,
  total_weight numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  previous_due numeric(12,2) NOT NULL DEFAULT 0,
  amount_paying numeric(12,2) NOT NULL DEFAULT 0,
  payment_mode text NOT NULL DEFAULT 'Cash',
  cash_amount numeric(12,2) DEFAULT NULL,
  online_amount numeric(12,2) DEFAULT NULL,
  new_due numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invoices Table
CREATE TABLE invoices (
  id bigint PRIMARY KEY,
  invoice_number text NOT NULL,
  date date NOT NULL,
  customer_name text NOT NULL,
  cages jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_birds integer NOT NULL DEFAULT 0,
  total_weight numeric(12,2) NOT NULL DEFAULT 0,
  rate numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  previous_due numeric(12,2) NOT NULL DEFAULT 0,
  amount_paying numeric(12,2) NOT NULL DEFAULT 0,
  payment_mode text NOT NULL DEFAULT 'Cash',
  cash_amount numeric(12,2) DEFAULT NULL,
  online_amount numeric(12,2) DEFAULT NULL,
  new_due numeric(12,2) NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  cash_payment numeric(12,2) NOT NULL DEFAULT 0,
  online_payment numeric(12,2) NOT NULL DEFAULT 0,
  total_payment numeric(12,2) NOT NULL DEFAULT 0,
  profit_loss numeric(12,2) NOT NULL DEFAULT 0,
  purchase_rate numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ledger Entries Table
CREATE TABLE ledger_entries (
  id bigint PRIMARY KEY,
  date date NOT NULL,
  entity_name text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('customer', 'vendor')),
  type text NOT NULL CHECK (type IN ('invoice', 'dc', 'payment')),
  description text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_amount numeric(12,2) DEFAULT NULL,
  payment_mode text DEFAULT NULL,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  reference_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Cash Flow Table (singleton with text ID)
CREATE TABLE cash_flow (
  id text PRIMARY KEY DEFAULT 'current',
  status text DEFAULT 'active',
  cash_balance numeric(12,2) NOT NULL DEFAULT 0,
  online_balance numeric(12,2) NOT NULL DEFAULT 0,
  total_balance numeric(12,2) NOT NULL DEFAULT 0,
  description text DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cage Locks Table
CREATE TABLE cage_locks (
  id bigint PRIMARY KEY,
  cage_no text NOT NULL,
  locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Settings Table
CREATE TABLE settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_delivery_challans_date ON delivery_challans(date);
CREATE INDEX idx_delivery_challans_vendor ON delivery_challans(vendor_name);
CREATE INDEX idx_delivery_challans_date_vendor ON delivery_challans(date, vendor_name);

CREATE INDEX idx_invoices_date ON invoices(date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_customer ON invoices(customer_name);

CREATE INDEX idx_ledger_entries_date ON ledger_entries(date);
CREATE INDEX idx_ledger_entries_entity ON ledger_entries(entity_name);
CREATE INDEX idx_ledger_entries_type ON ledger_entries(entity_type);
CREATE INDEX idx_ledger_entries_reference ON ledger_entries(reference_id);

CREATE INDEX idx_cage_locks_cage_no ON cage_locks(cage_no);

-- Enable Row Level Security
ALTER TABLE delivery_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE cage_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (single-tenant application)
CREATE POLICY "Allow all operations on delivery_challans" ON delivery_challans FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on invoices" ON invoices FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ledger_entries" ON ledger_entries FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on cash_flow" ON cash_flow FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on cage_locks" ON cage_locks FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on settings" ON settings FOR ALL TO public USING (true) WITH CHECK (true);

-- Insert initial data
INSERT INTO cash_flow (id, cash_balance, online_balance, total_balance) 
VALUES ('current', 0, 0, 0) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO settings (key, value) 
VALUES ('app_version', '"1.0.0"'::jsonb) 
ON CONFLICT (key) DO NOTHING;