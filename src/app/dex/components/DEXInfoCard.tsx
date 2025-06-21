import React from 'react';
import { LiquidityPool } from '../types';

interface DEXInfoCardProps {
  address?: string;
  chainName?: string;
  chainId?: number;
  contractAddress?: string;
  liquidityPools: LiquidityPool[];
}

export default function DEXInfoCard({ 
  address, 
  chainName, 
  chainId, 
  contractAddress, 
  liquidityPools 
}: DEXInfoCardProps) {
  const totalLiquidity = liquidityPools.reduce((sum, pool) => sum + parseFloat(pool.userLiquidity), 0);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your DEX Information</h3>
          <p className="text-gray-600">Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
          <p className="text-gray-600">Network: {chainName || 'Unknown'} (ID: {chainId})</p>
          <p className="text-gray-600">Contract: {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4)}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">${totalLiquidity.toFixed(2)}</div>
          <div className="text-gray-600">Your Liquidity</div>
          <div className="text-sm text-gray-500 mt-1">
            {liquidityPools.length} Active Pools
          </div>
        </div>
      </div>
    </div>
  );
} 