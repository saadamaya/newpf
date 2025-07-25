import { DeliveryChallan, Invoice, LedgerEntry, CashFlow, Vendor, Customer } from '../types';
import { supabase } from './supabase';

class Database {
  async init(): Promise<void> {
    // Test connection
    const { error } = await supabase.from('cash_flow').select('id').limit(1);
    if (error) {
      console.error('Supabase connection error:', error);
      throw new Error('Failed to connect to Supabase');
    }
  }

  // Delivery Challans
  async saveDC(dc: DeliveryChallan): Promise<void> {
    const { error } = await supabase
      .from('delivery_challans')
      .upsert({
        id: dc.id,
        date: dc.date,
        vendor_name: dc.vendorName,
        vendor_price: dc.vendorPrice,
        cages: dc.cages,
        total_birds: dc.totalBirds,
        total_weight: dc.totalWeight,
        total_amount: dc.totalAmount,
        previous_due: dc.previousDue,
        amount_paying: dc.amountPaying,
        payment_mode: dc.paymentMode,
        cash_amount: dc.cashAmount,
        online_amount: dc.onlineAmount,
        new_due: dc.newDue,
        created_at: dc.createdAt,
        updated_at: dc.updatedAt
      });

    if (error) throw error;
  }

  async getDCs(): Promise<DeliveryChallan[]> {
    const { data, error } = await supabase
      .from('delivery_challans')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      date: row.date,
      vendorName: row.vendor_name,
      vendorPrice: row.vendor_price,
      cages: row.cages,
      totalBirds: row.total_birds,
      totalWeight: row.total_weight,
      totalAmount: row.total_amount,
      previousDue: row.previous_due,
      amountPaying: row.amount_paying,
      paymentMode: row.payment_mode as 'Cash' | 'Online' | 'Both',
      cashAmount: row.cash_amount,
      onlineAmount: row.online_amount,
      newDue: row.new_due,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async getDCsByDate(date: string): Promise<DeliveryChallan[]> {
    const { data, error } = await supabase
      .from('delivery_challans')
      .select('*')
      .eq('date', date);

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      date: row.date,
      vendorName: row.vendor_name,
      vendorPrice: row.vendor_price,
      cages: row.cages,
      totalBirds: row.total_birds,
      totalWeight: row.total_weight,
      totalAmount: row.total_amount,
      previousDue: row.previous_due,
      amountPaying: row.amount_paying,
      paymentMode: row.payment_mode as 'Cash' | 'Online' | 'Both',
      cashAmount: row.cash_amount,
      onlineAmount: row.online_amount,
      newDue: row.new_due,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async checkDCExists(date: string, vendorName: string): Promise<DeliveryChallan | null> {
    const { data, error } = await supabase
      .from('delivery_challans')
      .select('*')
      .eq('date', date)
      .eq('vendor_name', vendorName)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) return null;

    return {
      id: data.id,
      date: data.date,
      vendorName: data.vendor_name,
      vendorPrice: data.vendor_price,
      cages: data.cages,
      totalBirds: data.total_birds,
      totalWeight: data.total_weight,
      totalAmount: data.total_amount,
      previousDue: data.previous_due,
      amountPaying: data.amount_paying,
      paymentMode: data.payment_mode as 'Cash' | 'Online' | 'Both',
      cashAmount: data.cash_amount,
      onlineAmount: data.online_amount,
      newDue: data.new_due,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  // Invoices
  async saveInvoice(invoice: Invoice): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .upsert({
        id: invoice.id,
        invoice_number: invoice.invoiceNumber,
        date: invoice.date,
        customer_name: invoice.customerName,
        cages: invoice.cages,
        total_birds: invoice.totalBirds,
        total_weight: invoice.totalWeight,
        rate: invoice.rate,
        total_amount: invoice.totalAmount,
        previous_due: invoice.previousDue,
        amount_paying: invoice.amountPaying,
        payment_mode: invoice.paymentMode,
        cash_amount: invoice.cashAmount,
        online_amount: invoice.onlineAmount,
        new_due: invoice.newDue,
        version: invoice.version,
        cash_payment: invoice.cashPayment,
        online_payment: invoice.onlinePayment,
        total_payment: invoice.totalPayment,
        profit_loss: invoice.profitLoss,
        purchase_rate: invoice.purchaseRate,
        created_at: invoice.createdAt,
        updated_at: invoice.updatedAt
      });

    if (error) throw error;
  }

  async getInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      date: row.date,
      customerName: row.customer_name,
      cages: row.cages,
      totalBirds: row.total_birds,
      totalWeight: row.total_weight,
      rate: row.rate,
      totalAmount: row.total_amount,
      previousDue: row.previous_due,
      amountPaying: row.amount_paying,
      paymentMode: row.payment_mode as 'Cash' | 'Online' | 'Both',
      cashAmount: row.cash_amount,
      onlineAmount: row.online_amount,
      newDue: row.new_due,
      version: row.version,
      cashPayment: row.cash_payment,
      onlinePayment: row.online_payment,
      totalPayment: row.total_payment,
      profitLoss: row.profit_loss,
      purchaseRate: row.purchase_rate,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) return null;

    return {
      id: data.id,
      invoiceNumber: data.invoice_number,
      date: data.date,
      customerName: data.customer_name,
      cages: data.cages,
      totalBirds: data.total_birds,
      totalWeight: data.total_weight,
      rate: data.rate,
      totalAmount: data.total_amount,
      previousDue: data.previous_due,
      amountPaying: data.amount_paying,
      paymentMode: data.payment_mode as 'Cash' | 'Online' | 'Both',
      cashAmount: data.cash_amount,
      onlineAmount: data.online_amount,
      newDue: data.new_due,
      version: data.version,
      cashPayment: data.cash_payment,
      onlinePayment: data.online_payment,
      totalPayment: data.total_payment,
      profitLoss: data.profit_loss,
      purchaseRate: data.purchase_rate,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  // Ledger
  async saveLedgerEntry(entry: LedgerEntry): Promise<void> {
    const { error } = await supabase
      .from('ledger_entries')
      .upsert({
        id: entry.id,
        date: entry.date,
        entity_name: entry.entityName,
        entity_type: entry.entityType,
        type: entry.type,
        description: entry.description,
        amount: entry.amount,
        payment_amount: entry.paymentAmount,
        payment_mode: entry.paymentMode,
        balance: entry.balance,
        reference_id: entry.referenceId,
        created_at: entry.createdAt
      });

    if (error) throw error;
  }

  async getLedgerEntries(): Promise<LedgerEntry[]> {
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      date: row.date,
      entityName: row.entity_name,
      entityType: row.entity_type as 'customer' | 'vendor',
      type: row.type as 'invoice' | 'dc' | 'payment',
      description: row.description,
      amount: row.amount,
      paymentAmount: row.payment_amount,
      paymentMode: row.payment_mode,
      balance: row.balance,
      referenceId: row.reference_id,
      createdAt: row.created_at
    }));
  }

  async getLedgerEntriesByEntity(entityName: string): Promise<LedgerEntry[]> {
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('entity_name', entityName)
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      date: row.date,
      entityName: row.entity_name,
      entityType: row.entity_type as 'customer' | 'vendor',
      type: row.type as 'invoice' | 'dc' | 'payment',
      description: row.description,
      amount: row.amount,
      paymentAmount: row.payment_amount,
      paymentMode: row.payment_mode,
      balance: row.balance,
      referenceId: row.reference_id,
      createdAt: row.created_at
    }));
  }

  // Cash Flow
  async getCashFlow(): Promise<CashFlow> {
    const { data, error } = await supabase
      .from('cash_flow')
      .select('*')
      .eq('id', 'current')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return { cashBalance: 0, onlineBalance: 0, totalBalance: 0 };
    }

    return {
      cashBalance: data.cash_balance,
      onlineBalance: data.online_balance,
      totalBalance: data.total_balance
    };
  }

  async updateCashFlow(cashFlow: CashFlow): Promise<void> {
    const { error } = await supabase
      .from('cash_flow')
      .upsert({
        id: 'current',
        cash_balance: cashFlow.cashBalance,
        online_balance: cashFlow.onlineBalance,
        total_balance: cashFlow.totalBalance,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  // Utilities
  async getVendors(): Promise<Vendor[]> {
    const entries = await this.getLedgerEntries();
    const vendorMap = new Map<string, Vendor>();

    entries.forEach(entry => {
      if (entry.entityType === 'vendor') {
        if (!vendorMap.has(entry.entityName)) {
          vendorMap.set(entry.entityName, {
            name: entry.entityName,
            currentDue: 0,
            lastTransactionDate: entry.date
          });
        }
        const vendor = vendorMap.get(entry.entityName)!;
        vendor.currentDue = entry.balance;
        if (new Date(entry.date) > new Date(vendor.lastTransactionDate)) {
          vendor.lastTransactionDate = entry.date;
        }
      }
    });

    return Array.from(vendorMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCustomers(): Promise<Customer[]> {
    const entries = await this.getLedgerEntries();
    const customerMap = new Map<string, Customer>();

    entries.forEach(entry => {
      if (entry.entityType === 'customer') {
        if (!customerMap.has(entry.entityName)) {
          customerMap.set(entry.entityName, {
            name: entry.entityName,
            currentDue: 0,
            advance: 0,
            lastTransactionDate: entry.date
          });
        }
        const customer = customerMap.get(entry.entityName)!;
        if (entry.balance >= 0) {
          customer.currentDue = entry.balance;
          customer.advance = 0;
        } else {
          customer.currentDue = 0;
          customer.advance = Math.abs(entry.balance);
        }
        if (new Date(entry.date) > new Date(customer.lastTransactionDate)) {
          customer.lastTransactionDate = entry.date;
        }
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  // Cage Locks
  async lockCage(cageNo: string, dcDate: string, invoiceId: string, customerName: string): Promise<void> {
    const { error } = await supabase
      .from('cage_locks')
      .upsert({
        id: `${cageNo}_${dcDate}`,
        cage_no: cageNo,
        dc_date: dcDate,
        invoice_id: invoiceId,
        customer_name: customerName,
        locked_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  async unlockCage(cageNo: string, dcDate: string): Promise<void> {
    const { error } = await supabase
      .from('cage_locks')
      .delete()
      .eq('id', `${cageNo}_${dcDate}`);

    if (error) throw error;
  }

  async getCageLocks(): Promise<any[]> {
    const { data, error } = await supabase
      .from('cage_locks')
      .select('*');

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      cageNo: row.cage_no,
      dcDate: row.dc_date,
      invoiceId: row.invoice_id,
      customerName: row.customer_name,
      lockedAt: row.locked_at
    }));
  }

  async unlockCagesByInvoice(invoiceId: string): Promise<void> {
    const { error } = await supabase
      .from('cage_locks')
      .delete()
      .eq('invoice_id', invoiceId);

    if (error) throw error;
  }
}

export const db = new Database();