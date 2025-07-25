import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: LucideIcon;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon: Icon,
  type = 'button',
  className = ''
}) => {
  const baseClasses = `
    inline-flex items-center justify-center space-x-2 font-medium rounded-lg
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50
    active:shadow-neumorphic-pressed disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: 'bg-gray-200 text-primary-600 shadow-neumorphic hover:shadow-neumorphic-sm focus:ring-primary-500',
    secondary: 'bg-gray-200 text-gray-600 shadow-neumorphic hover:shadow-neumorphic-sm focus:ring-gray-500',
    danger: 'bg-gray-200 text-red-600 shadow-neumorphic hover:shadow-neumorphic-sm focus:ring-red-500',
    success: 'bg-gray-200 text-green-600 shadow-neumorphic hover:shadow-neumorphic-sm focus:ring-green-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />}
      <span>{children}</span>
    </button>
  );
};