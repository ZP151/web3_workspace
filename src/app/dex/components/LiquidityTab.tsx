import React from 'react';
import { Droplets, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LiquidityTabProps {
  liquidityAmount: {
    tokenA: string;
    tokenB: string;
  };
  setLiquidityAmount: React.Dispatch<React.SetStateAction<{
    tokenA: string;
    tokenB: string;
  }>>;
  handleAddLiquidity: () => Promise<void>;
  isAddingLiquidity: boolean;
}

export default function LiquidityTab({
  liquidityAmount,
  setLiquidityAmount,
  handleAddLiquidity,
  isAddingLiquidity,
}: LiquidityTabProps) {
  return (
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
  );
} 