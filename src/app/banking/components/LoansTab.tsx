'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Zap } from 'lucide-react';

interface LoansTabProps {
  address: string;
  onTakeFlashLoan: (amount: string) => Promise<void>;
  onRepayFlashLoan: (amount: string) => Promise<void>;
  isLoading: boolean;
}

export default function LoansTab({
  address,
  onTakeFlashLoan,
  onRepayFlashLoan,
  isLoading
}: LoansTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('regular');
  const [loanAmount, setLoanAmount] = useState('');
  const [flashLoanAmount, setFlashLoanAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');

  const subTabs = [
    { id: 'regular', name: 'Regular Loans', icon: CreditCard },
    { id: 'flash', name: 'Flash Loans', icon: Zap },
  ];

  const handleTakeFlashLoan = async () => {
    if (!flashLoanAmount) return;
    await onTakeFlashLoan(flashLoanAmount);
    setFlashLoanAmount('');
  };

  const handleRepayFlashLoan = async () => {
    if (!repayAmount) return;
    await onRepayFlashLoan(repayAmount);
    setRepayAmount('');
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">💳 Loan Center</h3>
      
      {/* Sub Navigation */}
      <div className="flex space-x-2 mb-6 bg-gray-100 p-1 rounded-lg">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`${
              activeSubTab === tab.id
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            } flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all`}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Regular Loans Tab */}
      {activeSubTab === 'regular' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Loan Amount (ETH)</label>
            <input
              type="number"
              step="0.01"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="1.0"
              className="w-full p-3 border rounded-lg"
            />
          </div>

          <Button
            onClick={() => {/* TODO: Implement regular loan */}}
            disabled={!loanAmount || isLoading}
            className="w-full"
          >
            Apply for Loan
          </Button>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-800 mb-2">📋 Regular Loan Features</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Interest rate: 8.5% annually</li>
              <li>• Collateral required: 150% of loan amount</li>
              <li>• Flexible repayment terms</li>
              <li>• Credit building opportunities</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <h5 className="font-medium text-yellow-800 mb-2">⚠️ Loan Requirements</h5>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Minimum loan amount: 0.1 ETH</li>
              <li>• Must provide adequate collateral</li>
              <li>• Account must be in good standing</li>
              <li>• KYC verification may be required</li>
            </ul>
          </div>
        </div>
      )}

      {/* Flash Loans Tab */}
      {activeSubTab === 'flash' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Flash Loan Amount (ETH)</label>
            <input
              type="number"
              step="0.01"
              value={flashLoanAmount}
              onChange={(e) => setFlashLoanAmount(e.target.value)}
              placeholder="1.0"
              className="w-full p-3 border rounded-lg"
            />
          </div>

          <Button
            onClick={handleTakeFlashLoan}
            disabled={!flashLoanAmount || isLoading}
            className="w-full"
          >
            Take Flash Loan
          </Button>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-3">Repay Flash Loan</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Repayment Amount (ETH)</label>
                <input
                  type="number"
                  step="0.01"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  placeholder="1.0005"
                  className="w-full p-3 border rounded-lg"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Include 0.05% fee in repayment amount
                </div>
              </div>

              <Button
                onClick={handleRepayFlashLoan}
                disabled={!repayAmount || isLoading}
                className="w-full"
                variant="outline"
              >
                Repay Flash Loan
              </Button>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <h5 className="font-medium text-purple-800 mb-2">⚡ Flash Loan Features</h5>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Instant liquidity access</li>
              <li>• No collateral required</li>
              <li>• 0.05% fee (very competitive)</li>
              <li>• Must repay within 1 hour</li>
              <li>• Perfect for arbitrage opportunities</li>
            </ul>
          </div>

          <div className="p-4 bg-red-50 rounded-lg">
            <h5 className="font-medium text-red-800 mb-2">⚠️ Flash Loan Risks</h5>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Must repay within same transaction block</li>
              <li>• Failed repayment results in transaction reversal</li>
              <li>• High technical complexity required</li>
              <li>• Market volatility can impact profitability</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h5 className="font-medium text-green-800 mb-2">💡 Use Cases</h5>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Arbitrage trading between DEXs</li>
              <li>• Debt refinancing and restructuring</li>
              <li>• Liquidation protection strategies</li>
              <li>• Capital-efficient yield farming</li>
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
} 