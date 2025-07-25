import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      delivery_challans: {
        Row: {
          id: string;
          date: string;
          vendor_name: string;
          vendor_price: number;
          cages: any[];
          total_birds: number;
          total_weight: number;
          total_amount: number;
          previous_due: number;
          amount_paying: number;
          payment_mode: string;
          cash_amount?: number;
          online_amount?: number;
          new_due: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          date: string;
          vendor_name: string;
          vendor_price: number;
          cages: any[];
          total_birds: number;
          total_weight: number;
          total_amount: number;
          previous_due: number;
          amount_paying: number;
          payment_mode: string;
          cash_amount?: number;
          online_amount?: number;
          new_due: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          vendor_name?: string;
          vendor_price?: number;
          cages?: any[];
          total_birds?: number;
          total_weight?: number;
          total_amount?: number;
          previous_due?: number;
          amount_paying?: number;
          payment_mode?: string;
          cash_amount?: number;
          online_amount?: number;
          new_due?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          date: string;
          customer_name: string;
          cages: any[];
          total_birds: number;
          total_weight: number;
          rate: number;
          total_amount: number;
          previous_due: number;
          amount_paying: number;
          payment_mode: string;
          cash_amount?: number;
          online_amount?: number;
          new_due: number;
          version: number;
          cash_payment: number;
          online_payment: number;
          total_payment: number;
          profit_loss: number;
          purchase_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          invoice_number: string;
          date: string;
          customer_name: string;
          cages: any[];
          total_birds: number;
          total_weight: number;
          rate: number;
          total_amount: number;
          previous_due: number;
          amount_paying: number;
          payment_mode: string;
          cash_amount?: number;
          online_amount?: number;
          new_due: number;
          version?: number;
          cash_payment: number;
          online_payment: number;
          total_payment: number;
          profit_loss: number;
          purchase_rate: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          date?: string;
          customer_name?: string;
          cages?: any[];
          total_birds?: number;
          total_weight?: number;
          rate?: number;
          total_amount?: number;
          previous_due?: number;
          amount_paying?: number;
          payment_mode?: string;
          cash_amount?: number;
          online_amount?: number;
          new_due?: number;
          version?: number;
          cash_payment?: number;
          online_payment?: number;
          total_payment?: number;
          profit_loss?: number;
          purchase_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      ledger_entries: {
        Row: {
          id: string;
          date: string;
          entity_name: string;
          entity_type: string;
          type: string;
          description: string;
          amount: number;
          payment_amount?: number;
          payment_mode?: string;
          balance: number;
          reference_id: string;
          created_at: string;
        };
        Insert: {
          id: string;
          date: string;
          entity_name: string;
          entity_type: string;
          type: string;
          description: string;
          amount: number;
          payment_amount?: number;
          payment_mode?: string;
          balance: number;
          reference_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          entity_name?: string;
          entity_type?: string;
          type?: string;
          description?: string;
          amount?: number;
          payment_amount?: number;
          payment_mode?: string;
          balance?: number;
          reference_id?: string;
          created_at?: string;
        };
      };
      cash_flow: {
        Row: {
          id: string;
          cash_balance: number;
          online_balance: number;
          total_balance: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cash_balance: number;
          online_balance: number;
          total_balance: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cash_balance?: number;
          online_balance?: number;
          total_balance?: number;
          updated_at?: string;
        };
      };
      cage_locks: {
        Row: {
          id: string;
          cage_no: string;
          dc_date: string;
          invoice_id: string;
          customer_name: string;
          locked_at: string;
        };
        Insert: {
          id: string;
          cage_no: string;
          dc_date: string;
          invoice_id: string;
          customer_name: string;
          locked_at?: string;
        };
        Update: {
          id?: string;
          cage_no?: string;
          dc_date?: string;
          invoice_id?: string;
          customer_name?: string;
          locked_at?: string;
        };
      };
      settings: {
        Row: {
          key: string;
          value: any;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: any;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: any;
          updated_at?: string;
        };
      };
    };
  };
}