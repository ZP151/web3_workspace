import React from 'react';
import { RefreshCw, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiquidityPool } from '../types';

interface PoolsTabProps {
  liquidityPools: LiquidityPool[];
}

export default function PoolsTab({ liquidityPools }: PoolsTabProps) {
  return (
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
  );
} 