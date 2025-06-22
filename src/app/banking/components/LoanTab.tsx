'use client';

import React, { useState } from 'react';
import { useAccount, useContractWrite, usePrepareContractWrite, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { parseEther, formatEther } from 'viem';
import { toast } from 'react-hot-toast';

interface LoanTabProps {
  contractAddress?: `0x${string}`;
  contractABI: any;
  userLoans: any[];
  refetchUserLoans: () => void;
  interestRate?: any;
}

export default function LoanTab({ 
  contractAddress, 
  contractABI, 
  userLoans, 
  refetchUserLoans,
  interestRate 
}: LoanTabProps) {
  const { address, isConnected } = useAccount();
  const [loanAmount, setLoanAmount] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('');
  
  const { data: ethBalance } = useBalance({
    address: address,
    enabled: !!address && isConnected,
  });

  // 准备贷款申请交易
  const { config: requestLoanConfig } = usePrepareContractWrite({
    address: contractAddress,
    abi: contractABI,
    functionName: 'requestLoan',
    args: loanAmount ? [parseEther(loanAmount)] : undefined,
    value: collateralAmount ? parseEther(collateralAmount) : BigInt(0),
    enabled: !!contractAddress && isConnected && !!loanAmount && !!collateralAmount && 
             parseFloat(loanAmount) >= 0.1 && parseFloat(collateralAmount) > 0,
  });

  const { write: requestLoan, isLoading: isRequestingLoan } = useContractWrite({
    ...requestLoanConfig,
    onSuccess: (data) => {
      toast.success('Loan request successful!');
      setLoanAmount('');
      setCollateralAmount('');
      setTimeout(() => {
        refetchUserLoans();
      }, 2000);
    },
    onError: (error) => {
      console.error('Loan request failed:', error);
      toast.error('Loan request failed: ' + (error.message || 'Unknown error'));
    },
  });

  // 准备还款交易
  const prepareRepayLoan = (loanId: number, amount: string) => {
    return usePrepareContractWrite({
      address: contractAddress,
      abi: contractABI,
      functionName: 'repayLoan',
      args: [loanId],
      value: amount ? parseEther(amount) : BigInt(0),
      enabled: !!contractAddress && isConnected && !!amount,
    });
  };

  // 处理贷款申请
  const handleRequestLoan = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!loanAmount || parseFloat(loanAmount) < 0.1) {
      toast.error('Minimum loan amount is 0.1 ETH');
      return;
    }

    const requiredCollateral = parseFloat(loanAmount) * 1.5;
    setCollateralAmount(requiredCollateral.toString());
    
    if (!ethBalance || parseFloat(formatEther(ethBalance.value)) < requiredCollateral) {
      toast.error(`Insufficient collateral. Required: ${requiredCollateral.toFixed(4)} ETH`);
      return;
    }

    // 延迟检查以确保配置已准备好
    setTimeout(() => {
      if (!requestLoan) {
        toast.error('Unable to request loan, please check network connection and try again');
        return;
      }
      requestLoan();
    }, 100);
  };

  // 计算贷款利息
  const calculateLoanInterest = (loan: any) => {
    const now = Math.floor(Date.now() / 1000);
    const timeElapsed = now - Number(loan.startTime);
    const yearlyInterest = parseFloat(formatEther(loan.amount)) * (Number(loan.interestRate) / 10000); // 从基点转换
    const secondsPerYear = 365 * 24 * 60 * 60;
    const accruedInterest = (yearlyInterest * timeElapsed) / secondsPerYear;
    const totalOwed = parseFloat(formatEther(loan.amount)) + accruedInterest;
    
    return { accruedInterest, totalOwed };
  };

  // 处理还款
  const handleRepayLoan = (loanId: number) => {
    const loan = processedLoans[loanId];
    if (!loan || !loan.isActive) {
      toast.error('Cannot find valid loan information');
      return;
    }

    const { totalOwed } = calculateLoanInterest(loan);
    
    if (!ethBalance || parseFloat(formatEther(ethBalance.value)) < totalOwed) {
      toast.error(`Insufficient balance. Required: ${totalOwed.toFixed(6)} ETH`);
      return;
    }

    // 这里需要动态创建还款配置和写入函数
    toast('Loan repayment feature is under development...', { duration: 3000 });
  };

  // 格式化贷款数据
  const processedLoans = userLoans ? userLoans.map((loan, index) => ({
    id: index,
    amount: formatEther(loan.amount || 0),
    collateral: formatEther(loan.collateral || 0),
    startTime: Number(loan.startTime || 0),
    interestRate: Number(loan.interestRate || 0) / 100, // 从基点转换为百分比
    isActive: Boolean(loan.isActive),
  })) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
          Collateralized Loans
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loan Amount (ETH)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.0"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
            />
          </div>

          {/* 贷款计算器 */}
          {loanAmount && parseFloat(loanAmount) > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Required Collateral:</span>
                  <span>{(parseFloat(loanAmount) * 1.5).toFixed(2)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Interest Rate:</span>
                  <span>8.5% APY</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Interest:</span>
                  <span>{(parseFloat(loanAmount) * 0.085 / 12).toFixed(4)} ETH</span>
                </div>
              </div>
            </div>
          )}

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            onClick={handleRequestLoan}
            disabled={isRequestingLoan || !loanAmount || parseFloat(loanAmount) < 0.1}
          >
            {isRequestingLoan ? 'Requesting...' : 'Request Loan'}
          </Button>
          <div className="text-xs text-gray-500">
            Min Collateral Ratio: 150% • Interest Rate: 8.5% APY
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Status</h3>
        <div className="space-y-4">
          {processedLoans.length > 0 ? (
            processedLoans.map((loan) => {
              const { accruedInterest, totalOwed } = calculateLoanInterest(loan);
              
              return (
                <div key={loan.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900">Loan #{loan.id + 1}</div>
                      <div className={`text-sm ${loan.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                        {loan.isActive ? 'Active' : 'Repaid'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{parseFloat(loan.amount).toFixed(4)} ETH</div>
                      <div className="text-sm text-gray-600">Borrowed</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Collateral:</span>
                      <span className="ml-1 font-medium">{parseFloat(loan.collateral).toFixed(4)} ETH</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Interest Rate:</span>
                      <span className="ml-1 font-medium">{loan.interestRate}% APY</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Start Date:</span>
                      <span className="ml-1 font-medium">{new Date(loan.startTime * 1000).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Active Days:</span>
                      <span className="ml-1 font-medium">
                        {Math.floor((Date.now() / 1000 - loan.startTime) / (24 * 60 * 60))} days
                      </span>
                    </div>
                    {loan.isActive && (
                      <>
                        <div>
                          <span className="text-gray-600">Accrued Interest:</span>
                          <span className="ml-1 font-medium text-red-600">{accruedInterest.toFixed(6)} ETH</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Owed:</span>
                          <span className="ml-1 font-medium text-red-600">{totalOwed.toFixed(6)} ETH</span>
                        </div>
                      </>
                    )}
                  </div>
                  {loan.isActive && (
                    <div className="mt-3 flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1" 
                        onClick={() => toast(`Loan #${loan.id + 1} Details:\nPrincipal: ${parseFloat(loan.amount).toFixed(4)} ETH\nInterest: ${accruedInterest.toFixed(6)} ETH\nTotal Owed: ${totalOwed.toFixed(6)} ETH\nAnnual Rate: ${loan.interestRate}%`, { duration: 8000 })}
                      >
                        Calculate Interest
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1" 
                        onClick={() => handleRepayLoan(loan.id)}
                      >
                        Repay Loan
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No active loans</p>
              <p className="text-sm text-gray-400">Request a loan to see it here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 