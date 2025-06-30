import React from 'react';
import { Coins, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LimitOrderData, UserOrder } from '../types';

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
          Limit Order
        </h3>
        <Button variant="outline" size="sm" onClick={() => refetchUserOrders()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          refresh (computer window)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 创建限价订单 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Create Limit Order</h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
                <select
                  value={limitOrderData.orderType}
                  onChange={(e) => setLimitOrderData(prev => ({ ...prev, orderType: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Buy</option>
                  <option value={1}>Sell</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Token</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Output</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Time (hours)</label>
                <select
                  value={limitOrderData.expirationHours}
                  onChange={(e) => setLimitOrderData(prev => ({ ...prev, expirationHours: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">1 hour</option>
                  <option value="6">6 hours</option>
                  <option value="24">24 hours</option>
                  <option value="72">3 days</option>
                  <option value="168">7 days</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleCreateLimitOrder}
              disabled={isCreatingOrder || !limitOrderData.amountIn || !limitOrderData.pricePerToken}
              className="w-full"
            >
              {isCreatingOrder ? 'Creating...' : 'Create Limit Order'}
            </Button>
          </div>
        </div>

        {/* 我的订单 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">My Orders</h4>
          
          <div className="space-y-3">
            {userOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Coins className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p>No orders yet</p>
              </div>
            ) : (
              userOrders.map((order, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        order.orderType === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {order.orderType === 0 ? 'Buy' : 'Sell'}
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
                      Cancel
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Amount: {order.amountIn} {order.tokenIn}</div>
                    <div>Price: {order.pricePerToken}</div>
                    <div>Status: {order.status === 0 ? 'Active' : order.status === 1 ? 'Completed' : 'Cancelled'}</div>
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