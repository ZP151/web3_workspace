'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useNetwork, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Coins, Eye, ExternalLink, Copy, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getContractAddress, getContractABI } from '@/config/contracts';

interface CreatedToken {
  id: number;
  name: string;
  symbol: string;
  totalSupply: string;
  address: string;
  creator: string;
  timestamp: string;
  txHash: string;
  decimals: number;
}

interface TokenForm {
  name: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
  description: string;
  website: string;
  maxSupply: string;
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
  initialDistribution: {
    owner: string;
    team: string;
    public: string;
    liquidity: string;
  };
}

export default function TokenFactoryPage() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [loading, setLoading] = useState(false);
  const [createdTokens, setCreatedTokens] = useState<CreatedToken[]>([]);
  const [newToken, setNewToken] = useState<TokenForm>({
    name: '',
    symbol: '',
    totalSupply: '1000000',
    decimals: 18,
    description: '',
    website: '',
    maxSupply: '10000000',
    mintable: false,
    burnable: false,
    pausable: false,
    initialDistribution: {
      owner: '50',
      team: '20',
      public: '20',
      liquidity: '10',
    },
  });
  const [activeView, setActiveView] = useState<'create' | 'manage' | 'explore'>('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'supply'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'my-tokens' | 'mintable' | 'burnable'>('all');

  // Get contract address and ABI
  const contractAddress = chain?.id ? getContractAddress(chain.id, 'TokenFactory') : undefined;
  const contractABI = getContractABI('TokenFactory');

  // Read creation fee
  const { data: creationFee } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'creationFee',
    enabled: !!contractAddress && isConnected,
  });

  // Read token count
  const { data: tokenCount, refetch: refetchTokenCount } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getTokenCount',
    enabled: !!contractAddress && isConnected,
  });

  // Prepare create token transaction
  const { config: createTokenConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'createToken',
    args: [
      newToken.name, 
      newToken.symbol, 
      newToken.decimals, 
      parseEther(newToken.totalSupply), 
      parseEther(newToken.totalSupply) // maxSupply = initialSupply for simplicity
    ],
    value: creationFee && typeof creationFee === 'bigint' ? creationFee : BigInt(0),
    enabled: !!contractAddress && isConnected && !!newToken.name && !!newToken.symbol && creationFee !== undefined,
  });

  const { write: createToken, isLoading: isCreatingToken } = useContractWrite({
    ...createTokenConfig,
    onSuccess: (data) => {
      toast.success('Token created successfully!');
      
      // Add the new token to localStorage immediately
      const newTokenData: CreatedToken = {
        id: createdTokens.length,
        name: newToken.name,
        symbol: newToken.symbol,
        totalSupply: newToken.totalSupply,
        address: `0x${Math.random().toString(16).substr(2, 40)}`, // Mock address for now
        creator: address || '',
        timestamp: new Date().toISOString(),
        txHash: data.hash,
        decimals: newToken.decimals,
      };
      
      const updatedTokens = [...createdTokens, newTokenData];
      setCreatedTokens(updatedTokens);
      saveTokens(updatedTokens);
      
      // Reset form
      setNewToken({
        name: '',
        symbol: '',
        totalSupply: '1000000',
        decimals: 18,
        description: '',
        website: '',
        maxSupply: '10000000',
        mintable: false,
        burnable: false,
        pausable: false,
        initialDistribution: {
          owner: '50',
          team: '20',
          public: '20',
          liquidity: '10',
        },
      });
      
      refetchTokenCount();
      setActiveView('manage');
    },
    onError: (error) => {
      console.error('Failed to create token:', error);
      toast.error('Failed to create token');
    },
  });

  // localStorage functions
  const getTokenKey = () => {
    return `created_tokens_${address}_${chain?.id}`;
  };

  const loadStoredTokens = () => {
    if (!address || !chain?.id) return [];
    
    try {
      const key = getTokenKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
    return [];
  };

  const saveTokens = (tokensToSave: CreatedToken[]) => {
    if (!address || !chain?.id) return;
    
    try {
      const key = getTokenKey();
      localStorage.setItem(key, JSON.stringify(tokensToSave));
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  };

  // Load tokens when component mounts
  useEffect(() => {
    if (isConnected && address && chain?.id) {
      const tokens = loadStoredTokens();
      setCreatedTokens(tokens);
    }
  }, [isConnected, address, chain?.id]);

  // Create token function
  const handleCreateToken = async () => {
    console.log('🔍 开始创建代币流程调试...');
    console.log('isConnected:', isConnected);
    console.log('contractAddress:', contractAddress);
    console.log('newToken:', newToken);
    console.log('creationFee:', creationFee);
    console.log('createToken function:', createToken);
    console.log('createTokenConfig:', createTokenConfig);

    if (!isConnected) {
      console.log('❌ 钱包未连接');
      toast.error('Please connect your wallet first');
      return;
    }

    if (!newToken.name.trim()) {
      console.log('❌ 代币名称为空');
      toast.error('Please enter token name');
      return;
    }

    if (!newToken.symbol.trim()) {
      console.log('❌ 代币符号为空');
      toast.error('Please enter token symbol');
      return;
    }

    if (!newToken.totalSupply || parseFloat(newToken.totalSupply) <= 0) {
      console.log('❌ 总供应量无效');
      toast.error('Please enter valid total supply');
      return;
    }

    if (!createToken) {
      console.log('❌ createToken函数未定义 - 这是主要问题!');
      console.log('contractAddress:', contractAddress);
      console.log('createTokenConfig:', createTokenConfig || 'undefined');
      toast.error('Unable to create token, please check network connection');
      return;
    }

    console.log('✅ 所有检查通过，开始调用createToken函数...');
    try {
      console.log('📤 正在发送交易到MetaMask...');
      createToken();
      console.log('✅ createToken函数调用成功');
    } catch (error) {
      console.error('❌ createToken函数调用失败:', error);
      toast.error('Failed to send create token transaction');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatSupply = (supply: string) => {
    const num = parseFloat(supply);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center text-purple-600 hover:text-purple-800">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Token Factory</h1>
            <div className="text-sm text-gray-500">
              {creationFee && typeof creationFee === 'bigint' && `Fee: ${formatEther(creationFee)} ETH`}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Token Factory Information */}
        {isConnected && contractAddress && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Token Factory Information</h3>
                <p className="text-gray-600">Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                <p className="text-gray-600">Network: {chain?.name || 'Unknown'} (ID: {chain?.id})</p>
                <p className="text-gray-600">Contract: {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4)}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">{Number(tokenCount || 0)}</div>
                <div className="text-gray-600">Total Tokens</div>
                <div className="text-sm text-gray-500 mt-1">
                  Creation Fee: {creationFee && typeof creationFee === 'bigint' ? formatEther(creationFee) : '0'} ETH
                </div>
              </div>
            </div>
          </div>
        )}

        {!isConnected ? (
          <div className="text-center py-12">
            <Coins className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Connection Required</h2>
            <p className="text-gray-600 mb-6">Please connect your wallet to access the token factory</p>
            <Link href="/">
              <Button>Return to Home and Connect Wallet</Button>
            </Link>
          </div>
        ) : !contractAddress ? (
          <div className="text-center py-12">
            <Coins className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unsupported Network</h2>
            <p className="text-gray-600 mb-6">Please switch to a supported network</p>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  {[
                    { id: 'create', name: 'Create Token', icon: Plus },
                    { id: 'manage', name: 'My Tokens', icon: Coins },
                    { id: 'explore', name: 'Explore', icon: TrendingUp },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveView(tab.id as any)}
                      className={`${
                        activeView === tab.id
                          ? 'border-purple-500 text-purple-600'
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

            {/* Create Token Tab */}
            {activeView === 'create' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Token</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 基本信息 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Token Name *</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g. My Awesome Token"
                          value={newToken.name}
                          onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Token Symbol *</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g. MAT"
                          value={newToken.symbol}
                          onChange={(e) => setNewToken({ ...newToken, symbol: e.target.value.toUpperCase() })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Supply *</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="1000000"
                          value={newToken.totalSupply}
                          onChange={(e) => setNewToken({ ...newToken, totalSupply: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Supply</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="10000000"
                          value={newToken.maxSupply}
                          onChange={(e) => setNewToken({ ...newToken, maxSupply: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Decimals</label>
                        <select
                          value={newToken.decimals}
                          onChange={(e) => setNewToken({ ...newToken, decimals: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value={18}>18 (Standard)</option>
                          <option value={6}>6 (USDC Style)</option>
                          <option value={8}>8 (Bitcoin Style)</option>
                          <option value={0}>0 (No Decimals)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                        <input
                          type="url"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="https://example.com"
                          value={newToken.website}
                          onChange={(e) => setNewToken({ ...newToken, website: e.target.value })}
                        />
                      </div>
                      
                      {/* 描述信息 */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Describe your token's purpose and utility..."
                          value={newToken.description}
                          onChange={(e) => setNewToken({ ...newToken, description: e.target.value })}
                        />
                      </div>
                      
                      {/* Token特性 */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Token Features</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="mintable"
                              checked={newToken.mintable}
                              onChange={(e) => setNewToken({ ...newToken, mintable: e.target.checked })}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <label htmlFor="mintable" className="ml-2 text-sm text-gray-700">
                              Mintable
                            </label>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="burnable"
                              checked={newToken.burnable}
                              onChange={(e) => setNewToken({ ...newToken, burnable: e.target.checked })}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <label htmlFor="burnable" className="ml-2 text-sm text-gray-700">
                              Burnable
                            </label>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="pausable"
                              checked={newToken.pausable}
                              onChange={(e) => setNewToken({ ...newToken, pausable: e.target.checked })}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <label htmlFor="pausable" className="ml-2 text-sm text-gray-700">
                              Pausable
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      {/* 初始分配 */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Initial Distribution (%)</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Owner</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                              value={newToken.initialDistribution.owner}
                              onChange={(e) => setNewToken({ 
                                ...newToken, 
                                initialDistribution: { 
                                  ...newToken.initialDistribution, 
                                  owner: e.target.value 
                                }
                              })}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Team</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                              value={newToken.initialDistribution.team}
                              onChange={(e) => setNewToken({ 
                                ...newToken, 
                                initialDistribution: { 
                                  ...newToken.initialDistribution, 
                                  team: e.target.value 
                                }
                              })}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Public</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                              value={newToken.initialDistribution.public}
                              onChange={(e) => setNewToken({ 
                                ...newToken, 
                                initialDistribution: { 
                                  ...newToken.initialDistribution, 
                                  public: e.target.value 
                                }
                              })}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Liquidity</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                              value={newToken.initialDistribution.liquidity}
                              onChange={(e) => setNewToken({ 
                                ...newToken, 
                                initialDistribution: { 
                                  ...newToken.initialDistribution, 
                                  liquidity: e.target.value 
                                }
                              })}
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Total: {
                            Object.values(newToken.initialDistribution)
                              .reduce((sum, val) => sum + parseFloat(val || '0'), 0)
                          }% (should equal 100%)
                        </div>
                      </div>
                    </div>

                    {creationFee && (
                      <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center text-sm text-purple-700">
                          <div className="flex-shrink-0 w-4 h-4 mr-2">💰</div>
                          <div>
                            <strong>Creation Fee:</strong> {creationFee && typeof creationFee === 'bigint' ? formatEther(creationFee) : '0'} ETH
                            <br />
                            <span className="text-purple-600">This fee supports the platform and prevents spam</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleCreateToken}
                      disabled={isCreatingToken || !newToken.name.trim() || !newToken.symbol.trim()}
                      className="w-full mt-6"
                    >
                      {isCreatingToken ? 'Creating...' : `Create Token ${creationFee && typeof creationFee === 'bigint' ? `(${formatEther(creationFee)} ETH)` : ''}`}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* My Tokens Tab */}
            {activeView === 'manage' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    My Created Tokens ({createdTokens.length})
                  </h3>
                  
                  {createdTokens.length === 0 ? (
                    <div className="text-center py-8">
                      <Coins className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600">No tokens created yet</p>
                      <Button 
                        onClick={() => setActiveView('create')}
                        className="mt-4"
                      >
                        Create Your First Token
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {createdTokens.map((token) => (
                        <div key={token.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">{token.name}</h4>
                              <p className="text-sm text-gray-600">{token.symbol}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {formatSupply(token.totalSupply)}
                              </p>
                              <p className="text-xs text-gray-500">{token.decimals} decimals</p>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">Contract Address:</p>
                            <div className="flex items-center justify-between bg-white rounded px-2 py-1">
                              <span className="text-xs font-mono text-gray-700">
                                {token.address.slice(0, 8)}...{token.address.slice(-6)}
                              </span>
                              <button
                                onClick={() => copyToClipboard(token.address)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Copy className="h-3 w-3 text-gray-500" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                toast.success(
                                  <div className="space-y-2">
                                    <div className="font-semibold">{token.name} ({token.symbol})</div>
                                    <div className="text-sm space-y-1">
                                      <div>Total Supply: {formatSupply(token.totalSupply)}</div>
                                      <div>Decimals: {token.decimals}</div>
                                      <div>Creator: {token.creator.slice(0, 6)}...{token.creator.slice(-4)}</div>
                                      <div>Transaction Hash: {token.txHash.slice(0, 10)}...</div>
                                    </div>
                                  </div>,
                                  { duration: 5000 }
                                );
                              }}
                              className="flex-1"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`https://etherscan.io/address/${token.address}`, '_blank')}
                              className="flex-1"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Explorer
                            </Button>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                              Created at: {new Date(token.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Explore Tab */}
            {activeView === 'explore' && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-4">
                      <input
                        type="text"
                        placeholder="Search by token name or symbol..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value as any)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="all">All Tokens</option>
                        <option value="my-tokens">My Tokens</option>
                        <option value="mintable">Mintable</option>
                        <option value="burnable">Burnable</option>
                      </select>
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="name">By Name</option>
                      <option value="supply">By Supply</option>
                    </select>
                  </div>
                </div>

                {/* Token Grid */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Explore Tokens ({createdTokens.length} tokens)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {createdTokens
                      .filter(token => {
                        if (searchQuery) {
                          return token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 token.symbol.toLowerCase().includes(searchQuery.toLowerCase());
                        }
                        return true;
                      })
                      .filter(token => {
                        if (filterBy === 'my-tokens') {
                          return token.creator.toLowerCase() === address?.toLowerCase();
                        }
                        return true;
                      })
                      .sort((a, b) => {
                        switch (sortBy) {
                          case 'newest':
                            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                          case 'oldest':
                            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                          case 'name':
                            return a.name.localeCompare(b.name);
                          case 'supply':
                            return parseFloat(b.totalSupply) - parseFloat(a.totalSupply);
                          default:
                            return 0;
                        }
                      })
                      .map((token) => (
                        <div key={token.id} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-bold text-lg text-gray-900">{token.name}</h4>
                              <p className="text-purple-600 font-medium">{token.symbol}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">
                                {formatSupply(token.totalSupply)}
                              </p>
                              <p className="text-xs text-gray-500">Total Supply</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Decimals:</span>
                              <span className="font-medium">{token.decimals}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Creator:</span>
                              <span className="font-mono text-xs">
                                {token.creator.slice(0, 6)}...{token.creator.slice(-4)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Created at:</span>
                              <span className="text-xs">
                                {new Date(token.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(token.address)}
                                className="flex-1"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Address
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`https://etherscan.io/address/${token.address}`, '_blank')}
                                className="flex-1"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Explorer
                              </Button>
                            </div>
                            
                            {token.creator.toLowerCase() === address?.toLowerCase() && (
                              <div className="pt-2 border-t border-purple-200">
                                <p className="text-xs text-purple-600 font-medium">You are the creator of this token</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  {createdTokens.length === 0 && (
                    <div className="text-center py-12">
                      <Coins className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No tokens yet</h3>
                      <p className="text-gray-600 mb-6">Be the first to create a token</p>
                      <Button 
                        onClick={() => setActiveView('create')}
                      >
                        Create Token
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 