import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction, useNetwork } from 'wagmi';
import { parseEther } from 'viem';
import { getContractAddress, getContractABI } from '@/config/contracts';
import { FormData, Proposal } from './types';

// 简化的投票Hook
export function useVotingContract() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [isVoting, setIsVoting] = useState(false);
  const [selectedVote, setSelectedVote] = useState<{proposalId: number, optionId: number} | null>(null);

  // Get contract address for current network
  const contractAddress = chain?.id ? getContractAddress(chain.id, 'Voting') : undefined;
  const contractABI = getContractABI('Voting');

  // Get contract statistics
  const { data: stats, refetch: refetchStats } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getStats',
    enabled: !!contractAddress,
  });

  // Get proposal count
  const { data: proposalCount, refetch: refetchProposalCount } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getProposalCount',
    enabled: !!contractAddress,
  });

  // Get user voting power
  const { data: userVotingPower, refetch: refetchVotingPower } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'votingPower',
    args: [address],
    enabled: !!contractAddress && !!address,
  });

  // Prepare vote transaction
  const { config: voteConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'vote',
    args: selectedVote ? [BigInt(selectedVote.proposalId), BigInt(selectedVote.optionId)] : undefined,
    value: stats ? (stats as any)[3] : parseEther('0.001'),
    enabled: !!selectedVote && !!contractAddress,
  });

  const { write: vote, data: voteData } = useContractWrite(voteConfig);

  const { isLoading: isVotingTransaction } = useWaitForTransaction({
    hash: voteData?.hash,
    onSuccess: () => {
      setSelectedVote(null);
      setIsVoting(false);
      // Refetch data after successful vote
      refetchStats();
      refetchProposalCount();
      refetchVotingPower();
    },
    onError: (error) => {
      console.error('Vote transaction failed:', error);
      setSelectedVote(null);
      setIsVoting(false);
    }
  });

  const handleVote = async (proposalId: number, optionId = 0) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return false;
    }

    if (!contractAddress) {
      alert('Voting contract not deployed on this network');
      return false;
    }

    setIsVoting(true);
    setSelectedVote({ proposalId, optionId });
    
    try {
      if (vote) {
        vote();
        return true;
      }
    } catch (error) {
      console.error('Voting failed:', error);
      setIsVoting(false);
      setSelectedVote(null);
      return false;
    }
    
    return false;
  };

  return {
    isVoting: isVoting || isVotingTransaction,
    handleVote,
    stats,
    proposalCount,
    userVotingPower,
    contractAddress,
    isContractAvailable: !!contractAddress,
    refetchStats,
    refetchProposalCount,
    refetchVotingPower
  };
}

// 创建提案的Hook
export function useCreateProposal() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);

  // Get contract address for current network
  const contractAddress = chain?.id ? getContractAddress(chain.id, 'Voting') : undefined;
  const contractABI = getContractABI('Voting');

  // Get creation fee
  const { data: stats } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getStats',
    enabled: !!contractAddress,
  });

  // Prepare create proposal transaction
  const { config: createConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'createProposal',
    args: formData ? [
      formData.title,
      formData.description,
      BigInt(formData.duration),
      BigInt(formData.minVotes),
      formData.proposalType,
      formData.category,
      formData.proposalType === 1 ? formData.options.filter(opt => opt.trim() !== '') : []
    ] : undefined,
    value: stats ? (stats as any)[4] : parseEther('0.01'),
    enabled: !!formData && !!contractAddress,
  });

  const { write: createProposal, data: createData } = useContractWrite(createConfig);

  const { isLoading: isCreatingTransaction } = useWaitForTransaction({
    hash: createData?.hash,
    onSuccess: () => {
      setFormData(null);
      setIsCreating(false);
    },
    onError: (error) => {
      console.error('Create proposal transaction failed:', error);
      setFormData(null);
      setIsCreating(false);
    }
  });

  const handleCreateProposal = async (data: FormData) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return false;
    }

    if (!contractAddress) {
      alert('Voting contract not deployed on this network');
      return false;
    }

    setIsCreating(true);
    setFormData(data);
    
    try {
      if (createProposal) {
        createProposal();
        return true;
      }
    } catch (error) {
      console.error('Creating proposal failed:', error);
      setIsCreating(false);
      setFormData(null);
      return false;
    }
    
    return false;
  };

  return {
    isCreating: isCreating || isCreatingTransaction,
    handleCreateProposal,
    contractAddress,
    isContractAvailable: !!contractAddress,
    creationFee: stats ? (stats as any)[4] : parseEther('0.01')
  };
}

// Hook to load proposals from contract
export function useProposals() {
  const { chain } = useNetwork();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);

  // Get contract address for current network
  const contractAddress = chain?.id ? getContractAddress(chain.id, 'Voting') : undefined;
  const contractABI = getContractABI('Voting');

  // Get proposal count
  const { data: proposalCount } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getProposalCount',
    enabled: !!contractAddress,
  });
}