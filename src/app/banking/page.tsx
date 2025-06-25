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

  // 读取银行合约总余额
  const { data: contractBalance, refetch: refetchContractBalance } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getContractBalance',
    enabled: !!contractAddress,
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
    handleRequestLoan,
    handleTakeFlashLoan,
    handleRepayFlashLoan,
    handleRepayLoan,
    handleFullRepayment,
    handleContributeToPool,
    handleInitiateCrossChain,
    getFlashLoanStatus,
    getUserLoans,
    getLoanRepaymentAmount,
    getLoanStatus,
  } = useWeb3BankingFeatures(contractAddress as `0x${string}`, contractABI, refetchAccountInfo);

  // 解析账户信息
  const bankBalance = accountInfo ? formatEther(accountInfo[0] as bigint) : '0';
  const lastDepositTime = accountInfo ? Number(accountInfo[1]) : 0;
  const totalDeposited = accountInfo ? formatEther(accountInfo[2] as bigint) : '0';
  const totalWithdrawn = accountInfo ? formatEther(accountInfo[3] as bigint) : '0';
  const pendingInterest = accountInfo ? formatEther(accountInfo[4] as bigint) : '0';
  
  // 解析银行合约余额
  const totalBankFunds = contractBalance ? formatEther(contractBalance as unknown as bigint) : '0';

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

  // 手动刷新函数
  const handleManualRefresh = () => {
    refetchAccountInfo();
    refetchContractBalance();
    console.log('🔄 Manual refresh triggered');
  };

  // 包装还款函数，确保还款后立即刷新
  const handleRepayLoanWithRefresh = async (loanId: number, amount: string) => {
    console.log(`💰 Starting repayment for loan #${loanId} with amount: ${amount} ETH`);
    
    try {
      await handleRepayLoan(loanId, amount);
      
      // 还款成功后立即刷新多次，确保数据同步
      console.log('🔄 Triggering immediate refresh after repayment');
      handleManualRefresh();
      
      // 等待1秒后再次刷新
      setTimeout(() => {
        console.log('🔄 Second refresh after 1 second');
        handleManualRefresh();
      }, 1000);
      
      // 等待3秒后最后一次刷新
      setTimeout(() => {
        console.log('🔄 Final refresh after 3 seconds');
        handleManualRefresh();
      }, 3000);
      
    } catch (error) {
      console.error('❌ Repayment failed:', error);
      // 即使失败也刷新一下，以防状态有变化
      handleManualRefresh();
    }
  };

  // 包装智能全额还款函数，确保还款后立即刷新
  const handleFullRepaymentWithRefresh = async (loanId: number) => {
    console.log(`🔧 Starting intelligent full repayment for loan #${loanId}`);
    
    try {
      await handleFullRepayment(loanId);
      
      // 还款成功后立即刷新多次，确保数据同步
      console.log('🔄 Triggering immediate refresh after full repayment');
      handleManualRefresh();
      
      // 等待1秒后再次刷新
      setTimeout(() => {
        console.log('🔄 Second refresh after 1 second');
        handleManualRefresh();
      }, 1000);
      
      // 等待3秒后最后一次刷新
      setTimeout(() => {
        console.log('🔄 Final refresh after 3 seconds');
        handleManualRefresh();
      }, 3000);
      
    } catch (error) {
      console.error('❌ Full repayment failed:', error);
      // 即使失败也刷新一下，以防状态有变化
      handleManualRefresh();
    }
  };

  // 自动刷新
  useEffect(() => {
    if (!isConnected || !contractAddress) return;

    const interval = setInterval(() => {
      refetchAccountInfo();
      refetchContractBalance();
    }, 5000); // 减少到5秒以便更快看到更新

    return () => clearInterval(interval);
  }, [isConnected, contractAddress, refetchAccountInfo]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center text-green-600 hover:text-green-800">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
              <h1 className="text-xl font-bold text-gray-900">DeFi Bank</h1>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-500">
                  Auto-refresh: 30s
                </div>
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  title="Refresh data"
                >
                  <Wallet className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Wallet className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Connection Required</h2>
            <p className="text-gray-600 mb-6">Please connect your wallet to access banking features</p>
            <Link href="/">
              <Button>Return to Home and Connect Wallet</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center text-green-600 hover:text-green-800">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-xl font-bold text-gray-900">DeFi Bank</h1>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-500">
                Auto-refresh: 5s
              </div>
              <button
                onClick={handleManualRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                title="Refresh data"
              >
                <Wallet className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banking Info Card */}
        <BankingInfoCard
          address={address}
          chain={chain}
          contractAddress={contractAddress || undefined}
          bankBalance={bankBalance}
          totalBankFunds={totalBankFunds}
          isConnected={isConnected}
          onRefresh={handleManualRefresh}
        />

        {/* Navigation Tabs */}
        <BankingNavigation activeView={activeView} setActiveView={setActiveView} />

        {/* Tab Content */}
        {activeView === 'overview' && (
          <OverviewTab
            bankBalance={bankBalance}
            totalDeposited={totalDeposited}
            totalWithdrawn={totalWithdrawn}
            pendingInterest={pendingInterest}
            totalBankFunds={totalBankFunds}
            ethBalance={ethBalance}
            interestRate={interestRate ? Number(interestRate) / 100 : 0}
            minimumDeposit={minimumDeposit ? formatEther(minimumDeposit as unknown as bigint) : '0.001'}
            onManualRefresh={handleManualRefresh}
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
            onRequestLoan={handleRequestLoan}
            onTakeFlashLoan={handleTakeFlashLoan}
            onRepayFlashLoan={handleRepayFlashLoan}
            onRepayLoan={handleRepayLoanWithRefresh}
            onFullRepayment={handleFullRepaymentWithRefresh}
            getFlashLoanStatus={getFlashLoanStatus}
            getUserLoans={getUserLoans}
            getLoanRepaymentAmount={getLoanRepaymentAmount}
            getLoanStatus={getLoanStatus}
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