import React from 'react';
import { Input } from './Input';
import { formatCurrency } from '../utils/calculations';

interface PaymentSectionProps {
  previousDue: number;
  advance: number;
  invoiceAmount: number;
  cashPayment: number;
  onlinePayment: number;
  onCashPaymentChange: (value: number) => void;
  onOnlinePaymentChange: (value: number) => void;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  previousDue,
  advance,
  invoiceAmount,
  cashPayment,
  onlinePayment,
  onCashPaymentChange,
  onOnlinePaymentChange
}) => {
  const totalPayment = cashPayment + onlinePayment;
  const netDue = previousDue - advance;
  const totalOwed = netDue + invoiceAmount;
  const finalBalance = totalOwed - totalPayment;
  
  const isAdvance = finalBalance < 0;
  const displayAmount = Math.abs(finalBalance);

  return (
    <div className="bg-gray-300 rounded-lg p-4 shadow-neumorphic-inset">
      <h4 className="font-semibold text-gray-800 mb-4">Payment Details</h4>
      
      {/* Previous Balance */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Previous Due:</span>
          <span className="font-medium text-red-600">{formatCurrency(previousDue)}</span>
        </div>
        
        {advance > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Previous Advance:</span>
            <span className="font-medium text-green-600">-{formatCurrency(advance)}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center text-sm border-t border-gray-400 pt-2">
          <span className="text-gray-600">Net Previous Balance:</span>
          <span className={`font-medium ${netDue >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {netDue >= 0 ? formatCurrency(netDue) : `-${formatCurrency(Math.abs(netDue))}`}
          </span>
        </div>
      </div>

      {/* Invoice Amount */}
      <div className="flex justify-between items-center text-sm mb-4">
        <span className="text-gray-600">Invoice Amount:</span>
        <span className="font-medium text-blue-600">{formatCurrency(invoiceAmount)}</span>
      </div>

      {/* Payment Inputs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Input
          label="Cash Payment"
          type="number"
          value={cashPayment}
          onChange={(value) => onCashPaymentChange(parseFloat(value) || 0)}
          placeholder="0"
        />
        <Input
          label="Online Payment"
          type="number"
          value={onlinePayment}
          onChange={(value) => onOnlinePaymentChange(parseFloat(value) || 0)}
          placeholder="0"
        />
      </div>

      {/* Payment Summary */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Total Payment:</span>
          <span className="font-medium text-green-600">{formatCurrency(totalPayment)}</span>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Total Owed:</span>
          <span className="font-medium text-gray-800">{formatCurrency(totalOwed)}</span>
        </div>
      </div>

      {/* Final Balance */}
      <div className="border-t border-gray-400 pt-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-800">
            {isAdvance ? 'New Advance:' : 'Remaining Due:'}
          </span>
          <span className={`font-bold text-lg ${isAdvance ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(displayAmount)}
          </span>
        </div>
        
        {totalPayment > totalOwed && (
          <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-700">
            💡 Payment exceeds total amount. Extra {formatCurrency(displayAmount)} will be saved as advance for future invoices.
          </div>
        )}
        
        {totalPayment < totalOwed && totalPayment > 0 && (
          <div className="mt-2 p-2 bg-orange-100 rounded text-xs text-orange-700">
            ⚠️ Partial payment received. Remaining {formatCurrency(displayAmount)} will be added to customer's due.
          </div>
        )}
      </div>
    </div>
  );
};