import React from 'react';
import { Grid3X3, Plus, User, TrendingUp } from 'lucide-react';
import { ActiveView } from '../types';

interface NFTNavigationProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

export function NFTNavigation({ activeView, setActiveView }: NFTNavigationProps) {
  const navItems = [
    { id: 'marketplace' as ActiveView, name: 'Marketplace', icon: Grid3X3 },
    { id: 'mint' as ActiveView, name: 'Create NFT', icon: Plus },
    { id: 'my-nfts' as ActiveView, name: 'My Collection', icon: User },
    { id: 'analytics' as ActiveView, name: 'Analytics', icon: TrendingUp },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap justify-center md:justify-start space-x-2 md:space-x-8 p-2 md:p-0" aria-label="Tabs">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`${
                  activeView === item.id
                    ? 'border-purple-500 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                } whitespace-nowrap py-3 px-4 md:py-4 md:px-6 border-b-2 font-medium text-sm flex items-center rounded-t-lg transition-colors duration-200`}
              >
                <Icon className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                <span className="hidden sm:inline">{item.name}</span>
                <span className="sm:hidden">{item.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 