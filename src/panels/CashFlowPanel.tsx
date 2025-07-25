import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { CashFlow, LedgerEntry } from '../types';
import { db } from '../utils/database';
import { formatCurrency, getCurrentDateString } from '../utils/calculations';

export const CashFlowPanel: React.FC = () => {
  const [cashFlow, setCashFlow] = useState<CashFlow>({
    cashBalance: 0,
    onlineBalance: 0,
    totalBalance: 0
  });

  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'cash' | 'online'>('cash');
  const [adjustmentMode, setAdjustmentMode] = useState<'add' | 'subtract'>('add');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  useEffect(() => {
    loadCashFlowData();
  }, []);

  const loadCashFlowData = async () => {
    try {
      const currentCashFlow = await db.getCashFlow();
      setCashFlow(currentCashFlow);

      // Get recent payment transactions
      const ledgerEntries = await db.getLedgerEntries();
      const paymentEntries = ledgerEntries
        .filter(entry => entry.type === 'payment' && entry.paymentAmount)
        .slice(0, 20)
        .map(entry => ({
          date: entry.date,
          entityName: entry.entityName,
          entityType: entry.entityType,
          paymentMode: entry.paymentMode,
          amount: entry.paymentAmount,
          description: entry.description,
          balance: entry.balance
        }));

      setRecentTransactions(paymentEntries);
    } catch (error) {
      console.error('Error loading cash flow data:', error);
    }
  };

  const handleBalanceAdjustment = async () => {
    if (!adjustmentAmount || !adjustmentReason.trim()) {
      alert('Please enter amount and reason for adjustment');
      return;
    }

    try {
      const amount = parseFloat(adjustmentAmount);
      if (amount <= 0) {
        alert('Please enter a valid amount');
        return;
      }

      let newCashFlow = { ...cashFlow };
      const adjustedAmount = adjustmentMode === 'add' ? amount : -amount;

      if (adjustmentType === 'cash') {
        newCashFlow.cashBalance = Math.max(0, newCashFlow.cashBalance + adjustedAmount);
      } else {
        newCashFlow.onlineBalance = Math.max(0, newCashFlow.onlineBalance + adjustedAmount);
      }

      newCashFlow.totalBalance = newCashFlow.cashBalance + newCashFlow.onlineBalance;

      await db.updateCashFlow(newCashFlow);

      // Add ledger entry for adjustment
      await db.saveLedgerEntry({
        id: `ledger_adjustment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: getCurrentDateString(),
        entityName: 'Cash Flow Adjustment',
        entityType: 'customer',
        type: 'payment',
        description: `${adjustmentMode === 'add' ? '+' : '-'}${formatCurrency(amount)} (${adjustmentType.toUpperCase()}) - ${adjustmentReason}`,
        amount: adjustmentMode === 'add' ? amount : -amount,
        paymentAmount: amount,
        paymentMode: adjustmentType === 'cash' ? 'Cash' : 'Online',
        balance: 0,
        referenceId: 'adjustment',
        createdAt: new Date().toISOString()
      });

      // Reset form
      setAdjustmentAmount('');
      setAdjustmentReason('');
      setShowAdjustModal(false);

      // Reload data
      await loadCashFlowData();

      alert('Cash flow adjusted successfully');
    } catch (error) {
      console.error('Error adjusting cash flow:', error);
      alert('Error adjusting cash flow');
    }
  };

  const calculateDailyFlow = (days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentPayments = recentTransactions.filter(transaction => 
      new Date(transaction.date) >= cutoffDate
    );

    const cashIn = recentPayments
      .filter(t => t.entityType === 'customer')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const cashOut = recentPayments
      .filter(t => t.entityType === 'vendor')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return { cashIn, cashOut, net: cashIn - cashOut };
  };

  const weeklyFlow = calculateDailyFlow(7);
  const monthlyFlow = calculateDailyFlow(30);

  const flowCards = [
    {
      title: 'Cash Balance',
      value: cashFlow.cashBalance,
      icon: Wallet,
      color: 'green',
      description: 'Physical cash available'
    },
    {
      title: 'Online Balance',
      value: cashFlow.onlineBalance,
      icon: CreditCard,
      color: 'blue',
      description: 'Bank/digital balance'
    },
    {
      title: 'Total Balance',
      value: cashFlow.totalBalance,
      icon: TrendingUp,
      color: 'purple',
      description: 'Total available funds'
    }
  ];

  const transactionColumns = [
    { key: 'date', label: 'Date', type: 'date' as const },
    { key: 'entityName', label: 'Entity' },
    { key: 'entityType', label: 'Type' },
    { key: 'paymentMode', label: 'Mode' },
    { key: 'amount', label: 'Amount', type: 'currency' as const },
    { key: 'description', label: 'Description' }
  ];

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {flowCards.map((card) => {
          const Icon = card.icon;
          const colorClasses = {
            green: 'bg-green-100 text-green-600',
            blue: 'bg-blue-100 text-blue-600',
            purple: 'bg-purple-100 text-purple-600'
          };

          return (
            <Card key={card.title}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-800 mb-1">
                    {formatCurrency(card.value)}
                  </p>
                  <p className="text-xs text-gray-500">{card.description}</p>
                </div>
                <div className={`p-3 rounded-lg shadow-neumorphic-inset ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Flow Analysis */}
      <Card title="Cash Flow Analysis">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weekly Flow */}
          <div className="bg-gray-300 rounded-lg p-4 shadow-neumorphic-inset">
            <h5 className="font-medium text-gray-800 mb-3">Last 7 Days</h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Cash In</span>
                </div>
                <span className="font-medium text-green-600">{formatCurrency(weeklyFlow.cashIn)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-gray-600">Cash Out</span>
                </div>
                <span className="font-medium text-red-600">{formatCurrency(weeklyFlow.cashOut)}</span>
              </div>
              
              <div className="flex items-center justify-between border-t border-gray-400 pt-2">
                <span className="text-sm font-medium text-gray-800">Net Flow</span>
                <span className={`font-bold ${weeklyFlow.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(weeklyFlow.net))}
                  {weeklyFlow.net < 0 && ' Out'}
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Flow */}
          <div className="bg-gray-300 rounded-lg p-4 shadow-neumorphic-inset">
            <h5 className="font-medium text-gray-800 mb-3">Last 30 Days</h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Cash In</span>
                </div>
                <span className="font-medium text-green-600">{formatCurrency(monthlyFlow.cashIn)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-gray-600">Cash Out</span>
                </div>
                <span className="font-medium text-red-600">{formatCurrency(monthlyFlow.cashOut)}</span>
              </div>
              
              <div className="flex items-center justify-between border-t border-gray-400 pt-2">
                <span className="text-sm font-medium text-gray-800">Net Flow</span>
                <span className={`font-bold ${monthlyFlow.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(monthlyFlow.net))}
                  {monthlyFlow.net < 0 && ' Out'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <Card title="Balance Management" headerActions={
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowAdjustModal(true)}
            variant="primary"
            size="sm"
            icon={RefreshCw}
          >
            Adjust Balance
          </Button>
          <Button
            onClick={loadCashFlowData}
            variant="secondary"
            size="sm"
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      }>
        <div className="text-sm text-gray-600 space-y-2">
          <p>• Use "Adjust Balance" to correct cash/online balances due to external transactions</p>
          <p>• All payment transactions are automatically tracked from DC and Invoice panels</p>
          <p>• Balance adjustments will create audit entries in the ledger</p>
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card title="Recent Payment Transactions">
        <DataTable
          data={recentTransactions}
          columns={transactionColumns}
          emptyMessage="No recent payment transactions"
        />
      </Card>

      {/* Adjustment Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title="Adjust Cash Flow Balance"
        onConfirm={handleBalanceAdjustment}
        onCancel={() => setShowAdjustModal(false)}
        confirmText="Apply Adjustment"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Balance Type</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="cash"
                    checked={adjustmentType === 'cash'}
                    onChange={(e) => setAdjustmentType(e.target.value as 'cash' | 'online')}
                    className="text-primary-600"
                  />
                  <span className="text-sm">Cash Balance</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="online"
                    checked={adjustmentType === 'online'}
                    onChange={(e) => setAdjustmentType(e.target.value as 'cash' | 'online')}
                    className="text-primary-600"
                  />
                  <span className="text-sm">Online Balance</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Operation</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="add"
                    checked={adjustmentMode === 'add'}
                    onChange={(e) => setAdjustmentMode(e.target.value as 'add' | 'subtract')}
                    className="text-primary-600"
                  />
                  <span className="text-sm">Add Amount</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="subtract"
                    checked={adjustmentMode === 'subtract'}
                    onChange={(e) => setAdjustmentMode(e.target.value as 'add' | 'subtract')}
                    className="text-primary-600"
                  />
                  <span className="text-sm">Subtract Amount</span>
                </label>
              </div>
            </div>
          </div>

          <Input
            label="Adjustment Amount"
            type="number"
            value={adjustmentAmount}
            onChange={setAdjustmentAmount}
            placeholder="Enter amount"
            required
          />

          <Input
            label="Reason for Adjustment"
            value={adjustmentReason}
            onChange={setAdjustmentReason}
            placeholder="e.g., Bank deposit not recorded, External expense, etc."
            required
          />

          <div className="bg-gray-300 rounded-lg p-3">
            <p className="text-sm text-gray-600 mb-2">Current Balances:</p>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Cash:</span>
                <span className="font-medium">{formatCurrency(cashFlow.cashBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span>Online:</span>
                <span className="font-medium">{formatCurrency(cashFlow.onlineBalance)}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};