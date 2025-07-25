export interface Cage {
  cageNo: string;
  birdCount: number;
  weight: number;
}

export interface DeliveryChallan {
  id: string;
  date: string;
  vendorName: string;
  vendorPrice: number;
  cages: Cage[];
  totalBirds: number;
  totalWeight: number;
  totalAmount: number;
  previousDue: number;
  amountPaying: number;
  paymentMode: 'Cash' | 'Online' | 'Both';
  cashAmount?: number;
  onlineAmount?: number;
  newDue: number;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  cages: InvoiceCage[];
  totalBirds: number;
  totalWeight: number;
  rate: number;
  totalAmount: number;
  previousDue: number;
  amountPaying: number;
  paymentMode: 'Cash' | 'Online' | 'Both';
  cashAmount?: number;
  onlineAmount?: number;
  newDue: number;
  createdAt: string;
  updatedAt: string;
  version: number;
  cashPayment: number;
  onlinePayment: number;
  totalPayment: number;
  profitLoss: number;
  purchaseRate: number;
}

export interface InvoiceCage {
  cageNo: string;
  birdCount: number;
  weight: number;
  fromDC?: string;
  dcDate?: string;
  purchaseRate?: number;
}

export interface LedgerEntry {
  id: string;
  date: string;
  entityName: string;
  entityType: 'customer' | 'vendor';
  type: 'invoice' | 'dc' | 'payment';
  description: string;
  amount: number;
  paymentAmount?: number;
  paymentMode?: string;
  balance: number;
  referenceId: string;
  createdAt: string;
}

export interface CashFlow {
  cashBalance: number;
  onlineBalance: number;
  totalBalance: number;
}

export interface ProfitLoss {
  dailyProfit: number;
  pendingProfit: number;
  profitInMarket: number;
  expectedProfit: number;
  monthlyProfit: number;
  monthlyProfitDue: number;
  withdrawableProfit: number;
}

export interface Vendor {
  name: string;
  currentDue: number;
  lastTransactionDate: string;
}

export interface Customer {
  name: string;
  currentDue: number;
  advance: number;
  lastTransactionDate: string;
}
export interface CageLock {
  cageNo: string;
  dcDate: string;
  invoiceId: string;
  customerName: string;
  lockedAt: string;
}
