import React from 'react';
import { Droplets, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MiningData, LiquidityPool } from '../types';

interface MiningTabProps {
  miningData: MiningData;
  setMiningData: React.Dispatch<React.SetStateAction<MiningData>>;
  liquidityPools: LiquidityPool[];
  wethUsdcPoolId: `0x${string}`;
  handleClaimRewards: () => Promise<void>;
  isClaimingRewards: boolean;
  refetchUserLiquidity: () => void;
}

export default function MiningTab({
  miningData,
  setMiningData,
  liquidityPools,
  wethUsdcPoolId,
  handleClaimRewards,
  isClaimingRewards,
  refetchUserLiquidity,
}: MiningTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Droplets className="h-5 w-5 mr-2" />
          Liquidity Mining
        </h3>
        <Button variant="outline" size="sm" onClick={() => refetchUserLiquidity()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 挖矿统计 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <h4 className="text-lg font-semibold mb-4">Mining Statistics</h4>
          <div className="space-y-3">
            <div>
              <div className="text-2xl font-bold">{miningData.pendingRewards}</div>
              <div className="text-blue-100">Pending Rewards (ETH)</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{miningData.totalClaimed}</div>
              <div className="text-blue-100">Total Claimed</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{miningData.userLiquidity}</div>
              <div className="text-blue-100">Current Liquidity</div>
            </div>
          </div>
        </div>

        {/* 流动性池选择 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Select Liquidity Pool</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Liquidity Pool</label>
              <select
                value={miningData.selectedPool || ''}
                onChange={(e) => setMiningData(prev => ({ 
                  ...prev, 
                  selectedPool: e.target.value as `0x${string}` || null 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Pool</option>
                <option value={wethUsdcPoolId}>WETH/USDC Pool</option>
              </select>
            </div>

            {liquidityPools.length > 0 && miningData.selectedPool && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pool APY:</span>
                    <span className="font-medium">{liquidityPools[0].apy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Share:</span>
                    <span>{liquidityPools[0].userLiquidity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pool Total:</span>
                    <span>{liquidityPools[0].totalSupply}</span>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleClaimRewards}
              disabled={isClaimingRewards || !miningData.selectedPool || parseFloat(miningData.pendingRewards) <= 0}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isClaimingRewards ? 'Claiming...' : 'Claim Rewards'}
            </Button>
          </div>
        </div>

        {/* 挖矿规则 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Mining Rules</h4>
          
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
              <div>
                <div className="font-medium">Liquidity Rewards</div>
                <div>Provide liquidity to earn mining rewards</div>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
              <div>
                <div className="font-medium">Dynamic APY</div>
                <div>APY is adjusted dynamically based on trading volume, up to 20%</div>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3"></div>
              <div>
                <div className="font-medium">Time Lock</div>
                <div>Liquidity must be locked for 24 hours before it can be withdrawn</div>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3"></div>
              <div>
                <div className="font-medium">Real-time Settlement</div>
                <div>Rewards are calculated in real-time, and can be claimed at any time</div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-xs text-yellow-800">
              <strong>Risk Warning:</strong> Providing liquidity carries the risk of impermanent loss, please exercise caution.
            </div>
          </div>
        </div>
      </div>

      {/* 挖矿历史 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Mining History</h4>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Time</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Action</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Pool</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Reward Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Transaction Hash</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  No mining history yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 