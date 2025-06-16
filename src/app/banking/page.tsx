'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useNetwork, useContractRead, useContractWrite, usePrepareContractWrite, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Clock, Wallet, CreditCard, Shield, Award, AlertCircle, Calculator } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { parseEther, formatEther } from 'viem';
import { getContractAddress, getContractABI } from '@/config/contracts';
import NetworkStatus from '@/components/NetworkStatus';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'stake' | 'unstake' | 'loan' | 'repay';
  amount: string;
  timestamp: string;
  txHash: string;
  blockNumber?: number;
  contractAddress?: string;
}

export default function BankingPage() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('');
  const [stakingAmount, setStakingAmount] = useState('');
  const [activeView, setActiveView] = useState('overview');

  // Get contract address and ABI
  const contractAddress = chain?.id ? getContractAddress(chain.id, 'SimpleBank') : undefined;
  const contractABI = getContractABI('SimpleBank');

  // Get user's ETH balance
  const { data: ethBalance } = useBalance({
    address: address,
    enabled: !!address && isConnected,
  });

  // Get complete account info from contract
  const { data: accountInfo, refetch: refetchAccountInfo } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getAccountInfo',
    args: address ? [address] : undefined,
    enabled: !!contractAddress && !!address && isConnected,
  });

  // Get interest rate from contract  
  const { data: interestRate } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'INTEREST_RATE',
    enabled: !!contractAddress && isConnected,
  });

  // Get minimum deposit
  const { data: minimumDeposit } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'minimumDeposit',
    enabled: !!contractAddress && isConnected,
  });

  // Parse account info
  const bankBalance = accountInfo ? formatEther(accountInfo[0] as bigint) : '0';
  const lastDepositTime = accountInfo ? Number(accountInfo[1]) : 0;
  const totalDeposited = accountInfo ? formatEther(accountInfo[2] as bigint) : '0';
  const totalWithdrawn = accountInfo ? formatEther(accountInfo[3] as bigint) : '0';
  const pendingInterest = accountInfo ? formatEther(accountInfo[4] as bigint) : '0';

  // Prepare deposit transaction
  const { config: depositConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'deposit',
    value: depositAmount ? parseEther(depositAmount) : BigInt(0),
    enabled: !!contractAddress && isConnected && !!depositAmount && parseFloat(depositAmount) > 0,
  });

  const { write: deposit, isLoading: isDepositing } = useContractWrite({
    ...depositConfig,
    onSuccess: (data) => {
      toast.success('Deposit successful!');
      setDepositAmount('');
      // Add slight delay to ensure transaction is mined before refetch
      setTimeout(() => {
        refetchAccountInfo();
      }, 2000);
      addTransaction('deposit', depositAmount, data.hash);
    },
    onError: (error) => {
      console.error('Deposit failed:', error);
      toast.error('Deposit failed');
    },
  });

  // Prepare withdraw transaction
  const { config: withdrawConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'withdraw',
    args: withdrawAmount ? [parseEther(withdrawAmount)] : undefined,
    enabled: !!contractAddress && isConnected && !!withdrawAmount && parseFloat(withdrawAmount) > 0 && parseFloat(withdrawAmount) <= parseFloat(bankBalance),
  });

  const { write: withdraw, isLoading: isWithdrawing } = useContractWrite({
    ...withdrawConfig,
    onSuccess: (data) => {
      toast.success('Withdrawal successful!');
      setWithdrawAmount('');
      refetchAccountInfo();
      addTransaction('withdraw', withdrawAmount, data.hash);
    },
    onError: (error) => {
      console.error('Withdrawal failed:', error);
      
      // 提供更详细的错误信息
      let errorMessage = 'Withdrawal failed';
      const errorString = error.message || error.toString();
      
      if (errorString.includes('insufficient')) {
        errorMessage = 'Insufficient balance for withdrawal';
      } else if (errorString.includes('execution reverted')) {
        errorMessage = 'Transaction reverted - please check your balance';
      } else if (errorString.includes('user rejected') || errorString.includes('User rejected')) {
        errorMessage = 'Transaction cancelled by user';
      } else if (errorString.includes('network') || errorString.includes('fetch')) {
        errorMessage = 'Network error - please check connection and retry';
      } else if (errorString.includes('invalid key') || errorString.includes('Unauthorized')) {
        errorMessage = 'Network connection issue - please switch networks and retry';
      }
      
      toast.error(errorMessage);
    },
  });

  // Prepare withdraw all transaction - 简化版本，不检查余额
  const { config: withdrawAllConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'withdrawAll',
    enabled: !!contractAddress && isConnected,
  });

  const { write: withdrawAll, isLoading: isWithdrawingAll } = useContractWrite({
    ...withdrawAllConfig,
    onSuccess: (data) => {
      toast.success('All funds withdrawn successfully!');
      refetchAccountInfo();
      addTransaction('withdraw', bankBalance, data.hash);
    },
    onError: (error) => {
      console.error('Withdraw all failed:', error);
      toast.error('Withdraw all failed');
    },
  });

  // localStorage key for transactions
  const getTransactionKey = () => {
    return `banking_transactions_${address}_${chain?.id}`;
  };

  // Load transactions from localStorage
  const loadTransactions = () => {
    if (!address || !chain?.id) return;
    
    try {
      const key = getTransactionKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsedTransactions = JSON.parse(stored);
        
        // 检查是否需要清理旧合约地址的数据
        const currentContractAddress = contractAddress?.toLowerCase();
        const validTransactions = parsedTransactions.filter((tx: Transaction) => {
          // 如果交易记录中没有合约地址信息，或者合约地址匹配，则保留
          return !tx.contractAddress || tx.contractAddress.toLowerCase() === currentContractAddress;
        });
        
        // 如果数据被清理了，保存清理后的数据
        if (validTransactions.length !== parsedTransactions.length) {
          console.log(`🧹 清理了 ${parsedTransactions.length - validTransactions.length} 条旧合约的交易记录`);
          saveTransactions(validTransactions);
        }
        
        setTransactions(validTransactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  // Save transactions to localStorage
  const saveTransactions = (newTransactions: Transaction[]) => {
    if (!address || !chain?.id) return;
    
    try {
      const key = getTransactionKey();
      localStorage.setItem(key, JSON.stringify(newTransactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  };

  // Add transaction to local history and save to localStorage
  const addTransaction = (type: 'deposit' | 'withdraw' | 'stake' | 'unstake' | 'loan' | 'repay', amount: string, txHash: string) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type,
      amount,
      timestamp: new Date().toISOString(),
      txHash,
      blockNumber: Date.now(), // Mock block number for now
      contractAddress: contractAddress, // 添加合约地址信息
    };
    
    const updatedTransactions = [newTransaction, ...transactions].slice(0, 50); // Keep only last 50 transactions
    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);
  };

  // Deposit function
  const handleDeposit = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid deposit amount');
      return;
    }

    const minDeposit = minimumDeposit ? formatEther(minimumDeposit as bigint) : '0.01';
    if (parseFloat(depositAmount) < parseFloat(minDeposit)) {
      toast.error(`Minimum deposit is ${minDeposit} ETH`);
      return;
    }

    if (!ethBalance || parseFloat(depositAmount) > parseFloat(formatEther(ethBalance.value))) {
      toast.error('Insufficient ETH balance');
      return;
    }

    if (!deposit) {
      toast.error('Unable to deposit, please check network connection');
      return;
    }

    deposit();
  };

  // Withdraw function
  const handleWithdraw = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid withdrawal amount');
      return;
    }

    if (parseFloat(withdrawAmount) > parseFloat(bankBalance)) {
      toast.error('Insufficient bank balance');
      return;
    }

    if (!withdraw) {
      toast.error('Unable to withdraw, please check network connection');
      return;
    }

    withdraw();
  };

  // Handle withdraw all
  const handleWithdrawAll = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (parseFloat(bankBalance) <= 0) {
      toast.error('No balance to withdraw');
      return;
    }

    if (!withdrawAll) {
      toast.error('Unable to withdraw, please check network connection');
      return;
    }

    // 显示确认对话框
    if (!confirm(`Are you sure you want to withdraw all ${bankBalance} ETH?`)) {
      return;
    }

    withdrawAll();
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US');
  };

  // Calculate interest earnings
  const calculateInterest = () => {
    if (!accountInfo || !interestRate) return { daily: 0, monthly: 0, yearly: 0 };
    
    const principal = parseFloat(bankBalance);
    const rate = Number(interestRate) / 100; // Convert percentage
    const daily = (principal * rate) / 365;
    const monthly = daily * 30;
    const yearly = principal * rate;
    
    return { daily, monthly, yearly };
  };

  const interestCalc = calculateInterest();

  // Mock data for advanced features
  const [stakingBalance] = useState('2.5');
  const [stakingRewards] = useState('0.125');
  const [activeLoan] = useState(null);

  // Load transactions when component mounts or address/chain changes
  useEffect(() => {
    loadTransactions();
  }, [address, chain?.id]);

  // Auto-refresh account info every 10 seconds
  useEffect(() => {
    if (!isConnected || !contractAddress) return;

    const interval = setInterval(() => {
      refetchAccountInfo();
    }, 10000);

    return () => clearInterval(interval);
  }, [isConnected, contractAddress, refetchAccountInfo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center text-green-600 hover:text-green-800">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Decentralized Banking</h1>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-500">
                Auto-refresh: 10s
              </div>
              <button
                onClick={() => refetchAccountInfo()}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                title="Refresh data"
              >
                <Clock className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          <div className="text-center py-12">
            <Wallet className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Connection Required</h2>
            <p className="text-gray-600 mb-6">Please connect your wallet to access banking services</p>
            <Link href="/">
              <Button>Return to Home and Connect Wallet</Button>
            </Link>
          </div>
        ) : !contractAddress ? (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unsupported Network</h2>
            <p className="text-gray-600 mb-6">Please switch to a supported network (Hardhat Local Network)</p>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  {[
                    { id: 'overview', name: 'Overview', icon: DollarSign },
                    { id: 'deposit-withdraw', name: 'Deposit & Withdraw', icon: TrendingUp },
                    { id: 'loans', name: 'Loans', icon: CreditCard },
                    { id: 'staking', name: 'Staking', icon: Shield },
                    { id: 'calculator', name: 'Calculator', icon: Calculator },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveView(tab.id)}
                      className={`${
                        activeView === tab.id
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center`}
                    >
                      <tab.icon className="h-5 w-5 mr-2" />
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Overview Tab */}
            {activeView === 'overview' && (
              <>
                {/* Account Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* Bank Balance */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Bank Balance</p>
                        <p className="text-2xl font-bold text-gray-900">{bankBalance} ETH</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">
                          +{parseFloat(pendingInterest).toFixed(6)} ETH pending interest
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Wallet Balance */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Wallet Balance</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {ethBalance ? formatEther(ethBalance.value) : '0'} ETH
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <Wallet className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs text-gray-500">Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                    </div>
                  </div>

                  {/* Total Deposited */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Deposited</p>
                        <p className="text-2xl font-bold text-gray-900">{totalDeposited} ETH</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-full">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs text-gray-500">Withdrawn: {totalWithdrawn} ETH</p>
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Interest Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {interestRate ? Number(interestRate) : '0'}% APY
                        </p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-full">
                        <Award className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs text-gray-500">Compound interest</p>
                    </div>
                  </div>
                </div>

                {/* Contract Information */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Network: </span>
                      <span className="font-medium">{chain?.name} (ID: {chain?.id})</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Contract: </span>
                      <span className="font-medium font-mono">{contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Min Deposit: </span>
                      <span className="font-medium">{minimumDeposit ? formatEther(minimumDeposit as bigint) : '0.01'} ETH</span>
                    </div>
                  </div>
                </div>

                {/* Interest Calculation */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-yellow-600" />
                    Interest Earnings Projection
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Daily</p>
                      <p className="text-xl font-bold text-gray-900">{interestCalc.daily.toFixed(6)} ETH</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Monthly</p>
                      <p className="text-xl font-bold text-gray-900">{interestCalc.monthly.toFixed(6)} ETH</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Yearly</p>
                      <p className="text-xl font-bold text-gray-900">{interestCalc.yearly.toFixed(6)} ETH</p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="text-sm text-yellow-800">
                        Pending Interest: {parseFloat(pendingInterest).toFixed(6)} ETH (will be added on next transaction)
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Deposit & Withdraw Tab */}
            {activeView === 'deposit-withdraw' && (
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
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder={`Min: ${minimumDeposit ? formatEther(minimumDeposit as bigint) : '0.01'} ETH`}
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleDeposit}
                      disabled={isDepositing || !depositAmount || parseFloat(depositAmount) <= 0}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isDepositing ? 'Depositing...' : 'Deposit'}
                    </Button>
                    <div className="text-xs text-gray-500">
                      Current APY: {interestRate ? Number(interestRate) : '0'}% • Minimum: {minimumDeposit ? formatEther(minimumDeposit as bigint) : '0.01'} ETH
                    </div>
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
                        min="0"
                        max={bankBalance}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder={`Max: ${bankBalance} ETH`}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={handleWithdraw}
                        disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
                      </Button>
                      <Button
                        onClick={handleWithdrawAll}
                        disabled={isWithdrawingAll || parseFloat(bankBalance) <= 0}
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        {isWithdrawingAll ? 'Withdrawing...' : 'Withdraw All'}
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Available: {bankBalance} ETH • Pending Interest: {parseFloat(pendingInterest).toFixed(6)} ETH
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loans Tab */}
            {activeView === 'loans' && (
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
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.0"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Collateral (ETH)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.0"
                        value={collateralAmount}
                        onChange={(e) => setCollateralAmount(e.target.value)}
                      />
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled>
                      Request Loan (Coming Soon)
                    </Button>
                    <div className="text-xs text-gray-500">
                      Min Collateral Ratio: 150% • Interest Rate: 8.5% APY
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Status</h3>
                  <div className="text-center py-8">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No active loans</p>
                    <p className="text-sm text-gray-500 mt-2">Request a collateralized loan to get started</p>
                  </div>
                </div>
              </div>
            )}

            {/* Staking Tab */}
            {activeView === 'staking' && (
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
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0.0"
                        value={stakingAmount}
                        onChange={(e) => setStakingAmount(e.target.value)}
                      />
                    </div>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700" disabled>
                      Stake ETH (Coming Soon)
                    </Button>
                    <div className="text-xs text-gray-500">
                      Staking APY: 12.5% • Minimum Stake: 0.1 ETH
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Staking Overview</h3>
                  <div className="space-y-4">
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-purple-700">Staked Balance</span>
                        <span className="font-bold text-purple-900">{stakingBalance} ETH</span>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-purple-700">Rewards Earned</span>
                        <span className="font-bold text-purple-900">{stakingRewards} ETH</span>
                      </div>
                    </div>
                    <Button className="w-full" variant="outline" disabled>
                      Unstake & Claim Rewards
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Calculator Tab */}
            {activeView === 'calculator' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-indigo-600" />
                  Interest Calculator
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Principal Amount (ETH)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter amount to calculate"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="1">1 Month</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12">1 Year</option>
                        <option value="24">2 Years</option>
                      </select>
                    </div>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                      Calculate Interest
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h4 className="font-medium text-indigo-900 mb-2">Calculation Results</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-indigo-700">Interest Earned:</span>
                          <span className="font-bold text-indigo-900">-- ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-700">Total Amount:</span>
                          <span className="font-bold text-indigo-900">-- ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-700">APY:</span>
                          <span className="font-bold text-indigo-900">{interestRate ? Number(interestRate) : '0'}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  Recent Transactions ({transactions.length})
                </h3>
                {transactions.length > 0 && (
                  <button
                    onClick={() => {
                      setTransactions([]);
                      saveTransactions([]);
                      toast.success('Transaction history cleared');
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Clear History
                  </button>
                )}
              </div>
              
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No transactions yet</p>
                  <p className="text-sm text-gray-500 mt-2">Make your first deposit or withdrawal to see transaction history</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full mr-3 ${
                          tx.type === 'deposit' ? 'bg-green-100' : 
                          tx.type === 'withdraw' ? 'bg-red-100' :
                          tx.type === 'stake' ? 'bg-purple-100' :
                          tx.type === 'loan' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {tx.type === 'deposit' && <TrendingUp className="h-4 w-4 text-green-600" />}
                          {tx.type === 'withdraw' && <TrendingDown className="h-4 w-4 text-red-600" />}
                          {tx.type === 'stake' && <Shield className="h-4 w-4 text-purple-600" />}
                          {tx.type === 'loan' && <CreditCard className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{tx.type}</p>
                          <p className="text-sm text-gray-600">{formatTime(tx.timestamp)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          tx.type === 'deposit' || tx.type === 'stake' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tx.type === 'deposit' || tx.type === 'stake' ? '+' : '-'}{tx.amount} ETH
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 