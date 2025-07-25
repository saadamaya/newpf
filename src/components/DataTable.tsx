import React from 'react';
import { formatCurrency, formatDateForDisplay } from '../utils/calculations';

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'date';
  width?: string;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
  className?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  onRowClick,
  emptyMessage = 'No data available',
  className = ''
}) => {
  const formatCellValue = (value: any, type: string = 'text') => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'currency':
        return formatCurrency(Number(value));
      case 'number':
        return Number(value).toLocaleString('en-IN');
      case 'date':
        return formatDateForDisplay(value);
      default:
        return String(value);
    }
  };

  if (data.length === 0) {
    return (
      <div className="bg-gray-200 rounded-xl shadow-neumorphic-inset p-8 text-center">
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-200 rounded-xl shadow-neumorphic overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-300">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-400"
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={index}
                onClick={() => onRowClick?.(row)}
                className={`
                  border-b border-gray-300 last:border-b-0
                  ${onRowClick ? 'cursor-pointer hover:bg-gray-300 transition-colors duration-150' : ''}
                `}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-gray-800">
                    {formatCellValue(row[column.key], column.type)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};