'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAccount, useNetwork, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { Plus, History, Home, ArrowLeft, Vote, DollarSign, Users, Clock, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import VotingStats from './components/VotingStats';
import CreateProposalForm from './components/CreateProposalForm';
import ProposalCard from './components/ProposalCard';
import { getContractAddress, getContractABI } from '@/config/contracts';
import { FormData, Proposal } from './components/types';

export default function VotingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('history');
  const [isVoting, setIsVoting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVote, setSelectedVote] = useState<{proposalId: number, optionId: number} | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);

  // Get contract info
  const contractAddress = chain?.id ? getContractAddress(chain.id, 'Voting') : null;
  const contractABI = getContractABI('Voting');
  const isContractAvailable = !!contractAddress;

  // Get contract statistics
  const { data: stats, refetch: refetchStats } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getStats',
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

  // Get proposal count
  const { data: proposalCount, refetch: refetchProposalCount } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getProposalCount',
    enabled: !!contractAddress,
  });

  // Get user's total votes cast
  const { data: userTotalVotes } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'userVoteCount',
    args: [address],
    enabled: !!contractAddress && !!address,
  });

  // Vote transaction
  const { writeAsync: vote, data: voteData } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'vote',
    onSuccess: (data) => {
      console.log('🗳️ Vote transaction sent:', data);
    },
    onError: (error) => {
      console.error('🚨 Vote transaction failed:', error);
    }
  });

  // Weighted vote transaction
  const { writeAsync: voteWithWeight, data: weightedVoteData } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'voteWithWeight',
    onSuccess: (data) => {
      console.log('🗳️ Weighted vote transaction sent:', data);
    },
    onError: (error) => {
      console.error('🚨 Weighted vote transaction failed:', error);
    }
  });

  const { isLoading: isVotingTransaction } = useWaitForTransaction({
    hash: voteData?.hash,
    onSuccess: () => {
      setSelectedVote(null);
      setIsVoting(false);
      // Refetch data after successful vote
      refetchStats();
      refetchProposalCount();
      refetchVotingPower();
      loadProposalsFromContract();
      alert('Vote successful!');
    },
    onError: (error) => {
      console.error('Vote transaction failed:', error);
      setSelectedVote(null);
      setIsVoting(false);
      alert('Vote failed: ' + ((error as Error).message || 'Unknown error'));
    }
  });

  // Debug: Log formData content
  useEffect(() => {
    if (formData) {
      console.log('🔍 FormData Debug:', {
        title: formData.title,
        titleType: typeof formData.title,
        titleLength: formData.title?.length,
        description: formData.description,
        descriptionType: typeof formData.description,
        descriptionLength: formData.description?.length,
        duration: formData.duration,
        durationType: typeof formData.duration,
        minVotes: formData.minVotes,
        minVotesType: typeof formData.minVotes,
        proposalType: formData.proposalType,
        proposalTypeType: typeof formData.proposalType,
        category: formData.category,
        categoryType: typeof formData.category,
        options: formData.options,
        optionsType: typeof formData.options,
        rawFormData: formData
      });
    }
  }, [formData]);

  // Direct contract write without prepare
  const { write: createProposal, data: createData, error: writeError, isLoading: isWriteLoading } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'createProposal',
    value: stats ? (stats as any)[4] : parseEther('0.01'),
    onSuccess: (data) => {
      console.log('🎉 Transaction sent successfully:', data);
    },
    onError: (error) => {
      console.error('🚨 Transaction failed:', error);
    }
  });

  // Debug contract write status
  useEffect(() => {
    console.log('📋 Contract Write Debug:', {
      formData: !!formData,
      contractAddress,
      chainId: chain?.id,
      createProposal: !!createProposal,
      writeError: writeError?.message,
      isWriteLoading,
      stats: stats ? 'loaded' : 'not loaded',
      proposalFee: stats ? formatEther((stats as any)[4]) : 'unknown'
    });
  }, [formData, contractAddress, chain?.id, createProposal, writeError, isWriteLoading, stats]);

  const { isLoading: isCreatingTransaction } = useWaitForTransaction({
    hash: createData?.hash,
    onSuccess: () => {
      setFormData(null);
      setIsCreating(false);
      setActiveTab('history');
      // Refetch data after successful creation
      refetchStats();
      refetchProposalCount();
      loadProposalsFromContract();
      alert('Proposal created successfully!');
    },
    onError: (error) => {
      console.error('Create proposal transaction failed:', error);
      setFormData(null);
      setIsCreating(false);
      alert('Proposal creation failed: ' + ((error as Error).message || 'Unknown error'));
    }
  });

  // Mock proposal data for development when contract not available
  const mockProposals: Proposal[] = [
    {
      id: 0,
      title: "Increase Platform Trading Fee to 0.1%",
      description: "To maintain platform operations and development, we propose increasing the trading fee from 0.05% to 0.1%. This will help us provide better services and security.",
      voteCount: 156,
      deadline: Math.floor(Date.now() / 1000) + 86400 * 7,
      executed: false,
      minVotes: 100,
      proposalType: 0,
      category: 1,
      creator: "0x1234567890123456789012345678901234567890",
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 2,
      hasVoted: false
    },
    {
      id: 1,
      title: "Choose New Liquidity Mining Reward Token",
      description: "We need to select a new token for liquidity mining rewards. Please choose the most suitable token from the following options.",
      voteCount: 89,
      deadline: Math.floor(Date.now() / 1000) + 86400 * 5,
      executed: false,
      minVotes: 50,
      proposalType: 1,
      category: 1,
      creator: "0x2345678901234567890123456789012345678901",
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 1,
      options: ["USDC", "DAI", "WETH", "Custom Token"],
      optionVotes: [25, 18, 32, 14],
      hasVoted: false
    }
  ];

  // Load proposals from contract
  const loadProposalsFromContract = async () => {
    if (!contractAddress || !proposalCount) {
      // Fallback to mock data
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProposals(mockProposals);
      } catch (error) {
        console.error('Failed to load proposals:', error);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    setLoading(true);
    try {
      const count = Number(proposalCount);
      const loadedProposals: Proposal[] = [];
      
      // 使用ethers直接调用合约来获取真实数据
      for (let i = 0; i < Math.min(count, 10); i++) {
        try {
          // 直接使用合约地址和ABI调用
          const { createPublicClient, http } = await import('viem');
          const { ganache } = await import('@/lib/wagmi');
          
          const client = createPublicClient({
            chain: ganache,
            transport: http('http://127.0.0.1:7545')
          });
          
          // 调用getProposal函数
          const proposalData = await client.readContract({
            address: contractAddress as `0x${string}`,
            abi: contractABI,
            functionName: 'getProposal',
            args: [BigInt(i)]
          }) as any[];
          
          console.log(`📄 原始提案数据 ${i}:`, proposalData);
          
          // 解析合约返回的数据（按照实际合约返回的顺序）
          const [
            title,
            description, 
            voteCount,
            deadline,
            executed,
            minVotes,
            proposalType,
            category,
            creator,
            createdAt
          ] = proposalData;
          
          // 检查用户是否已投票
          let hasVoted = false;
          if (address) {
            try {
                             const hasVotedResult = await client.readContract({
                 address: contractAddress as `0x${string}`,
                 abi: contractABI,
                 functionName: 'hasVoted',
                 args: [BigInt(i), address]
               });
               hasVoted = Boolean(hasVotedResult);
            } catch (error) {
              console.warn(`无法检查投票状态 ${i}:`, error);
            }
          }
          
          // 如果是多选提案，获取选项
          let options: string[] | undefined;
          let optionVotes: number[] | undefined;
          
          if (proposalType === 1) {
            try {
              const optionsData = await client.readContract({
                address: contractAddress as `0x${string}`,
                abi: contractABI,
                functionName: 'getProposalOptions',
                args: [BigInt(i)]
              }) as [string[], bigint[]];
              
              options = optionsData[0];
              optionVotes = optionsData[1].map(v => Number(v));
            } catch (error) {
              console.warn(`无法获取选项 ${i}:`, error);
              options = [];
              optionVotes = [];
            }
          }
          
          const proposal: Proposal = {
            id: i,
            title: title || `提案 ${i + 1}`,
            description: description || `提案 ${i + 1} 的描述`,
            voteCount: Number(voteCount || 0),
            deadline: Number(deadline || 0),
            executed: Boolean(executed),
            minVotes: Number(minVotes || 0),
            proposalType: Number(proposalType || 0),
            category: Number(category || 0),
            creator: creator || "0x0000000000000000000000000000000000000000",
            createdAt: Number(createdAt || 0),
            hasVoted,
            options,
            optionVotes
          };
          
          console.log(`✅ 解析后的提案 ${i}:`, proposal);
          loadedProposals.push(proposal);
          
        } catch (error) {
          console.error(`Failed to load proposal ${i}:`, error);
          // 添加错误占位符
          loadedProposals.push({
            id: i,
            title: `提案 ${i + 1} (加载失败)`,
            description: `无法从合约加载提案 ${i + 1} 的详细信息。错误: ${error}`,
            voteCount: 0,
            deadline: Math.floor(Date.now() / 1000) + 86400,
            executed: false,
            minVotes: 1,
            proposalType: 0,
            category: 0,
            creator: "0x0000000000000000000000000000000000000000",
            createdAt: Math.floor(Date.now() / 1000),
            hasVoted: false
          });
        }
      }
      
      setProposals(loadedProposals.reverse()); // Show newest first
    } catch (error) {
      console.error('Failed to load proposals from contract:', error);
      // Fallback to mock data
      setProposals(mockProposals);
    } finally {
      setLoading(false);
    }
  };

  // Load proposals (use contract if available, otherwise mock)
  const loadProposals = async () => {
    if (isContractAvailable) {
      await loadProposalsFromContract();
    } else {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProposals(mockProposals);
      } catch (error) {
        console.error('Failed to load proposals:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle voting with real contract calls
  const handleVote = async (proposalId: number, optionId = 0, voteWeight = 1) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!isContractAvailable) {
      // Fallback to simulation
      setIsVoting(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setProposals(prev => prev.map(p => 
          p.id === proposalId 
            ? { 
                ...p, 
                voteCount: p.voteCount + 1,
                hasVoted: true,
                optionVotes: p.optionVotes ? p.optionVotes.map((votes, i) => 
                  i === optionId ? votes + 1 : votes
                ) : undefined
              }
            : p
        ));
        
        alert('Vote successful! (Simulated)');
      } catch (error) {
        console.error('Voting failed:', error);
        alert('Voting failed, please try again');
      } finally {
        setIsVoting(false);
      }
      return;
    }

    // Real contract call
    setIsVoting(true);
    setSelectedVote({ proposalId, optionId });
    
    try {
      const baseFee = stats ? (stats as any)[3] : parseEther('0.001');
      
      // 检查是否是权重投票
      const proposal = proposals.find(p => p.id === proposalId);
      const isWeightedVote = proposal?.proposalType === 2;
      
      if (isWeightedVote && voteWeight > 1) {
        // 权重投票费用按权重倍数计算
        const votingFee = parseEther((parseFloat(formatEther(baseFee)) * voteWeight).toString());
        
        console.log('🗳️ Weighted voting with params:', {
          proposalId: BigInt(proposalId),
          optionId: BigInt(optionId),
          voteWeight: BigInt(voteWeight),
          value: votingFee
        });
        
        await voteWithWeight({
          args: [BigInt(proposalId), BigInt(optionId), BigInt(voteWeight)],
          value: votingFee
        });
      } else {
        // 普通投票
        console.log('🗳️ Regular voting with params:', {
          proposalId: BigInt(proposalId),
          optionId: BigInt(optionId),
          value: baseFee
        });
        
        await vote({
          args: [BigInt(proposalId), BigInt(optionId)],
          value: baseFee
        });
      }
      
    } catch (error) {
      console.error('Voting failed:', error);
      setIsVoting(false);
      setSelectedVote(null);
      alert('Vote failed: ' + ((error as Error).message || 'Unknown error'));
    }
  };

  // Handle proposal creation with real contract calls
  const handleCreateProposal = async (data: FormData) => {
    console.log('🚀 HandleCreateProposal called:', {
      isConnected,
      isContractAvailable,
      contractAddress,
      chainId: chain?.id,
      data
    });

    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!isContractAvailable) {
      console.log('⚠️ Contract not available, using simulation mode');
      // Fallback to simulation
      setIsCreating(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const newProposal: Proposal = {
          id: proposals.length,
          title: data.title,
          description: data.description,
          voteCount: 0,
          deadline: Math.floor(Date.now() / 1000) + Number(data.duration) * 3600,
          executed: false,
          minVotes: Number(data.minVotes),
          proposalType: data.proposalType,
          category: data.category,
          creator: address || "0x0000000000000000000000000000000000000000",
          createdAt: Math.floor(Date.now() / 1000),
          options: data.proposalType === 1 ? data.options.filter(opt => opt.trim() !== '') : undefined,
          optionVotes: data.proposalType === 1 ? new Array(data.options.filter(opt => opt.trim() !== '').length).fill(0) : undefined,
          hasVoted: false
        };
        
        setProposals(prev => [newProposal, ...prev]);
        setActiveTab('history');
        alert('Proposal created successfully! (Simulated)');
      } catch (error) {
        console.error('Failed to create proposal:', error);
        alert('Failed to create proposal, please try again');
      } finally {
        setIsCreating(false);
      }
      return;
    }

    // Real contract call
    console.log('🔥 Starting real contract call');
    setIsCreating(true);
    setFormData(data);
    
    // Wait a bit for prepare to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('💰 Contract call state:', {
      createProposal: !!createProposal,
      isWriteLoading,
      writeError: writeError?.message
    });
    
    try {
      if (createProposal) {
        console.log('✨ Calling createProposal with args:', {
          title: data.title,
          description: data.description,
          duration: data.duration,
          minVotes: data.minVotes,
          proposalType: data.proposalType,
          category: data.category,
          options: data.proposalType === 1 ? data.options.filter(opt => opt.trim() !== '') : []
        });
        
        createProposal({
          args: [
            data.title,
            data.description,
            BigInt(data.duration),
            BigInt(data.minVotes),
            data.proposalType,
            data.category,
            data.proposalType === 1 ? data.options.filter(opt => opt.trim() !== '') : []
          ]
        });
      } else {
        console.error('❌ createProposal function not available');
        alert('Transaction preparation failed. Please try again.');
        setIsCreating(false);
        setFormData(null);
      }
    } catch (error) {
      console.error('Creating proposal failed:', error);
      setIsCreating(false);
      setFormData(null);
      alert('Creating proposal failed: ' + ((error as Error).message || 'Unknown error'));
    }
  };

  useEffect(() => {
    loadProposals();
  }, [contractAddress, proposalCount]);

  // Auto-refresh data every 30 seconds when contract is available
  useEffect(() => {
    if (!isConnected || !contractAddress) return;

    const interval = setInterval(() => {
      refetchStats();
      refetchVotingPower();
      refetchProposalCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, contractAddress, refetchStats, refetchVotingPower, refetchProposalCount]);

  // Default stats if contract not available
  const defaultStats: readonly [bigint, bigint, bigint, bigint, bigint] = [BigInt(0), BigInt(0), BigInt(0), parseEther('0.001'), parseEther('0.01')] as const;
  
  // Safe stats conversion
  const safeStats: readonly [bigint, bigint, bigint, bigint, bigint] = Array.isArray(stats) && stats.length >= 5 
    ? (stats as unknown) as readonly [bigint, bigint, bigint, bigint, bigint]
    : defaultStats;
  
  const safeUserVotingPower = typeof userVotingPower === 'bigint' 
    ? userVotingPower 
    : BigInt(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Voting Governance</h1>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-500">
                Auto-refresh: 30s
              </div>
              <button
                onClick={() => {
                  refetchStats();
                  refetchVotingPower();
                  refetchProposalCount();
                  loadProposals();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                title="Refresh data"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Voting Information */}
        {isConnected && contractAddress && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Voting Information</h3>
                <p className="text-gray-600">Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                <p className="text-gray-600">Network: {chain?.name || 'Unknown'} (ID: {chain?.id})</p>
                <p className="text-gray-600">Contract: {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4)}</p>
                <div className="mt-2 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-blue-600">Connected to Voting Contract</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{formatEther(safeUserVotingPower)} ETH</div>
                <div className="text-gray-600">Voting Power</div>
                <div className="text-sm text-gray-500 mt-1">
                  Total Votes Cast: {userTotalVotes ? Number(userTotalVotes) : 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isConnected ? (
          <div className="text-center py-12">
            <Vote className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Connection Required</h2>
            <p className="text-gray-600 mb-6">Please connect your wallet to participate in governance voting</p>
            <Link href="/">
              <Button>Return to Home and Connect Wallet</Button>
            </Link>
          </div>
        ) : !contractAddress ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-16 w-16 text-orange-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Contract Not Deployed</h2>
            <p className="text-gray-600 mb-6">Voting contract is not deployed on this network. Operating in simulation mode.</p>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'history'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <History className="h-4 w-4" />
                Proposal History
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'create'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                disabled={!isConnected}
              >
                <Plus className="h-4 w-4" />
                Create Proposal
              </button>
            </div>

            {/* Contract availability warning */}
            {!isContractAvailable && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800">⚠️ Voting contract not deployed on this network. Using simulation mode.</p>
              </div>
            )}

            {/* Statistics */}
            <VotingStats 
              stats={safeStats} 
              userVotingPower={safeUserVotingPower} 
            />

            {/* Create Proposal Form */}
            <CreateProposalForm
              show={activeTab === 'create'}
              onClose={() => setActiveTab('history')}
              onSubmit={handleCreateProposal}
              isCreating={isCreating || isCreatingTransaction}
              creationFee={stats ? (stats as any)[4] : parseEther('0.01')}
            />

            {/* Proposal List */}
            {activeTab === 'history' && (
              <>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading proposals...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {proposals.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No proposals yet</p>
                        <p className="text-gray-400 mt-2">
                          {isConnected ? 'Create your first proposal!' : 'Please connect your wallet to view proposals'}
                        </p>
                      </div>
                    ) : (
                      proposals.map((proposal) => (
                        <ProposalCard
                          key={proposal.id}
                          proposal={proposal}
                          onVote={handleVote}
                          isVoting={isVoting || isVotingTransaction}
                          isConnected={isConnected}
                          userVotingPower={Number(safeUserVotingPower)}
                        />
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
} 