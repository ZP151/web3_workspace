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
    if (!contractAddress) {
      toast.error('Contract not available');
      return;
    }
    
    try {
      const { writeContract } = await import('wagmi/actions');
      
      await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'claimInterest',
        args: [],
      });
      
      toast.success('Interest claimed successfully!');
      if (refetchAccountInfo) refetchAccountInfo();
    } catch (error: any) {
      console.error('Claim interest failed:', error);
      toast.error('Claim interest failed: ' + (error.shortMessage || error.message || 'Unknown error'));
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
      toast.error('Flash loan application failed: ' + (error.shortMessage || error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepayFlashLoan = async (amount: string) => {
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

  return {
    isLoading,
    handleSocialTransfer,
    handleCreateSavingsGoal,
    handleContributeToGoal,
    handleTakeFlashLoan,
    handleRepayFlashLoan,
    handleContributeToPool,
    handleInitiateCrossChain,
  };
}; 