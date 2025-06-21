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
  const [lastTransactionTime, setLastTransactionTime] = useState<number>(0);
  const [calculatorAmount, setCalculatorAmount] = useState('');
  const [calculatorPeriod, setCalculatorPeriod] = useState('12');
  const [calculatorResult, setCalculatorResult] = useState<{interest: number, total: number} | null>(null);
  const [isRequestingLoan, setIsRequestingLoan] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [stakedAmount, setStakedAmount] = useState('0');

  // Get contract address and ABI
  const contractAddress = chain?.id ? getContractAddress(chain.id, 'EnhancedBank') : undefined;
  const contractABI = getContractABI('EnhancedBank');

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
      
      // 提供更详细的错误信息和重试建议
      let errorMessage = 'Deposit failed';
      const errorString = error.message || error.toString();
      
      if (errorString.includes('Internal JSON-RPC error') || errorString.includes('internal error')) {
        errorMessage = 'Network connection unstable. Please try again in a moment.';
      } else if (errorString.includes('insufficient')) {
        errorMessage = 'Insufficient balance for deposit';
      } else if (errorString.includes('user rejected') || errorString.includes('User rejected')) {
        errorMessage = 'Transaction cancelled by user';
      } else if (errorString.includes('execution reverted')) {
        errorMessage = 'Transaction reverted - please check amount and try again';
      } else if (errorString.includes('nonce')) {
        errorMessage = 'Transaction conflict - please wait and try again';
      }
      
      toast.error(errorMessage);
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
      
      if (errorString.includes('Internal JSON-RPC error') || errorString.includes('internal error')) {
        errorMessage = 'Network connection unstable. Please try again in a moment.';
      } else if (errorString.includes('insufficient')) {
        errorMessage = 'Insufficient balance for withdrawal';
      } else if (errorString.includes('execution reverted')) {
        errorMessage = 'Transaction reverted - please check your balance';
      } else if (errorString.includes('user rejected') || errorString.includes('User rejected')) {
        errorMessage = 'Transaction cancelled by user';
      } else if (errorString.includes('network') || errorString.includes('fetch')) {
        errorMessage = 'Network error - please check connection and retry';
      } else if (errorString.includes('invalid key') || errorString.includes('Unauthorized')) {
        errorMessage = 'Network connection issue - please switch networks and retry';
      } else if (errorString.includes('nonce')) {
        errorMessage = 'Transaction conflict - please wait and try again';
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

  // Prepare claim interest transaction - 使用最小存款金额来触发利息计算
  const { config: claimInterestConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'deposit',
    value: minimumDeposit && typeof minimumDeposit === 'bigint' ? minimumDeposit : parseEther('0.01'), // 使用最小存款金额
    enabled: !!contractAddress && isConnected && parseFloat(pendingInterest) > 0,
  });

  const { write: claimInterest, isLoading: isClaimingInterest } = useContractWrite({
    ...claimInterestConfig,
    onSuccess: (data) => {
      toast.success('Interest claimed and minimum deposit added!');
      refetchAccountInfo();
      const depositAmount = minimumDeposit && typeof minimumDeposit === 'bigint' 
        ? formatEther(minimumDeposit) 
        : '0.01';
      addTransaction('deposit', depositAmount, data.hash);
    },
    onError: (error) => {
      console.error('Claim interest failed:', error);
      let errorMessage = 'Failed to claim interest';
      const errorString = error.message || error.toString();
      
      if (errorString.includes('insufficient')) {
        errorMessage = 'Insufficient ETH balance for minimum deposit';
      } else if (errorString.includes('network') || errorString.includes('connection')) {
        errorMessage = 'Network connection issue - please check connection and retry';
      }
      
      toast.error(errorMessage);
    },
  });

  // Prepare loan request transaction
  const { config: loanConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'requestLoan',
    args: loanAmount ? [parseEther(loanAmount)] : undefined,
    value: loanAmount ? parseEther((parseFloat(loanAmount) * 1.5).toString()) : BigInt(0), // 150% collateral
    enabled: !!contractAddress && isConnected && !!loanAmount && parseFloat(loanAmount) >= 0.1,
  });

  const { write: requestLoan, isLoading: isRequestingLoanTx } = useContractWrite({
    ...loanConfig,
    onSuccess: (data) => {
      toast.success(`Loan request for ${loanAmount} ETH successful!`);
      setLoanAmount('');
      refetchAccountInfo();
      refetchUserLoans();
      addTransaction('loan', loanAmount, data.hash);
    },
    onError: (error) => {
      console.error('Loan request failed:', error);
      let errorMessage = 'Failed to request loan';
      const errorString = error.message || error.toString();
      
      if (errorString.includes('insufficient')) {
        errorMessage = 'Insufficient collateral or bank liquidity';
      } else if (errorString.includes('network') || errorString.includes('connection')) {
        errorMessage = 'Network connection issue - please retry';
      }
      
      toast.error(errorMessage);
    },
  });

  // Prepare stake transaction
  const { config: stakeConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'stake',
    value: stakingAmount ? parseEther(stakingAmount) : BigInt(0),
    enabled: !!contractAddress && isConnected && !!stakingAmount && parseFloat(stakingAmount) >= 0.1,
  });

  const { write: stakeTokens, isLoading: isStakingTx } = useContractWrite({
    ...stakeConfig,
    onSuccess: (data) => {
      toast.success(`Successfully staked ${stakingAmount} ETH!`);
      setStakingAmount('');
      refetchAccountInfo();
      refetchUserStakes();
      addTransaction('stake', stakingAmount, data.hash);
    },
    onError: (error) => {
      console.error('Stake failed:', error);
      let errorMessage = 'Failed to stake';
      const errorString = error.message || error.toString();
      
      if (errorString.includes('insufficient')) {
        errorMessage = 'Insufficient ETH balance';
      } else if (errorString.includes('network') || errorString.includes('connection')) {
        errorMessage = 'Network connection issue - please retry';
      }
      
      toast.error(errorMessage);
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
      contractAddress: contractAddress || undefined, // 添加合约地址信息
    };
    
    const updatedTransactions = [newTransaction, ...transactions].slice(0, 50); // Keep only last 50 transactions
    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);
  };

  // Deposit function with retry mechanism
  const handleDeposit = async (retryAttempt = 0) => {
    const retryInfo = retryAttempt > 0 ? ` (重试第${retryAttempt}次)` : '';
    console.log('🔍 开始存款流程调试...' + retryInfo);
    console.log('isConnected:', isConnected);
    console.log('depositAmount (raw):', depositAmount);
    console.log('depositAmount (parsed):', parseFloat(depositAmount));
    console.log('contractAddress:', contractAddress);
    console.log('deposit function:', deposit);
    console.log('isDepositing:', isDepositing);
    console.log('minimumDeposit:', minimumDeposit);
    console.log('ethBalance:', ethBalance);
    
    if (!isConnected) {
      console.log('❌ 钱包未连接');
      toast.error('Please connect your wallet first');
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      console.log('❌ 存款金额无效:', depositAmount);
      toast.error('Please enter a valid deposit amount');
      return;
    }

    // 添加金额范围检查
    const depositValue = parseFloat(depositAmount);
    if (depositValue > 1000) {
      console.log('❌ 存款金额过大:', depositValue);
      toast.error('Deposit amount seems too large. Please check the amount.');
      return;
    }

    // 添加交易间隔检查（仅在首次尝试时检查）
    if (retryAttempt === 0) {
      const now = Date.now();
      const timeSinceLastTransaction = now - lastTransactionTime;
      if (timeSinceLastTransaction < 3000) { // 3秒间隔
        const remainingTime = Math.ceil((3000 - timeSinceLastTransaction) / 1000);
        console.log('❌ 交易过于频繁，还需等待', remainingTime, '秒');
        toast.error(`Please wait ${remainingTime} second${remainingTime > 1 ? 's' : ''} before making another transaction`);
        return;
      }
      setLastTransactionTime(now); // 记录交易时间
    }

    const minDeposit = minimumDeposit && typeof minimumDeposit === 'bigint' 
      ? formatEther(minimumDeposit) 
      : '0.01';
    console.log('最小存款要求:', minDeposit);
    
    if (parseFloat(depositAmount) < parseFloat(minDeposit)) {
      console.log('❌ 存款金额低于最小要求');
      toast.error(`Minimum deposit is ${minDeposit} ETH`);
      return;
    }

    if (!ethBalance || parseFloat(depositAmount) > parseFloat(formatEther(ethBalance.value))) {
      console.log('❌ ETH余额不足');
      console.log('需要:', depositAmount, 'ETH');
      console.log('当前余额:', ethBalance ? formatEther(ethBalance.value) : '未知');
      toast.error('Insufficient ETH balance');
      return;
    }

    if (!deposit) {
      console.log('❌ deposit函数未定义 - 这是主要问题!');
      console.log('contractAddress:', contractAddress);
      console.log('depositConfig:', depositConfig || 'undefined');
      toast.error('Unable to deposit, please check network connection');
      return;
    }

    console.log('✅ 所有检查通过，开始调用deposit函数...');
    try {
      console.log('📤 正在发送交易到MetaMask...');
      deposit();
      console.log('✅ deposit函数调用成功');
      
      // 添加状态监控
      setTimeout(() => {
        console.log('🔍 5秒后检查状态:');
        console.log('isDepositing:', isDepositing);
        console.log('如果isDepositing仍为false，说明交易可能被用户取消或MetaMask无响应');
      }, 5000);
      
    } catch (error) {
      console.error('❌ deposit函数调用失败:', error);
      
      // 检查是否是可重试的网络错误
      const errorString = (error as any)?.message || error?.toString() || '';
      const isRetryableError = errorString.includes('Internal JSON-RPC error') || 
                              errorString.includes('internal error') ||
                              errorString.includes('network') ||
                              errorString.includes('timeout') ||
                              errorString.includes('connection');
      
      if (isRetryableError && retryAttempt < 2) {
        const retryDelay = (retryAttempt + 1) * 1500; // 递增延迟：1.5s, 3s
        console.log(`🔄 检测到网络错误，${retryDelay}ms后自动重试... (${retryAttempt + 1}/3)`);
        toast.error(`Network unstable. Auto-retrying in ${retryDelay/1000}s... (${retryAttempt + 1}/3)`);
        
        setTimeout(() => {
          handleDeposit(retryAttempt + 1);
        }, retryDelay);
      } else {
        const finalMessage = retryAttempt >= 2 
          ? 'Deposit failed after 3 attempts. Network may be unstable, please try again later.'
          : 'Failed to send deposit transaction';
        toast.error(finalMessage);
      }
    }
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

    // 添加交易间隔检查
    const now = Date.now();
    const timeSinceLastTransaction = now - lastTransactionTime;
    if (timeSinceLastTransaction < 3000) { // 3秒间隔
      const remainingTime = Math.ceil((3000 - timeSinceLastTransaction) / 1000);
      toast.error(`Please wait ${remainingTime} second${remainingTime > 1 ? 's' : ''} before making another transaction`);
      return;
    }

    if (!withdraw) {
      toast.error('Unable to withdraw, please check network connection');
      return;
    }

    setLastTransactionTime(now); // 记录交易时间

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

  // Handle claim interest
  const handleClaimInterest = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (parseFloat(pendingInterest) <= 0) {
      toast.error('No pending interest to claim');
      return;
    }

    if (!claimInterest) {
      toast.error('Unable to claim interest, please check network connection');
      return;
    }

    claimInterest();
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

  // Calculator function
  const calculateInterestForCalculator = () => {
    if (!calculatorAmount || parseFloat(calculatorAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const principal = parseFloat(calculatorAmount);
    const months = parseInt(calculatorPeriod);
    const annualRate = interestRate ? Number(interestRate) / 100 : 0.05; // 5% default
    
    // Calculate compound interest (monthly compounding)
    const monthlyRate = annualRate / 12;
    const compoundInterest = principal * Math.pow(1 + monthlyRate, months) - principal;
    const totalAmount = principal + compoundInterest;

    setCalculatorResult({
      interest: compoundInterest,
      total: totalAmount
    });

    toast.success('Interest calculated successfully!');
  };

  // Mock data for advanced features
  const [stakingBalance] = useState('2.5');
  const [stakingRewards] = useState('0.125');
  const [activeLoan] = useState(null);

  // Handle loan request
  const handleRequestLoan = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!loanAmount || parseFloat(loanAmount) < 0.1) {
      toast.error('Minimum loan amount is 0.1 ETH');
      return;
    }

    const requiredCollateral = parseFloat(loanAmount) * 1.5;
    if (!ethBalance || parseFloat(formatEther(ethBalance.value)) < requiredCollateral) {
      toast.error(`Insufficient ETH balance for collateral. Required: ${requiredCollateral.toFixed(4)} ETH`);
      return;
    }

    if (!requestLoan) {
      toast.error('Unable to request loan, please check network connection');
      return;
    }

    console.log('🔍 开始贷款申请流程...');
    console.log('loanAmount:', loanAmount);
    console.log('requiredCollateral:', requiredCollateral);
    
    try {
      console.log('📤 正在发送贷款申请交易到MetaMask...');
      requestLoan();
      console.log('✅ 贷款申请函数调用成功');
    } catch (error) {
      console.error('❌ 贷款申请失败:', error);
      toast.error('Failed to request loan');
    }
  };

  // Handle staking
  const handleStake = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!stakingAmount || parseFloat(stakingAmount) < 0.1) {
      toast.error('Minimum staking amount is 0.1 ETH');
      return;
    }

    if (!ethBalance || parseFloat(formatEther(ethBalance.value)) < parseFloat(stakingAmount)) {
      toast.error('Insufficient ETH balance for staking');
      return;
    }

    if (!stakeTokens) {
      toast.error('Unable to stake, please check network connection');
      return;
    }

    console.log('🔍 开始质押流程...');
    console.log('stakingAmount:', stakingAmount);
    
    try {
      console.log('📤 正在发送质押交易到MetaMask...');
      stakeTokens();
      console.log('✅ 质押函数调用成功');
    } catch (error) {
      console.error('❌ 质押失败:', error);
      toast.error('Failed to stake');
    }
  };

  // Handle unstake
  const handleUnstake = async (stakeId: number) => {
    console.log('🔍 开始解除质押流程...', stakeId);
    toast.success(`Unstaking stake #${stakeId} - Smart contract integration coming soon`);
  };

  // Handle calculate loan interest
  const handleCalculateLoanInterest = async (loanId: number) => {
    console.log('🔍 计算贷款利息...', loanId);
    
    if (!isConnected) {
      toast.error('请先连接钱包');
      return;
    }

    const loan = processedLoans[loanId];
    if (!loan) {
      toast.error('找不到该贷款信息');
      return;
    }

    // 计算利息
    const now = Math.floor(Date.now() / 1000);
    const timeElapsed = now - loan.startTime;
    const yearlyInterest = parseFloat(loan.amount) * (loan.interestRate / 100);
    const secondsPerYear = 365 * 24 * 60 * 60;
    const accruedInterest = (yearlyInterest * timeElapsed) / secondsPerYear;
    const totalOwed = parseFloat(loan.amount) + accruedInterest;

    toast.success(
      `Loans #${loanId + 1} Interest calculation.\n` +
      `Principal: ${parseFloat(loan.amount).toFixed(4)} ETH\n` +
      `Interest: ${accruedInterest.toFixed(6)} ETH\n` +
      `Total owed: ${totalOwed.toFixed(6)} ETH\n` +
      `Annual interest rate: ${loan.interestRate}%`,
      { duration: 8000 }
    );
  };

  // Handle repay loan
  const handleRepayLoan = async (loanId: number) => {
    console.log('🔍 开始还款流程...', loanId);
    
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    const loan = processedLoans[loanId];
    if (!loan || !loan.isActive) {
      toast.error('Can\'t find active loan information');
      return;
    }

    // 计算总还款金额
    const now = Math.floor(Date.now() / 1000);
    const timeElapsed = now - loan.startTime;
    const yearlyInterest = parseFloat(loan.amount) * (loan.interestRate / 100);
    const secondsPerYear = 365 * 24 * 60 * 60;
    const accruedInterest = (yearlyInterest * timeElapsed) / secondsPerYear;
    const totalRepayment = parseFloat(loan.amount) + accruedInterest;

    // 检查余额
    if (!ethBalance || parseFloat(formatEther(ethBalance.value)) < totalRepayment) {
      toast.error(`Insufficient balance. Need ${totalRepayment.toFixed(6)} ETH, current balance ${ethBalance ? formatEther(ethBalance.value) : '0'} ETH`);
      return;
    }

    // 确认还款
    const confirmed = confirm(
      `Confirm repayment of loan #${loanId + 1}?\n\n` +
      `Principal: ${parseFloat(loan.amount).toFixed(4)} ETH\n` +
      `Interest: ${accruedInterest.toFixed(6)} ETH\n` +
      `Total repayment: ${totalRepayment.toFixed(6)} ETH\n\n` +
      `After repayment, the collateral will be returned ${parseFloat(loan.collateral).toFixed(4)} ETH`
    );

    if (!confirmed) {
      return;
    }

    // 这里应该调用智能合约的repayLoan函数
    console.log('📤 Sending repayment transaction to smart contract...');
    toast.success(`Loan #${loanId + 1} repayment successful! Collateral returned - Smart contract integration coming soon`);
    
    // 添加交易记录
    addTransaction('repay', totalRepayment.toFixed(6), 'mock_tx_hash_' + Date.now());
  };

  // Handle view stake details
  const handleViewStakeDetails = (stakeId: number) => {
    const stake = processedStakes[stakeId];
    if (!stake) {
      toast.error('Can\'t find stake information');
      return;
    }

    const lockTime = calculateLockTimeRemaining(stake.startTime, stake.lockPeriod);
    const estimatedReward = calculateStakeReward(stake.amount, stake.rewardRate, stake.startTime);
    const lockProgress = Math.min(100, ((Date.now() / 1000 - stake.startTime) / stake.lockPeriod) * 100);

    const details = 
      `Stake details #${stakeId + 1}\n\n` +
      `Stake amount: ${parseFloat(stake.amount).toFixed(4)} ETH\n` +
      `Annualized return rate: ${stake.rewardRate}%\n` +
      `Start time: ${new Date(stake.startTime * 1000).toLocaleString()}\n` +
      `Lock period: ${stake.lockPeriod / (24 * 60 * 60)} days\n` +
      `Unlock progress: ${lockProgress.toFixed(1)}%\n` +
      `Estimated reward: ${estimatedReward.toFixed(6)} ETH\n` +
      `Status: ${!stake.isActive ? 'Unlocked' : lockTime.isUnlocked ? 'Unlocked' : `Locked (${lockTime.days} days ${lockTime.hours} hours)`}`;

    toast.success(details, { duration: 10000 });
  };

  // Helper functions for loan and stake data
  const formatLoanData = (loans: any[]) => {
    if (!loans || !Array.isArray(loans)) return [];
    
    return loans.map((loan, index) => ({
      id: index,
      amount: formatEther(loan.amount || 0),
      collateral: formatEther(loan.collateral || 0),
      startTime: Number(loan.startTime || 0),
      interestRate: Number(loan.interestRate || 0) / 100, // Convert from basis points
      isActive: Boolean(loan.isActive),
    }));
  };

  const formatStakeData = (stakes: any[]) => {
    if (!stakes || !Array.isArray(stakes)) return [];
    
    return stakes.map((stake, index) => ({
      id: index,
      amount: formatEther(stake.amount || 0),
      startTime: Number(stake.startTime || 0),
      lockPeriod: Number(stake.lockPeriod || 0),
      rewardRate: Number(stake.rewardRate || 0) / 100, // Convert from basis points
      isActive: Boolean(stake.isActive),
    }));
  };

  const calculateLockTimeRemaining = (startTime: number, lockPeriod: number) => {
    const now = Math.floor(Date.now() / 1000);
    const unlockTime = startTime + lockPeriod;
    const remaining = unlockTime - now;
    
    if (remaining <= 0) return { days: 0, hours: 0, isUnlocked: true };
    
    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
    
    return { days, hours, isUnlocked: false };
  };

  const calculateStakeReward = (amount: string, rewardRate: number, startTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const timeElapsed = now - startTime;
    const yearlyReward = parseFloat(amount) * (rewardRate / 100);
    const secondsPerYear = 365 * 24 * 60 * 60;
    
    return (yearlyReward * timeElapsed) / secondsPerYear;
  };

  // Process loan and stake data
  const processedLoans = formatLoanData(userLoans as any[]);
  const processedStakes = formatStakeData(userStakes as any[]);

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
        {/* Banking Information */}
        {isConnected && contractAddress && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Banking Information</h3>
                <p className="text-gray-600">Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                <p className="text-gray-600">Network: {chain?.name || 'Unknown'} (ID: {chain?.id})</p>
                <p className="text-gray-600">Contract: {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4)}</p>
                <div className="mt-2 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600">Network Connected</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{bankBalance} ETH</div>
                <div className="text-gray-600">Bank Balance</div>
                <div className="text-sm text-gray-500 mt-1">
                  Auto-retry enabled for failed transactions
                </div>
              </div>
            </div>
          </div>
        )}

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
                        placeholder={`Min: ${minimumDeposit && typeof minimumDeposit === 'bigint' ? formatEther(minimumDeposit) : '0.01'} ETH`}
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
                      Current APY: {interestRate ? Number(interestRate) : '0'}% • Minimum: {minimumDeposit && typeof minimumDeposit === 'bigint' ? formatEther(minimumDeposit) : '0.01'} ETH
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

                {/* Claim Interest */}
                {parseFloat(pendingInterest) > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Award className="h-5 w-5 mr-2 text-yellow-600" />
                      Claim Interest
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-yellow-800">Pending Interest</p>
                            <p className="text-2xl font-bold text-yellow-900">{parseFloat(pendingInterest).toFixed(6)} ETH</p>
                          </div>
                          <div className="text-yellow-600">
                            <Award className="h-8 w-8" />
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={handleClaimInterest}
                        disabled={isClaimingInterest || parseFloat(pendingInterest) <= 0}
                        className="w-full bg-yellow-600 hover:bg-yellow-700"
                      >
                        {isClaimingInterest ? 'Claiming...' : 'Claim Interest'}
                      </Button>
                      <div className="text-xs text-gray-500">
                        Will deposit minimum amount (0.01 ETH) to trigger interest calculation
                      </div>
                    </div>
                  </div>
                )}
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
                        max="10"
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
                        placeholder={loanAmount ? (parseFloat(loanAmount) * 1.5).toFixed(2) : "0.0"}
                        value={collateralAmount}
                        onChange={(e) => setCollateralAmount(e.target.value)}
                      />
                    </div>
                    
                    {/* Loan Calculator */}
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
                      {isRequestingLoanTx ? 'Requesting Loan...' : 'Request Loan'}
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
                      processedLoans.map((loan) => (
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
                              <span className="text-gray-600">Days Active:</span>
                              <span className="ml-1 font-medium">
                                {Math.floor((Date.now() / 1000 - loan.startTime) / (24 * 60 * 60))} days
                              </span>
                            </div>
                          </div>
                          {loan.isActive && (
                            <div className="mt-3 flex space-x-2">
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleCalculateLoanInterest(loan.id)}>
                                Calculate Interest
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleRepayLoan(loan.id)}>
                                Repay Loan
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
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
                        min="0.1"
                        max="50"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0.0"
                        value={stakingAmount}
                        onChange={(e) => setStakingAmount(e.target.value)}
                      />
                    </div>

                    {/* Staking Calculator */}
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
                                              disabled={isStakingTx || !stakingAmount || parseFloat(stakingAmount) < 0.1}
                    >
                                              {isStakingTx ? 'Staking...' : 'Stake ETH'}
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
                        const estimatedReward = calculateStakeReward(stake.amount, stake.rewardRate, stake.startTime);
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
                                <Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewStakeDetails(stake.id)}>
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
                        value={calculatorAmount}
                        onChange={(e) => setCalculatorAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={calculatorPeriod}
                        onChange={(e) => setCalculatorPeriod(e.target.value)}
                      >
                        <option value="1">1 Month</option>
                        <option value="3">3 Months</option>
                        <option value="6">6 Months</option>
                        <option value="12">1 Year</option>
                        <option value="24">2 Years</option>
                        <option value="36">3 Years</option>
                        <option value="60">5 Years</option>
                      </select>
                    </div>
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      onClick={calculateInterestForCalculator}
                      disabled={!calculatorAmount || parseFloat(calculatorAmount) <= 0}
                    >
                      Calculate Interest
                    </Button>
                    <div className="text-xs text-gray-500">
                      Using current bank interest rate: {interestRate ? Number(interestRate) : '5'}% APY
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h4 className="font-medium text-indigo-900 mb-2">Calculation Results</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-indigo-700">Principal Amount:</span>
                          <span className="font-bold text-indigo-900">
                            {calculatorAmount || '--'} ETH
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-700">Interest Earned:</span>
                          <span className="font-bold text-indigo-900">
                            {calculatorResult ? calculatorResult.interest.toFixed(6) : '--'} ETH
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-700">Total Amount:</span>
                          <span className="font-bold text-indigo-900">
                            {calculatorResult ? calculatorResult.total.toFixed(6) : '--'} ETH
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-700">Time Period:</span>
                          <span className="font-bold text-indigo-900">
                            {calculatorPeriod} month{parseInt(calculatorPeriod) > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-700">APY:</span>
                          <span className="font-bold text-indigo-900">{interestRate ? Number(interestRate) : '5'}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {calculatorResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-900 mb-2">Growth Breakdown</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-green-700">Monthly Interest:</span>
                            <span className="font-medium text-green-900">
                              {(calculatorResult.interest / parseInt(calculatorPeriod)).toFixed(6)} ETH
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-700">ROI:</span>
                            <span className="font-medium text-green-900">
                              {((calculatorResult.interest / parseFloat(calculatorAmount)) * 100).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
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