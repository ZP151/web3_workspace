'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useNetwork, useContractRead, useContractWrite, usePrepareContractWrite, useBalance } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'react-hot-toast';
import { Coins, Plus, Loader2, ArrowLeft, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getContractAddress, getContractABI } from '@/config/contracts';

interface TokenInfo {
  id: number;
  name: string;
  symbol: string;
  initialSupply: string;
  creator: string;
  createdAt: string;
}

const SimpleTokenFactory = () => {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [isCreating, setIsCreating] = useState(false);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: 18,
    initialSupply: '1000000',
    maxSupply: '10000000'
  });

  // Get contract info
  const contractAddress = chain?.id ? getContractAddress(chain.id, 'TokenFactory') : null;
  const contractABI = getContractABI('TokenFactory');

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address: address,
    enabled: !!address && isConnected,
  });

  // Get token count
  const { data: tokenCount, refetch: refetchTokenCount } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getTokenCount',
    enabled: !!contractAddress && isConnected,
  });

  // Get creation fee
  const { data: creationFee } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'creationFee',
    enabled: !!contractAddress && isConnected,
  });

  // Prepare create token transaction
  const { config: createTokenConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'createToken',
    args: formData.name && formData.symbol ? [
      formData.name,
      formData.symbol,
      BigInt(formData.decimals),
      parseEther(formData.initialSupply),
      parseEther(formData.maxSupply)
    ] : undefined,
    value: creationFee ? BigInt(creationFee.toString()) : undefined,
    enabled: !!contractAddress && !!formData.name && !!formData.symbol && !!creationFee,
  });

  const { write: createToken, isLoading: isCreatingToken } = useContractWrite({
    ...createTokenConfig,
    onSuccess: (data) => {
      console.log('✅ Token creation transaction submitted:', data.hash);
      toast.success('Token creation transaction submitted! Waiting for confirmation...');
      setIsCreating(true);
      
      // Add the new token to local state immediately for UI feedback
      const newToken: TokenInfo = {
        id: Number(tokenCount || 0) + 1,
        name: formData.name,
        symbol: formData.symbol,
        initialSupply: formData.initialSupply,
        creator: address || '',
        createdAt: new Date().toISOString(),
      };
      
      setTokens(prev => [newToken, ...prev]);
      console.log('📄 New token added to UI:', newToken);
      
      // Reset form
      setFormData({
        name: '',
        symbol: '',
        decimals: 18,
        initialSupply: '1000000',
        maxSupply: '10000000'
      });
      
      // Simulate transaction confirmation
      setTimeout(() => {
        setIsCreating(false);
        refetchTokenCount();
        toast.success('🎉 Token created successfully!');
      }, 3000);
    },
    onError: (error) => {
      console.error('❌ Token creation failed:', error);
      toast.error('Token creation failed: ' + error.message);
      setIsCreating(false);
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error('Please connect wallet first');
      return;
    }

    if (!contractAddress) {
      toast.error('Current network not supported, please switch to a supported network');
      return;
    }

    if (!formData.name || !formData.symbol) {
      toast.error('Please enter token name and symbol');
      return;
    }

    if (!ethBalance || !creationFee) {
      toast.error('Unable to get balance or creation fee');
      return;
    }

    const fee = BigInt(creationFee.toString());
    if (ethBalance.value < fee) {
      toast.error(`Insufficient ETH balance, need ${formatEther(fee)} ETH`);
      return;
    }

    console.log('🚀 Creating token with params:', {
      name: formData.name,
      symbol: formData.symbol,
      decimals: formData.decimals,
      initialSupply: formData.initialSupply,
      maxSupply: formData.maxSupply,
      fee: formatEther(fee) + ' ETH'
    });

    createToken?.();
  };

  // Load tokens from localStorage for persistence
  useEffect(() => {
    const savedTokens = localStorage.getItem('userTokens');
    if (savedTokens) {
      try {
        const parsedTokens = JSON.parse(savedTokens);
        setTokens(parsedTokens);
        console.log('📦 Loaded tokens from localStorage:', parsedTokens);
      } catch (error) {
        console.error('Error loading saved tokens:', error);
      }
    }
  }, []);

  // Save tokens to localStorage when tokens change
  useEffect(() => {
    if (tokens.length > 0) {
      localStorage.setItem('userTokens', JSON.stringify(tokens));
      console.log('💾 Saved tokens to localStorage:', tokens);
    }
  }, [tokens]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Coins className="h-16 w-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Token Factory</h1>
          <p className="text-gray-600 mb-6">Please connect your wallet to create custom ERC-20 tokens</p>
          <Link href="/">
            <Button>Back to Home and Connect Wallet</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!contractAddress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Coins className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unsupported Network</h1>
          <p className="text-gray-600 mb-6">Please switch to Hardhat or Ganache network</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center text-purple-600 hover:text-purple-800">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Token Factory</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Network: </span>
              <span className="font-medium">{chain?.name} (ID: {chain?.id})</span>
            </div>
            <div>
              <span className="text-gray-600">Total Tokens: </span>
              <span className="font-medium">{tokenCount ? Number(tokenCount) : 0}</span>
            </div>
            <div>
              <span className="text-gray-600">Creation Fee: </span>
              <span className="font-medium">
                {creationFee ? formatEther(BigInt(creationFee.toString())) : '0'} ETH
              </span>
            </div>
          </div>
        </div>

        {/* Create Token Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Plus className="h-5 w-5 mr-2 text-purple-600" />
            Create New ERC-20 Token
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., My Awesome Token"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Symbol *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., MAT"
                  value={formData.symbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decimals
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.decimals}
                  onChange={(e) => setFormData(prev => ({ ...prev, decimals: parseInt(e.target.value) }))}
                >
                  <option value={6}>6 (USDC style)</option>
                  <option value={8}>8 (Bitcoin style)</option>
                  <option value={18}>18 (Ethereum style)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Supply *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="1000000"
                  value={formData.initialSupply}
                  onChange={(e) => setFormData(prev => ({ ...prev, initialSupply: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Supply *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="10000000"
                  value={formData.maxSupply}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxSupply: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your ETH Balance
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  {ethBalance ? formatEther(ethBalance.value) : '0'} ETH
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isCreatingToken || isCreating || !formData.name || !formData.symbol}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isCreatingToken || isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isCreating ? 'Creating...' : 'Confirming...'}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Token
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Token List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Coins className="h-5 w-5 mr-2 text-green-600" />
            Your Created Tokens ({tokens.length})
          </h2>
          
          {tokens.length === 0 ? (
            <div className="text-center py-8">
              <Coins className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No tokens created yet</p>
              <p className="text-sm text-gray-500 mt-2">Create your first token above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tokens.map((token) => (
                <div key={token.id} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{token.name}</h3>
                      <p className="text-sm text-gray-600">{token.symbol}</p>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Coins className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Supply:</span>
                      <span className="font-medium">{token.initialSupply}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {new Date(token.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-purple-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Creator:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono">
                          {token.creator.slice(0, 6)}...{token.creator.slice(-4)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(token.creator)}
                          className="p-1 hover:bg-purple-100 rounded"
                        >
                          <Copy className="h-3 w-3 text-purple-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleTokenFactory; 