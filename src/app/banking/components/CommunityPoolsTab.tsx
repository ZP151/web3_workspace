'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CommunityPoolsTabProps {
  address: string;
  onContributeToPool: (poolId: number, amount: string) => Promise<void>;
  isLoading: boolean;
}

export default function CommunityPoolsTab({
  address,
  onContributeToPool,
  isLoading
}: CommunityPoolsTabProps) {
  const [poolId, setPoolId] = useState(1);
  const [poolContribution, setPoolContribution] = useState('');

  const handleContributeToPool = async () => {
    if (!poolContribution) return;
    await onContributeToPool(poolId, poolContribution);
    setPoolContribution('');
  };

  const pools = [
    {
      id: 1,
      name: '🌟 Beginner-Friendly Pool',
      apy: '8%',
      totalAmount: '156.7',
      participants: 89,
      myContribution: '0.5',
      description: 'Stable returns for beginners, low risk with high security'
    },
    {
      id: 2,
      name: '💎 Diamond Hands Pool',
      apy: '10%',
      totalAmount: '234.2',
      participants: 156,
      myContribution: '1.2',
      description: 'Exclusive for long-term holders, longer lock-up for higher returns'
    },
    {
      id: 3,
      name: '🚀 Innovation Project Pool',
      apy: '12%',
      totalAmount: '89.5',
      participants: 67,
      myContribution: '0.0',
      description: 'Supporting innovative DeFi projects, high returns with high risk'
    }
  ];

  const selectedPool = pools.find(pool => pool.id === poolId);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">🏆 Community Savings Pools</h3>
      <p className="text-sm text-gray-600 mb-6">
        Join community collective savings for higher yields. Strength in numbers, shared risks and rewards.
      </p>

      {/* Pool Selection and Contribution */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Select Savings Pool</label>
          <select
            value={poolId}
            onChange={(e) => setPoolId(Number(e.target.value))}
            className="w-full p-3 border rounded-lg"
          >
            {pools.map(pool => (
              <option key={pool.id} value={pool.id}>
                {pool.name} ({pool.apy} APY)
              </option>
            ))}
          </select>
          <div className="text-xs text-gray-500 mt-1">
            {selectedPool?.description}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Contribution Amount (ETH)</label>
          <input
            type="number"
            step="0.01"
            value={poolContribution}
            onChange={(e) => setPoolContribution(e.target.value)}
            placeholder="0.1"
            className="w-full p-3 border rounded-lg"
          />
        </div>

        <Button
          onClick={handleContributeToPool}
          disabled={!poolContribution || isLoading}
          className="w-full"
        >
          Join Community Pool
        </Button>
      </div>

      {/* Selected Pool Details */}
      {selectedPool && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <h4 className="font-medium mb-3">{selectedPool.name}</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Pool Fund</div>
              <div className="font-semibold text-green-600">{selectedPool.totalAmount} ETH</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Participants</div>
              <div className="font-semibold text-blue-600">{selectedPool.participants} users</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">My Contribution</div>
              <div className="font-semibold text-purple-600">{selectedPool.myContribution} ETH</div>
            </div>
          </div>
        </div>
      )}

      {/* All Pools Overview */}
      <div className="space-y-4">
        <h4 className="font-medium">Community Pools Overview</h4>
        {pools.map(pool => (
          <div key={pool.id} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
               onClick={() => setPoolId(pool.id)}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{pool.name}</span>
              <span className="text-sm font-medium text-green-600">{pool.apy} APY</span>
            </div>
            <div className="text-sm text-gray-600 mb-2">{pool.description}</div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Total Fund: {pool.totalAmount} ETH</span>
              <span>Participants: {pool.participants} users</span>
              <span>My Contribution: {pool.myContribution} ETH</span>
            </div>
          </div>
        ))}
      </div>

      {/* Reward Distribution Mechanism */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h5 className="font-medium text-yellow-800 mb-2">📊 Reward Distribution Mechanism</h5>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Rewards distributed by contribution ratio</li>
          <li>• Weekly settlement, automatic deposit</li>
          <li>• Early withdrawal incurs 10% fee</li>
          <li>• Referral rewards for bringing new users</li>
        </ul>
      </div>

      {/* Risk Warning */}
      <div className="mt-4 p-4 bg-red-50 rounded-lg">
        <h5 className="font-medium text-red-800 mb-2">⚠️ Risk Warning</h5>
        <ul className="text-sm text-red-700 space-y-1">
          <li>• Community pool investments carry market risks</li>
          <li>• Yield rates may adjust based on market conditions</li>
          <li>• Funds cannot be withdrawn immediately during lock-up period</li>
          <li>• Please participate according to your risk tolerance</li>
        </ul>
      </div>

      {/* Participation Benefits */}
      <div className="mt-4 p-4 bg-green-50 rounded-lg">
        <h5 className="font-medium text-green-800 mb-2">✨ Participation Benefits</h5>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Higher yield rates than individual deposits</li>
          <li>• Professional team management reduces risks</li>
          <li>• Community voting on major decisions</li>
          <li>• Share in platform development dividends</li>
        </ul>
      </div>
    </Card>
  );
} 