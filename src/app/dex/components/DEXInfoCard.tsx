import React from 'react';
import { formatEther } from 'viem';

interface DEXInfoCardProps {
  contractAddress?: string;
  poolInfo?: any;
  userLiquidityInfo?: any;
  wethBalance?: any;
  usdcBalance?: any;
  daiBalance?: any;
}

export default function DEXInfoCard({ 
  contractAddress,
  poolInfo,
  userLiquidityInfo,
  wethBalance,
  usdcBalance,
  daiBalance
}: DEXInfoCardProps) {
  // 安全地计算用户流动性
  const userLiquidity = userLiquidityInfo ? 
    formatEther((userLiquidityInfo as unknown as [bigint, bigint, bigint, bigint, bigint])[0] || BigInt(0)) : '0';
  
  // 安全地获取代币余额
  const wethBalanceFormatted = wethBalance ? formatEther(wethBalance as bigint) : '0';
  const usdcBalanceFormatted = usdcBalance ? formatEther(usdcBalance as bigint) : '0';
  const daiBalanceFormatted = daiBalance ? formatEther(daiBalance as bigint) : '0';
  
  // 计算总流动性价值（示例计算）
  const totalLiquidity = parseFloat(userLiquidity) * 2000; // 假设ETH价格为$2000

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your DEX Information</h3>
          <p className="text-gray-600">Contract: {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4)}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">WETH: {parseFloat(wethBalanceFormatted).toFixed(4)}</p>
            <p className="text-sm text-gray-600">USDC: {parseFloat(usdcBalanceFormatted).toFixed(4)}</p>
            <p className="text-sm text-gray-600">DAI: {parseFloat(daiBalanceFormatted).toFixed(4)}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">${totalLiquidity.toFixed(2)}</div>
          <div className="text-gray-600">Your Liquidity</div>
          <div className="text-sm text-gray-500 mt-1">
            {parseFloat(userLiquidity).toFixed(4)} ETH Liquidity
          </div>
        </div>
      </div>
    </div>
  );
} 