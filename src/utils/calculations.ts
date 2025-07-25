import { Cage, InvoiceCage, DeliveryChallan, Invoice } from '../types';

export const roundDownToRupee = (amount: number): number => {
  return Math.floor(amount);
};

export const calculateDCTotals = (cages: Cage[], vendorPrice: number) => {
  const totalBirds = cages.reduce((sum, cage) => sum + cage.birdCount, 0);
  const totalWeight = cages.reduce((sum, cage) => sum + cage.weight, 0);
  const totalAmount = roundDownToRupee(totalWeight * vendorPrice);
  
  return { totalBirds, totalWeight, totalAmount };
};

export const calculateInvoiceTotals = (cages: InvoiceCage[], rate: number) => {
  const totalBirds = cages.reduce((sum, cage) => sum + cage.birdCount, 0);
  const totalWeight = cages.reduce((sum, cage) => sum + cage.weight, 0);
  const totalAmount = roundDownToRupee(totalWeight * rate);
  
  return { totalBirds, totalWeight, totalAmount };
};

export const calculateProfitLoss = (totalWeight: number, sellingRate: number, purchaseRate: number): number => {
  return roundDownToRupee((sellingRate - purchaseRate) * totalWeight);
};

export const generateInvoiceNumber = (customerName: string, date: string, version: number = 1, subVersion?: number): string => {
  const formattedDate = new Date(date).toLocaleDateString('en-GB').replace(/\//g, '-');
  const cleanCustomer = customerName.replace(/[^a-zA-Z0-9]/g, '');
  
  if (subVersion) {
    return `I${version}.${subVersion}_${cleanCustomer}_${formattedDate}_1`;
  }
  return `I${version}_${cleanCustomer}_${formattedDate}_1`;
};

export const parseCageInput = (input: string): Cage[] => {
  const lines = input.trim().split('\n').filter(line => line.trim());
  const cages: Cage[] = [];
  
  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 3) {
      const cageNo = parts[0];
      const birdCount = parseInt(parts[1]) || 0;
      const weight = parseFloat(parts[2]) || 0;
      
      if (cageNo && birdCount > 0 && weight > 0) {
        cages.push({ cageNo, birdCount, weight });
      }
    }
  });
  
  return cages;
};

export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const getCurrentDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getDateFromString = (dateStr: string): Date => {
  return new Date(dateStr);
};

export const formatDateForDisplay = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const getWeekdayFromDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long' });
};

export const getLast30DaysEntries = <T extends { date: string }>(entries: T[]): T[] => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return entries.filter(entry => new Date(entry.date) >= thirtyDaysAgo);
};