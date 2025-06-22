import React from 'react';
import { Grid3X3, Plus, User, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActiveView } from '../types';

interface NFTNavigationProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

export function NFTNavigation({ activeView, onViewChange }: NFTNavigationProps) {
  const navItems = [
    { id: 'marketplace' as ActiveView, name: 'Marketplace', icon: Grid3X3 },
    { id: 'mint' as ActiveView, name: 'Create NFT', icon: Plus },
    { id: 'my-nfts' as ActiveView, name: 'My Collection', icon: User },
    { id: 'analytics' as ActiveView, name: 'Analytics', icon: TrendingUp },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.id}
            variant={activeView === item.id ? 'default' : 'outline'}
            onClick={() => onViewChange(item.id)}
            className={`flex items-center space-x-2 ${
              activeView === item.id
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'hover:bg-purple-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{item.name}</span>
          </Button>
        );
      })}
    </div>
  );
} 