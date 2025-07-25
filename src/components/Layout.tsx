import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePanel: string;
  onPanelChange: (panel: string) => void;
  panels: Array<{
    id: string;
    name: string;
    icon: LucideIcon;
  }>;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activePanel,
  onPanelChange,
  panels
}) => {
  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header */}
      <div className="bg-gray-200 shadow-neumorphic px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">SuperPoultry ERP</h1>
      </div>

      {/* Navigation */}
      <div className="bg-gray-200 px-6 py-4">
        <nav className="flex space-x-2">
          {panels.map((panel) => {
            const Icon = panel.icon;
            const isActive = activePanel === panel.id;
            
            return (
              <button
                key={panel.id}
                onClick={() => onPanelChange(panel.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'shadow-neumorphic-inset bg-gray-200 text-primary-600' 
                    : 'shadow-neumorphic bg-gray-200 text-gray-600 hover:text-primary-600'
                  }
                `}
              >
                <Icon size={18} />
                <span className="font-medium">{panel.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};