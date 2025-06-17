'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useNetwork, useContractRead, useContractWrite } from 'wagmi';
import { parseEther, formatEther, keccak256, encodePacked } from 'viem';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  ArrowUpDown, 
  Droplets, 
  TrendingUp, 
  Coins, 
  BarChart3,
  Plus,
  Minus,
  RefreshCw,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getContractAddress, getContractABI } from '@/config/contracts';

interface LiquidityPool {
  id: string;
  poolId: `0x${string}`;
  tokenA: string;
  tokenB: string;
  reserveA: string;
  reserveB: string;
  totalSupply: string;
  userLiquidity: string;
  apy: string;
}

interface SwapData {
  poolId: `0x${string}` | null;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  slippage: number;
}

// 动态获取代币地址
const getTokenAddresses = (chainId: number) => {
  try {
    const addresses = require('@/contracts/addresses.json');
    const chainAddresses = addresses[chainId.toString()];
    
    if (!chainAddresses) {
      console.warn(`未找到链 ${chainId} 的代币地址配置`);
      return {};
    }
    
    return {
      WETH: chainAddresses.WETH || '',
      USDC: chainAddresses.USDC || '',
      DAI: chainAddresses.DAI || '',
    };
  } catch (error) {
    console.error('读取代币地址配置失败:', error);
    return {};
  }
};

export default function DEXPage() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [activeView, setActiveView] = useState<'swap' | 'liquidity' | 'pools' | 'analytics'>('swap');
  const [liquidityPools, setLiquidityPools] = useState<LiquidityPool[]>([]);
  const [swapData, setSwapData] = useState<SwapData>({
    poolId: null,
    tokenIn: 'WETH',
    tokenOut: 'USDC',
    amountIn: '',
    amountOut: '',
    slippage: 0.5,
  });
  const [liquidityAmount, setLiquidityAmount] = useState({
    tokenA: '',
    tokenB: '',
  });

  // Get contract address and ABI
  const contractAddress = chain?.id ? getContractAddress(chain.id, 'DEXPlatform') : undefined;
  const contractABI = getContractABI('DEXPlatform');
  
  // 获取当前链的代币地址
  const TOKEN_ADDRESSES = chain?.id ? getTokenAddresses(chain.id) : {};

  // 计算池ID
  const calculatePoolId = (tokenA: string, tokenB: string): `0x${string}` => {
    const addrA = TOKEN_ADDRESSES[tokenA as keyof typeof TOKEN_ADDRESSES];
    const addrB = TOKEN_ADDRESSES[tokenB as keyof typeof TOKEN_ADDRESSES];
    
    // 确保地址顺序一致（较小的地址在前）
    const [sortedA, sortedB] = addrA < addrB ? [addrA, addrB] : [addrB, addrA];
    
    return keccak256(encodePacked(['address', 'address'], [sortedA as `0x${string}`, sortedB as `0x${string}`]));
  };

  // 更新交换数据中的池ID
  useEffect(() => {
    if (swapData.tokenIn && swapData.tokenOut && swapData.tokenIn !== swapData.tokenOut) {
      const poolId = calculatePoolId(swapData.tokenIn, swapData.tokenOut);
      setSwapData(prev => ({ ...prev, poolId }));
    }
  }, [swapData.tokenIn, swapData.tokenOut]);

  // Read contract data - 获取所有池子
  const { data: allPoolIds, refetch: refetchPools } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getAllPools',
    enabled: !!contractAddress && isConnected,
  });

  // 获取特定池子的信息
  const wethUsdcPoolId = calculatePoolId('WETH', 'USDC');
  const { data: poolInfo, refetch: refetchPoolInfo } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getPoolInfo',
    args: [wethUsdcPoolId],
    enabled: !!contractAddress && isConnected,
  });

  // 获取用户在特定池子的流动性
  const { data: userLiquidityInfo, refetch: refetchUserLiquidity } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getUserLiquidityInfo',
    args: [wethUsdcPoolId, address],
    enabled: !!contractAddress && isConnected && !!address,
  });

  // 获取交换输出金额
  const { data: swapAmountOut, refetch: refetchSwapAmount } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getAmountOut',
    args: [
      swapData.poolId || wethUsdcPoolId,
      TOKEN_ADDRESSES[swapData.tokenIn as keyof typeof TOKEN_ADDRESSES] as `0x${string}`,
      parseEther(swapData.amountIn || '0')
    ],
    enabled: !!contractAddress && isConnected && !!swapData.poolId && !!swapData.amountIn && parseFloat(swapData.amountIn) > 0,
    watch: true, // 启用实时监听
  });

  // Swap tokens
  const { writeAsync: executeSwap, isLoading: isSwapping } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'swapTokens',
    onSuccess: (data) => {
      toast.success(`交换成功！交易哈希: ${data.hash}`);
      setSwapData(prev => ({ ...prev, amountIn: '', amountOut: '' }));
      refetchPoolInfo();
      refetchUserLiquidity();
    },
    onError: (error) => {
      console.error('交换失败:', error);
      toast.error('交换失败: ' + (error.message || '未知错误'));
    },
  });

  // Add liquidity
  const { writeAsync: addLiquidity, isLoading: isAddingLiquidity } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'addLiquidity',
    onSuccess: (data) => {
      toast.success(`流动性添加成功！交易哈希: ${data.hash}`);
      setLiquidityAmount({ tokenA: '', tokenB: '' });
      refetchPoolInfo();
      refetchUserLiquidity();
    },
    onError: (error) => {
      console.error('添加流动性失败:', error);
      toast.error('添加流动性失败: ' + (error.message || '未知错误'));
    },
  });

  // 处理池子数据
  useEffect(() => {
    if (poolInfo && userLiquidityInfo) {
      const [tokenA, tokenB, reserveA, reserveB, totalLiquidity] = poolInfo as unknown as [string, string, bigint, bigint, bigint];
      const [userLiquidity] = userLiquidityInfo as unknown as [bigint, bigint];
      
      const mockPool: LiquidityPool = {
        id: '1',
        poolId: wethUsdcPoolId,
        tokenA: 'WETH',
        tokenB: 'USDC',
        reserveA: formatEther(reserveA),
        reserveB: formatEther(reserveB),
        totalSupply: formatEther(totalLiquidity),
        userLiquidity: formatEther(userLiquidity),
        apy: '12.5', // 这个需要根据实际情况计算
      };
      
      setLiquidityPools([mockPool]);
    }
  }, [poolInfo, userLiquidityInfo, wethUsdcPoolId]);

  // 更新交换输出金额
  useEffect(() => {
    if (swapAmountOut && swapData.amountIn && parseFloat(swapData.amountIn) > 0) {
      const outputAmount = formatEther(swapAmountOut as unknown as bigint);
      setSwapData(prev => ({ ...prev, amountOut: outputAmount }));
    } else if (!swapData.amountIn || parseFloat(swapData.amountIn) <= 0) {
      // 如果输入为空，清空输出
      setSwapData(prev => ({ ...prev, amountOut: '' }));
    }
  }, [swapAmountOut, swapData.amountIn]);

  // 当输入金额变化时，重新获取输出金额
  useEffect(() => {
    console.log('🔍 自动换算触发条件检查:');
    console.log('amountIn:', swapData.amountIn);
    console.log('poolId:', swapData.poolId);
    console.log('contractAddress:', contractAddress);
    console.log('isConnected:', isConnected);
    console.log('tokenIn:', swapData.tokenIn);
    console.log('tokenOut:', swapData.tokenOut);
    
    if (swapData.amountIn && parseFloat(swapData.amountIn) > 0 && swapData.poolId && contractAddress && isConnected) {
      console.log('✅ 满足自动换算条件，延迟500ms后执行');
      // 延迟执行，避免频繁调用
      const timer = setTimeout(() => {
        console.log('📤 执行自动换算查询');
        refetchSwapAmount();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      console.log('❌ 不满足自动换算条件');
    }
  }, [swapData.amountIn, swapData.tokenIn, swapData.tokenOut, swapData.poolId, contractAddress, isConnected, refetchSwapAmount]);

  const handleSwapInputChange = (value: string) => {
    console.log('🔍 输入金额变化:', value);
    setSwapData(prev => ({
      ...prev,
      amountIn: value,
    }));
  };

  const handleSwapTokens = () => {
    setSwapData(prev => ({
      ...prev,
      tokenIn: prev.tokenOut,
      tokenOut: prev.tokenIn,
      amountIn: '',
      amountOut: '',
    }));
  };

  const handleSwap = async () => {
    console.log('🔍 开始交换流程调试...');
    console.log('isConnected:', isConnected);
    console.log('contractAddress:', contractAddress);
    console.log('swapData:', swapData);
    console.log('executeSwap function:', executeSwap);

    if (!isConnected) {
      console.log('❌ 钱包未连接');
      toast.error('请先连接钱包');
      return;
    }

    if (!swapData.amountIn || parseFloat(swapData.amountIn) <= 0) {
      console.log('❌ 交换金额无效');
      toast.error('请输入有效的交换金额');
      return;
    }

    if (!swapData.poolId) {
      console.log('❌ 池ID无效');
      toast.error('无效的交易对');
      return;
    }

    if (!executeSwap) {
      console.log('❌ executeSwap函数未定义 - 可能是网络或合约问题');
      toast.error('无法执行交换，请检查网络连接和合约状态');
      return;
    }

    console.log('✅ 所有检查通过，开始调用executeSwap函数...');
    try {
      console.log('📤 正在发送交易到MetaMask...');
      
      await executeSwap({
        args: [
          swapData.poolId,
          TOKEN_ADDRESSES[swapData.tokenIn as keyof typeof TOKEN_ADDRESSES] as `0x${string}`,
          parseEther(swapData.amountIn),
          parseEther((parseFloat(swapData.amountOut) * 0.95).toString()) // 5% slippage
        ]
      });
      
      console.log('✅ executeSwap函数调用成功');
    } catch (error) {
      console.error('❌ executeSwap函数调用失败:', error);
      toast.error('交换失败: ' + (error as Error).message);
    }
  };

  const handleAddLiquidity = async () => {
    console.log('🔍 开始添加流动性流程调试...');
    console.log('isConnected:', isConnected);
    console.log('contractAddress:', contractAddress);
    console.log('liquidityAmount:', liquidityAmount);
    console.log('addLiquidity function:', addLiquidity);

    if (!isConnected) {
      console.log('❌ 钱包未连接');
      toast.error('请先连接钱包');
      return;
    }

    if (!liquidityAmount.tokenA || !liquidityAmount.tokenB) {
      console.log('❌ 流动性金额无效');
      toast.error('请输入两种代币的金额');
      return;
    }

    if (parseFloat(liquidityAmount.tokenA) <= 0 || parseFloat(liquidityAmount.tokenB) <= 0) {
      console.log('❌ 流动性金额必须大于0');
      toast.error('金额必须大于0');
      return;
    }

    if (!addLiquidity) {
      console.log('❌ addLiquidity函数未定义 - 可能是网络或合约问题');
      toast.error('无法添加流动性，请检查网络连接和合约状态');
      return;
    }

    console.log('✅ 所有检查通过，开始调用addLiquidity函数...');
    try {
      console.log('📤 正在发送交易到MetaMask...');
      
      await addLiquidity({
        args: [
          wethUsdcPoolId,
          parseEther(liquidityAmount.tokenA),
          parseEther(liquidityAmount.tokenB),
          parseEther((parseFloat(liquidityAmount.tokenA) * 0.95).toString()), // 5% slippage
          parseEther((parseFloat(liquidityAmount.tokenB) * 0.95).toString())   // 5% slippage
        ]
      });
      
      console.log('✅ addLiquidity函数调用成功');
    } catch (error) {
      console.error('❌ addLiquidity函数调用失败:', error);
      toast.error('添加流动性失败: ' + (error as Error).message);
    }
  };

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
            <h1 className="text-xl font-bold text-gray-900">DEX Platform</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* DEX Information */}
        {isConnected && contractAddress && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your DEX Information</h3>
                <p className="text-gray-600">Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                <p className="text-gray-600">Network: {chain?.name || 'Unknown'} (ID: {chain?.id})</p>
                <p className="text-gray-600">Contract: {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4)}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">${liquidityPools.reduce((sum, pool) => sum + parseFloat(pool.userLiquidity), 0).toFixed(2)}</div>
                <div className="text-gray-600">Your Liquidity</div>
                <div className="text-sm text-gray-500 mt-1">
                  {liquidityPools.length} Active Pools
                </div>
              </div>
            </div>
          </div>
        )}

        {!isConnected ? (
          <div className="text-center py-12">
            <ArrowUpDown className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Connection Required</h2>
            <p className="text-gray-600 mb-6">Please connect your wallet to access DEX features</p>
            <Link href="/">
              <Button>Return to Home and Connect Wallet</Button>
            </Link>
          </div>
        ) : !contractAddress ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-16 w-16 text-red-400 mb-4" />
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
                    { id: 'swap', name: 'Swap', icon: ArrowUpDown },
                    { id: 'liquidity', name: 'Add Liquidity', icon: Droplets },
                    { id: 'pools', name: 'Pools', icon: BarChart3 },
                    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveView(tab.id as any)}
                      className={`${
                        activeView === tab.id
                          ? 'border-blue-500 text-blue-600'
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

            {/* Swap Tab */}
            {activeView === 'swap' && (
              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <ArrowUpDown className="h-5 w-5 mr-2" />
                    Swap Tokens
                  </h3>
                  
                  <div className="space-y-4">
                    {/* From Token */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">From</label>
                      <div className="flex space-x-2">
                        <select
                          value={swapData.tokenIn}
                          onChange={(e) => setSwapData(prev => ({ ...prev, tokenIn: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="WETH">WETH</option>
                          <option value="USDC">USDC</option>
                          <option value="DAI">DAI</option>
                        </select>
                        <input
                          type="number"
                          step="0.000001"
                          min="0"
                          className="flex-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.0"
                          value={swapData.amountIn}
                          onChange={(e) => handleSwapInputChange(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center">
                      <button
                        onClick={handleSwapTokens}
                        className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                      >
                        <ArrowUpDown className="h-5 w-5 text-blue-600" />
                      </button>
                    </div>

                    {/* To Token */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">To</label>
                      <div className="flex space-x-2">
                        <select
                          value={swapData.tokenOut}
                          onChange={(e) => setSwapData(prev => ({ ...prev, tokenOut: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="WETH">WETH</option>
                          <option value="USDC">USDC</option>
                          <option value="DAI">DAI</option>
                        </select>
                        <div className="flex-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center">
                          {swapData.amountIn && parseFloat(swapData.amountIn) > 0 && !swapData.amountOut ? (
                            <div className="flex items-center space-x-2">
                              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                              <span className="text-gray-500 text-sm">计算中...</span>
                            </div>
                          ) : (
                            <span className="w-full">{swapData.amountOut || '0.0'}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Slippage Settings */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Slippage Tolerance</label>
                      <div className="flex space-x-2">
                        {[0.1, 0.5, 1.0].map((value) => (
                          <button
                            key={value}
                            onClick={() => setSwapData(prev => ({ ...prev, slippage: value }))}
                            className={`px-3 py-1 text-sm rounded ${
                              swapData.slippage === value
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {value}%
                          </button>
                        ))}
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="50"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={swapData.slippage}
                          onChange={(e) => setSwapData(prev => ({ ...prev, slippage: parseFloat(e.target.value) || 0.5 }))}
                        />
                      </div>
                    </div>

                    {/* Swap Info */}
                    {swapData.amountIn && swapData.amountOut && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Exchange Rate:</span>
                            <span>1 {swapData.tokenIn} = {(parseFloat(swapData.amountOut) / parseFloat(swapData.amountIn)).toFixed(6)} {swapData.tokenOut}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Price Impact:</span>
                            <span className="text-orange-600">~0.1%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Max Slippage:</span>
                            <span>{swapData.slippage}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Min Received:</span>
                            <span>{(parseFloat(swapData.amountOut) * (1 - swapData.slippage / 100)).toFixed(6)} {swapData.tokenOut}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pool Status */}
                    {liquidityPools.length > 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pool Liquidity:</span>
                            <span>${((parseFloat(liquidityPools[0].reserveA) * 2000) + (parseFloat(liquidityPools[0].reserveB))).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pool Ratio:</span>
                            <span>{liquidityPools[0].tokenA}/{liquidityPools[0].tokenB}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleSwap}
                      disabled={isSwapping || !swapData.amountIn || parseFloat(swapData.amountIn) <= 0}
                      className="w-full"
                    >
                      {isSwapping ? 'Swapping...' : 'Swap Tokens'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Liquidity Tab */}
            {activeView === 'liquidity' && (
              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Droplets className="h-5 w-5 mr-2" />
                    Add Liquidity
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">ETH Amount</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.0"
                        value={liquidityAmount.tokenA}
                        onChange={(e) => setLiquidityAmount(prev => ({ ...prev, tokenA: e.target.value }))}
                      />
                    </div>

                    <div className="flex justify-center">
                      <Plus className="h-5 w-5 text-gray-400" />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">USDC Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.0"
                        value={liquidityAmount.tokenB}
                        onChange={(e) => setLiquidityAmount(prev => ({ ...prev, tokenB: e.target.value }))}
                      />
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pool Share:</span>
                          <span>~0.1%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estimated APY:</span>
                          <span className="text-green-600">12.5%</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleAddLiquidity}
                      disabled={isAddingLiquidity || !liquidityAmount.tokenA || !liquidityAmount.tokenB}
                      className="w-full"
                    >
                      {isAddingLiquidity ? 'Adding Liquidity...' : 'Add Liquidity'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Pools Tab */}
            {activeView === 'pools' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Liquidity Pools</h3>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {liquidityPools.map((pool) => (
                    <div key={pool.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex -space-x-1">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {pool.tokenA.charAt(0)}
                            </div>
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {pool.tokenB.charAt(0)}
                            </div>
                          </div>
                          <span className="font-semibold">{pool.tokenA}/{pool.tokenB}</span>
                        </div>
                        <span className="text-sm font-medium text-green-600">{pool.apy}% APY</span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Liquidity:</span>
                          <span>${(parseFloat(pool.reserveA) * 2000 + parseFloat(pool.reserveB)).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Your Liquidity:</span>
                          <span>${parseFloat(pool.userLiquidity).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pool Share:</span>
                          <span>{parseFloat(pool.userLiquidity) > 0 ? ((parseFloat(pool.userLiquidity) / parseFloat(pool.totalSupply)) * 100).toFixed(2) : '0'}%</span>
                        </div>
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <Button size="sm" className="flex-1">
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" disabled={parseFloat(pool.userLiquidity) <= 0}>
                          <Minus className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeView === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">DEX Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Value Locked</p>
                        <p className="text-2xl font-bold text-gray-900">$2.5M</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-sm text-green-600">+12.5% from last week</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">24h Volume</p>
                        <p className="text-2xl font-bold text-gray-900">$485K</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <BarChart3 className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-sm text-green-600">+8.2% from yesterday</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Pools</p>
                        <p className="text-2xl font-bold text-gray-900">{liquidityPools.length}</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-full">
                        <Droplets className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-sm text-gray-500">Active pools</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg APY</p>
                        <p className="text-2xl font-bold text-gray-900">10.6%</p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-full">
                        <TrendingUp className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-sm text-gray-500">Across all pools</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon</h4>
                  <div className="text-center py-8">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">Advanced analytics and charts will be available soon</p>
                    <p className="text-sm text-gray-500 mt-2">Including price charts, volume analysis, and more</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 