'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calculator, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CalculatorTabProps {
  interestRate?: any;
}

export default function CalculatorTab({ interestRate }: CalculatorTabProps) {
  const [calculatorAmount, setCalculatorAmount] = useState('');
  const [calculatorPeriod, setCalculatorPeriod] = useState('12');
  const [calculatorType, setCalculatorType] = useState<'deposit' | 'loan' | 'staking'>('deposit');
  const [calculatorResult, setCalculatorResult] = useState<{
    simple: number;
    compound: number;
    totalAmount: number;
    monthlyEarnings: number;
  } | null>(null);

  // 利率配置
  const rates = {
    deposit: 5, // 5% 存款利率
    loan: 8.5, // 8.5% 贷款利率
    staking: 12.5, // 12.5% 质押利率
  };

  // 计算复利
  const calculateCompoundInterest = (principal: number, rate: number, time: number, compoundFreq: number = 12) => {
    // A = P(1 + r/n)^(nt)
    const r = rate / 100;
    const amount = principal * Math.pow(1 + r / compoundFreq, compoundFreq * time);
    const interest = amount - principal;
    
    return { amount, interest };
  };

  // 计算简单利息
  const calculateSimpleInterest = (principal: number, rate: number, time: number) => {
    const r = rate / 100;
    const interest = principal * r * time;
    const amount = principal + interest;
    
    return { amount, interest };
  };

  // 处理计算
  const handleCalculate = () => {
    if (!calculatorAmount || parseFloat(calculatorAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const principal = parseFloat(calculatorAmount);
    const months = parseInt(calculatorPeriod);
    const years = months / 12;
    const rate = rates[calculatorType];

    // 计算简单利息
    const simple = calculateSimpleInterest(principal, rate, years);
    
    // 计算复利（按月复利）
    const compound = calculateCompoundInterest(principal, rate, years, 12);
    
    // 计算月收益
    const monthlyRate = rate / 100 / 12;
    const monthlyEarnings = principal * monthlyRate;

    setCalculatorResult({
      simple: simple.interest,
      compound: compound.interest,
      totalAmount: compound.amount,
      monthlyEarnings: monthlyEarnings,
    });

    toast.success('Calculation completed!');
  };

  // 重置计算器
  const handleReset = () => {
    setCalculatorAmount('');
    setCalculatorPeriod('12');
    setCalculatorType('deposit');
    setCalculatorResult(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calculator className="h-5 w-5 mr-2 text-green-600" />
          Interest Calculator
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Calculation Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={calculatorType}
              onChange={(e) => setCalculatorType(e.target.value as 'deposit' | 'loan' | 'staking')}
            >
              <option value="deposit">Deposit Earnings (5% APY)</option>
              <option value="loan">Loan Cost (8.5% APY)</option>
              <option value="staking">Staking Rewards (12.5% APY)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {calculatorType === 'loan' ? 'Loan Amount (ETH)' : 'Investment Amount (ETH)'}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0.0"
              value={calculatorAmount}
              onChange={(e) => setCalculatorAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Investment Period (Months)</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={calculatorPeriod}
              onChange={(e) => setCalculatorPeriod(e.target.value)}
            >
              <option value="1">1 Month</option>
              <option value="3">3 Months</option>
              <option value="6">6 Months</option>
              <option value="12">12 Months</option>
              <option value="24">24 Months</option>
              <option value="36">36 Months</option>
              <option value="60">60 Months</option>
            </select>
          </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Annual Rate:</span>
                  <span className="font-medium">{rates[calculatorType]}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Investment Period:</span>
                  <span className="font-medium">{calculatorPeriod} months ({(parseInt(calculatorPeriod) / 12).toFixed(1)} years)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Compound Frequency:</span>
                  <span className="font-medium">Monthly</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700" 
                onClick={handleCalculate}
                disabled={!calculatorAmount || parseFloat(calculatorAmount) <= 0}
              >
                Calculate Returns
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReset}
              >
                Reset
              </Button>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          Calculation Results
        </h3>
        
        {calculatorResult ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-center mb-3">
                <div className="text-2xl font-bold text-green-700">
                  {calculatorResult.totalAmount.toFixed(4)} ETH
                </div>
                <div className="text-sm text-gray-600">Final Amount</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-gray-900">{calculatorResult.compound.toFixed(4)} ETH</div>
                  <div className="text-gray-600">Compound Interest</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900">{calculatorResult.simple.toFixed(4)} ETH</div>
                  <div className="text-gray-600">Simple Interest</div>
                </div>
              </div>
            </div>

                          <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Monthly Earnings</span>
                  <span className="font-semibold text-gray-900">{calculatorResult.monthlyEarnings.toFixed(6)} ETH</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Annual Rate</span>
                  <span className="font-semibold text-green-600">{rates[calculatorType]}%</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Compound Advantage</span>
                  <span className="font-semibold text-blue-600">
                    +{(calculatorResult.compound - calculatorResult.simple).toFixed(6)} ETH
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs text-gray-600">
                  <strong>Note:</strong> Calculation based on {rates[calculatorType]}% annual rate, compounded monthly.
                  Actual returns may vary due to market conditions and contract fees.
                  {calculatorType === 'loan' && ' Loan cost includes principal and interest.'}
                </div>
              </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Calculator className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">Enter amount and period</p>
            <p className="text-sm text-gray-400">Click "Calculate Returns" to see detailed results</p>
          </div>
        )}
      </div>
    </div>
  );
} 