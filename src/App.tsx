import React, { useState, useEffect } from 'react';
import { Truck, FileText, BookOpen, TrendingUp, Wallet } from 'lucide-react';
import { Layout } from './components/Layout';
import { DeliveryChallansPanel } from './panels/DeliveryChallansPanel';
import { InvoicePanel } from './panels/InvoicePanel';
import { LedgerPanel } from './panels/LedgerPanel';
import { ProfitLossPanel } from './panels/ProfitLossPanel';
import { CashFlowPanel } from './panels/CashFlowPanel';
import { db } from './utils/database';

function App() {
  const [activePanel, setActivePanel] = useState('dc');
  const [isDbReady, setIsDbReady] = useState(false);

  const panels = [
    { id: 'dc', name: 'Delivery Challans', icon: Truck },
    { id: 'invoice', name: 'Invoice', icon: FileText },
    { id: 'ledger', name: 'Ledger', icon: BookOpen },
    { id: 'pl', name: 'P&L', icon: TrendingUp },
    { id: 'cashflow', name: 'Cash Flow', icon: Wallet }
  ];

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await db.init();
      setIsDbReady(true);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      alert('Failed to initialize application. Please refresh the page.');
    }
  };

  const renderActivePanel = () => {
    if (!isDbReady) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing SuperPoultry ERP...</p>
          </div>
        </div>
      );
    }

    switch (activePanel) {
      case 'dc':
        return <DeliveryChallansPanel />;
      case 'invoice':
        return <InvoicePanel />;
      case 'ledger':
        return <LedgerPanel />;
      case 'pl':
        return <ProfitLossPanel />;
      case 'cashflow':
        return <CashFlowPanel />;
      default:
        return <DeliveryChallansPanel />;
    }
  };

  return (
    <Layout
      activePanel={activePanel}
      onPanelChange={setActivePanel}
      panels={panels}
    >
      {renderActivePanel()}
    </Layout>
  );
}

export default App;