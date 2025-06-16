'use client';

import React from 'react';
import { useAccount, useNetwork } from 'wagmi';

export default function SimpleNetworkIndicator() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();

  if (!isConnected || !chain) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 rounded-lg px-3 py-2 text-sm text-red-700">
        ❌ 未连接钱包
      </div>
    );
  }

  const getNetworkInfo = () => {
    switch (chain.id) {
      case 31337:
        return {
          name: 'Hardhat本地网络',
          color: 'bg-yellow-100 border-yellow-300 text-yellow-700',
          icon: '🔨'
        };
      case 1337:
        return {
          name: 'Ganache本地网络',
          color: 'bg-orange-100 border-orange-300 text-orange-700',
          icon: '🟤'
        };
      case 1:
        return {
          name: 'Ethereum主网',
          color: 'bg-blue-100 border-blue-300 text-blue-700',
          icon: '💎'
        };
      case 11155111:
        return {
          name: 'Sepolia测试网',
          color: 'bg-purple-100 border-purple-300 text-purple-700',
          icon: '🧪'
        };
      default:
        return {
          name: `网络 ${chain.id}`,
          color: 'bg-gray-100 border-gray-300 text-gray-700',
          icon: '🌐'
        };
    }
  };

  const networkInfo = getNetworkInfo();

  return (
    <div className={`fixed bottom-4 right-4 border rounded-lg px-3 py-2 text-sm ${networkInfo.color} max-w-xs`}>
      <div className="flex items-center space-x-2">
        <span>{networkInfo.icon}</span>
        <div>
          <div className="font-medium">{networkInfo.name}</div>
          <div className="text-xs opacity-75">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        </div>
      </div>
    </div>
  );
}

// 工具函数：获取网络名称
export const getNetworkName = (chainId: number): string => {
  switch (chainId) {
    case 31337: return 'Hardhat本地网络';
    case 1337: return 'Ganache本地网络';
    case 1: return 'Ethereum主网';
    case 11155111: return 'Sepolia测试网';
    default: return `网络 ${chainId}`;
  }
};

// 工具函数：检查是否为本地网络
export const isLocalNetwork = (chainId: number): boolean => {
  return chainId === 31337 || chainId === 1337;
}; 