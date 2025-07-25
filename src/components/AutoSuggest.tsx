import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface AutoSuggestProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  onAddNew?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const AutoSuggest: React.FC<AutoSuggestProps> = ({
  label,
  value,
  onChange,
  suggestions,
  onAddNew,
  placeholder,
  required = false,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const filtered = suggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSuggestions(filtered);
  }, [value, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleAddNew = () => {
    if (onAddNew && value.trim() && !suggestions.includes(value.trim())) {
      onAddNew(value.trim());
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full px-4 py-2 bg-gray-200 border-none rounded-lg shadow-neumorphic-inset
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50
                     disabled:opacity-50 disabled:cursor-not-allowed text-gray-800
                     transition-all duration-200"
        />
        
        {isOpen && (filteredSuggestions.length > 0 || (onAddNew && value.trim())) && (
          <div className="absolute z-10 w-full mt-1 bg-gray-200 rounded-lg shadow-neumorphic max-h-60 overflow-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-gray-300 focus:bg-gray-300 
                          focus:outline-none first:rounded-t-lg last:rounded-b-lg
                          transition-colors duration-150"
              >
                {suggestion}
              </button>
            ))}
            
            {onAddNew && value.trim() && !suggestions.includes(value.trim()) && (
              <button
                type="button"
                onClick={handleAddNew}
                className="w-full px-4 py-2 text-left text-primary-600 hover:bg-gray-300 
                          focus:bg-gray-300 focus:outline-none flex items-center space-x-2
                          border-t border-gray-300 rounded-b-lg transition-colors duration-150"
              >
                <Plus size={16} />
                <span>Add "{value.trim()}"</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};