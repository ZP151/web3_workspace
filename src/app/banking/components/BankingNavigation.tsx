import React from 'react';
import { DollarSign, TrendingUp, Send, CreditCard, Shield, Users } from 'lucide-react';

interface BankingNavigationProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export const BankingNavigation: React.FC<BankingNavigationProps> = ({
  activeView,
  setActiveView,
}) => {
  const tabs = [
    { id: 'overview', name: 'Overview', icon: DollarSign },
    { id: 'deposit-withdraw', name: 'Deposit & Withdraw', icon: TrendingUp },
    { id: 'transfers', name: 'Transfers', icon: Send },
    { id: 'loans', name: 'Loans', icon: CreditCard },
    { id: 'savings', name: 'Savings Goals', icon: TrendingUp },
    { id: 'community', name: 'Community Pools', icon: Users },
    { id: 'staking', name: 'Staking', icon: Shield },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-x-2 gap-y-1 p-2" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`${
                activeView === tab.id
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              } whitespace-nowrap py-2 px-3 border-2 rounded-lg font-medium text-sm flex items-center transition-all duration-200`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}; 