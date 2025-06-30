import React from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface DepositWithdrawTabProps {
  depositAmount: string;
  setDepositAmount: (amount: string) => void;
  withdrawAmount: string;
  setWithdrawAmount: (amount: string) => void;
  onDeposit: (amount: string) => Promise<void>;
  onWithdraw: (amount: string) => Promise<void>;
  onWithdrawAll: () => Promise<void>;
  onClaimInterest: () => Promise<void>;
  isDepositing: boolean;
  isWithdrawing: boolean;
  isWithdrawingAll: boolean;
  bankBalance?: string;
  ethBalance?: any;
  minimumDeposit?: any;
  pendingInterest?: string;
}

export default function DepositWithdrawTab({
  depositAmount,
  withdrawAmount,
  setDepositAmount,
  setWithdrawAmount,
  onDeposit,
  onWithdraw,
  onWithdrawAll,
  onClaimInterest,
  isDepositing,
  isWithdrawing,
  isWithdrawingAll,
  bankBalance,
  ethBalance,
  minimumDeposit,
  pendingInterest,
}: DepositWithdrawTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Deposit */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          Deposit ETH
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount (ETH)</label>
            <input
              type="number"
              step="0.001"
              placeholder="0.0"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
            Please make sure you have a sufficient balance in your wallet.
            </p>
          </div>
          <Button
            onClick={() => onDeposit(depositAmount)}
            disabled={isDepositing || !depositAmount || parseFloat(depositAmount) <= 0}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isDepositing ? 'Depositing...' : 'Deposit'}
          </Button>
          {depositAmount && parseFloat(depositAmount) > 0 && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                You will deposit {depositAmount} ETH and start earning 5% annual interest
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Withdraw */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
          Withdraw ETH
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount (ETH)</label>
            <input
              type="number"
              step="0.001"
              placeholder="0.0"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can withdraw from your bank balance.
            </p>
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => onWithdraw(withdrawAmount)}
              disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
            </Button>
            <Button
              onClick={onWithdrawAll}
              disabled={isWithdrawingAll}
              variant="outline"
              className="w-full border-red-600 text-red-600 hover:bg-red-50"
            >
              {isWithdrawingAll ? 'Withdrawing all...' : 'Withdraw all'}
            </Button>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-800 font-medium">
                Click here to claim your accumulated interest
                </span>
                <Button
                  onClick={onClaimInterest}
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                Claim Interest
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="lg:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Important Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h5 className="font-semibold mb-1">Deposits</h5>
            <ul className="space-y-1">
              <li>• Interest starts accumulating immediately</li>
              <li>• 5% annual compound interest</li>
              <li>• No lock-up period for deposits</li>
              <li>• Interest calculated per second</li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold mb-1">Withdrawals</h5>
            <ul className="space-y-1">
              <li>• Interest is auto-claimed on withdrawal</li>
              <li>• No withdrawal fees</li>
              <li>• Instant withdrawal processing</li>
              <li>• Withdraw partial or full balance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 