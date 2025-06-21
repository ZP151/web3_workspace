import React from 'react';
import { ArrowUpDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SwapData, LiquidityPool } from '../types';
import { formatEther } from 'viem';

interface SwapTabProps {
  swapData: SwapData;
  setSwapData: React.Dispatch<React.SetStateAction<SwapData>>;
  liquidityPools: LiquidityPool[];
  handleSwapInputChange: (value: string) => void;
  handleSwapTokens: () => void;
  handleSwap: () => Promise<void>;
  isSwapping: boolean;
  wethBalance?: unknown;
  usdcBalance?: unknown;
  daiBalance?: unknown;
  tokenAAllowance?: unknown;
  tokenBAllowance?: unknown;
  needsApproval: (token: 'WETH' | 'USDC' | 'DAI', amount: string) => boolean;
}

export default function SwapTab({
  swapData,
  setSwapData,
  liquidityPools,
  handleSwapInputChange,
  handleSwapTokens,
  handleSwap,
  isSwapping,
  wethBalance,
  usdcBalance,
  daiBalance,
  tokenAAllowance,
  tokenBAllowance,
  needsApproval,
}: SwapTabProps) {
  const getTokenBalance = (token: string) => {
    switch (token) {
      case 'WETH':
        return wethBalance ? formatEther(wethBalance as bigint) : '0';
      case 'USDC':
        return usdcBalance ? formatEther(usdcBalance as bigint) : '0';
      case 'DAI':
        return daiBalance ? formatEther(daiBalance as bigint) : '0';
      default:
        return '0';
    }
  };

  const getTokenAllowance = (token: string) => {
    if (token === 'WETH') {
      return tokenAAllowance ? formatEther(tokenAAllowance as bigint) : '0';
    } else {
      return tokenBAllowance ? formatEther(tokenBAllowance as bigint) : '0';
    }
  };

  return (
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
            <div className="space-y-2">
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
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  余额: {getTokenBalance(swapData.tokenIn)} {swapData.tokenIn}
                </span>
                {swapData.amountIn && needsApproval(swapData.tokenIn as 'WETH' | 'USDC' | 'DAI', swapData.amountIn) && (
                  <span className="text-orange-600">
                    需要授权 (当前授权: {getTokenAllowance(swapData.tokenIn)})
                  </span>
                )}
              </div>
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
  );
} 