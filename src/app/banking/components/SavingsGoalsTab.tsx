'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SavingsGoalsTabProps {
  address: string;
  bankBalance: string;
  onCreateSavingsGoal: (name: string, targetAmount: string, durationDays: number) => Promise<void>;
  onContributeToGoal: (goalId: number, amount: string) => Promise<void>;
  isLoading: boolean;
}

export default function SavingsGoalsTab({
  address,
  bankBalance,
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

  const handleCreateGoal = async () => {
    if (!goalName || !goalTarget) return;
    await onCreateSavingsGoal(goalName, goalTarget, goalDuration);
    setGoalName('');
    setGoalTarget('');
    setGoalDuration(30);
  };

  const handleGoalContribution = async () => {
    if (!goalContribution) return;
    await onContributeToGoal(selectedGoalId, goalContribution);
    setGoalContribution('');
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
            >
              <option value={0}>Goal #1 (Car Fund)</option>
              <option value={1}>Goal #2 (Travel Savings)</option>
              <option value={2}>Goal #3 (Education Fund)</option>
            </select>
            <div className="text-xs text-gray-500 mt-1">
              Progress: 0.5 ETH / 2.0 ETH (25%)
            </div>
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
            disabled={!goalContribution || isLoading}
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
        <div className="grid gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Car Fund</span>
              <span className="text-sm text-gray-500">25%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="bg-green-600 h-2 rounded-full" style={{width: '25%'}}></div>
            </div>
            <div className="text-sm text-gray-600">
              0.5 ETH / 2.0 ETH • Remaining 15 days • Reward rate 2.5%
            </div>
          </div>
        </div>
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