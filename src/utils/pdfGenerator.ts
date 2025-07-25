import jsPDF from 'jspdf';
import { Invoice } from '../types';
import { formatCurrency, formatDateForDisplay } from './calculations';

export const generateInvoicePDF = (invoice: Invoice): void => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('INVOICE', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('SuperPoultry', 20, 35);
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, 150, 35);
  doc.text(`Date: ${formatDateForDisplay(invoice.date)}`, 150, 45);
  
  // Customer details
  doc.text('Bill To:', 20, 60);
  doc.text(invoice.customerName, 20, 70);
  
  // Table header
  const startY = 90;
  doc.text('Cage No', 20, startY);
  doc.text('Birds', 60, startY);
  doc.text('Weight (kg)', 90, startY);
  doc.text('Rate', 130, startY);
  doc.text('Amount', 170, startY);
  
  // Draw line
  doc.line(20, startY + 5, 190, startY + 5);
  
  // Table content
  let currentY = startY + 15;
  invoice.cages.forEach((cage, index) => {
    doc.text(cage.cageNo, 20, currentY);
    doc.text(cage.birdCount.toString(), 60, currentY);
    doc.text(cage.weight.toFixed(2), 90, currentY);
    doc.text(invoice.rate.toString(), 130, currentY);
    doc.text(formatCurrency(cage.weight * invoice.rate), 170, currentY);
    currentY += 10;
  });
  
  // Totals
  currentY += 10;
  doc.line(20, currentY, 190, currentY);
  currentY += 10;
  
  doc.text(`Total Birds: ${invoice.totalBirds}`, 20, currentY);
  doc.text(`Total Weight: ${invoice.totalWeight.toFixed(2)} kg`, 20, currentY + 10);
  
  doc.text(`Previous Due: ${formatCurrency(invoice.previousDue)}`, 130, currentY);
  doc.text(`Invoice Amount: ${formatCurrency(invoice.totalAmount)}`, 130, currentY + 10);
  doc.text(`Amount Paid: ${formatCurrency(invoice.amountPaying)}`, 130, currentY + 20);
  doc.text(`New Due: ${formatCurrency(invoice.newDue)}`, 130, currentY + 30);
  
  // Payment mode
  currentY += 50;
  doc.text(`Payment Mode: ${invoice.paymentMode}`, 20, currentY);
  if (invoice.paymentMode === 'Both') {
    doc.text(`Cash: ${formatCurrency(invoice.cashAmount || 0)}`, 20, currentY + 10);
    doc.text(`Online: ${formatCurrency(invoice.onlineAmount || 0)}`, 20, currentY + 20);
  }
  
  // Save
  doc.save(`${invoice.invoiceNumber}.pdf`);
};