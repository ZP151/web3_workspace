import React, { useState } from 'react';
import { DollarSign, TrendingUp, Wallet, Award, AlertCircle, Calculator, RefreshCw } from 'lucide-react';
import { formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { FetchBalanceResult } from 'wagmi/actions';

interface OverviewTabProps {
  bankBalance: string;
  totalDeposited: string;
  totalWithdrawn: string;
  pendingInterest: string;
  totalBankFunds: string;
  ethBalance?: FetchBalanceResult;
  interestRate: number;
  minimumDeposit: string;
  onManualRefresh: () => void;
}

export default function OverviewTab({
  bankBalance,
  totalDeposited,
  totalWithdrawn,
  pendingInterest,
  totalBankFunds,
  ethBalance,
  interestRate,
  minimumDeposit,
  onManualRefresh,
}: OverviewTabProps) {
  const [calcAmount, setCalcAmount] = useState('1.0');
  const [calcPeriod, setCalcPeriod] = useState(365);

  const calculateProjection = () => {
    const amount = parseFloat(calcAmount) || 0;
    const rate = (interestRate || 0) / 100;
    const daily = (amount * rate) / 365;
    const result = daily * calcPeriod;
    return result;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Account Overview</h2>
        <Button onClick={onManualRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Account Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Bank Balance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bank Balance</p>
              <p className="text-2xl font-bold text-gray-900">{bankBalance} ETH</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">
                +{parseFloat(pendingInterest || '0').toFixed(6)} ETH pending interest
              </span>
            </div>
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Wallet Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {ethBalance ? parseFloat(formatEther(ethBalance.value)).toFixed(4) : '0'} ETH
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500 truncate" title={ethBalance?.formatted}>
              {ethBalance ? `Formatted: ${ethBalance.formatted}` : ''}
            </p>
          </div>
        </div>

        {/* Total Deposited */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Deposited</p>
              <p className="text-2xl font-bold text-gray-900">{totalDeposited} ETH</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500">Withdrawn: {totalWithdrawn} ETH</p>
          </div>
        </div>

        {/* Interest Rate */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Interest Rate (APY)</p>
              <p className="text-2xl font-bold text-gray-900">
                {(interestRate || 0).toFixed(2)}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Award className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500">Compound interest</p>
          </div>
        </div>
      </div>

      {/* Interest Calculation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Award className="h-5 w-5 mr-2 text-yellow-600" />
          Key Banking Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Pending Interest</p>
            <p className="text-xl font-bold text-gray-900">{parseFloat(pendingInterest || '0').toFixed(6)} ETH</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Bank Funds</p>
            <p className="text-xl font-bold text-gray-900">{parseFloat(totalBankFunds || '0').toFixed(4)} ETH</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Minimum Deposit</p>
            <p className="text-xl font-bold text-gray-900">{minimumDeposit} ETH</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">
              Pending Interest: {parseFloat(pendingInterest || '0').toFixed(6)} ETH (will be added on next transaction)
            </span>
          </div>
        </div>
      </div>

      {/* Interest Calculator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calculator className="h-5 w-5 mr-2 text-blue-600" />
          Interest Calculator
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (ETH)
            </label>
            <input
              type="number"
              step="0.1"
              value={calcAmount}
              onChange={(e) => setCalcAmount(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1.0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period (Days)
            </label>
            <select
              value={calcPeriod}
              onChange={(e) => setCalcPeriod(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={7}>1 Week</option>
              <option value={30}>1 Month</option>
              <option value={90}>3 Months</option>
              <option value={180}>6 Months</option>
              <option value={365}>1 Year</option>
            </select>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Projected Interest</p>
            <p className="text-xl font-bold text-blue-600">
              {calculateProjection().toFixed(6)} ETH
            </p>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          * Based on current interest rate {(interestRate || 0).toFixed(2)}% APY
        </div>
      </div>
    </>
  );
} 