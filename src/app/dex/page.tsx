'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useNetwork, useContractRead, useContractWrite } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { ArrowUpDown, AlertCircle, ArrowLeft, Droplets, BarChart3, TrendingUp, Coins, RefreshCw, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 导入拆分后的组件
import DEXInfoCard from './components/DEXInfoCard';
import SwapTab from './components/SwapTab';
import LiquidityTab from './components/LiquidityTab';
import PoolsTab from './components/PoolsTab';
import AnalyticsTab from './components/AnalyticsTab';
import OrdersTab from './components/OrdersTab';
import MiningTab from './components/MiningTab';
import DEXNavigation from './components/DEXNavigation';

// 导入钩子和工具函数
import { useDEXContract, useSwapLogic, useLimitOrders, useMining } from './hooks/useDEXHooks';
import { getTokenAddresses, erc20ABI } from './utils/tokenUtils';
import { LiquidityPool } from './types';
import { getContractAddress } from '@/config/contracts';
import { SystemFeedback } from '@/components/SystemFeedback';

export default function DEXPage() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  
  // Minimal check
  const dexAddressCheck = chain?.id ? getContractAddress(chain.id, 'DEXPlatform') : null;
  const tokensCheck = chain?.id ? getTokenAddresses(chain.id) : null;
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-800 transition-colors">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home 
                </Link>
              <h1 className="text-xl font-bold text-gray-900">DEX Platform</h1>
              <div className="w-[88px]"></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 mb-8">
              <Wallet className="h-12 w-12 text-orange-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Wallet Not Connected</h2>
            <p className="text-gray-600 mb-8">You need to connect your wallet to use this module.</p>
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg">
                Return to Home and Connect Wallet
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 使用自定义钩子
  const { contractAddress, contractABI, TOKEN_ADDRESSES, calculatePoolId } = useDEXContract(chain?.id);
  const { 
    swapData, 
    setSwapData, 
    executeSwap, 
    isSwapping, 
    handleSwapInputChange, 
    handleSwapTokens,
    refetchSwapAmount 
  } = useSwapLogic(contractAddress as `0x${string}` | undefined, contractABI, calculatePoolId, TOKEN_ADDRESSES);
  
  const {
    limitOrderData,
    setLimitOrderData,
    userOrders,
    setUserOrders,
    createLimitOrder,
    cancelOrder,
    isCreatingOrder,
    isCancellingOrder,
  } = useLimitOrders(contractAddress as `0x${string}` | undefined, contractABI, calculatePoolId);

  const {
    miningData,
    setMiningData,
    claimRewards,
    isClaimingRewards,
  } = useMining(contractAddress as `0x${string}` | undefined, contractABI);

  // 页面状态
  const [activeView, setActiveView] = useState<'swap' | 'liquidity' | 'pools' | 'analytics' | 'orders' | 'mining'>('swap');
  const [liquidityPools, setLiquidityPools] = useState<LiquidityPool[]>([]);
  const [liquidityAmount, setLiquidityAmount] = useState({
    tokenA: '',
    tokenB: '',
  });

  // 合约读取操作 - 使用useMemo缓存计算结果
  const wethUsdcPoolId = useMemo(() => {
    return calculatePoolId('WETH', 'USDC');
  }, [calculatePoolId]);
  
  // 获取所有池子
  const { data: allPoolIds, refetch: refetchPools } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getAllPools',
    enabled: !!contractAddress && isConnected,
  });

  // 获取特定池子的信息
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

  // 获取用户订单
  const { data: getUserOrdersData, refetch: refetchUserOrders } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getUserOrders',
    args: [address],
    enabled: !!contractAddress && isConnected && !!address,
  });

  // 获取代币余额
  const { data: wethBalance } = useContractRead({
    address: TOKEN_ADDRESSES.WETH as `0x${string}`,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    enabled: !!address && !!TOKEN_ADDRESSES.WETH,
  });

  const { data: usdcBalance } = useContractRead({
    address: TOKEN_ADDRESSES.USDC as `0x${string}`,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    enabled: !!address && !!TOKEN_ADDRESSES.USDC,
  });

  const { data: daiBalance } = useContractRead({
    address: TOKEN_ADDRESSES.DAI as `0x${string}`,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    enabled: !!address && !!TOKEN_ADDRESSES.DAI,
  });

  // 获取代币授权
  const { data: tokenAAllowance } = useContractRead({
    address: TOKEN_ADDRESSES.WETH as `0x${string}`,
    abi: erc20ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, contractAddress as `0x${string}`],
    enabled: !!address && !!contractAddress && !!TOKEN_ADDRESSES.WETH,
  });

  const { data: tokenBAllowance } = useContractRead({
    address: TOKEN_ADDRESSES.USDC as `0x${string}`,
    abi: erc20ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, contractAddress as `0x${string}`],
    enabled: !!address && !!contractAddress && !!TOKEN_ADDRESSES.USDC,
  });

  // 添加流动性
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

  // 处理函数
  const handleSwap = async () => {
    if (!contractAddress || !swapData.poolId) return;
    
    try {
      const tokenInAddress = TOKEN_ADDRESSES[swapData.tokenIn as keyof typeof TOKEN_ADDRESSES] as `0x${string}`;
      const tokenOutAddress = TOKEN_ADDRESSES[swapData.tokenOut as keyof typeof TOKEN_ADDRESSES] as `0x${string}`;
      const amountInWei = parseEther(swapData.amountIn);
      const minAmountOut = parseEther((parseFloat(swapData.amountOut) * (1 - swapData.slippage / 100)).toString());

      await executeSwap({
        args: [swapData.poolId, tokenInAddress, tokenOutAddress, amountInWei, minAmountOut],
      });
    } catch (error) {
      console.error('执行交换失败:', error);
    }
  };

  const handleAddLiquidity = async () => {
    if (!contractAddress) return;
    
    try {
      const tokenAAddress = TOKEN_ADDRESSES.WETH as `0x${string}`;
      const tokenBAddress = TOKEN_ADDRESSES.USDC as `0x${string}`;
      const amountAWei = parseEther(liquidityAmount.tokenA);
      const amountBWei = parseEther(liquidityAmount.tokenB);

      await addLiquidity({
        args: [tokenAAddress, tokenBAddress, amountAWei, amountBWei, 0, 0],
        value: amountAWei,
      });
    } catch (error) {
      console.error('执行添加流动性失败:', error);
    }
  };

  const handleCreateLimitOrder = async () => {
    if (!contractAddress || !limitOrderData.poolId) return;
    
    try {
      const tokenInAddress = TOKEN_ADDRESSES[limitOrderData.tokenIn as keyof typeof TOKEN_ADDRESSES] as `0x${string}`;
      const amountInWei = parseEther(limitOrderData.amountIn);
      const priceWei = parseEther(limitOrderData.pricePerToken);
      const minAmountOutWei = parseEther(limitOrderData.amountOutMin);
      const expirationTime = Math.floor(Date.now() / 1000) + (parseInt(limitOrderData.expirationHours) * 3600);

      await createLimitOrder({
        args: [
          limitOrderData.poolId,
          limitOrderData.orderType,
          tokenInAddress,
          amountInWei,
          priceWei,
          minAmountOutWei,
          expirationTime
        ],
      });
    } catch (error) {
      console.error('执行创建限价订单失败:', error);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!contractAddress) return;
    
    try {
      await cancelOrder({
        args: [BigInt(orderId)],
      });
    } catch (error) {
      console.error('执行取消订单失败:', error);
    }
  };

  const handleClaimRewards = async () => {
    if (!contractAddress || !miningData.selectedPool) return;
    
    try {
      await claimRewards({
        args: [miningData.selectedPool],
      });
    } catch (error) {
      console.error('执行领取奖励失败:', error);
    }
  };

  // 检查是否需要授权
  const needsApproval = (token: 'WETH' | 'USDC' | 'DAI', amount: string) => {
    if (!amount || parseFloat(amount) <= 0) return false;
    
    try {
      const requiredAmount = parseEther(amount);
      const allowance = token === 'WETH' ? tokenAAllowance : tokenBAllowance;
      
      if (!allowance) return true;
      return (allowance as unknown as bigint) < requiredAmount;
    } catch (error) {
      console.error('检查授权时出错:', error);
      return true;
    }
  };

  // 初始化池子数据
  useEffect(() => {
    if (poolInfo) {
      // poolInfo是PoolInfo结构体，包含完整的池信息
      const poolData = poolInfo as unknown as {
        poolId: string;
        tokenA: string;
        tokenB: string;
        reserveA: bigint;
        reserveB: bigint;
        totalLiquidity: bigint;
        apy: bigint;
        dailyVolume: bigint;
        totalFees: bigint;
      };

      const mockPool: LiquidityPool = {
        id: '1',
        poolId: wethUsdcPoolId,
        tokenA: 'WETH',
        tokenB: 'USDC',
        reserveA: formatEther(poolData.reserveA),
        reserveB: formatEther(poolData.reserveB),
        totalSupply: formatEther(poolData.totalLiquidity),
        userLiquidity: userLiquidityInfo ? formatEther((userLiquidityInfo as unknown as [bigint, bigint, bigint, bigint, bigint])[0]) : '0',
        apy: (Number(poolData.apy) / 100).toString(), // Convert from basis points to percentage
      };
      setLiquidityPools([mockPool]);
    }
  }, [poolInfo, userLiquidityInfo]);

  // 初始化用户订单数据
  useEffect(() => {
    if (getUserOrdersData) {
      console.log('User orders from contract:', getUserOrdersData);
      return; // 如果有真实数据，使用真实数据
    }
    
    // 只在初始化时设置模拟数据，避免无限循环
    if (userOrders.length === 0) {
      const now = Date.now();
      const mockOrders = [
        {
          id: 1,
          orderType: 0,
          tokenIn: 'WETH',
          tokenOut: 'USDC',
          amountIn: '1.5',
          pricePerToken: '2200',
          status: 0,
          expiresAt: now + 86400000,
        },
        {
          id: 2,
          orderType: 1,
          tokenIn: 'USDC',
          tokenOut: 'WETH',
          amountIn: '3000',
          pricePerToken: '0.00045',
          status: 0,
          expiresAt: now + 172800000,
        }
      ];
      
      setUserOrders(mockOrders);
    }
  }, [getUserOrdersData, userOrders.length]);

  // 初始化挖矿数据
  useEffect(() => {
    if (userLiquidityInfo) {
      const [userLiquidity, pendingRewards] = userLiquidityInfo as unknown as [bigint, bigint];
      setMiningData(prev => ({
        ...prev,
        userLiquidity: formatEther(userLiquidity),
        pendingRewards: formatEther(pendingRewards),
        totalClaimed: '15.75',
        selectedPool: prev.selectedPool || wethUsdcPoolId,
      }));
    } else if (!miningData.selectedPool) {
      // 只在没有selectedPool时才设置默认值，避免无限循环
      setMiningData(prev => ({
        ...prev,
        pendingRewards: '2.45',
        totalClaimed: '15.75',
        userLiquidity: '25.75',
        selectedPool: wethUsdcPoolId,
      }));
    }
  }, [userLiquidityInfo, wethUsdcPoolId, miningData.selectedPool]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-xl font-bold text-gray-900">DEX Platform</h1>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-500">
                Auto-refresh: 30s
              </div>
              <button
                onClick={() => {
                  refetchPools();
                  refetchPoolInfo();
                  refetchUserLiquidity();
                  refetchUserOrders();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors duration-200"
                title="Refresh data"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* DEX Information Card */}
        <DEXInfoCard
          contractAddress={contractAddress}
          poolInfo={poolInfo}
          userLiquidityInfo={userLiquidityInfo}
          wethBalance={wethBalance}
          usdcBalance={usdcBalance}
          daiBalance={daiBalance}
        />

        {/* Navigation Tabs */}
        <DEXNavigation
          activeView={activeView}
          setActiveView={setActiveView}
        />

        {/* Main Content */}
        <div className="mt-6">
          {activeView === 'swap' && (
            <SwapTab
              swapData={swapData}
              setSwapData={setSwapData}
              liquidityPools={liquidityPools}
              handleSwap={handleSwap}
              isSwapping={isSwapping}
              handleSwapInputChange={handleSwapInputChange}
              handleSwapTokens={handleSwapTokens}
              wethBalance={wethBalance}
              usdcBalance={usdcBalance}
              daiBalance={daiBalance}
              tokenAAllowance={tokenAAllowance}
              tokenBAllowance={tokenBAllowance}
              needsApproval={needsApproval}
            />
          )}
          {activeView === 'liquidity' && (
            <LiquidityTab
              liquidityAmount={liquidityAmount}
              setLiquidityAmount={setLiquidityAmount}
              handleAddLiquidity={handleAddLiquidity}
              isAddingLiquidity={isAddingLiquidity}
              poolInfo={poolInfo}
              userLiquidityInfo={userLiquidityInfo}
            />
          )}
          {activeView === 'pools' && (
            <PoolsTab
              liquidityPools={liquidityPools}
              allPoolIds={allPoolIds}
              refetchPools={refetchPools}
            />
          )}
          {activeView === 'analytics' && (
            <AnalyticsTab
              poolInfo={poolInfo}
              userLiquidityInfo={userLiquidityInfo}
              allPoolIds={allPoolIds}
            />
          )}
          {activeView === 'orders' && (
            <OrdersTab
              limitOrderData={limitOrderData}
              setLimitOrderData={setLimitOrderData}
              userOrders={userOrders}
              handleCreateLimitOrder={handleCreateLimitOrder}
              handleCancelOrder={handleCancelOrder}
              isCreatingOrder={isCreatingOrder}
              isCancellingOrder={isCancellingOrder}
            />
          )}
          {activeView === 'mining' && (
            <MiningTab
              miningData={miningData}
              setMiningData={setMiningData}
              liquidityPools={liquidityPools}
              wethUsdcPoolId={wethUsdcPoolId}
              handleClaimRewards={handleClaimRewards}
              isClaimingRewards={isClaimingRewards}
              refetchUserLiquidity={refetchUserLiquidity}
            />
          )}
        </div>
      </div>
    </div>
  );
} 