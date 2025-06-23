import React from 'react';
import { Clock } from 'lucide-react';

interface BankingInfoCardProps {
  address?: string;
  chain?: any;
  contractAddress?: string;
  bankBalance: string;
  totalBankFunds?: string;
  isConnected: boolean;
  onRefresh: () => void;
}

export default function BankingInfoCard({ 
  address, 
  chain, 
  contractAddress, 
  bankBalance, 
  totalBankFunds,
  isConnected,
  onRefresh 
}: BankingInfoCardProps) {
  if (!isConnected || !contractAddress) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Banking Information</h3>
          <p className="text-gray-600">Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
          <p className="text-gray-600">Network: {chain?.name || 'Unknown'} (ID: {chain?.id})</p>
          <p className="text-gray-600">Contract: {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4)}</p>
          <div className="mt-2 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-green-600">Network Connected</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">{bankBalance} ETH</div>
          <div className="text-gray-600">Your Bank Deposit</div>
          {totalBankFunds && (
            <>
              <div className="text-lg font-semibold text-blue-600 mt-2">{totalBankFunds} ETH</div>
              <div className="text-gray-600 text-sm">Total Bank Funds</div>
            </>
          )}
          <div className="text-sm text-gray-500 mt-1">
            Auto-retry enabled for failed transactions
          </div>
          <button
            onClick={onRefresh}
            className="mt-2 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            title="Refresh data"
          >
            <Clock className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 