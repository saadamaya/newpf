import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Truck } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AutoSuggest } from '../components/AutoSuggest';
import { Select } from '../components/Select';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { DeliveryChallan, Cage } from '../types';
import { db } from '../utils/database';
import {
  parseCageInput,
  calculateDCTotals,
  getCurrentDateString,
  formatCurrency,
  getLast30DaysEntries,
  roundDownToRupee
} from '../utils/calculations';

export const DeliveryChallansPanel: React.FC = () => {
  const [formData, setFormData] = useState({
    date: getCurrentDateString(),
    vendorName: '',
    vendorPrice: '',
    cageInput: '',
    previousDue: 0,
    amountPaying: '',
    paymentMode: 'Cash' as 'Cash' | 'Online' | 'Both',
    cashAmount: '',
    onlineAmount: ''
  });

  const [cages, setCages] = useState<Cage[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [recentDCs, setRecentDCs] = useState<DeliveryChallan[]>([]);
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [existingDC, setExistingDC] = useState<DeliveryChallan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const parsed = parseCageInput(formData.cageInput);
    setCages(parsed);
  }, [formData.cageInput]);

  useEffect(() => {
    if (formData.vendorName) {
      loadVendorDue();
    }
  }, [formData.vendorName]);

  const loadData = async () => {
    try {
      const vendorData = await db.getVendors();
      setVendors(vendorData.map(v => v.name));
      
      const allDCs = await db.getDCs();
      setRecentDCs(getLast30DaysEntries(allDCs));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadVendorDue = async () => {
    try {
      const vendorData = await db.getVendors();
      const vendor = vendorData.find(v => v.name === formData.vendorName);
      setFormData(prev => ({
        ...prev,
        previousDue: vendor?.currentDue || 0
      }));
    } catch (error) {
      console.error('Error loading vendor due:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddVendor = (name: string) => {
    setVendors(prev => [...prev, name]);
    setFormData(prev => ({
      ...prev,
      vendorName: name,
      previousDue: 0
    }));
  };

  const calculateTotals = () => {
    const vendorPrice = parseFloat(formData.vendorPrice) || 0;
    return calculateDCTotals(cages, vendorPrice);
  };

  const calculateNewDue = () => {
    const { totalAmount } = calculateTotals();
    const amountPaying = parseFloat(formData.amountPaying) || 0;
    return roundDownToRupee((formData.previousDue + totalAmount) - amountPaying);
  };

  const validateForm = (): string | null => {
    if (!formData.date) return 'Date is required';
    if (!formData.vendorName.trim()) return 'Vendor name is required';
    if (!formData.vendorPrice || parseFloat(formData.vendorPrice) <= 0) return 'Valid vendor price is required';
    if (cages.length === 0) return 'At least one cage is required';
    
    const amountPaying = parseFloat(formData.amountPaying) || 0;
    if (formData.paymentMode === 'Both') {
      const cashAmount = parseFloat(formData.cashAmount) || 0;
      const onlineAmount = parseFloat(formData.onlineAmount) || 0;
      if (Math.abs((cashAmount + onlineAmount) - amountPaying) > 0.01) {
        return 'Cash + Online amounts must equal total payment amount';
      }
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    try {
      const existing = await db.checkDCExists(formData.date, formData.vendorName);
      if (existing) {
        setExistingDC(existing);
        setShowOverwriteModal(true);
        return;
      }

      await saveDC(false);
    } catch (error) {
      console.error('Error checking existing DC:', error);
    }
  };

  const saveDC = async (isOverwrite: boolean) => {
    setIsLoading(true);
    
    try {
      const { totalBirds, totalWeight, totalAmount } = calculateTotals();
      const amountPaying = parseFloat(formData.amountPaying) || 0;
      
      const dc: DeliveryChallan = {
        id: isOverwrite && existingDC ? existingDC.id : `dc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: formData.date,
        vendorName: formData.vendorName.trim(),
        vendorPrice: parseFloat(formData.vendorPrice),
        cages: [...cages],
        totalBirds,
        totalWeight,
        totalAmount,
        previousDue: formData.previousDue,
        amountPaying,
        paymentMode: formData.paymentMode,
        cashAmount: formData.paymentMode === 'Both' ? parseFloat(formData.cashAmount) : undefined,
        onlineAmount: formData.paymentMode === 'Both' ? parseFloat(formData.onlineAmount) : undefined,
        newDue: calculateNewDue(),
        createdAt: isOverwrite && existingDC ? existingDC.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save DC
      await db.saveDC(dc);

      // Update ledger
      await updateLedgerAndCashFlow(dc);

      // Reset form
      resetForm();
      setShowOverwriteModal(false);
      setExistingDC(null);
      
      // Reload data
      await loadData();
      
      alert('Delivery Challan saved successfully!');
    } catch (error) {
      console.error('Error saving DC:', error);
      alert('Error saving Delivery Challan');
    } finally {
      setIsLoading(false);
    }
  };

  const updateLedgerAndCashFlow = async (dc: DeliveryChallan) => {
    // Add DC entry to ledger
    await db.saveLedgerEntry({
      id: `ledger_dc_${dc.id}`,
      date: dc.date,
      entityName: dc.vendorName,
      entityType: 'vendor',
      type: 'dc',
      description: `DC - ${dc.totalBirds} birds, ${dc.totalWeight}kg`,
      amount: dc.totalAmount,
      balance: dc.newDue,
      referenceId: dc.id,
      createdAt: new Date().toISOString()
    });

    // Add payment entry if any payment made
    if (dc.amountPaying > 0) {
      await db.saveLedgerEntry({
        id: `ledger_payment_${dc.id}`,
        date: dc.date,
        entityName: dc.vendorName,
        entityType: 'vendor',
        type: 'payment',
        description: `Payment - ${dc.paymentMode}`,
        amount: -dc.amountPaying,
        paymentAmount: dc.amountPaying,
        paymentMode: dc.paymentMode,
        balance: dc.newDue,
        referenceId: dc.id,
        createdAt: new Date().toISOString()
      });

      // Update cash flow
      const currentCashFlow = await db.getCashFlow();
      let newCashFlow = { ...currentCashFlow };

      if (dc.paymentMode === 'Cash') {
        newCashFlow.cashBalance = Math.max(0, newCashFlow.cashBalance - dc.amountPaying);
      } else if (dc.paymentMode === 'Online') {
        newCashFlow.onlineBalance = Math.max(0, newCashFlow.onlineBalance - dc.amountPaying);
      } else if (dc.paymentMode === 'Both') {
        newCashFlow.cashBalance = Math.max(0, newCashFlow.cashBalance - (dc.cashAmount || 0));
        newCashFlow.onlineBalance = Math.max(0, newCashFlow.onlineBalance - (dc.onlineAmount || 0));
      }

      newCashFlow.totalBalance = newCashFlow.cashBalance + newCashFlow.onlineBalance;
      await db.updateCashFlow(newCashFlow);
    }
  };

  const resetForm = () => {
    setFormData({
      date: getCurrentDateString(),
      vendorName: '',
      vendorPrice: '',
      cageInput: '',
      previousDue: 0,
      amountPaying: '',
      paymentMode: 'Cash',
      cashAmount: '',
      onlineAmount: ''
    });
    setCages([]);
  };

  const totals = calculateTotals();
  const newDue = calculateNewDue();

  const dcColumns = [
    { key: 'date', label: 'Date', type: 'date' as const },
    { key: 'vendorName', label: 'Vendor' },
    { key: 'totalBirds', label: 'Birds', type: 'number' as const },
    { key: 'totalWeight', label: 'Weight (kg)', type: 'number' as const },
    { key: 'totalAmount', label: 'Amount', type: 'currency' as const },
    { key: 'amountPaying', label: 'Paid', type: 'currency' as const },
    { key: 'newDue', label: 'New Due', type: 'currency' as const }
  ];

  return (
    <div className="space-y-6">
      <Card title="New Delivery Challan" headerActions={
        <Button icon={Plus} onClick={resetForm} variant="secondary" size="sm">
          Clear Form
        </Button>
      }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(value) => handleInputChange('date', value)}
              required
            />

            <AutoSuggest
              label="Vendor Name"
              value={formData.vendorName}
              onChange={(value) => handleInputChange('vendorName', value)}
              suggestions={vendors}
              onAddNew={handleAddVendor}
              placeholder="Enter or select vendor"
              required
            />

            <Input
              label="Vendor Price (per kg)"
              type="number"
              value={formData.vendorPrice}
              onChange={(value) => handleInputChange('vendorPrice', value)}
              placeholder="₹ per kg"
              required
            />

            <Input
              label="Cages (CageNo BirdCount Weight)"
              type="textarea"
              value={formData.cageInput}
              onChange={(value) => handleInputChange('cageInput', value)}
              placeholder="C1 100 45.5&#10;C2 80 38.2&#10;C3 120 55.0"
              rows={6}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Calculations Display */}
            <div className="bg-gray-300 rounded-lg p-4 shadow-neumorphic-inset">
              <h4 className="font-semibold text-gray-800 mb-3">Calculations</h4>
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
                  <span>Total Amount:</span>
                  <span className="font-medium">{formatCurrency(totals.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-gray-300 rounded-lg p-4 shadow-neumorphic-inset">
              <h4 className="font-semibold text-gray-800 mb-3">Payment</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Previous Due:</span>
                  <span className="font-medium">{formatCurrency(formData.previousDue)}</span>
                </div>

                <Input
                  label="Amount Paying Now"
                  type="number"
                  value={formData.amountPaying}
                  onChange={(value) => handleInputChange('amountPaying', value)}
                  placeholder="0"
                />

                <Select
                  label="Payment Mode"
                  value={formData.paymentMode}
                  onChange={(value) => handleInputChange('paymentMode', value)}
                  options={[
                    { value: 'Cash', label: 'Cash' },
                    { value: 'Online', label: 'Online' },
                    { value: 'Both', label: 'Both' }
                  ]}
                />

                {formData.paymentMode === 'Both' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Cash Amount"
                      type="number"
                      value={formData.cashAmount}
                      onChange={(value) => handleInputChange('cashAmount', value)}
                      placeholder="0"
                    />
                    <Input
                      label="Online Amount"
                      type="number"
                      value={formData.onlineAmount}
                      onChange={(value) => handleInputChange('onlineAmount', value)}
                      placeholder="0"
                    />
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-gray-400">
                  <span className="text-sm font-medium">New Due:</span>
                  <span className="font-bold text-lg">{formatCurrency(newDue)}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading || cages.length === 0}
              className="w-full"
              size="lg"
              icon={Truck}
            >
              {isLoading ? 'Saving...' : 'Save Delivery Challan'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Last 30 Days */}
      <Card title="Last 30 Days" headerActions={
        <Button icon={Calendar} variant="secondary" size="sm">
          View All
        </Button>
      }>
        <DataTable
          data={recentDCs}
          columns={dcColumns}
          emptyMessage="No delivery challans in the last 30 days"
        />
      </Card>

      {/* Overwrite Modal */}
      <Modal
        isOpen={showOverwriteModal}
        onClose={() => setShowOverwriteModal(false)}
        title="DC Already Exists"
        variant="warning"
        onConfirm={() => saveDC(true)}
        onCancel={() => setShowOverwriteModal(false)}
        confirmText="Overwrite"
        cancelText="Cancel"
      >
        <p className="text-gray-600 mb-4">
          A Delivery Challan already exists for <strong>{formData.vendorName}</strong> on{' '}
          <strong>{new Date(formData.date).toLocaleDateString('en-IN')}</strong>.
        </p>
        <p className="text-gray-600">
          Do you want to overwrite the existing DC with the new data?
        </p>
        {existingDC && (
          <div className="mt-4 p-3 bg-gray-300 rounded-lg">
            <h5 className="font-medium text-gray-800 mb-2">Existing DC:</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Birds: {existingDC.totalBirds}, Weight: {existingDC.totalWeight}kg</div>
              <div>Amount: {formatCurrency(existingDC.totalAmount)}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};