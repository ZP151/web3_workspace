'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useNetwork, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseEther } from 'viem';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Vote, Clock, CheckCircle, XCircle, Users, Plus, Tag, BarChart3, 
  Settings, DollarSign, Code, Heart, Filter
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getContractAddress, getContractABI } from '@/config/contracts';
import NetworkStatus from '@/components/NetworkStatus';

// Types for enhanced proposal system
type ProposalType = 'simple' | 'multiple' | 'weighted';
type ProposalCategory = 'governance' | 'finance' | 'technical' | 'community';

interface Proposal {
  id: number;
  title: string;
  description: string;
  voteCount: number;
  deadline: number;
  executed: boolean;
  minVotes: number;
  hasVoted?: boolean;
  isActive: boolean;
  proposalType: ProposalType;
  category: ProposalCategory;
}

// Category and type configurations
const CATEGORY_CONFIG = {
  governance: {
    label: 'Governance',
    color: 'blue',
    icon: Settings,
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    description: 'Governance decisions'
  },
  finance: {
    label: 'Finance',
    color: 'green',
    icon: DollarSign,
    bg: 'bg-green-100',
    text: 'text-green-800',
    description: 'Financial management'
  },
  technical: {
    label: 'Technical',
    color: 'purple',
    icon: Code,
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    description: 'Technical upgrades'
  },
  community: {
    label: 'Community',
    color: 'orange',
    icon: Heart,
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    description: 'Community activities'
  }
};

const VOTING_TYPE_CONFIG = {
  simple: {
    label: 'Simple (Yes/No)',
    icon: CheckCircle,
    description: 'Simple yes/no voting'
  },
  multiple: {
    label: 'Multiple Choice',
    icon: BarChart3,
    description: 'Multiple option voting'
  },
  weighted: {
    label: 'Weighted Voting',
    icon: Tag,
    description: 'Weighted voting system'
  }
};

export default function VotingPage() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProposalCategory | 'all'>('all');
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    durationHours: 24,
    minVotes: 100,
    proposalType: 'simple' as ProposalType,
    category: 'governance' as ProposalCategory,
  });

  // Get contract address and ABI
  const contractAddress = chain?.id ? getContractAddress(chain.id, 'VotingCore') : undefined;
  const contractABI = getContractABI('VotingCore');

  // Read proposal count
  const { data: proposalCount, refetch: refetchProposalCount } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getProposalCount',
    enabled: !!contractAddress && isConnected,
  });

  // Prepare create proposal transaction
  const { config: createProposalConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'createProposal',
    args: [newProposal.description, newProposal.durationHours, newProposal.minVotes],
    value: parseEther('0.001'), // 支付创建提案费用
    enabled: !!contractAddress && isConnected && !!newProposal.title && !!newProposal.description,
  });

  const { write: createProposal, isLoading: isCreatingProposal } = useContractWrite({
    ...createProposalConfig,
    onSuccess: (data) => {
      toast.success('Proposal created successfully!');
      
      // Add the new proposal to localStorage immediately
      const newProposalData: Proposal = {
        id: proposals.length,
        title: newProposal.title,
        description: newProposal.description,
        voteCount: 0,
        deadline: Date.now() + (newProposal.durationHours * 60 * 60 * 1000),
        executed: false,
        minVotes: newProposal.minVotes,
        hasVoted: false,
        isActive: true,
        proposalType: newProposal.proposalType,
        category: newProposal.category,
      };
      
      const updatedProposals = [...proposals, newProposalData];
      setProposals(updatedProposals);
      saveProposals(updatedProposals);
      
      // Reset form
      setNewProposal({
        title: '',
        description: '',
        durationHours: 24,
        minVotes: 100,
        proposalType: 'simple',
        category: 'governance',
      });
      
      refetchProposalCount();
      loadProposals();
    },
    onError: (error) => {
      console.error('Failed to create proposal:', error);
      toast.error('Failed to create proposal');
    },
  });

  // localStorage key for proposals
  const getProposalKey = () => {
    return `voting_proposals_${address}_${chain?.id}`;
  };

  // Load proposals from localStorage
  const loadStoredProposals = () => {
    if (!address || !chain?.id) return [];
    
    try {
      const key = getProposalKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
    }
    return [];
  };

  // Save proposals to localStorage
  const saveProposals = (proposalsToSave: Proposal[]) => {
    if (!address || !chain?.id) return;
    
    try {
      const key = getProposalKey();
      localStorage.setItem(key, JSON.stringify(proposalsToSave));
    } catch (error) {
      console.error('Error saving proposals:', error);
    }
  };

  // Load all proposal data
  function loadProposals() {
    if (!contractAddress || !proposalCount || !isConnected) return;

    setLoading(true);
    setTimeout(async () => {
      try {
        const proposalsData: Proposal[] = [];
        const count = Number(proposalCount);
        const storedProposals = loadStoredProposals();

        // First, try to load proposals from the contract
        for (let i = 0; i < count; i++) {
          try {
            // In a real implementation, you would call the contract to get proposal data
            // For now, we'll use stored data if available, otherwise create sample data
            const storedProposal = storedProposals.find((p: Proposal) => p.id === i);
            
            if (storedProposal) {
              proposalsData.push(storedProposal);
            } else {
              // Generate sample proposal if not found in storage
              const sampleProposals = [
                { category: 'governance', type: 'simple', title: 'Protocol Governance Update' },
                { category: 'finance', type: 'multiple', title: 'Treasury Fund Allocation' },
                { category: 'technical', type: 'weighted', title: 'Smart Contract Upgrade v2.0' },
                { category: 'community', type: 'simple', title: 'Community Event Proposal' },
              ];
              
              const sample = sampleProposals[i % sampleProposals.length];
              const newProposal: Proposal = {
                id: i,
                title: `${sample.title} #${i + 1}`,
                description: `This is a detailed description for ${sample.title}. This proposal aims to improve the platform through various enhancements and community-driven improvements.`,
                voteCount: Math.floor(Math.random() * 200),
                deadline: Date.now() + 86400000 * (i + 1), // Expires in 1-5 days
                executed: false,
                minVotes: 100,
                hasVoted: Math.random() > 0.5,
                isActive: true,
                proposalType: sample.type as ProposalType,
                category: sample.category as ProposalCategory,
              };
              proposalsData.push(newProposal);
            }
          } catch (error) {
            console.error(`Failed to load proposal ${i}:`, error);
          }
        }

        // If we have any stored proposals that aren't in the contract yet, add them
        const extraStoredProposals = storedProposals.filter((p: Proposal) => p.id >= count);
        proposalsData.push(...extraStoredProposals);

        // Save the updated proposals back to localStorage
        saveProposals(proposalsData);
        
        setProposals(proposalsData);
        setFilteredProposals(proposalsData);
      } catch (error) {
        console.error('Failed to load proposals:', error);
        toast.error('Failed to load proposals');
      } finally {
        setLoading(false);
      }
    }, 100);
  }

  // Filter proposals by category
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProposals(proposals);
    } else {
      setFilteredProposals(proposals.filter(p => p.category === selectedCategory));
    }
  }, [proposals, selectedCategory]);

  // Vote function
  const handleVote = async (proposalId: number) => {
    if (!isConnected || !contractAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      // This needs to call the smart contract's vote function
      // Temporarily using mock voting, should actually use useContractWrite
      setProposals(prev => prev.map(p => 
        p.id === proposalId 
          ? { ...p, voteCount: p.voteCount + 1, hasVoted: true }
          : p
      ));
      
      toast.success('Vote successful!');
    } catch (error) {
      console.error('Vote failed:', error);
      toast.error('Vote failed');
    } finally {
      setLoading(false);
    }
  };

  // Create proposal function
  const handleCreateProposal = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!newProposal.title.trim()) {
      toast.error('Please enter proposal title');
      return;
    }

    if (!newProposal.description.trim()) {
      toast.error('Please enter proposal description');
      return;
    }

    if (!createProposal) {
      toast.error('Unable to create proposal, please check network connection');
      return;
    }

    createProposal();
  };

  // Format time
  const formatTimeRemaining = (deadline: number) => {
    const now = Date.now();
    const timeLeft = deadline - now;
    
    if (timeLeft <= 0) return 'Expired';
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const isDeadlinePassed = (deadline: number) => {
    return deadline < Date.now();
  };

  // Component for rendering category badge
  const CategoryBadge = ({ category }: { category: ProposalCategory }) => {
    const config = CATEGORY_CONFIG[category];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // Component for rendering voting type badge
  const VotingTypeBadge = ({ type }: { type: ProposalType }) => {
    const config = VOTING_TYPE_CONFIG[type];
    const Icon = config.icon;
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // When component loads or proposal count changes, reload proposals
  useEffect(() => {
    if (proposalCount && contractAddress && isConnected) {
      loadProposals();
    }
  }, [proposalCount, contractAddress, isConnected]);

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
            <h1 className="text-xl font-bold text-gray-900">Decentralized Voting Governance</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Network Status */}
        <NetworkStatus />
        
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
            <XCircle className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unsupported Network</h2>
            <p className="text-gray-600 mb-6">Please switch to a supported network (Hardhat Local Network)</p>
          </div>
        ) : (
          <>
            {/* Header with Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Governance Proposals</h2>
                <p className="text-gray-600">Participate in decentralized decision making</p>
              </div>
              
              {/* Category Filter */}
              <div className="mt-4 sm:mt-0">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as ProposalCategory | 'all')}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Your Voting Information</h3>
                  <p className="text-gray-600">Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                  <p className="text-gray-600">Network: {chain?.name} (ID: {chain?.id})</p>
                  <p className="text-gray-600">Contract: {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4)}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{Number(proposalCount || 0)}</div>
                  <div className="text-gray-600">Total Proposals</div>
                </div>
              </div>
            </div>

            {/* Create New Proposal */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Create New Proposal
              </h3>
              <div className="grid grid-cols-1 gap-6">
                {/* Title and Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Proposal Title</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter proposal title..."
                      value={newProposal.title}
                      onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={newProposal.category}
                      onChange={(e) => setNewProposal({ ...newProposal, category: e.target.value as ProposalCategory })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label} - {config.description}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Proposal Description</label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter detailed proposal description..."
                    value={newProposal.description}
                    onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                  />
                </div>

                {/* Voting Type and Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Voting Type</label>
                    <select
                      value={newProposal.proposalType}
                      onChange={(e) => setNewProposal({ ...newProposal, proposalType: e.target.value as ProposalType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(VOTING_TYPE_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (hours)</label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newProposal.durationHours}
                      onChange={(e) => setNewProposal({ ...newProposal, durationHours: parseInt(e.target.value) || 24 })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Votes</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newProposal.minVotes}
                      onChange={(e) => setNewProposal({ ...newProposal, minVotes: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center text-sm text-blue-700">
                      <div className="flex-shrink-0 w-4 h-4 mr-2">💰</div>
                      <div>
                        <strong>创建费用：</strong> 0.001 ETH
                        <br />
                        <span className="text-blue-600">费用用于防止垃圾提案，支持平台运营</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleCreateProposal}
                    disabled={isCreatingProposal || !newProposal.title.trim() || !newProposal.description.trim()}
                    className="w-full"
                  >
                    {isCreatingProposal ? 'Creating...' : 'Create Proposal (0.001 ETH)'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Proposal List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedCategory === 'all' ? 'All Proposals' : `${CATEGORY_CONFIG[selectedCategory as ProposalCategory]?.label} Proposals`}
                </h3>
                <span className="text-sm text-gray-500">
                  {filteredProposals.length} proposal(s)
                </span>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading proposals...</p>
                </div>
              ) : filteredProposals.length === 0 ? (
                <div className="text-center py-8">
                  <Vote className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    {selectedCategory === 'all' ? 'No proposals yet' : `No ${CATEGORY_CONFIG[selectedCategory as ProposalCategory]?.label.toLowerCase()} proposals yet`}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {filteredProposals.map((proposal) => (
                    <div key={proposal.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <CategoryBadge category={proposal.category} />
                            <VotingTypeBadge type={proposal.proposalType} />
                          </div>
                          <h4 className="text-xl font-semibold text-gray-900 mb-2">
                            {proposal.title}
                          </h4>
                          <p className="text-gray-600 mb-4">{proposal.description}</p>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {proposal.voteCount} votes
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatTimeRemaining(proposal.deadline)}
                            </div>
                            <div className="flex items-center">
                              <Tag className="h-4 w-4 mr-1" />
                              Requires {proposal.minVotes} votes
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-6 text-right">
                          <div className="flex items-center space-x-2 mb-4">
                            {proposal.executed ? (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="h-5 w-5 mr-1" />
                                Executed
                              </div>
                            ) : isDeadlinePassed(proposal.deadline) ? (
                              <div className="flex items-center text-red-600">
                                <XCircle className="h-5 w-5 mr-1" />
                                Expired
                              </div>
                            ) : (
                              <div className="flex items-center text-blue-600">
                                <Clock className="h-5 w-5 mr-1" />
                                Active
                              </div>
                            )}
                          </div>
                          
                          <Button
                            onClick={() => handleVote(proposal.id)}
                            disabled={
                              loading || 
                              proposal.hasVoted || 
                              proposal.executed || 
                              isDeadlinePassed(proposal.deadline)
                            }
                            variant={proposal.hasVoted ? "secondary" : "default"}
                            size="sm"
                          >
                            {proposal.hasVoted ? 'Voted' : 'Vote'}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Vote Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{proposal.voteCount} / {proposal.minVotes}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all" 
                            style={{ width: `${Math.min(100, (proposal.voteCount / proposal.minVotes) * 100)}%` }}
                          ></div>
                        </div>
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