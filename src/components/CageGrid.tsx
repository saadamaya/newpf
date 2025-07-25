import React, { useState, useEffect } from 'react';
import { Plus, Lock, Trash2, AlertCircle } from 'lucide-react';
import { InvoiceCage, DeliveryChallan } from '../types';
import { Button } from './Button';

interface CageGridProps {
  cages: InvoiceCage[];
  onChange: (cages: InvoiceCage[]) => void;
  availableDCs: DeliveryChallan[];
  lockedCages: Set<string>;
  onCageLockError: (message: string) => void;
}

export const CageGrid: React.FC<CageGridProps> = ({
  cages,
  onChange,
  availableDCs,
  lockedCages,
  onCageLockError
}) => {
  const [selectedDCDate, setSelectedDCDate] = useState<string>('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCage, setManualCage] = useState({
    cageNo: '',
    birdCount: 0,
    weight: 0
  });

  const selectedDC = availableDCs.find(dc => dc.date === selectedDCDate);
  const selectedCageIds = new Set(cages.map(cage => `${cage.cageNo}_${cage.dcDate || selectedDCDate}`));

  const addCageFromDC = (dcCage: any, dc: DeliveryChallan) => {
    const cageKey = `${dcCage.cageNo}_${dc.date}`;
    
    // Check if cage is already locked by another invoice
    if (lockedCages.has(cageKey)) {
      onCageLockError(`Cage ${dcCage.cageNo} is already in use by another invoice`);
      return;
    }

    // Check if cage is already selected in this invoice
    if (selectedCageIds.has(cageKey)) {
      onCageLockError(`This cage is already selected in this invoice`);
      return;
    }

    const newCage: InvoiceCage = {
      cageNo: dcCage.cageNo,
      birdCount: dcCage.birdCount,
      weight: dcCage.weight,
      fromDC: dc.id,
      dcDate: dc.date,
      purchaseRate: dc.vendorPrice
    };

    onChange([...cages, newCage]);
  };

  const addManualCage = () => {
    if (!manualCage.cageNo.trim() || manualCage.birdCount <= 0 || manualCage.weight <= 0) {
      onCageLockError('Please fill all manual cage fields with valid values');
      return;
    }

    // Check if manual cage number already exists in current selection
    const existingCage = cages.find(cage => cage.cageNo === manualCage.cageNo.trim());
    if (existingCage) {
      onCageLockError(`Cage ${manualCage.cageNo} is already selected`);
      return;
    }

    const newCage: InvoiceCage = {
      cageNo: manualCage.cageNo.trim(),
      birdCount: manualCage.birdCount,
      weight: manualCage.weight
    };

    onChange([...cages, newCage]);
    
    // Reset manual entry
    setManualCage({ cageNo: '', birdCount: 0, weight: 0 });
    setShowManualEntry(false);
  };

  const removeCage = (index: number) => {
    const newCages = cages.filter((_, i) => i !== index);
    onChange(newCages);
  };

  const isCageLocked = (dcCage: any, dc: DeliveryChallan): boolean => {
    const cageKey = `${dcCage.cageNo}_${dc.date}`;
    return lockedCages.has(cageKey);
  };

  const isCageSelected = (dcCage: any, dc: DeliveryChallan): boolean => {
    const cageKey = `${dcCage.cageNo}_${dc.date}`;
    return selectedCageIds.has(cageKey);
  };

  const totalBirds = cages.reduce((sum, cage) => sum + cage.birdCount, 0);
  const totalWeight = cages.reduce((sum, cage) => sum + cage.weight, 0);

  return (
    <div className="space-y-4">
      {/* DC Date Selection */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Select DC Date:</label>
        <select
          value={selectedDCDate}
          onChange={(e) => setSelectedDCDate(e.target.value)}
          className="px-3 py-2 bg-gray-200 rounded-lg shadow-neumorphic-inset text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Select Date</option>
          {availableDCs.map(dc => (
            <option key={dc.date} value={dc.date}>
              {new Date(dc.date).toLocaleDateString('en-IN')} - {dc.vendorName} ({dc.cages.length} cages)
            </option>
          ))}
        </select>
      </div>

      <div className="bg-gray-200 rounded-xl shadow-neumorphic">
        {/* Available Cages from DC */}
        {selectedDC && (
          <div className="p-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Available Cages from {selectedDC.vendorName} - {new Date(selectedDC.date).toLocaleDateString('en-IN')}
            </h4>
            
            <div className="bg-gray-300 rounded-lg shadow-neumorphic-inset max-h-64 overflow-auto">
              {/* Header */}
              <div className="grid grid-cols-6 gap-4 p-3 bg-gray-400 font-medium text-sm text-gray-700 sticky top-0 rounded-t-lg">
                <div>Cage No</div>
                <div>Birds</div>
                <div>Weight (kg)</div>
                <div>Purchase Rate</div>
                <div>Status</div>
                <div>Action</div>
              </div>

              {/* Cage Rows */}
              {selectedDC.cages.map((dcCage, index) => {
                const isLocked = isCageLocked(dcCage, selectedDC);
                const isSelected = isCageSelected(dcCage, selectedDC);
                const isUnavailable = isLocked || isSelected;

                return (
                  <div 
                    key={index}
                    className={`grid grid-cols-6 gap-4 p-3 border-b border-gray-400 last:border-b-0 ${
                      isUnavailable ? 'bg-gray-400 opacity-60' : 'hover:bg-gray-200'
                    } transition-colors`}
                  >
                    <div className="font-medium text-gray-800">{dcCage.cageNo}</div>
                    <div className="text-gray-700">{dcCage.birdCount} birds</div>
                    <div className="text-gray-700">{dcCage.weight.toFixed(2)} kg</div>
                    <div className="text-gray-700">₹{selectedDC.vendorPrice}/kg</div>
                    <div className="flex items-center space-x-1">
                      {isSelected ? (
                        <span className="text-blue-600 text-xs flex items-center">
                          <AlertCircle size={12} className="mr-1" />
                          Selected
                        </span>
                      ) : isLocked ? (
                        <span className="text-red-600 text-xs flex items-center">
                          <Lock size={12} className="mr-1" />
                          In Use
                        </span>
                      ) : (
                        <span className="text-green-600 text-xs">✅ Available</span>
                      )}
                    </div>
                    <div>
                      {!isUnavailable && (
                        <button
                          onClick={() => addCageFromDC(dcCage, selectedDC)}
                          className="p-1 bg-green-200 text-green-700 rounded-lg shadow-neumorphic-sm hover:shadow-neumorphic-inset transition-all duration-200"
                          title="Add this cage"
                        >
                          <Plus size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Cages */}
        {cages.length > 0 && (
          <div className="p-4 border-t border-gray-300">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Selected Cages</h4>
            
            <div className="bg-gray-300 rounded-lg shadow-neumorphic-inset">
              {/* Header */}
              <div className="grid grid-cols-6 gap-4 p-3 bg-gray-400 font-medium text-sm text-gray-700 rounded-t-lg">
                <div>Cage No</div>
                <div>Birds</div>
                <div>Weight (kg)</div>
                <div>Source</div>
                <div>Purchase Rate</div>
                <div>Action</div>
              </div>

              {/* Selected Cage Rows */}
              {cages.map((cage, index) => (
                <div 
                  key={index}
                  className="grid grid-cols-6 gap-4 p-3 border-b border-gray-400 last:border-b-0 hover:bg-gray-200 transition-colors"
                >
                  <div className="font-medium text-gray-800">{cage.cageNo}</div>
                  <div className="text-gray-700">{cage.birdCount} birds</div>
                  <div className="text-gray-700">{cage.weight.toFixed(2)} kg</div>
                  <div className="text-xs">
                    {cage.fromDC ? (
                      <span className="bg-blue-100 px-2 py-1 rounded text-blue-700">
                        DC: {new Date(cage.dcDate || '').toLocaleDateString('en-IN')}
                      </span>
                    ) : (
                      <span className="bg-orange-100 px-2 py-1 rounded text-orange-700">
                        Manual
                      </span>
                    )}
                  </div>
                  <div className="text-gray-700">
                    {cage.purchaseRate ? `₹${cage.purchaseRate}/kg` : 'Manual'}
                  </div>
                  <div>
                    <button
                      onClick={() => removeCage(index)}
                      className="p-1 bg-red-200 text-red-700 rounded-lg shadow-neumorphic-sm hover:shadow-neumorphic-inset transition-all duration-200"
                      title="Remove cage"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Cage Entry */}
        <div className="p-4 border-t border-gray-300">
          {!showManualEntry ? (
            <Button
              onClick={() => setShowManualEntry(true)}
              variant="secondary"
              size="sm"
              icon={Plus}
            >
              Add Manual Cage
            </Button>
          ) : (
            <div className="bg-gray-300 rounded-lg p-4 shadow-neumorphic-inset">
              <h5 className="font-medium text-gray-800 mb-3">Add Manual Cage</h5>
              <div className="grid grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Cage No"
                  value={manualCage.cageNo}
                  onChange={(e) => setManualCage(prev => ({ ...prev, cageNo: e.target.value }))}
                  className="px-3 py-2 bg-gray-200 rounded-lg shadow-neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="number"
                  placeholder="Bird Count"
                  value={manualCage.birdCount}
                  onChange={(e) => setManualCage(prev => ({ ...prev, birdCount: parseInt(e.target.value) || 0 }))}
                  className="px-3 py-2 bg-gray-200 rounded-lg shadow-neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Weight (kg)"
                  value={manualCage.weight}
                  onChange={(e) => setManualCage(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                  className="px-3 py-2 bg-gray-200 rounded-lg shadow-neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex space-x-2">
                  <Button onClick={addManualCage} variant="primary" size="sm">
                    Add
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowManualEntry(false);
                      setManualCage({ cageNo: '', birdCount: 0, weight: 0 });
                    }} 
                    variant="secondary" 
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="p-4 border-t border-gray-300 bg-gray-300 rounded-b-xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-200 rounded-lg p-3 shadow-neumorphic-inset text-center">
              <div className="text-sm text-gray-600">Total Birds</div>
              <div className="text-2xl font-bold text-gray-800">{totalBirds.toLocaleString()}</div>
            </div>
            <div className="bg-gray-200 rounded-lg p-3 shadow-neumorphic-inset text-center">
              <div className="text-sm text-gray-600">Total Weight</div>
              <div className="text-2xl font-bold text-gray-800">{totalWeight.toFixed(2)} kg</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};