'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useContractRead } from 'wagmi';

interface SavingsGoal {
  name: string;
  targetAmount: bigint;
  currentAmount: bigint;
  deadline: bigint;
  rewardRate: number;
  isAchieved: boolean;
}

interface SavingsGoalsTabProps {
  address: string;
  bankBalance: string;
  contractAddress?: `0x${string}`;
  contractABI?: any;
  onCreateSavingsGoal: (name: string, targetAmount: string, durationDays: number) => Promise<void>;
  onContributeToGoal: (goalId: number, amount: string) => Promise<void>;
  isLoading: boolean;
}

export default function SavingsGoalsTab({
  address,
  bankBalance,
  contractAddress,
  contractABI,
  onCreateSavingsGoal,
  onContributeToGoal,
  isLoading
}: SavingsGoalsTabProps) {
  // 创建目标状态
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDuration, setGoalDuration] = useState(30);

  // 向目标存款状态
  const [goalContribution, setGoalContribution] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState(0);

  // 获取用户的储蓄目标
  const { data: userGoals, refetch: refetchGoals } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getUserSavingsGoals',
    args: [address],
    enabled: !!contractAddress && !!address,
    watch: true,
  });

  const savingsGoals = userGoals as SavingsGoal[] || [];

  // 格式化ETH显示
  const formatEther = (wei: bigint) => {
    return (Number(wei) / 1e18).toFixed(4);
  };

  // 计算进度百分比
  const calculateProgress = (current: bigint, target: bigint) => {
    if (target === BigInt(0)) return 0;
    return Math.min(100, Number(current * BigInt(100) / target));
  };

  // 计算剩余天数
  const calculateDaysRemaining = (deadline: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    const deadlineSeconds = Number(deadline);
    const remainingSeconds = deadlineSeconds - now;
    return Math.max(0, Math.ceil(remainingSeconds / (24 * 60 * 60)));
  };

  const handleCreateGoal = async () => {
    if (!goalName || !goalTarget) return;
    await onCreateSavingsGoal(goalName, goalTarget, goalDuration);
    setGoalName('');
    setGoalTarget('');
    setGoalDuration(30);
    
    // 强制刷新目标列表
    const refreshGoals = async () => {
      console.log('Refreshing savings goals...');
      await refetchGoals();
      console.log('Savings goals refreshed');
    };
    
    // 立即刷新
    await refreshGoals();
    
    // 3秒后再刷新一次
    setTimeout(async () => {
      await refreshGoals();
    }, 3000);
  };

  const handleGoalContribution = async () => {
    if (!goalContribution) return;
    await onContributeToGoal(selectedGoalId, goalContribution);
    setGoalContribution('');
    
    // 强制刷新目标列表
    const refreshGoals = async () => {
      console.log('Refreshing savings goals after contribution...');
      await refetchGoals();
      console.log('Savings goals refreshed after contribution');
    };
    
    // 立即刷新
    await refreshGoals();
    
    // 3秒后再刷新一次
    setTimeout(async () => {
      await refreshGoals();
    }, 3000);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">🎯 Smart Savings Goals</h3>
      <p className="text-sm text-gray-600 mb-6">
        Set savings goals and earn bonus interest when achieved. Longer-term goals offer higher reward rates.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Goal */}
        <div className="space-y-4">
          <h4 className="font-medium text-green-600">Create New Goal</h4>
          
          <div>
            <label className="block text-sm font-medium mb-2">Goal Name</label>
            <input
              type="text"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder="e.g: Car Fund, Travel Savings"
              maxLength={50}
              className="w-full p-3 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target Amount (ETH)</label>
            <input
              type="number"
              step="0.1"
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
              placeholder="1.0"
              className="w-full p-3 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Duration (Days)</label>
            <select
              value={goalDuration}
              onChange={(e) => setGoalDuration(Number(e.target.value))}
              className="w-full p-3 border rounded-lg"
            >
              <option value={7}>7 days (Short-term) - Base rate 2%</option>
              <option value={30}>30 days (Monthly) - Reward rate 2.5%</option>
              <option value={90}>90 days (Quarterly) - Reward rate 3.5%</option>
              <option value={180}>180 days (Semi-annual) - Reward rate 5%</option>
              <option value={365}>365 days (Annual) - Reward rate 8%</option>
            </select>
            <div className="text-xs text-gray-500 mt-1">
              Estimated reward rate: {2 + Math.floor(goalDuration / 30) * 0.5}%
            </div>
          </div>

          <Button
            onClick={handleCreateGoal}
            disabled={!goalName || !goalTarget || isLoading}
            className="w-full"
          >
            Create Savings Goal
          </Button>

          <div className="text-xs text-gray-600 bg-green-50 p-3 rounded">
            💡 After creating a goal, each deposit earns base interest + goal reward interest
          </div>
        </div>

        {/* Contribute to Goal */}
        <div className="space-y-4">
          <h4 className="font-medium text-blue-600">Contribute to Goal</h4>
          
          <div>
            <label className="block text-sm font-medium mb-2">Select Goal</label>
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(Number(e.target.value))}
              className="w-full p-3 border rounded-lg"
              disabled={savingsGoals.length === 0}
            >
              {savingsGoals.length === 0 ? (
                <option value={-1}>No goals created yet</option>
              ) : (
                savingsGoals.map((goal, index) => (
                  <option key={index} value={index}>
                    Goal #{index + 1} ({goal.name})
                  </option>
                ))
              )}
            </select>
            {savingsGoals.length > 0 && selectedGoalId < savingsGoals.length && (
              <div className="text-xs text-gray-500 mt-1">
                Progress: {formatEther(savingsGoals[selectedGoalId].currentAmount)} ETH / {formatEther(savingsGoals[selectedGoalId].targetAmount)} ETH 
                ({calculateProgress(savingsGoals[selectedGoalId].currentAmount, savingsGoals[selectedGoalId].targetAmount)}%)
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Deposit Amount (ETH)</label>
            <input
              type="number"
              step="0.01"
              value={goalContribution}
              onChange={(e) => setGoalContribution(e.target.value)}
              placeholder="0.1"
              className="w-full p-3 border rounded-lg"
            />
            <div className="text-xs text-gray-500 mt-1">
              Bank Balance: {bankBalance} ETH
            </div>
          </div>

          <Button
            onClick={handleGoalContribution}
            disabled={!goalContribution || isLoading || savingsGoals.length === 0}
            className="w-full"
          >
            Contribute to Goal
          </Button>

          <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
            🎯 Upon achieving goal, you'll instantly receive bonus interest automatically added to bank account
          </div>
        </div>
      </div>

      {/* 目标状态展示 */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="font-medium mb-4">My Savings Goals</h4>
        {savingsGoals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🎯</div>
            <p>No savings goals yet. Create your first goal above!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {savingsGoals.map((goal, index) => {
              const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
              const daysRemaining = calculateDaysRemaining(goal.deadline);
              
              return (
                <div key={index} className={`p-4 rounded-lg ${goal.isAchieved ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{goal.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{progress.toFixed(1)}%</span>
                      {goal.isAchieved && <span className="text-green-600">✓ Achieved</span>}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full ${goal.isAchieved ? 'bg-green-600' : 'bg-blue-600'}`}
                      style={{width: `${Math.min(100, progress)}%`}}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatEther(goal.currentAmount)} ETH / {formatEther(goal.targetAmount)} ETH
                    {!goal.isAchieved && (
                      <>
                        {' • '}
                        {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Deadline passed'}
                        {' • '}
                        Reward rate {goal.rewardRate}%
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 功能说明 */}
      <div className="mt-6 pt-6 border-t bg-purple-50 p-4 rounded-lg">
        <h5 className="font-medium text-purple-800 mb-2">Savings Goal Advantages</h5>
        <ul className="text-sm text-purple-700 space-y-1">
          <li>• Set clear goals to foster savings habits</li>
          <li>• Longer-term goals offer higher reward rates</li>
          <li>• Immediate bonus interest upon goal achievement</li>
          <li>• Smart contract automatically calculates and distributes rewards</li>
        </ul>
      </div>
    </Card>
  );
} 