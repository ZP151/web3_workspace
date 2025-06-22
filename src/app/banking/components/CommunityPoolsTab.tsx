'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useContractRead } from 'wagmi';

interface CommunityPool {
  name: string;
  totalAmount: bigint;
  participantCount: bigint;
  rewardRate: bigint;
  isActive: boolean;
}

interface CommunityPoolsTabProps {
  address: string;
  contractAddress?: `0x${string}`;
  contractABI?: any;
  onContributeToPool: (poolId: number, amount: string) => Promise<void>;
  isLoading: boolean;
}

export default function CommunityPoolsTab({
  address,
  contractAddress,
  contractABI,
  onContributeToPool,
  isLoading
}: CommunityPoolsTabProps) {
  const [poolId, setPoolId] = useState(1);
  const [poolContribution, setPoolContribution] = useState('');
  const [poolsData, setPoolsData] = useState<any[]>([]);

  // 获取总池子数量
  const { data: nextPoolId } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: 'nextPoolId',
    enabled: !!contractAddress,
    watch: true,
  });

  // 获取池子信息
  const { data: pool1Info, refetch: refetchPool1 } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getPoolInfo',
    args: [1],
    enabled: !!contractAddress,
    watch: true,
  });

  const { data: pool2Info, refetch: refetchPool2 } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getPoolInfo',
    args: [2],
    enabled: !!contractAddress,
    watch: true,
  });

  const { data: pool3Info, refetch: refetchPool3 } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getPoolInfo',
    args: [3],
    enabled: !!contractAddress,
    watch: true,
  });

  // 获取用户在各池子的贡献
  const { data: userContrib1, refetch: refetchContrib1 } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getUserPoolContribution',
    args: [1, address],
    enabled: !!contractAddress && !!address,
    watch: true,
  });

  const { data: userContrib2, refetch: refetchContrib2 } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getUserPoolContribution',
    args: [2, address],
    enabled: !!contractAddress && !!address,
    watch: true,
  });

  const { data: userContrib3, refetch: refetchContrib3 } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getUserPoolContribution',
    args: [3, address],
    enabled: !!contractAddress && !!address,
    watch: true,
  });

  // 格式化ETH显示
  const formatEther = (wei: bigint) => {
    return (Number(wei || 0) / 1e18).toFixed(4);
  };

  // 组装池子数据
  useEffect(() => {
    console.log('Raw pool data:', { pool1Info, pool2Info, pool3Info });
    console.log('User contributions:', { userContrib1, userContrib2, userContrib3 });
    
    const pools = [];

    if (pool1Info) {
      // getPoolInfo返回: [name, totalAmount, participantCount, rewardRate, isActive]
      const [name, totalAmount, participantCount, rewardRate, isActive] = pool1Info as any[];
      console.log('Pool 1 parsed:', { name, totalAmount, participantCount, rewardRate, isActive });
      pools.push({
        id: 1,
        name: name || '🌟 Beginner-Friendly Pool',
        apy: '8%',
        totalAmount: formatEther(totalAmount || BigInt(0)),
        participants: Number(participantCount || 0),
        myContribution: formatEther(userContrib1 ? BigInt(userContrib1.toString()) : BigInt(0)),
        description: 'Stable returns for beginners, low risk with high security',
        isActive: isActive === true
      });
    }

    if (pool2Info) {
      const [name, totalAmount, participantCount, rewardRate, isActive] = pool2Info as any[];
      console.log('Pool 2 parsed:', { name, totalAmount, participantCount, rewardRate, isActive });
      pools.push({
        id: 2,
        name: name || '💎 Diamond Hands Pool',
        apy: '10%',
        totalAmount: formatEther(totalAmount || BigInt(0)),
        participants: Number(participantCount || 0),
        myContribution: formatEther(userContrib2 ? BigInt(userContrib2.toString()) : BigInt(0)),
        description: 'Exclusive for long-term holders, longer lock-up for higher returns',
        isActive: isActive === true
      });
    }

    if (pool3Info) {
      const [name, totalAmount, participantCount, rewardRate, isActive] = pool3Info as any[];
      console.log('Pool 3 parsed:', { name, totalAmount, participantCount, rewardRate, isActive });
      pools.push({
        id: 3,
        name: name || '🚀 Innovation Project Pool',
        apy: '12%',
        totalAmount: formatEther(totalAmount || BigInt(0)),
        participants: Number(participantCount || 0),
        myContribution: formatEther(userContrib3 ? BigInt(userContrib3.toString()) : BigInt(0)),
        description: 'Supporting innovative DeFi projects, high returns with high risk',
        isActive: isActive === true
      });
    }

    // 如果没有池子数据，使用默认示例数据
    if (pools.length === 0) {
      pools.push(
        {
          id: 1,
          name: '🌟 Beginner-Friendly Pool',
          apy: '8%',
          totalAmount: '0.0000',
          participants: 0,
          myContribution: '0.0000',
          description: 'Stable returns for beginners, low risk with high security',
          isActive: false
        },
        {
          id: 2,
          name: '💎 Diamond Hands Pool',
          apy: '10%',
          totalAmount: '0.0000',
          participants: 0,
          myContribution: '0.0000',
          description: 'Exclusive for long-term holders, longer lock-up for higher returns',
          isActive: false
        },
        {
          id: 3,
          name: '🚀 Innovation Project Pool',
          apy: '12%',
          totalAmount: '0.0000',
          participants: 0,
          myContribution: '0.0000',
          description: 'Supporting innovative DeFi projects, high returns with high risk',
          isActive: false
        }
      );
    }

    setPoolsData(pools);
  }, [pool1Info, pool2Info, pool3Info, userContrib1, userContrib2, userContrib3]);

  const handleContributeToPool = async () => {
    if (!poolContribution) return;
    await onContributeToPool(poolId, poolContribution);
    setPoolContribution('');
    
    // 立即刷新数据
    const refreshData = async () => {
      console.log(`Refreshing pool ${poolId} data...`);
      if (poolId === 1) {
        await refetchPool1();
        await refetchContrib1();
      } else if (poolId === 2) {
        await refetchPool2();
        await refetchContrib2();
      } else if (poolId === 3) {
        await refetchPool3();
        await refetchContrib3();
      }
      console.log(`Pool ${poolId} data refreshed`);
    };
    
    // 立即刷新一次
    await refreshData();
    
    // 3秒后再刷新一次确保数据更新
    setTimeout(async () => {
      await refreshData();
    }, 3000);
  };

  const selectedPool = poolsData.find(pool => pool.id === poolId);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">🏆 Community Savings Pools</h3>
      <p className="text-sm text-gray-600 mb-6">
        Join community collective savings for higher yields. Strength in numbers, shared risks and rewards.
      </p>

      {/* Pool Status */}
      {nextPoolId && Number(nextPoolId) > 1 && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-800">
            📊 {Number(nextPoolId) - 1} community pools are currently active
          </div>
        </div>
      )}

      {poolsData.length === 0 || !poolsData.some(p => p.isActive) ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🏊‍♂️</div>
          <p className="text-gray-500 mb-4">No active community pools yet</p>
          <p className="text-sm text-gray-400">Pools will be available once they are initialized by the administrator</p>
        </div>
      ) : (
        <>
          {/* Pool Selection and Contribution */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Savings Pool</label>
              <select
                value={poolId}
                onChange={(e) => setPoolId(Number(e.target.value))}
                className="w-full p-3 border rounded-lg"
              >
                {poolsData.filter(pool => pool.isActive).map(pool => (
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
              disabled={!poolContribution || isLoading || !selectedPool?.isActive}
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
            {poolsData.filter(pool => pool.isActive).map(pool => (
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
        </>
      )}

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