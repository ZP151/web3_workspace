'use client';

import React, { useEffect } from 'react';
import { useAccount, useNetwork } from 'wagmi';
import { NETWORK_CONFIG } from '@/lib/wagmi';

interface NetworkLoggerProps {
  context?: string;
}

export default function NetworkLogger({ context = 'app' }: NetworkLoggerProps) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();

  useEffect(() => {
    if (isConnected && chain && address) {
      const networkInfo = NETWORK_CONFIG[chain.id as keyof typeof NETWORK_CONFIG];
      
      console.log(`🌐 [${context}] Network Connection Status:`, {
        chainId: chain.id,
        networkName: networkInfo?.name || chain.name || 'Unknown',
        shortName: networkInfo?.shortName || 'Unknown',
        rpcUrl: networkInfo?.rpcUrl || 'Unknown',
        address: address,
        connected: isConnected,
        timestamp: new Date().toISOString()
      });

      // 发出自定义事件，供其他组件监听
      window.dispatchEvent(new CustomEvent('networkChange', {
        detail: {
          chainId: chain.id,
          networkName: networkInfo?.name || chain.name,
          address: address,
          context: context
        }
      }));
    }
  }, [isConnected, chain, address, context]);

  // 监听网络切换错误
  useEffect(() => {
    const handleNetworkError = (error: any) => {
      console.error(`❌ [${context}] Network Error:`, {
        error: error.message || error,
        currentChain: chain?.id,
        address: address,
        timestamp: new Date().toISOString()
      });
    };

    window.addEventListener('wagmi:error', handleNetworkError);
    return () => window.removeEventListener('wagmi:error', handleNetworkError);
  }, [context, chain, address]);

  // 当网络信息不匹配时显示警告
  useEffect(() => {
    if (chain && typeof window !== 'undefined') {
      const expectedChainFromUrl = window.location.pathname.includes('ganache') ? 1337 : 31337;
      
      if (chain.id !== expectedChainFromUrl) {
        console.warn(`⚠️ [${context}] Network Mismatch:`, {
          currentChain: chain.id,
          currentNetwork: NETWORK_CONFIG[chain.id as keyof typeof NETWORK_CONFIG]?.name || 'Unknown',
          expectedChain: expectedChainFromUrl,
          expectedNetwork: NETWORK_CONFIG[expectedChainFromUrl as keyof typeof NETWORK_CONFIG]?.name || 'Unknown',
          recommendation: `Please switch to ${NETWORK_CONFIG[expectedChainFromUrl as keyof typeof NETWORK_CONFIG]?.name || 'the correct network'}`
        });
      }
    }
  }, [chain, context]);

  return null; // 这是一个日志组件，不渲染任何UI
}

// 工具函数：获取当前网络状态
export const getCurrentNetworkStatus = () => {
  return {
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'unknown'
  };
};

// 工具函数：记录交易
export const logTransaction = (
  type: string, 
  details: any, 
  context: string = 'transaction'
) => {
  console.log(`📝 [${context}] Transaction Log:`, {
    type,
    details,
    ...getCurrentNetworkStatus()
  });
}; 