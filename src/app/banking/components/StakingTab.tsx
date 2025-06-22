'use client';

import React, { useState } from 'react';
import { useAccount, useContractWrite, usePrepareContractWrite, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { parseEther, formatEther } from 'viem';
import { toast } from 'react-hot-toast';

interface StakingTabProps {
  contractAddress?: `0x${string}`;
  contractABI: any;
  userStakes: any[];
  refetchUserStakes: () => void;
}

export default function StakingTab({ 
  contractAddress, 
  contractABI, 
  userStakes, 
  refetchUserStakes 
}: StakingTabProps) {
  const { address, isConnected } = useAccount();
  const [stakingAmount, setStakingAmount] = useState('');
  
  const { data: ethBalance } = useBalance({
    address: address,
    enabled: !!address && isConnected,
  });

  // 准备质押交易
  const { config: stakeConfig } = usePrepareContractWrite({
    address: contractAddress,
    abi: contractABI,
    functionName: 'stake',
    value: stakingAmount ? parseEther(stakingAmount) : BigInt(0),
    enabled: !!contractAddress && isConnected && !!stakingAmount && parseFloat(stakingAmount) >= 0.1,
  });

  const { write: stakeTokens, isLoading: isStaking } = useContractWrite({
    ...stakeConfig,
    onSuccess: (data) => {
      toast.success('Staking successful!');
      setStakingAmount('');
      setTimeout(() => {
        refetchUserStakes();
      }, 2000);
    },
    onError: (error) => {
      console.error('Staking failed:', error);
      toast.error('Staking failed: ' + (error.message || 'Unknown error'));
    },
  });

  // 处理质押
  const handleStake = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!stakingAmount || parseFloat(stakingAmount) < 0.1) {
      toast.error('Minimum staking amount is 0.1 ETH');
      return;
    }

    if (!ethBalance || parseFloat(formatEther(ethBalance.value)) < parseFloat(stakingAmount)) {
      toast.error('Insufficient balance');
      return;
    }

    // 延迟检查以确保配置已准备好
    setTimeout(() => {
      if (!stakeTokens) {
        toast.error('Unable to stake, please check network connection and try again');
        return;
      }
      stakeTokens();
    }, 100);
  };

  // 处理解除质押
  const handleUnstake = (stakeId: number) => {
    const stake = processedStakes[stakeId];
    if (!stake || !stake.isActive) {
      toast.error('Cannot find valid staking information');
      return;
    }

    const lockTime = calculateLockTimeRemaining(stake.startTime, stake.lockPeriod);
    if (!lockTime.isUnlocked) {
      toast.error(`Stake is still locked, ${lockTime.days} days ${lockTime.hours} hours remaining`);
      return;
    }

    // 这里需要实现解除质押的合约调用
    toast('Unstaking feature is under development...', { duration: 3000 });
  };

  // 计算锁定时间剩余
  const calculateLockTimeRemaining = (startTime: number, lockPeriod: number) => {
    const now = Math.floor(Date.now() / 1000);
    const unlockTime = startTime + lockPeriod;
    const timeRemaining = unlockTime - now;
    
    if (timeRemaining <= 0) {
      return { isUnlocked: true, days: 0, hours: 0 };
    }
    
    const days = Math.floor(timeRemaining / (24 * 60 * 60));
    const hours = Math.floor((timeRemaining % (24 * 60 * 60)) / (60 * 60));
    
    return { isUnlocked: false, days, hours };
  };

  // 计算质押奖励
  const calculateStakeReward = (amount: string, rewardRate: number, startTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const timeElapsed = now - startTime;
    const yearlyReward = parseFloat(amount) * (rewardRate / 10000); // 从基点转换
    const secondsPerYear = 365 * 24 * 60 * 60;
    const earnedReward = (yearlyReward * timeElapsed) / secondsPerYear;
    
    return earnedReward;
  };

  // 格式化质押数据
  const processedStakes = userStakes ? userStakes.map((stake, index) => ({
    id: index,
    amount: formatEther(stake.amount || 0),
    startTime: Number(stake.startTime || 0),
    lockPeriod: Number(stake.lockPeriod || 0),
    rewardRate: Number(stake.rewardRate || 0) / 100, // 从基点转换为百分比
    isActive: Boolean(stake.isActive),
  })) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-purple-600" />
          Stake ETH
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Staking Amount (ETH)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="0.0"
              value={stakingAmount}
              onChange={(e) => setStakingAmount(e.target.value)}
            />
          </div>

          {/* 质押计算器 */}
          {stakingAmount && parseFloat(stakingAmount) >= 0.1 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Rewards:</span>
                  <span>{(parseFloat(stakingAmount) * 0.125 / 365).toFixed(6)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Rewards:</span>
                  <span>{(parseFloat(stakingAmount) * 0.125 / 12).toFixed(4)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Yearly Rewards:</span>
                  <span>{(parseFloat(stakingAmount) * 0.125).toFixed(4)} ETH</span>
                </div>
              </div>
            </div>
          )}

          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={handleStake}
            disabled={isStaking || !stakingAmount || parseFloat(stakingAmount) < 0.1}
          >
            {isStaking ? 'Staking...' : 'Stake ETH'}
          </Button>
          <div className="text-xs text-gray-500">
            Staking APY: 12.5% • Minimum Stake: 0.1 ETH • Lock Period: 7 days
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Staking Positions</h3>
        <div className="space-y-4">
          {processedStakes.length > 0 ? (
            processedStakes.map((stake) => {
              const lockTime = calculateLockTimeRemaining(stake.startTime, stake.lockPeriod);
              const estimatedReward = calculateStakeReward(stake.amount, stake.rewardRate * 100, stake.startTime);
              const lockProgress = Math.min(100, ((Date.now() / 1000 - stake.startTime) / stake.lockPeriod) * 100);
              
              return (
                <div key={stake.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900">Stake #{stake.id + 1}</div>
                      <div className={`text-sm ${stake.isActive ? (lockTime.isUnlocked ? 'text-green-600' : 'text-blue-600') : 'text-gray-600'}`}>
                        {!stake.isActive ? 'Withdrawn' : lockTime.isUnlocked ? 'Ready to Unstake' : 'Locked'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{parseFloat(stake.amount).toFixed(4)} ETH</div>
                      <div className="text-sm text-gray-600">Staked</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">Estimated Rewards:</span>
                      <span className="ml-1 font-medium text-purple-600">{estimatedReward.toFixed(6)} ETH</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{lockTime.isUnlocked ? 'Status:' : 'Time Remaining:'}</span>
                      <span className={`ml-1 font-medium ${lockTime.isUnlocked ? 'text-green-600' : ''}`}>
                        {lockTime.isUnlocked ? 'Unlocked' : `${lockTime.days}d ${lockTime.hours}h`}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">APY:</span>
                      <span className="ml-1 font-medium">{stake.rewardRate}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Start Date:</span>
                      <span className="ml-1 font-medium">{new Date(stake.startTime * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className={`h-2 rounded-full ${lockTime.isUnlocked ? 'bg-green-500' : 'bg-purple-600'}`} 
                      style={{width: `${lockProgress}%`}}
                    ></div>
                  </div>
                  {stake.isActive && (
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1" 
                        onClick={() => toast(`Stake #${stake.id + 1} Details:\nStaked Amount: ${parseFloat(stake.amount).toFixed(4)} ETH\nEstimated Rewards: ${estimatedReward.toFixed(6)} ETH\nAPY: ${stake.rewardRate}%\nStatus: ${lockTime.isUnlocked ? 'Unlocked' : `Locked (${lockTime.days}d ${lockTime.hours}h)`}`, { duration: 8000 })}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        className={`flex-1 ${lockTime.isUnlocked ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                        variant={lockTime.isUnlocked ? 'default' : 'outline'}
                        onClick={() => handleUnstake(stake.id)}
                        disabled={!lockTime.isUnlocked}
                      >
                        {lockTime.isUnlocked ? 'Unstake' : `Locked (${lockTime.days}d)`}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No staking positions</p>
              <p className="text-sm text-gray-400">Stake ETH to earn rewards</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 