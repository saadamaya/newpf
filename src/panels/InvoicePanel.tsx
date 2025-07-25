import React, { useState, useEffect } from 'react';
import { Plus, FileText, Download, AlertTriangle } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AutoSuggest } from '../components/AutoSuggest';
import { DataTable } from '../components/DataTable';
import { CageGrid } from '../components/CageGrid';
import { PaymentSection } from '../components/PaymentSection';
import { Modal } from '../components/Modal';
import { Invoice, InvoiceCage, DeliveryChallan } from '../types';
import { db } from '../utils/database';
import {
  calculateInvoiceTotals,
  calculateProfitLoss,
  getCurrentDateString,
  formatCurrency,
  generateInvoiceNumber,
  roundDownToRupee
} from '../utils/calculations';
import { generateInvoicePDF } from '../utils/pdfGenerator';

export const InvoicePanel: React.FC = () => {
  const [formData, setFormData] = useState({
    date: getCurrentDateString(),
    customerName: '',
    previousDue: 0,
    advance: 0,
    rate: 0,
    cashPayment: 0,
    onlinePayment: 0
  });

  // *** FIXED: added rate and dcDate keys with defaults ***
  const [cages, setCages] = useState<InvoiceCage[]>([
    { cageNo: '', birdCount: 0, weight: 0, rate: 0, dcDate: '' }
  ]);

  const [customers, setCustomers] = useState<string[]>([]);
  const [availableDCs, setAvailableDCs] = useState<DeliveryChallan[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [lockedCages, setLockedCages] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.customerName) {
      loadCustomerDue();
    }
  }, [formData.customerName]);

  const loadData = async () => {
    try {
      const customerData = await db.getCustomers();
      setCustomers(customerData.map(c => c.name));
      
      const allInvoices = await db.getInvoices();
      setRecentInvoices(allInvoices.slice(0, 10));
      
      const allDCs = await db.getDCs();
      setAvailableDCs(allDCs);
      
      const locks = await db.getCageLocks();
      const lockSet = new Set(locks.map(lock => `${lock.cageNo}_${lock.dcDate}`));
      setLockedCages(lockSet);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadCustomerDue = async () => {
    try {
      const customerData = await db.getCustomers();
      const customer = customerData.find(c => c.name === formData.customerName);
      setFormData(prev => ({
        ...prev,
        previousDue: customer?.currentDue || 0,
        advance: customer?.advance || 0
      }));
    } catch (error) {
      console.error('Error loading customer due:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddCustomer = (name: string) => {
    setCustomers(prev => [...prev, name]);
    setFormData(prev => ({
      ...prev,
      customerName: name,
      previousDue: 0,
      advance: 0
    }));
  };

  const handleCageLockError = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const calculateTotals = () => {
    return calculateInvoiceTotals(cages, formData.rate);
  };

  const calculateProfitLossForInvoice = () => {
    const { totalAmount } = calculateTotals();
    const { totalWeight } = calculateTotals();
    
    const cagesWithPurchaseRate = cages.filter(cage => cage.purchaseRate);
    const avgPurchaseRate = cagesWithPurchaseRate.length > 0
      ? cagesWithPurchaseRate.reduce((sum, cage) => sum + (cage.purchaseRate || 0), 0) / cagesWithPurchaseRate.length
      : 0;
    
    return calculateProfitLoss(totalWeight, formData.rate, avgPurchaseRate);
  };

  // *** FIXED validateForm: removed cage.rate check from filter ***
  const validateForm = (): string | null => {
    if (!formData.date) return 'Date is required';
    if (!formData.customerName.trim()) return 'Customer name is required';
    if (!formData.rate || formData.rate <= 0) return 'Valid selling rate is required';
    
    const validCages = cages.filter(cage => 
      cage.cageNo.trim() && cage.birdCount > 0 && cage.weight > 0
    );
    if (validCages.length === 0) return 'At least one valid cage is required';
    
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    setIsLoading(true);
    
    try {
      const validCages = cages.filter(cage => 
        cage.cageNo.trim() && cage.birdCount > 0 && cage.weight > 0
      );
      
      const { totalBirds, totalWeight, totalAmount } = calculateInvoiceTotals(validCages, formData.rate);
      const totalPayment = formData.cashPayment + formData.onlinePayment;
      const netDue = formData.previousDue - formData.advance;
      const finalBalance = (netDue + totalAmount) - totalPayment;
      const profitLoss = calculateProfitLossForInvoice();
      
      const invoice: Invoice = {
        id: `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        invoiceNumber: generateInvoiceNumber(formData.customerName, formData.date, 1),
        date: formData.date,
        customerName: formData.customerName.trim(),
        cages: validCages,
        totalBirds,
        totalWeight,
        rate: formData.rate,
        totalAmount,
        previousDue: formData.previousDue,
        amountPaying: totalPayment,
        paymentMode: formData.cashPayment > 0 && formData.onlinePayment > 0 ? 'Both' : 
                    formData.cashPayment > 0 ? 'Cash' : 'Online',
        cashAmount: formData.cashPayment,
        onlineAmount: formData.onlinePayment,
        newDue: finalBalance,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        cashPayment: formData.cashPayment,
        onlinePayment: formData.onlinePayment,
        totalPayment,
        profitLoss,
        purchaseRate: validCages.length > 0 ? (validCages[0].purchaseRate || 0) : 0
      };

      for (const cage of validCages) {
        if (cage.dcDate) {
          await db.lockCage(cage.cageNo, cage.dcDate, invoice.id, invoice.customerName);
        }
      }

      await db.saveInvoice(invoice);

      await updateLedgerAndCashFlow(invoice);

      generateInvoicePDF(invoice);

      resetForm();
      
      await loadData();
      
      alert('Invoice created successfully!');
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error creating invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const updateLedgerAndCashFlow = async (invoice: Invoice) => {
    await db.saveLedgerEntry({
      id: `ledger_invoice_${invoice.id}`,
      date: invoice.date,
      entityName: invoice.customerName,
      entityType: 'customer',
      type: 'invoice',
      description: `Invoice ${invoice.invoiceNumber} - ${invoice.totalBirds} birds, ${invoice.totalWeight}kg`,
      amount: invoice.totalAmount,
      balance: invoice.newDue,
      referenceId: invoice.id,
      createdAt: new Date().toISOString()
    });

    if (invoice.totalPayment > 0) {
      await db.saveLedgerEntry({
        id: `ledger_payment_${invoice.id}`,
        date: invoice.date,
        entityName: invoice.customerName,
        entityType: 'customer',
        type: 'payment',
        description: `Payment - ${invoice.paymentMode}`,
        amount: -invoice.totalPayment,
        paymentAmount: invoice.totalPayment,
        paymentMode: invoice.paymentMode,
        balance: invoice.newDue,
        referenceId: invoice.id,
        createdAt: new Date().toISOString()
      });

      const currentCashFlow = await db.getCashFlow();
      let newCashFlow = { ...currentCashFlow };

      newCashFlow.cashBalance += invoice.cashPayment;
      newCashFlow.onlineBalance += invoice.onlinePayment;

      newCashFlow.totalBalance = newCashFlow.cashBalance + newCashFlow.onlineBalance;
      await db.updateCashFlow(newCashFlow);
    }
  };

  const resetForm = () => {
    setFormData({
      date: getCurrentDateString(),
      customerName: '',
      previousDue: 0,
      advance: 0,
      rate: 0,
      cashPayment: 0,
      onlinePayment: 0
    });
    // reset cages to initial with rate and dcDate included
    setCages([{ cageNo: '', birdCount: 0, weight: 0, rate: 0, dcDate: '' }]);
  };

  const totals = calculateTotals();
  const profitLoss = calculateProfitLossForInvoice();

  const invoiceColumns = [
    { key: 'invoiceNumber', label: 'Invoice No.' },
    { key: 'date', label: 'Date', type: 'date' as const },
    { key: 'customerName', label: 'Customer' },
    { key: 'totalBirds', label: 'Birds', type: 'number' as const },
    { key: 'totalAmount', label: 'Amount', type: 'currency' as const },
    { key: 'totalPayment', label: 'Paid', type: 'currency' as const },
    { key: 'newDue', label: 'Due', type: 'currency' as const }
  ];

  return (
    <div className="space-y-6">
      <Card title="New Invoice" headerActions={
        <Button icon={Plus} onClick={resetForm} variant="secondary" size="sm">
          Clear Form
        </Button>
      }>
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(value) => handleInputChange('date', value)}
              required
            />

            <AutoSuggest
              label="Customer Name"
              value={formData.customerName}
              onChange={(value) => handleInputChange('customerName', value)}
              suggestions={customers}
              onAddNew={handleAddCustomer}
              placeholder="Enter or select customer"
              required
            />

            <Input
              label="Selling Rate (₹/kg)"
              type="number"
              value={formData.rate}
              onChange={(value) => handleInputChange('rate', value)}
              placeholder="120"
              required
            />

            {/* Profit/Loss Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profit/Loss
              </label>
              <div className={`px-4 py-2 bg-gray-200 rounded-lg shadow-neumorphic-inset font-bold text-lg ${
                profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
              </div>
            </div>
          </div>

          {/* Cages Section */}
          <CageGrid
            cages={cages}
            onChange={setCages}
            availableDCs={availableDCs}
            lockedCages={lockedCages}
            onCageLockError={handleCageLockError}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Totals */}
            <div className="bg-gray-300 rounded-lg p-4 shadow-neumorphic-inset">
              <h4 className="font-semibold text-gray-800 mb-3">Invoice Totals</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Birds:</span>
                  <span className="font-medium">{totals.totalBirds}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Weight:</span>
                  <span className="font-medium">{totals.totalWeight.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Invoice Amount:</span>
                  <span className="font-medium">{formatCurrency(totals.totalAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-400 pt-2">
                  <span>Profit/Loss:</span>
                  <span className={`font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment */}
            <PaymentSection
              previousDue={formData.previousDue}
              advance={formData.advance}
              invoiceAmount={totals.totalAmount}
              cashPayment={formData.cashPayment}
              onlinePayment={formData.onlinePayment}
              onCashPaymentChange={(value) => setFormData(prev => ({ ...prev, cashPayment: value }))}
              onOnlinePaymentChange={(value) => setFormData(prev => ({ ...prev, onlinePayment: value }))}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading || totals.totalAmount === 0}
            className="w-full"
            size="lg"
            icon={FileText}
          >
            {isLoading ? 'Creating...' : 'Create Invoice & Generate PDF'}
          </Button>
        </div>
      </Card>

      {/* Recent Invoices */}
      <Card title="Recent Invoices">
        <DataTable
          data={recentInvoices}
          columns={invoiceColumns}
          onRowClick={(invoice) => generateInvoicePDF(invoice)}
          emptyMessage="No invoices created yet"
        />
      </Card>

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Cage Selection Error"
        variant="warning"
        onConfirm={() => setShowErrorModal(false)}
        confirmText="OK"
      >
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-8 w-8 text-orange-600" />
          <p className="text-gray-600">{errorMessage}</p>
        </div>
      </Modal>
    </div>
  );
};
