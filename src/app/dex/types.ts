export interface LiquidityPool {
  id: string;
  poolId: `0x${string}`;
  tokenA: string;
  tokenB: string;
  reserveA: string;
  reserveB: string;
  totalSupply: string;
  userLiquidity: string;
  apy: string;
}

export interface SwapData {
  poolId: `0x${string}` | null;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  slippage: number;
}

export interface LimitOrderData {
  poolId: `0x${string}` | null;
  orderType: number; // 0: BUY, 1: SELL
  tokenIn: string;
  amountIn: string;
  pricePerToken: string;
  amountOutMin: string;
  expirationHours: string;
}

export interface UserOrder {
  id: number;
  orderType: number;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  pricePerToken: string;
  status: number;
  expiresAt: number;
}

export interface MiningData {
  selectedPool: `0x${string}` | null;
  pendingRewards: string;
  totalClaimed: string;
  userLiquidity: string;
} 