import { useState } from 'react';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'react-hot-toast';

export const useTransferFunctions = (
  contractAddress?: `0x${string}`,
  contractABI?: any,
  refetchAccountInfo?: () => void
) => {
  const [isTransferring, setIsTransferring] = useState(false);

  const handleTransferInternal = async (to: string, amount: string) => {
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    if (!to || !amount || parseFloat(amount) <= 0) {
      toast.error('Please enter valid recipient and amount');
      return;
    }
    
    try {
      setIsTransferring(true);
      
      // Use writeContract from wagmi/actions
      const { writeContract } = await import('wagmi/actions');
      
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'transferInternal',
        args: [to, parseEther(amount)],
      });
      
      toast.success(`Internal transfer successful! ${amount} ETH sent to ${to.slice(0, 6)}...${to.slice(-4)}`);
      if (refetchAccountInfo) refetchAccountInfo();
    } catch (error: any) {
      console.error('Internal transfer failed:', error);
      toast.error('Internal transfer failed: ' + (error.shortMessage || error.message || 'Unknown error'));
    } finally {
      setIsTransferring(false);
    }
  };

  const handleTransferExternal = async (to: string, amount: string) => {
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    if (!to || !amount || parseFloat(amount) <= 0) {
      toast.error('Please enter valid recipient and amount');
      return;
    }
    
    try {
      setIsTransferring(true);
      
      const { writeContract } = await import('wagmi/actions');
      
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'transferExternal',
        args: [to, parseEther(amount)],
      });
      
      toast.success(`External transfer successful! ${amount} ETH sent to ${to.slice(0, 6)}...${to.slice(-4)}`);
      if (refetchAccountInfo) refetchAccountInfo();
    } catch (error: any) {
      console.error('External transfer failed:', error);
      toast.error('External transfer failed: ' + (error.shortMessage || error.message || 'Unknown error'));
    } finally {
      setIsTransferring(false);
    }
  };

  const handleBatchTransfer = async (recipients: string[], amounts: string[], internal: boolean) => {
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    if (recipients.length === 0 || recipients.length !== amounts.length) {
      toast.error('Invalid recipients or amounts');
      return;
    }
    
    try {
      setIsTransferring(true);
      
      const amountsBigInt = amounts.map(amount => parseEther(amount));
      
      const { writeContract } = await import('wagmi/actions');
      
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'batchTransfer',
        args: [recipients, amountsBigInt, internal],
      });
      
      const totalAmount = amounts.reduce((sum, amount) => sum + parseFloat(amount), 0);
      const transferType = internal ? 'internal' : 'external';
      toast.success(`Batch ${transferType} transfer successful! ${totalAmount.toFixed(4)} ETH sent to ${recipients.length} recipients`);
      if (refetchAccountInfo) refetchAccountInfo();
    } catch (error: any) {
      console.error('Batch transfer failed:', error);
      toast.error('Batch transfer failed: ' + (error.shortMessage || error.message || 'Unknown error'));
    } finally {
      setIsTransferring(false);
    }
  };

  const handleUserToUserTransfer = async (to: string, amount: string) => {
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    if (!to || !amount || parseFloat(amount) <= 0) {
      toast.error('Please enter valid recipient and amount');
      return;
    }
    
    try {
      setIsTransferring(true);
      
      const { writeContract } = await import('wagmi/actions');
      
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'userToUserTransfer',
        args: [to],
        value: parseEther(amount),
      });
      
      toast.success(`User transfer successful! ${amount} ETH sent to ${to.slice(0, 6)}...${to.slice(-4)}`);
      if (refetchAccountInfo) refetchAccountInfo();
    } catch (error: any) {
      console.error('User transfer failed:', error);
      toast.error('User transfer failed: ' + (error.shortMessage || error.message || 'Unknown error'));
    } finally {
      setIsTransferring(false);
    }
  };

  const handleBatchUserTransfer = async (recipients: string[], amounts: string[]) => {
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    if (recipients.length === 0 || recipients.length !== amounts.length) {
      toast.error('Invalid recipients or amounts');
      return;
    }
    
    try {
      setIsTransferring(true);
      
      const amountsBigInt = amounts.map(amount => parseEther(amount));
      const totalValue = amountsBigInt.reduce((sum, amount) => sum + amount, BigInt(0));
      
      const { writeContract } = await import('wagmi/actions');
      
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'batchUserTransfer',
        args: [recipients, amountsBigInt],
        value: totalValue,
      });
      
      const totalAmount = amounts.reduce((sum, amount) => sum + parseFloat(amount), 0);
      toast.success(`Batch user transfer successful! ${totalAmount.toFixed(4)} ETH sent to ${recipients.length} recipients`);
      if (refetchAccountInfo) refetchAccountInfo();
    } catch (error: any) {
      console.error('Batch user transfer failed:', error);
      toast.error('Batch user transfer failed: ' + (error.shortMessage || error.message || 'Unknown error'));
    } finally {
      setIsTransferring(false);
    }
  };

  return {
    isTransferring,
    handleTransferInternal,
    handleTransferExternal,
    handleBatchTransfer,
    handleUserToUserTransfer,
    handleBatchUserTransfer,
  };
};

export const useDepositWithdrawFunctions = (
  contractAddress?: `0x${string}`,
  contractABI?: any,
  refetchAccountInfo?: () => void
) => {
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isWithdrawingAll, setIsWithdrawingAll] = useState(false);

  const handleDeposit = async (amount: string) => {
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid deposit amount');
      return;
    }
    
    try {
      setIsDepositing(true);
      
      const { writeContract } = await import('wagmi/actions');
      
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'deposit',
        args: [],
        value: parseEther(amount),
      });
      
      toast.success(`Deposit successful! ${amount} ETH deposited`);
      if (refetchAccountInfo) refetchAccountInfo();
    } catch (error: any) {
      console.error('Deposit failed:', error);
      toast.error('Deposit failed: ' + (error.shortMessage || error.message || 'Unknown error'));
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async (amount: string) => {
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid withdrawal amount');
      return;
    }
    
    try {
      setIsWithdrawing(true);
      
      const { writeContract } = await import('wagmi/actions');
      
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'withdraw',
        args: [parseEther(amount)],
      });
      
      toast.success(`Withdrawal successful! ${amount} ETH withdrawn`);
      if (refetchAccountInfo) refetchAccountInfo();
    } catch (error: any) {
      console.error('Withdrawal failed:', error);
      toast.error('Withdrawal failed: ' + (error.shortMessage || error.message || 'Unknown error'));
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleWithdrawAll = async () => {
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    try {
      setIsWithdrawingAll(true);
      
      const { writeContract } = await import('wagmi/actions');
      
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'withdrawAll',
        args: [],
      });
      
      toast.success('Full withdrawal successful!');
      if (refetchAccountInfo) refetchAccountInfo();
    } catch (error: any) {
      console.error('Full withdrawal failed:', error);
      toast.error('Full withdrawal failed: ' + (error.shortMessage || error.message || 'Unknown error'));
    } finally {
      setIsWithdrawingAll(false);
    }
  };

    const handleClaimInterest = async () => {
    // 在EnhancedBank合约中，利息会在任何交易时自动计算并添加到余额
    // 我们通过最小金额的存款来触发利息更新，这是最安全的方式
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    try {
      toast('Computing accrued interest and updating your balance...', {
        icon: '💰',
      });
      
      const { writeContract } = await import('wagmi/actions');
      
      // 通过最小存款(0.001 ETH)来触发利息计算
      // 这会调用_payInterest()函数，计算并添加累积利息到余额
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'deposit',
        args: [],
        value: parseEther('0.001'), // 最小存款触发利息更新
      });
      
      toast.success('✅ Interest claimed! Your accrued interest has been added to your balance.');
      
      // 刷新账户信息以显示更新后的余额
      if (refetchAccountInfo) {
        setTimeout(() => {
          refetchAccountInfo();
        }, 1500);
      }
      
    } catch (error: any) {
      console.error('Interest claim failed:', error);
      toast.error('Failed to claim interest: ' + (error.shortMessage || error.message || 'Unknown error'));
    }
  };

  return {
    isDepositing,
    isWithdrawing,
    isWithdrawingAll,
    handleDeposit,
    handleWithdraw,
    handleWithdrawAll,
    handleClaimInterest,
  };
};

export const useBankingCalculations = () => {
  const calculateInterest = (balance: string, rate?: any) => {
    const balanceNum = parseFloat(balance) || 0;
    const annualRate = rate ? Number(rate) / 100 : 0.05; // Default 5%
    
    const daily = (balanceNum * annualRate) / 365;
    const monthly = daily * 30;
    const yearly = balanceNum * annualRate;
    
    return { daily, monthly, yearly };
  };

  const calculateCompoundInterest = (principal: number, rate: number, time: number) => {
    // A = P(1 + r/n)^(nt)
    // n = 365 (daily compounding)
    const n = 365;
    const r = rate / 100;
    const amount = principal * Math.pow(1 + r / n, n * time);
    const interest = amount - principal;
    
    return { amount, interest };
  };

  return {
    calculateInterest,
    calculateCompoundInterest,
  };
};

// Web3 创新功能 Hooks
export const useWeb3BankingFeatures = (
  contractAddress?: `0x${string}`,
  contractABI?: any,
  refetchAccountInfo?: () => void
) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSocialTransfer = async (to: string, amount: string, message: string, isPublic: boolean) => {
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { writeContract } = await import('wagmi/actions');
      
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'socialTransfer',
        args: [to, message, isPublic],
        value: parseEther(amount),
      });
      
      toast.success(`Social transfer successful! ${amount} ETH sent to ${to.slice(0, 6)}...${to.slice(-4)}`);
      if (refetchAccountInfo) refetchAccountInfo();
    } catch (error: any) {
      console.error('Social transfer failed:', error);
      toast.error('Social transfer failed: ' + (error.shortMessage || error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSavingsGoal = async (name: string, targetAmount: string, durationDays: number) => {
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { writeContract } = await import('wagmi/actions');
      
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'createSavingsGoal',
        args: [name, parseEther(targetAmount), durationDays],
      });
      
      toast.success(`Savings goal created successfully! Goal: ${name}, Amount: ${targetAmount} ETH`);
      if (refetchAccountInfo) refetchAccountInfo();
    } catch (error: any) {
      console.error('Create savings goal failed:', error);
      toast.error('Create savings goal failed: ' + (error.shortMessage || error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleContributeToGoal = async (goalId: number, amount: string) => {
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { writeContract } = await import('wagmi/actions');
      
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'contributeToSavingsGoal',
        args: [goalId],
        value: parseEther(amount),
      });
      
      toast.success(`Contribution to savings goal successful! ${amount} ETH deposited to goal #${goalId}`);
      if (refetchAccountInfo) refetchAccountInfo();
    } catch (error: any) {
      console.error('Contribute to goal failed:', error);
      toast.error('Contribute to savings goal failed: ' + (error.shortMessage || error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeFlashLoan = async (amount: string) => {
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    // 参数验证
    if (!amount || amount.trim() === '') {
      toast.error('Flash loan application failed: Missing or invalid parameters.\nDouble check you have provided the correct parameters.');
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Flash loan application failed: Invalid loan amount.\nPlease enter a valid positive number.');
      return;
    }
    
    if (amountNum < 0.01) {
      toast.error('Flash loan application failed: Minimum loan amount is 0.01 ETH.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { writeContract } = await import('wagmi/actions');
      
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'takeFlashLoan',
        args: [parseEther(amount)],
      });
      
      toast.success(`Flash loan successful! ${amount} ETH borrowed, please repay within 1 hour`);
      if (refetchAccountInfo) refetchAccountInfo();
    } catch (error: any) {
      console.error('Take flash loan failed:', error);
      
      // 改进错误处理，检查具体的错误原因
      let errorMessage = 'Flash loan application failed: ';
      
      const errorStr = error.message || error.shortMessage || '';
      
      if (errorStr.includes('Active flash loan exists')) {
        errorMessage += 'You already have an active flash loan. Please refresh the page and check your flash loan status.';
      } else if (errorStr.includes('Invalid loan amount')) {
        errorMessage += 'Invalid loan amount. The amount exceeds available liquidity (max 50% of bank balance).';
      } else if (errorStr.includes('Insufficient bank liquidity')) {
        errorMessage += 'Insufficient bank liquidity for this loan amount.';
      } else if (errorStr.includes('Missing or invalid parameters')) {
        errorMessage += 'Contract call failed. Please try again or refresh the page.';
      } else {
        errorMessage += (error.shortMessage || error.message || 'Unknown error');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepayFlashLoan = async (amount: string) => {
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    // 参数验证
    if (!amount || amount.trim() === '') {
      toast.error('Flash loan repayment failed: Missing or invalid parameters.\nDouble check you have provided the correct repayment amount.');
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Flash loan repayment failed: Invalid repayment amount.\nPlease enter a valid positive number.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { writeContract } = await import('wagmi/actions');
      
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'repayFlashLoan',
        args: [],
        value: parseEther(amount),
      });
      
      toast.success(`Flash loan repayment successful! ${amount} ETH repaid`);
      if (refetchAccountInfo) refetchAccountInfo();
    } catch (error: any) {
      console.error('Repay flash loan failed:', error);
      toast.error('Flash loan repayment failed: ' + (error.shortMessage || error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleContributeToPool = async (poolId: number, amount: string) => {
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { writeContract } = await import('wagmi/actions');
      
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'contributeToPool',
        args: [poolId],
        value: parseEther(amount),
      });
      
      toast.success(`Community pool contribution successful! ${amount} ETH added to pool #${poolId}`);
      if (refetchAccountInfo) refetchAccountInfo();
    } catch (error: any) {
      console.error('Contribute to pool failed:', error);
      toast.error('Community pool contribution failed: ' + (error.shortMessage || error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiateCrossChain = async (to: string, amount: string, chainId: number) => {
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { writeContract } = await import('wagmi/actions');
      
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'initiateCrossChainTransfer',
        args: [to, parseEther(amount), chainId],
        value: parseEther(amount),
      });
      
      toast.success(`Cross-chain transfer initiated! ${amount} ETH being sent to chain ${chainId}`);
      if (refetchAccountInfo) refetchAccountInfo();
    } catch (error: any) {
      console.error('Initiate cross chain transfer failed:', error);
      toast.error('Cross-chain transfer initiation failed: ' + (error.shortMessage || error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestLoan = async (amount: string) => {
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    // 参数验证
    if (!amount || amount.trim() === '') {
      toast.error('Regular loan application failed: Missing or invalid parameters.\nPlease enter a valid loan amount.');
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Regular loan application failed: Invalid loan amount.\nPlease enter a valid positive number.');
      return;
    }
    
    if (amountNum < 0.1) {
      toast.error('Regular loan application failed: Minimum loan amount is 0.1 ETH.');
      return;
    }
    
    // 计算所需抵押品（150%）
    const requiredCollateral = amountNum * 1.5;
    
    try {
      setIsLoading(true);
      
      const { writeContract } = await import('wagmi/actions');
      
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'requestLoan',
        args: [parseEther(amount)],
        value: parseEther(requiredCollateral.toString()),
      });
      
      toast.success(`Loan request successful! ${amount} ETH requested with ${requiredCollateral.toFixed(4)} ETH collateral`);
      if (refetchAccountInfo) refetchAccountInfo();
    } catch (error: any) {
      console.error('Request loan failed:', error);
      toast.error('Regular loan application failed: ' + (error.shortMessage || error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // 添加获取闪电贷状态的功能
  const getFlashLoanStatus = async (userAddress: string) => {
    if (!contractAddress || !userAddress) {
      console.log('⚠️ Missing contractAddress or userAddress:', { contractAddress, userAddress });
      return null;
    }
    
    try {
      console.log('🔍 Getting flash loan status for:', userAddress, 'on contract:', contractAddress);
      
      const { readContract } = await import('wagmi/actions');
      
      const flashLoan = await readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'activeFlashLoans',
        args: [userAddress as `0x${string}`],
      });
      
      console.log('📋 Flash loan data received:', flashLoan);
      return flashLoan;
    } catch (error) {
      console.error('❌ Error fetching flash loan status:', error);
      return null;
    }
  };

  // 添加获取用户贷款列表的功能
  const getUserLoans = async (userAddress: string) => {
    if (!contractAddress || !userAddress) return [];
    
    try {
      const { readContract } = await import('wagmi/actions');
      
      const loans = await readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getUserLoans',
        args: [userAddress],
      });
      
      // 为每个贷款添加原始索引，以便前端能正确映射到合约
      const loansWithIndex = loans.map((loan: any, index: number) => ({
        ...loan,
        contractIndex: index, // 记录在合约中的真实索引
      }));
      
      console.log('🔍 Loans with contract indices:', loansWithIndex.map((l: any, i: number) => 
        `#${i}: Contract[${l.contractIndex}] ${l.isActive ? 'Active' : 'Inactive'}`
      ));
      
      return loansWithIndex;
    } catch (error) {
      console.error('Error fetching user loans:', error);
      return [];
    }
  };

  // 获取特定贷款的精确还款金额（使用新的合约函数）
  const getLoanRepaymentAmount = async (userAddress: string, loanId: number) => {
    if (!contractAddress || !userAddress) return null;
    
    try {
      const { readContract } = await import('wagmi/actions');
      
      // 首先尝试使用新的 getLoanStatus 函数
      try {
        const loanStatus = await readContract({
          address: contractAddress,
          abi: contractABI,
          functionName: 'getLoanStatus',
          args: [userAddress, loanId],
        });
        
        return {
          principal: Number(loanStatus[0]) / 1e18,  // originalAmount
          remainingPrincipal: Number(loanStatus[1]) / 1e18,  // remainingPrincipal  
          interest: Number(loanStatus[3]) / 1e18,   // unpaidInterest
          totalRepayment: Number(loanStatus[4]) / 1e18,  // totalOwed
          isActive: loanStatus[5],
        };
      } catch (newFunctionError) {
        console.log('New function not available, using fallback method');
        
        // 回退到旧方法
        const interest = await readContract({
          address: contractAddress,
          abi: contractABI,
          functionName: 'calculateLoanInterest',
          args: [userAddress, loanId],
        });
        
        const loans = await readContract({
          address: contractAddress,
          abi: contractABI,
          functionName: 'getUserLoans',
          args: [userAddress],
        });
        
        if (loans && loans[loanId]) {
          const loan = loans[loanId];
          const principal = Number(loan.amount);
          const totalRepayment = principal + Number(interest);
          
          return {
            principal: principal / 1e18,
            interest: Number(interest) / 1e18,
            totalRepayment: totalRepayment / 1e18,
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error calculating loan repayment:', error);
      return null;
    }
  };

  const handleRepayLoan = async (loanId: number, amount: string) => {
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    // 参数验证
    if (!amount || amount.trim() === '') {
      toast.error('Please enter a valid repayment amount greater than 0');
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid positive number for repayment');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // 获取当前用户地址
      const { getAccount } = await import('wagmi/actions');
      const account = getAccount();
      
      if (!account.address) {
        toast.error('No account connected');
        return;
      }
      
      // 获取精确的还款金额
      const repaymentInfo = await getLoanRepaymentAmount(account.address, loanId);
      
      if (!repaymentInfo) {
        toast.error('Could not calculate required repayment amount');
        return;
      }
      
      console.log('📊 Loan repayment info:', repaymentInfo);
      console.log('💰 User attempting to pay:', amount, 'ETH');
      console.log('💰 Required amount:', repaymentInfo.totalRepayment, 'ETH');
      
      // 合约现在支持部分还款，检查金额是否合理
      if (amountNum > repaymentInfo.totalRepayment + 0.01) {
        toast.error(`Payment amount too large! Maximum needed: ${repaymentInfo.totalRepayment.toFixed(6)} ETH`);
        return;
      }
      
      console.log('💰 Contract supports partial repayment');
      console.log('💰 User payment amount:', amount, 'ETH');
      console.log('💰 Total owed:', repaymentInfo.totalRepayment.toFixed(6), 'ETH');
      
      const { writeContract } = await import('wagmi/actions');
      
      const txParams = {
        address: contractAddress,
        abi: contractABI,
        functionName: 'repayLoan',
        args: [loanId],
        value: parseEther(amount),
        gasLimit: 800000, // 增加gas限制以支持v5合约的复杂计算
      };
      
      console.log('📤 Calling writeContract with params:', txParams);
      
      const result = await writeContract(txParams);
      
      console.log('✅ Transaction result:', result);
      
      toast.success(`✅ Loan repayment successful! ${amount} ETH repaid for loan #${loanId}`);
      
      // 强制刷新所有相关数据
      if (refetchAccountInfo) {
        // 立即刷新
        refetchAccountInfo();
        // 等待区块链状态同步后再次刷新
        setTimeout(() => {
          refetchAccountInfo();
          console.log('🔄 Data refreshed after transaction');
        }, 2000);
      }
    } catch (error: any) {
      console.error('❌ Repay loan failed:', error);
      
      const errorMsg = error.shortMessage || error.message || error.reason || 'Unknown error';
      
      if (errorMsg.includes('Insufficient repayment amount')) {
        toast.error('❌ Insufficient repayment amount. Please use "Full Repayment" button for exact amount.');
      } else if (errorMsg.includes('insufficient funds')) {
        toast.error('❌ Insufficient funds for repayment + gas fees');
      } else if (errorMsg.includes('Loan not found')) {
        toast.error('❌ Loan not found or already repaid');
      } else {
        toast.error(`❌ Loan repayment failed: ${errorMsg}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getLoanStatus = async (userAddress: string, loanId: number) => {
    if (!contractAddress || !userAddress) return null;
    
    try {
      const { readContract } = await import('wagmi/actions');
      
      const loanStatus = await readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getLoanStatus',
        args: [userAddress, loanId],
      });
      
      console.log(`🔍 Detailed loan status for loan #${loanId}:`, loanStatus);
      return loanStatus;
    } catch (error) {
      console.error(`❌ Error getting loan status for loan #${loanId}:`, error);
      return null;
    }
  };

  // 智能全额还款函数 - 自动处理微量余额和利息增长
  const handleFullRepayment = async (loanId: number) => {
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { getAccount } = await import('wagmi/actions');
      const account = getAccount();
      
      if (!account.address) {
        toast.error('No account connected');
        return;
      }
      
      console.log(`🔍 Starting intelligent full repayment for loan #${loanId}...`);
      
      // 步骤1: 获取当前贷款状态
      const repaymentInfo = await getLoanRepaymentAmount(account.address, loanId);
      if (!repaymentInfo) {
        toast.error('Could not calculate required repayment amount');
        return;
      }
      
      let finalAmount = repaymentInfo.totalRepayment;
      console.log(`📊 Current total owed: ${finalAmount.toFixed(12)} ETH`);
      
      // 步骤2: 检测微量余额并应用智能逻辑
      let isMicroBalance = false;
      let bufferApplied = 0;
      
      if (finalAmount > 0 && finalAmount < 0.01) {
        isMicroBalance = true;
        const originalAmount = finalAmount;
        
        // 对于微量余额，添加更大的缓冲来处理利息增长
        if (finalAmount < 0.000001) {
          // 极小余额：添加0.001 ETH缓冲
          bufferApplied = 0.001;
          finalAmount = originalAmount + bufferApplied;
        } else if (finalAmount < 0.001) {
          // 小余额：添加0.002 ETH缓冲
          bufferApplied = 0.002;
          finalAmount = originalAmount + bufferApplied;
        } else {
          // 中等微量余额：添加0.005 ETH缓冲
          bufferApplied = 0.005;
          finalAmount = originalAmount + bufferApplied;
        }
        
        // 确保最小金额为0.01 ETH
        finalAmount = Math.max(finalAmount, 0.01);
        
        console.log(`🔧 Micro balance detected!`);
        console.log(`   Original amount: ${originalAmount.toFixed(12)} ETH`);
        console.log(`   Buffer applied: ${bufferApplied.toFixed(6)} ETH`);
        console.log(`   Final amount: ${finalAmount.toFixed(8)} ETH`);
        
        toast(`🔧 检测到微量余额，自动添加 ${bufferApplied.toFixed(6)} ETH 缓冲确保完全还清`, {
          icon: '🔧',
          duration: 4000,
        });
      } else {
        // 正常金额：添加小额缓冲防止利息增长
        bufferApplied = Math.min(finalAmount * 0.001, 0.01); // 0.1%缓冲，最大0.01 ETH
        finalAmount += bufferApplied;
        
        console.log(`💰 Normal repayment with safety buffer: ${bufferApplied.toFixed(6)} ETH`);
        console.log(`   Total payment: ${finalAmount.toFixed(6)} ETH`);
      }
      
      // 步骤3: 执行还款
      const { writeContract } = await import('wagmi/actions');
      
      const txParams = {
        address: contractAddress,
        abi: contractABI,
        functionName: 'repayLoan',
        args: [loanId],
        value: parseEther(finalAmount.toFixed(8)),
        gasLimit: 800000,
      };
      
      console.log(`📤 Executing full repayment transaction...`);
      console.log(`   Payment amount: ${finalAmount.toFixed(8)} ETH`);
      console.log(`   Is micro balance: ${isMicroBalance}`);
      
      const result = await writeContract(txParams);
      console.log('✅ Transaction result:', result);
      
      // 成功消息
      if (isMicroBalance) {
        toast.success(`✅ 微量余额已完全清零！贷款 #${loanId} 已全额还清`);
      } else {
        toast.success(`✅ 贷款 #${loanId} 已全额还清！支付 ${finalAmount.toFixed(6)} ETH`);
      }
      
      // 强制刷新数据
      if (refetchAccountInfo) {
        refetchAccountInfo();
        setTimeout(() => {
          refetchAccountInfo();
          console.log('🔄 Data refreshed after full repayment');
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('❌ Full repayment failed:', error);
      
      const errorMsg = error.shortMessage || error.message || error.reason || 'Unknown error';
      
      if (errorMsg.includes('insufficient funds')) {
        toast.error('❌ 余额不足支付还款金额和手续费');
      } else if (errorMsg.includes('Loan not found')) {
        toast.error('❌ 贷款未找到或已还清');
      } else {
        toast.error(`❌ 全额还款失败: ${errorMsg}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleSocialTransfer,
    handleCreateSavingsGoal,
    handleContributeToGoal,
    handleTakeFlashLoan,
    handleRepayFlashLoan,
    handleContributeToPool,
    handleInitiateCrossChain,
    handleRequestLoan,
    handleRepayLoan,
    handleFullRepayment,
    getFlashLoanStatus,
    getUserLoans,
    getLoanRepaymentAmount,
    getLoanStatus,
  };
}; 