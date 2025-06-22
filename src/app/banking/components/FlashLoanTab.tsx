'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface FlashLoanTabProps {
  address: string;
  onTakeFlashLoan: (amount: string) => Promise<void>;
  onRepayFlashLoan: (amount: string) => Promise<void>;
  isLoading: boolean;
}

export default function FlashLoanTab({
  address,
  onTakeFlashLoan,
  onRepayFlashLoan,
  isLoading
}: FlashLoanTabProps) {
  const [flashLoanAmount, setFlashLoanAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');

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
      <h3 className="text-lg font-semibold mb-4">⚡ Flash Loan</h3>
      <p className="text-sm text-gray-600 mb-6">
        DeFi feature for borrowing and repaying within the same transaction. Only 0.05% fee. Perfect for arbitrage, debt restructuring and advanced strategies.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Apply for Flash Loan */}
        <div className="space-y-4">
          <h4 className="font-medium text-green-600">Apply for Flash Loan</h4>
          
          <div>
            <label className="block text-sm font-medium mb-2">Loan Amount (ETH)</label>
            <input
              type="number"
              step="0.1"
              value={flashLoanAmount}
              onChange={(e) => setFlashLoanAmount(e.target.value)}
              placeholder="1.0"
              className="w-full p-3 border rounded-lg"
            />
            <div className="text-xs text-gray-500 mt-1">
              Fee: {flashLoanAmount ? (Number(flashLoanAmount) * 0.0005).toFixed(6) : '0'} ETH (0.05%)
            </div>
            <div className="text-xs text-gray-500">
              Total repayment: {flashLoanAmount ? (Number(flashLoanAmount) * 1.0005).toFixed(6) : '0'} ETH
            </div>
          </div>

          <Button
            onClick={handleTakeFlashLoan}
            disabled={!flashLoanAmount || isLoading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Apply for Flash Loan
          </Button>

          <div className="text-xs text-gray-600 bg-yellow-50 p-3 rounded">
            ⚠️ Must repay within 1 hour or transaction will fail
          </div>
        </div>

        {/* Repay Flash Loan */}
        <div className="space-y-4">
          <h4 className="font-medium text-red-600">Repay Flash Loan</h4>
          
          <div>
            <label className="block text-sm font-medium mb-2">Repayment Amount (ETH)</label>
            <input
              type="number"
              step="0.001"
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              placeholder="1.0005"
              className="w-full p-3 border rounded-lg"
            />
            <div className="text-xs text-gray-500 mt-1">
              Must include principal + fee
            </div>
          </div>

          <Button
            onClick={handleRepayFlashLoan}
            disabled={!repayAmount || isLoading}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            Repay Flash Loan
          </Button>

          <div className="text-xs text-gray-600 bg-green-50 p-3 rounded">
            💡 Excess amount will be automatically refunded to your wallet
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* 闪电贷状态 */}
      <div className="mb-6">
        <h4 className="font-medium mb-4">Current Flash Loan Status</h4>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            No active flash loan
          </div>
          {/* 如果有活跃贷款，显示详情：
          <div className="text-sm space-y-1">
            <div>借款金额: 1.0 ETH</div>
            <div>手续费: 0.0005 ETH</div>
            <div>需偿还: 1.0005 ETH</div>
            <div>剩余时间: 58分23秒</div>
          </div>
          */}
        </div>
      </div>
      
      {/* 使用场景介绍 */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h5 className="font-medium text-blue-800 mb-3">Flash Loan Usage Scenarios</h5>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h6 className="text-sm font-medium text-blue-700 mb-1">Arbitrage Trading</h6>
            <p className="text-xs text-blue-600">Profit from price differences between exchanges</p>
          </div>
          <div>
            <h6 className="text-sm font-medium text-blue-700 mb-1">Debt Restructuring</h6>
            <p className="text-xs text-blue-600">Replace collateral or optimize interest rates</p>
          </div>
          <div>
            <h6 className="text-sm font-medium text-blue-700 mb-1">Liquidation Protection</h6>
            <p className="text-xs text-blue-600">Avoid forced liquidation of collateral</p>
          </div>
          <div>
            <h6 className="text-sm font-medium text-blue-700 mb-1">Complex DeFi Strategies</h6>
            <p className="text-xs text-blue-600">Execute complex DeFi strategies</p>
          </div>
        </div>
      </div>

      {/* 注意事项 */}
      <div className="mt-6 p-4 bg-orange-50 rounded-lg">
        <h5 className="font-medium text-orange-800 mb-2">⚠️ Important Reminder</h5>
        <ul className="text-sm text-orange-700 space-y-1">
          <li>• Flash loan must be borrowed and repaid within the same transaction</li>
          <li>• If not repaid within 1 hour, the loan will be invalid</li>
          <li>• Suitable for advanced users with DeFi experience</li>
          <li>• Please ensure you understand the risks before using</li>
        </ul>
      </div>
    </Card>
  );
} 