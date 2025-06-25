import React from 'react';
import { ArrowUpDown, Droplets, TrendingUp, Coins, BarChart3 } from 'lucide-react';

interface DEXNavigationProps {
  activeView: 'swap' | 'liquidity' | 'pools' | 'analytics' | 'orders' | 'mining';
  setActiveView: (view: 'swap' | 'liquidity' | 'pools' | 'analytics' | 'orders' | 'mining') => void;
}

export default function DEXNavigation({ activeView, setActiveView }: DEXNavigationProps) {
  const tabs = [
    { id: 'swap', name: 'Swap', icon: ArrowUpDown },
    { id: 'liquidity', name: 'Add Liquidity', icon: Droplets },
    { id: 'pools', name: 'Pools', icon: BarChart3 },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
    { id: 'orders', name: 'Orders', icon: Coins },
    { id: 'mining', name: 'Mining', icon: Droplets },
  ] as const;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap justify-center md:justify-start space-x-2 md:space-x-8 p-2 md:p-0" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`${
                activeView === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              } whitespace-nowrap py-3 px-4 md:py-4 md:px-6 border-b-2 font-medium text-sm flex items-center rounded-t-lg transition-colors duration-200`}
            >
              <tab.icon className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              <span className="hidden sm:inline">{tab.name}</span>
              <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
} 