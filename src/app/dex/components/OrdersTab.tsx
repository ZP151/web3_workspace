import React from 'react';
import { Coins, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LimitOrderData, UserOrder, TokenAddresses } from '../types';

interface OrdersTabProps {
  limitOrderData: LimitOrderData;
  setLimitOrderData: React.Dispatch<React.SetStateAction<LimitOrderData>>;
  userOrders: UserOrder[];
  calculatePoolId: (tokenA: string, tokenB: string) => `0x${string}`;
  handleCreateLimitOrder: () => Promise<void>;
  handleCancelOrder: (orderId: number) => Promise<void>;
  isCreatingOrder: boolean;
  isCancellingOrder: boolean;
  refetchUserOrders: () => void;
}

export default function OrdersTab({
  limitOrderData,
  setLimitOrderData,
  userOrders,
  calculatePoolId,
  handleCreateLimitOrder,
  handleCancelOrder,
  isCreatingOrder,
  isCancellingOrder,
  refetchUserOrders,
}: OrdersTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Coins className="h-5 w-5 mr-2" />
          限价订单
        </h3>
        <Button variant="outline" size="sm" onClick={() => refetchUserOrders()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 创建限价订单 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">创建限价订单</h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">订单类型</label>
                <select
                  value={limitOrderData.orderType}
                  onChange={(e) => setLimitOrderData(prev => ({ ...prev, orderType: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>买入 (BUY)</option>
                  <option value={1}>卖出 (SELL)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">代币</label>
                <select
                  value={limitOrderData.tokenIn}
                  onChange={(e) => {
                    const tokenIn = e.target.value;
                    const tokenOut = tokenIn === 'WETH' ? 'USDC' : 'WETH';
                    const poolId = calculatePoolId(tokenIn, tokenOut);
                    setLimitOrderData(prev => ({ ...prev, tokenIn, poolId }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="WETH">WETH</option>
                  <option value="USDC">USDC</option>
                  <option value="DAI">DAI</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">数量</label>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={limitOrderData.amountIn}
                  onChange={(e) => setLimitOrderData(prev => ({ ...prev, amountIn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">价格</label>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={limitOrderData.pricePerToken}
                  onChange={(e) => setLimitOrderData(prev => ({ ...prev, pricePerToken: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">最小输出</label>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={limitOrderData.amountOutMin}
                  onChange={(e) => setLimitOrderData(prev => ({ ...prev, amountOutMin: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">过期时间 (小时)</label>
                <select
                  value={limitOrderData.expirationHours}
                  onChange={(e) => setLimitOrderData(prev => ({ ...prev, expirationHours: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">1 小时</option>
                  <option value="6">6 小时</option>
                  <option value="24">24 小时</option>
                  <option value="72">3 天</option>
                  <option value="168">7 天</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleCreateLimitOrder}
              disabled={isCreatingOrder || !limitOrderData.amountIn || !limitOrderData.pricePerToken}
              className="w-full"
            >
              {isCreatingOrder ? '创建中...' : '创建限价订单'}
            </Button>
          </div>
        </div>

        {/* 我的订单 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">我的订单</h4>
          
          <div className="space-y-3">
            {userOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Coins className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p>暂无订单</p>
              </div>
            ) : (
              userOrders.map((order, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        order.orderType === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {order.orderType === 0 ? '买入' : '卖出'}
                      </span>
                      <span className="ml-2 text-sm font-medium">
                        {order.tokenIn} → {order.tokenOut}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={isCancellingOrder}
                    >
                      取消
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>数量: {order.amountIn} {order.tokenIn}</div>
                    <div>价格: {order.pricePerToken}</div>
                    <div>状态: {order.status === 0 ? '活跃' : order.status === 1 ? '已完成' : '已取消'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 