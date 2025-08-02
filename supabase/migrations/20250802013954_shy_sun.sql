/*
  # Complete SuperPoultry ERP Database Schema

  This migration creates the complete database schema for the SuperPoultry ERP system from scratch.

  ## New Tables Created:
  1. **delivery_challans** - Store delivery challan records with vendor details and cage information
  2. **invoices** - Store invoice records with customer details, cages, and payment information  
  3. **ledger_entries** - Store all financial transactions and balance tracking
  4. **cash_flow** - Store current cash and online balance information
  5. **cage_locks** - Track which cages are locked/in use by invoices
  6. **settings** - Store application configuration and settings

  ## Security:
  - Row Level Security (RLS) enabled on all tables
  - Public access policies for all operations (suitable for single-tenant use)
  - Proper indexes for performance optimization

  ## Features:
  - JSONB columns for flexible cage data storage
  - Proper foreign key relationships where applicable
  - Automatic timestamps with timezone support
  - Numeric precision for financial calculations
*/

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS cage_locks CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS cash_flow CASCADE;
DROP TABLE IF EXISTS ledger_entries CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS delivery_challans CASCADE;

-- Create delivery_challans table
CREATE TABLE delivery_challans (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
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

-- Create invoices table
CREATE TABLE invoices (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
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

-- Create ledger_entries table
CREATE TABLE ledger_entries (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
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

-- Create cash_flow table
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

-- Create cage_locks table
CREATE TABLE cage_locks (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  cage_no text NOT NULL,
  locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create settings table
CREATE TABLE settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_delivery_challans_date ON delivery_challans(date);
CREATE INDEX idx_delivery_challans_vendor ON delivery_challans(vendor_name);
CREATE INDEX idx_delivery_challans_date_vendor ON delivery_challans(date, vendor_name);

CREATE INDEX idx_invoices_date ON invoices(date);
CREATE INDEX idx_invoices_customer ON invoices(customer_name);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

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

-- Create policies for public access (suitable for single-tenant ERP)
CREATE POLICY "Allow all operations on delivery_challans" ON delivery_challans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ledger_entries" ON ledger_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on cash_flow" ON cash_flow FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on cage_locks" ON cage_locks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- Insert initial cash_flow record
INSERT INTO cash_flow (id, cash_balance, online_balance, total_balance, description) 
VALUES ('current', 0, 0, 0, 'Initial cash flow record')
ON CONFLICT (id) DO NOTHING;

-- Insert initial settings
INSERT INTO settings (key, value) VALUES 
('app_version', '"1.0.0"'),
('last_backup', 'null'),
('business_name', '"SuperPoultry ERP"')
ON CONFLICT (key) DO NOTHING;