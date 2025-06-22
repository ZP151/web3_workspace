'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useNetwork, useContractRead, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wallet } from 'lucide-react';
import Link from 'next/link';
import { formatEther } from 'viem';
import { getContractAddress, getContractABI } from '@/config/contracts';

// 导入组件
import {
  BankingNavigation,
  BankingInfoCard,
  OverviewTab,
  DepositWithdrawTab,
  TransfersTab,
  LoansTab,
  StakingTab,
  SavingsGoalsTab,
  CommunityPoolsTab,
  CalculatorTab,
} from './components';

// 导入hooks
import { useTransferFunctions, useBankingCalculations, useDepositWithdrawFunctions, useWeb3BankingFeatures } from './hooks/useBankingHooks';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'stake' | 'unstake' | 'loan' | 'repay' | 'transfer_internal' | 'transfer_external' | 'batch_transfer';
  amount: string;
  timestamp: string;
  txHash: string;
  blockNumber?: number;
  contractAddress?: string;
}

export default function BankingPage() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  
  // 状态管理
  const [activeView, setActiveView] = useState('overview');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 合约配置
  const contractAddress = chain?.id ? getContractAddress(chain.id, 'EnhancedBank') : undefined;
  const contractABI = getContractABI('EnhancedBank');

  // 钱包余额
  const { data: ethBalance } = useBalance({
    address: address,
    enabled: !!address && isConnected,
  });

  // 合约读取
  const { data: accountInfo, refetch: refetchAccountInfo } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getAccountInfo',
    args: address ? [address] : undefined,
    enabled: !!contractAddress && !!address && isConnected,
    watch: true,
  });

  const { data: interestRate } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'DEPOSIT_INTEREST_RATE',
    enabled: !!contractAddress,
    watch: true,
  });

  const { data: minimumDeposit } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'minimumDeposit',
    enabled: !!contractAddress,
    watch: true,
  });

  // Read user loans from contract
  const { data: userLoans, refetch: refetchUserLoans } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getUserLoans',
    args: address ? [address] : undefined,
    enabled: !!contractAddress && !!address && isConnected,
    watch: true,
  });

  // Read user stakes from contract
  const { data: userStakes, refetch: refetchUserStakes } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getUserStakes',
    args: address ? [address] : undefined,
    enabled: !!contractAddress && !!address && isConnected,
    watch: true,
  });

  // 自定义hooks
  const { calculateInterest, calculateCompoundInterest } = useBankingCalculations();
  const {
    isTransferring,
    handleTransferInternal,
    handleTransferExternal,
    handleBatchTransfer,
    handleUserToUserTransfer,
    handleBatchUserTransfer,
  } = useTransferFunctions(contractAddress as `0x${string}`, contractABI, refetchAccountInfo);
  
  // Web3 Banking Features Hooks
  const {
    isLoading: isWeb3Loading,
    handleSocialTransfer,
    handleCreateSavingsGoal,
    handleContributeToGoal,
    handleTakeFlashLoan,
    handleRepayFlashLoan,
    handleContributeToPool,
    handleInitiateCrossChain,
  } = useWeb3BankingFeatures(contractAddress as `0x${string}`, contractABI, refetchAccountInfo);

  // 解析账户信息
  const bankBalance = accountInfo ? formatEther(accountInfo[0] as bigint) : '0';
  const lastDepositTime = accountInfo ? Number(accountInfo[1]) : 0;
  const totalDeposited = accountInfo ? formatEther(accountInfo[2] as bigint) : '0';
  const totalWithdrawn = accountInfo ? formatEther(accountInfo[3] as bigint) : '0';
  const pendingInterest = accountInfo ? formatEther(accountInfo[4] as bigint) : '0';

  // 计算利息
  const interestCalc = calculateInterest(bankBalance, interestRate);

  // 存款取款hooks
  const {
    isDepositing,
    isWithdrawing,
    isWithdrawingAll,
    handleDeposit,
    handleWithdraw,
    handleWithdrawAll,
    handleClaimInterest,
  } = useDepositWithdrawFunctions(contractAddress as `0x${string}`, contractABI, refetchAccountInfo);

  // 自动刷新
  useEffect(() => {
    if (!isConnected || !contractAddress) return;

    const interval = setInterval(() => {
      refetchAccountInfo();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [isConnected, contractAddress, refetchAccountInfo]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Dashboard
                </Link>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Auto refresh: 10s
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <Wallet className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-600">Please connect your wallet to access banking features</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Auto refresh: 10s
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banking Info Card */}
        <BankingInfoCard
          address={address}
          chain={chain}
          contractAddress={contractAddress || undefined}
          bankBalance={bankBalance}
          isConnected={isConnected}
          onRefresh={refetchAccountInfo}
        />

        {/* Navigation Tabs */}
        <BankingNavigation activeView={activeView} setActiveView={setActiveView} />

        {/* Tab Content */}
        {activeView === 'overview' && (
          <OverviewTab
            bankBalance={bankBalance}
            ethBalance={ethBalance}
            address={address}
            totalDeposited={totalDeposited}
            totalWithdrawn={totalWithdrawn}
            pendingInterest={pendingInterest}
            interestRate={interestRate}
            interestCalc={interestCalc}
          />
        )}

        {activeView === 'deposit-withdraw' && (
          <DepositWithdrawTab
            depositAmount={depositAmount}
            withdrawAmount={withdrawAmount}
            setDepositAmount={setDepositAmount}
            setWithdrawAmount={setWithdrawAmount}
            bankBalance={bankBalance}
            ethBalance={ethBalance}
            minimumDeposit={minimumDeposit}
            isDepositing={isDepositing}
            isWithdrawing={isWithdrawing}
            isWithdrawingAll={isWithdrawingAll}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            onWithdrawAll={handleWithdrawAll}
            onClaimInterest={handleClaimInterest}
            pendingInterest={pendingInterest}
          />
        )}

        {activeView === 'transfers' && (
          <TransfersTab
            address={address || ''}
            bankBalance={bankBalance}
            onTransferInternal={handleTransferInternal}
            onTransferExternal={handleTransferExternal}
            onBatchTransfer={handleBatchTransfer}
            onUserToUserTransfer={handleUserToUserTransfer}
            onBatchUserTransfer={handleBatchUserTransfer}
            onSocialTransfer={handleSocialTransfer}
            isLoading={isWeb3Loading || isTransferring}
          />
        )}

        {activeView === 'loans' && (
          <LoansTab
            address={address || ''}
            onTakeFlashLoan={handleTakeFlashLoan}
            onRepayFlashLoan={handleRepayFlashLoan}
            isLoading={isWeb3Loading}
          />
        )}

        {activeView === 'staking' && (
          <StakingTab
            contractAddress={contractAddress as `0x${string}` | undefined}
            contractABI={contractABI}
            userStakes={userStakes as any[] || []}
            refetchUserStakes={refetchUserStakes}
          />
        )}

        {activeView === 'savings' && (
          <SavingsGoalsTab
            address={address || ''}
            bankBalance={bankBalance}
            contractAddress={contractAddress as `0x${string}` | undefined}
            contractABI={contractABI}
            onCreateSavingsGoal={handleCreateSavingsGoal}
            onContributeToGoal={handleContributeToGoal}
            isLoading={isWeb3Loading}
          />
        )}

        {activeView === 'community' && (
          <CommunityPoolsTab
            address={address || ''}
            contractAddress={contractAddress as `0x${string}` | undefined}
            contractABI={contractABI}
            onContributeToPool={handleContributeToPool}
            isLoading={isWeb3Loading}
          />
        )}


      </div>
    </div>
  );
} 