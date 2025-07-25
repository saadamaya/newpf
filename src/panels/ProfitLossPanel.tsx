import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Calendar, Calculator } from 'lucide-react';
import { Card } from '../components/Card';
import { DataTable } from '../components/DataTable';
import { ProfitLoss, DeliveryChallan, Invoice, LedgerEntry } from '../types';
import { db } from '../utils/database';
import { formatCurrency, getCurrentDateString } from '../utils/calculations';

export const ProfitLossPanel: React.FC = () => {
  const [profitLoss, setProfitLoss] = useState<ProfitLoss>({
    dailyProfit: 0,
    pendingProfit: 0,
    profitInMarket: 0,
    expectedProfit: 0,
    monthlyProfit: 0,
    monthlyProfitDue: 0,
    withdrawableProfit: 0
  });

  const [dailyTransactions, setDailyTransactions] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    calculateProfitLoss();
  }, [selectedMonth]);

  const calculateProfitLoss = async () => {
    try {
      const [dcs, invoices, ledgerEntries] = await Promise.all([
        db.getDCs(),
        db.getInvoices(),
        db.getLedgerEntries()
      ]);

      const today = getCurrentDateString();
      const currentMonth = selectedMonth;

      // Calculate daily profit (today's sales - today's purchases)
      const todaySales = invoices
        .filter(inv => inv.date === today)
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      const todayPurchases = dcs
        .filter(dc => dc.date === today)
        .reduce((sum, dc) => sum + dc.totalAmount, 0);

      const dailyProfit = todaySales - todayPurchases;

      // Calculate pending profit (unpaid invoices)
      const pendingProfit = invoices
        .filter(inv => inv.newDue > 0)
        .reduce((sum, inv) => sum + inv.newDue, 0);

      // Calculate profit in market (all customer dues)
      const profitInMarket = ledgerEntries
        .filter(entry => entry.entityType === 'customer' && entry.balance > 0)
        .reduce((sum, entry) => sum + entry.balance, 0);

      // Calculate expected profit (if all dues are collected)
      const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalPurchases = dcs.reduce((sum, dc) => sum + dc.totalAmount, 0);
      const expectedProfit = totalSales - totalPurchases;

      // Calculate monthly profit (this month's net profit)
      const monthlyInvoices = invoices.filter(inv => inv.date.startsWith(currentMonth));
      const monthlyDCs = dcs.filter(dc => dc.date.startsWith(currentMonth));
      
      const monthlySales = monthlyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const monthlyPurchases = monthlyDCs.reduce((sum, dc) => sum + dc.totalAmount, 0);
      const monthlyProfit = monthlySales - monthlyPurchases;

      // Calculate monthly profit due (unpaid from this month)
      const monthlyProfitDue = monthlyInvoices
        .filter(inv => inv.newDue > 0)
        .reduce((sum, inv) => sum + inv.newDue, 0);

      // Calculate withdrawable profit (realized profit - vendor dues)
      const vendorDues = ledgerEntries
        .filter(entry => entry.entityType === 'vendor' && entry.balance > 0)
        .reduce((sum, entry) => sum + entry.balance, 0);

      const cashFlow = await db.getCashFlow();
      const withdrawableProfit = Math.max(0, cashFlow.totalBalance - vendorDues);

      setProfitLoss({
        dailyProfit,
        pendingProfit,
        profitInMarket,
        expectedProfit,
        monthlyProfit,
        monthlyProfitDue,
        withdrawableProfit
      });

      // Prepare daily transactions for table
      const todayData = [
        ...invoices.filter(inv => inv.date === today).map(inv => ({
          type: 'Sale',
          description: `Invoice ${inv.invoiceNumber} - ${inv.customerName}`,
          amount: inv.totalAmount,
          date: inv.date
        })),
        ...dcs.filter(dc => dc.date === today).map(dc => ({
          type: 'Purchase',
          description: `DC - ${dc.vendorName} (${dc.totalBirds} birds)`,
          amount: -dc.totalAmount,
          date: dc.date
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setDailyTransactions(todayData);

      // Prepare monthly data
      const monthlyTransactionData = [
        ...monthlyInvoices.map(inv => ({
          type: 'Sale',
          description: `Invoice ${inv.invoiceNumber} - ${inv.customerName}`,
          amount: inv.totalAmount,
          paid: inv.totalAmount - inv.newDue,
          due: inv.newDue,
          date: inv.date
        })),
        ...monthlyDCs.map(dc => ({
          type: 'Purchase',
          description: `DC - ${dc.vendorName} (${dc.totalBirds} birds)`,
          amount: dc.totalAmount,
          paid: dc.totalAmount - dc.newDue,
          due: dc.newDue,
          date: dc.date
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setMonthlyData(monthlyTransactionData);

    } catch (error) {
      console.error('Error calculating profit/loss:', error);
    }
  };

  const profitCards = [
    {
      title: 'Daily Profit',
      value: profitLoss.dailyProfit,
      icon: Calendar,
      color: profitLoss.dailyProfit >= 0 ? 'green' : 'red',
      description: 'Today\'s net profit'
    },
    {
      title: 'Pending Profit',
      value: profitLoss.pendingProfit,
      icon: TrendingUp,
      color: 'orange',
      description: 'Profit from unpaid invoices'
    },
    {
      title: 'Profit in Market',
      value: profitLoss.profitInMarket,
      icon: DollarSign,
      color: 'blue',
      description: 'Total customer dues'
    },
    {
      title: 'Expected Profit',
      value: profitLoss.expectedProfit,
      icon: Calculator,
      color: profitLoss.expectedProfit >= 0 ? 'green' : 'red',
      description: 'If all dues collected'
    },
    {
      title: 'Monthly Profit',
      value: profitLoss.monthlyProfit,
      icon: TrendingUp,
      color: profitLoss.monthlyProfit >= 0 ? 'green' : 'red',
      description: 'This month\'s net profit'
    },
    {
      title: 'Withdrawable Profit',
      value: profitLoss.withdrawableProfit,
      icon: PiggyBank,
      color: 'green',
      description: 'Safe to withdraw/save'
    }
  ];

  const dailyColumns = [
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount', type: 'currency' as const },
    { key: 'date', label: 'Date', type: 'date' as const }
  ];

  const monthlyColumns = [
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount', type: 'currency' as const },
    { key: 'paid', label: 'Paid', type: 'currency' as const },
    { key: 'due', label: 'Due', type: 'currency' as const },
    { key: 'date', label: 'Date', type: 'date' as const }
  ];

  return (
    <div className="space-y-6">
      {/* Profit Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profitCards.map((card) => {
          const Icon = card.icon;
          const isProfit = card.value >= 0;
          const colorClasses = {
            green: 'bg-green-100 text-green-600',
            red: 'bg-red-100 text-red-600',
            blue: 'bg-blue-100 text-blue-600',
            orange: 'bg-orange-100 text-orange-600'
          };

          return (
            <Card key={card.title}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className={`text-2xl font-bold mb-1 ${isProfit && card.color === 'green' ? 'text-green-600' : card.color === 'red' ? 'text-red-600' : 'text-gray-800'}`}>
                    {formatCurrency(Math.abs(card.value))}
                    {card.value < 0 && card.color === 'red' && <span className="text-red-600"> Loss</span>}
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

      {/* Quick Insights */}
      <Card title="Quick Insights">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h5 className="font-medium text-gray-800">Profit Analysis</h5>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Cash Available:</span>
                <span className="font-medium">{formatCurrency(profitLoss.withdrawableProfit)}</span>
              </div>
              <div className="flex justify-between">
                <span>Profit Margin (Month):</span>
                <span className="font-medium">
                  {monthlyData.length > 0 
                    ? `${((profitLoss.monthlyProfit / monthlyData.reduce((sum, item) => item.type === 'Sale' ? sum + item.amount : sum, 0)) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>Outstanding Recovery:</span>
                <span className="font-medium">{formatCurrency(profitLoss.profitInMarket)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-medium text-gray-800">Recommendations</h5>
            <div className="text-sm text-gray-600 space-y-2">
              {profitLoss.withdrawableProfit > 50000 && (
                <div className="flex items-center space-x-2 text-green-600">
                  <PiggyBank size={16} />
                  <span>Good profit available for savings/investment</span>
                </div>
              )}
              {profitLoss.pendingProfit > profitLoss.withdrawableProfit && (
                <div className="flex items-center space-x-2 text-orange-600">
                  <TrendingUp size={16} />
                  <span>Focus on collecting pending payments</span>
                </div>
              )}
              {profitLoss.dailyProfit < 0 && (
                <div className="flex items-center space-x-2 text-red-600">
                  <TrendingDown size={16} />
                  <span>Review pricing strategy</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Today's Transactions */}
      <Card title="Today's Transactions">
        <DataTable
          data={dailyTransactions}
          columns={dailyColumns}
          emptyMessage="No transactions today"
        />
      </Card>

      {/* Monthly View */}
      <Card title="Monthly Analysis" headerActions={
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-1 bg-gray-200 rounded-lg shadow-neumorphic-inset text-sm"
        />
      }>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-gray-300 rounded-lg p-4 shadow-neumorphic-inset">
            <p className="text-sm text-gray-600">Monthly Sales</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(monthlyData.filter(item => item.type === 'Sale').reduce((sum, item) => sum + item.amount, 0))}
            </p>
          </div>
          <div className="bg-gray-300 rounded-lg p-4 shadow-neumorphic-inset">
            <p className="text-sm text-gray-600">Monthly Purchases</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(monthlyData.filter(item => item.type === 'Purchase').reduce((sum, item) => sum + item.amount, 0))}
            </p>
          </div>
          <div className="bg-gray-300 rounded-lg p-4 shadow-neumorphic-inset">
            <p className="text-sm text-gray-600">Net Profit</p>
            <p className={`text-xl font-bold ${profitLoss.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(profitLoss.monthlyProfit))}
              {profitLoss.monthlyProfit < 0 && ' Loss'}
            </p>
          </div>
        </div>

        <DataTable
          data={monthlyData}
          columns={monthlyColumns}
          emptyMessage="No transactions this month"
        />
      </Card>
    </div>
  );
};