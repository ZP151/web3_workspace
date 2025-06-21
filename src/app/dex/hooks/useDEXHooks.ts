import { useState, useEffect, useCallback } from 'react';
import { useContractRead, useContractWrite } from 'wagmi';
import { parseEther, formatEther, keccak256, encodePacked } from 'viem';
import { toast } from 'react-hot-toast';
import { getContractAddress, getContractABI } from '@/config/contracts';
import { getTokenAddresses, erc20ABI } from '../utils/tokenUtils';
import { SwapData, LimitOrderData, UserOrder, MiningData, LiquidityPool } from '../types';

export const useDEXContract = (chainId?: number) => {
  const contractAddress = chainId ? getContractAddress(chainId, 'DEXPlatform') : undefined;
  const contractABI = getContractABI('DEXPlatform');
  const TOKEN_ADDRESSES = chainId ? getTokenAddresses(chainId) : {};

  // 计算池ID - 使用useCallback缓存函数引用
  const calculatePoolId = useCallback((tokenA: string, tokenB: string): `0x${string}` => {
    const addrA = TOKEN_ADDRESSES[tokenA as keyof typeof TOKEN_ADDRESSES];
    const addrB = TOKEN_ADDRESSES[tokenB as keyof typeof TOKEN_ADDRESSES];
    
    if (!addrA || !addrB) return '0x0000000000000000000000000000000000000000000000000000000000000000';
    
    // 确保地址顺序一致（较小的地址在前）
    const [sortedA, sortedB] = addrA < addrB ? [addrA, addrB] : [addrB, addrA];
    
    return keccak256(encodePacked(['address', 'address'], [sortedA as `0x${string}`, sortedB as `0x${string}`]));
  }, [TOKEN_ADDRESSES]);

  return {
    contractAddress,
    contractABI,
    TOKEN_ADDRESSES,
    calculatePoolId,
  };
};

export const useSwapLogic = (
  contractAddress?: `0x${string}`,
  contractABI?: any,
  calculatePoolId?: (tokenA: string, tokenB: string) => `0x${string}`,
  TOKEN_ADDRESSES?: any
) => {
  const [swapData, setSwapData] = useState<SwapData>({
    poolId: null,
    tokenIn: 'WETH',
    tokenOut: 'USDC',
    amountIn: '',
    amountOut: '',
    slippage: 0.5,
  });

  // 更新交换数据中的池ID
  useEffect(() => {
    if (calculatePoolId && swapData.tokenIn && swapData.tokenOut && swapData.tokenIn !== swapData.tokenOut) {
      const poolId = calculatePoolId(swapData.tokenIn, swapData.tokenOut);
      // 只有当poolId真的不同时才更新
      if (poolId !== swapData.poolId) {
        setSwapData(prev => ({ ...prev, poolId }));
      }
    }
  }, [swapData.tokenIn, swapData.tokenOut, swapData.poolId, calculatePoolId]);

  // 获取交换输出金额
  const { data: swapAmountOut, refetch: refetchSwapAmount } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getAmountOut',
    args: [
      swapData.poolId || '0x0000000000000000000000000000000000000000000000000000000000000000',
      TOKEN_ADDRESSES?.[swapData.tokenIn as keyof typeof TOKEN_ADDRESSES] as `0x${string}`,
      parseEther(swapData.amountIn || '0')
    ],
    enabled: !!contractAddress && !!swapData.poolId && !!swapData.amountIn && parseFloat(swapData.amountIn) > 0,
    watch: true,
  });

  // Swap tokens
  const { writeAsync: executeSwap, isLoading: isSwapping } = useContractWrite({
    address: contractAddress,
    abi: contractABI,
    functionName: 'swapTokens',
    onSuccess: (data) => {
      toast.success(`交换成功！交易哈希: ${data.hash}`);
      setSwapData(prev => ({ ...prev, amountIn: '', amountOut: '' }));
    },
    onError: (error) => {
      console.error('交换失败:', error);
      toast.error('交换失败: ' + (error.message || '未知错误'));
    },
  });

  // 处理交换输入变化
  const handleSwapInputChange = (value: string) => {
    setSwapData(prev => ({ ...prev, amountIn: value }));
  };

  // 交换代币位置
  const handleSwapTokens = () => {
    setSwapData(prev => ({
      ...prev,
      tokenIn: prev.tokenOut,
      tokenOut: prev.tokenIn,
      amountIn: '',
      amountOut: '',
    }));
  };

  // 更新输出金额
  useEffect(() => {
    if (swapAmountOut) {
      try {
        const outputAmount = formatEther(swapAmountOut as unknown as bigint);
        // 只有当输出金额真的不同时才更新
        if (outputAmount !== swapData.amountOut) {
          setSwapData(prev => ({ ...prev, amountOut: outputAmount }));
        }
      } catch (error) {
        console.error('解析交换输出金额失败:', error);
        if (swapData.amountOut !== '0') {
          setSwapData(prev => ({ ...prev, amountOut: '0' }));
        }
      }
    } else if (swapData.amountOut !== '') {
      setSwapData(prev => ({ ...prev, amountOut: '' }));
    }
  }, [swapAmountOut, swapData.amountOut]);

  return {
    swapData,
    setSwapData,
    executeSwap,
    isSwapping,
    handleSwapInputChange,
    handleSwapTokens,
    refetchSwapAmount,
  };
};

export const useLimitOrders = (
  contractAddress?: `0x${string}`,
  contractABI?: any,
  calculatePoolId?: (tokenA: string, tokenB: string) => `0x${string}`
) => {
  const [limitOrderData, setLimitOrderData] = useState<LimitOrderData>({
    poolId: null,
    orderType: 0,
    tokenIn: 'WETH',
    amountIn: '',
    pricePerToken: '',
    amountOutMin: '',
    expirationHours: '24',
  });

  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);

  // Create limit order
  const { writeAsync: createLimitOrder, isLoading: isCreatingOrder } = useContractWrite({
    address: contractAddress,
    abi: contractABI,
    functionName: 'createLimitOrder',
    onSuccess: (data) => {
      toast.success(`限价订单创建成功！交易哈希: ${data.hash}`);
      setLimitOrderData(prev => ({ ...prev, amountIn: '', pricePerToken: '', amountOutMin: '' }));
    },
    onError: (error) => {
      console.error('创建限价订单失败:', error);
      toast.error('创建限价订单失败: ' + (error.message || '未知错误'));
    },
  });

  // Cancel order
  const { writeAsync: cancelOrder, isLoading: isCancellingOrder } = useContractWrite({
    address: contractAddress,
    abi: contractABI,
    functionName: 'cancelLimitOrder',
    onSuccess: (data) => {
      toast.success(`订单取消成功！交易哈希: ${data.hash}`);
    },
    onError: (error) => {
      console.error('取消订单失败:', error);
      toast.error('取消订单失败: ' + (error.message || '未知错误'));
    },
  });

  return {
    limitOrderData,
    setLimitOrderData,
    userOrders,
    setUserOrders,
    createLimitOrder,
    cancelOrder,
    isCreatingOrder,
    isCancellingOrder,
  };
};

export const useMining = (
  contractAddress?: `0x${string}`,
  contractABI?: any
) => {
  const [miningData, setMiningData] = useState<MiningData>({
    selectedPool: null,
    pendingRewards: '0',
    totalClaimed: '0',
    userLiquidity: '0',
  });

  // Claim rewards
  const { writeAsync: claimRewards, isLoading: isClaimingRewards } = useContractWrite({
    address: contractAddress,
    abi: contractABI,
    functionName: 'claimRewards',
    onSuccess: (data) => {
      toast.success(`奖励领取成功！交易哈希: ${data.hash}`);
    },
    onError: (error) => {
      console.error('奖励领取失败:', error);
      toast.error('奖励领取失败: ' + (error.message || '未知错误'));
    },
  });

  return {
    miningData,
    setMiningData,
    claimRewards,
    isClaimingRewards,
  };
}; 