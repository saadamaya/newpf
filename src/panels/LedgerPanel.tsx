import React, { useState, useEffect } from 'react';
import { Search, User, Building, Calendar } from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { DataTable } from '../components/DataTable';
import { LedgerEntry } from '../types';
import { db } from '../utils/database';
import { formatCurrency, getWeekdayFromDate } from '../utils/calculations';

export const LedgerPanel: React.FC = () => {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [weekdayFilter, setWeekdayFilter] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [entities, setEntities] = useState<string[]>([]);

  useEffect(() => {
    loadLedgerData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [ledgerEntries, searchTerm, entityTypeFilter, dateFilter, weekdayFilter, selectedEntity]);

  const loadLedgerData = async () => {
    try {
      const entries = await db.getLedgerEntries();
      setLedgerEntries(entries);
      
      // Extract unique entity names
      const uniqueEntities = Array.from(new Set(entries.map(entry => entry.entityName))).sort();
      setEntities(uniqueEntities);
    } catch (error) {
      console.error('Error loading ledger data:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...ledgerEntries];

    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.entityName.toLowerCase().includes(term) ||
        entry.description.toLowerCase().includes(term) ||
        entry.type.toLowerCase().includes(term)
      );
    }

    // Entity type filter
    if (entityTypeFilter) {
      filtered = filtered.filter(entry => entry.entityType === entityTypeFilter);
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(entry => entry.date === dateFilter);
    }

    // Weekday filter
    if (weekdayFilter) {
      filtered = filtered.filter(entry => getWeekdayFromDate(entry.date) === weekdayFilter);
    }

    // Selected entity filter
    if (selectedEntity) {
      filtered = filtered.filter(entry => entry.entityName === selectedEntity);
    }

    setFilteredEntries(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setEntityTypeFilter('');
    setDateFilter('');
    setWeekdayFilter('');
    setSelectedEntity('');
  };

  const getEntityBalance = (entityName: string): number => {
    const entityEntries = ledgerEntries.filter(entry => entry.entityName === entityName);
    return entityEntries.length > 0 ? entityEntries[0].balance : 0;
  };

  const getTotalOutstanding = (entityType: 'customer' | 'vendor'): number => {
    const entityMap = new Map<string, number>();
    
    ledgerEntries
      .filter(entry => entry.entityType === entityType)
      .forEach(entry => {
        entityMap.set(entry.entityName, entry.balance);
      });

    return Array.from(entityMap.values()).reduce((sum, balance) => sum + balance, 0);
  };

  const ledgerColumns = [
    { key: 'date', label: 'Date', type: 'date' as const },
    { key: 'entityName', label: 'Name' },
    { key: 'entityType', label: 'Type' },
    { key: 'type', label: 'Transaction' },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount', type: 'currency' as const },
    { key: 'paymentAmount', label: 'Payment', type: 'currency' as const },
    { key: 'balance', label: 'Balance', type: 'currency' as const }
  ];

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg shadow-neumorphic-inset">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Customer Outstanding</p>
              <p className="text-xl font-bold text-gray-800">
                {formatCurrency(getTotalOutstanding('customer'))}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-lg shadow-neumorphic-inset">
              <Building className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Vendor Outstanding</p>
              <p className="text-xl font-bold text-gray-800">
                {formatCurrency(getTotalOutstanding('vendor'))}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg shadow-neumorphic-inset">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-xl font-bold text-gray-800">
                {ledgerEntries.length.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Input
            label="Search"
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search name, description..."
          />

          <Select
            label="Entity Type"
            value={entityTypeFilter}
            onChange={setEntityTypeFilter}
            options={[
              { value: '', label: 'All Types' },
              { value: 'customer', label: 'Customers' },
              { value: 'vendor', label: 'Vendors' }
            ]}
          />

          <Select
            label="Entity Name"
            value={selectedEntity}
            onChange={setSelectedEntity}
            options={[
              { value: '', label: 'All Entities' },
              ...entities.map(entity => ({ value: entity, label: entity }))
            ]}
          />

          <Input
            label="Date"
            type="date"
            value={dateFilter}
            onChange={setDateFilter}
          />

          <Select
            label="Weekday"
            value={weekdayFilter}
            onChange={setWeekdayFilter}
            options={[
              { value: '', label: 'All Days' },
              ...weekdays.map(day => ({ value: day, label: day }))
            ]}
          />

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-200 text-gray-600 rounded-lg shadow-neumorphic 
                       hover:shadow-neumorphic-sm active:shadow-neumorphic-pressed
                       transition-all duration-200 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </Card>

      {/* Ledger Table */}
      <Card title={`Ledger Entries (${filteredEntries.length})`}>
        <DataTable
          data={filteredEntries}
          columns={ledgerColumns}
          emptyMessage="No ledger entries found"
        />
      </Card>

      {/* Entity Balances */}
      {selectedEntity && (
        <Card title={`${selectedEntity} - Balance: ${formatCurrency(getEntityBalance(selectedEntity))}`}>
          <DataTable
            data={filteredEntries.filter(entry => entry.entityName === selectedEntity)}
            columns={ledgerColumns}
            emptyMessage="No transactions found for this entity"
          />
        </Card>
      )}
    </div>
  );
};