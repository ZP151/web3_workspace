import React from 'react';
import { DollarSign, TrendingUp, Wallet, Award, AlertCircle } from 'lucide-react';
import { formatEther } from 'viem';

interface OverviewTabProps {
  bankBalance: string;
  ethBalance?: any;
  address?: string;
  totalDeposited: string;
  totalWithdrawn: string;
  pendingInterest: string;
  interestRate?: any;
  interestCalc: {
    daily: number;
    monthly: number;
    yearly: number;
  };
}

export default function OverviewTab({
  bankBalance,
  ethBalance,
  address,
  totalDeposited,
  totalWithdrawn,
  pendingInterest,
  interestRate,
  interestCalc,
}: OverviewTabProps) {
  return (
    <>
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
                +{parseFloat(pendingInterest).toFixed(6)} ETH pending interest
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
                {ethBalance ? formatEther(ethBalance.value) : '0'} ETH
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500">Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
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
              <p className="text-sm font-medium text-gray-600">Interest Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {interestRate ? Number(interestRate) : '0'}% APY
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
          Interest Earnings Projection
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Daily</p>
            <p className="text-xl font-bold text-gray-900">{interestCalc.daily.toFixed(6)} ETH</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Monthly</p>
            <p className="text-xl font-bold text-gray-900">{interestCalc.monthly.toFixed(6)} ETH</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Yearly</p>
            <p className="text-xl font-bold text-gray-900">{interestCalc.yearly.toFixed(6)} ETH</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">
              Pending Interest: {parseFloat(pendingInterest).toFixed(6)} ETH (will be added on next transaction)
            </span>
          </div>
        </div>
      </div>
    </>
  );
} 