export interface TokenAddresses {
  WETH?: string;
  USDC?: string;
  DAI?: string;
}

// 动态获取代币地址
export const getTokenAddresses = (chainId: number): TokenAddresses => {
  try {
    const addresses = require('@/contracts/addresses.json');
    const chainAddresses = addresses[chainId.toString()];
    
    if (!chainAddresses) {
      console.warn(`未找到链 ${chainId} 的代币地址配置`);
      return {};
    }
    
    return {
      WETH: chainAddresses.WETH || '',
      USDC: chainAddresses.USDC || '',
      DAI: chainAddresses.DAI || '',
    };
  } catch (error) {
    console.error('读取代币地址配置失败:', error);
    return {};
  }
};

// ERC20 ABI
export const erc20ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' },
      { name: 'spender', type: 'address', internalType: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

// 格式化代币数量显示
export const formatTokenAmount = (amount: string | bigint, decimals: number = 18): string => {
  try {
    const value = typeof amount === 'string' ? parseFloat(amount) : parseFloat(amount.toString());
    if (value === 0) return '0';
    
    if (value < 0.000001) {
      return value.toExponential(2);
    } else if (value < 1) {
      return value.toFixed(6);
    } else if (value < 1000) {
      return value.toFixed(4);
    } else if (value < 1000000) {
      return value.toFixed(2);
    } else {
      return (value / 1000000).toFixed(2) + 'M';
    }
  } catch (error) {
    console.error('格式化代币数量失败:', error);
    return '0';
  }
};

// 代币符号映射
export const TOKEN_SYMBOLS: Record<string, string> = {
  WETH: 'WETH',
  USDC: 'USDC', 
  DAI: 'DAI',
  ETH: 'ETH'
};

// 代币名称映射
export const TOKEN_NAMES: Record<string, string> = {
  WETH: 'Wrapped Ether',
  USDC: 'USD Coin',
  DAI: 'Dai Stablecoin',
  ETH: 'Ethereum'
};

// 获取代币显示信息
export const getTokenDisplayInfo = (symbol: string) => {
  return {
    symbol: TOKEN_SYMBOLS[symbol] || symbol,
    name: TOKEN_NAMES[symbol] || symbol,
  };
}; 