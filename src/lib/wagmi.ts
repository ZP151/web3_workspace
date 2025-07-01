import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, sepolia, polygonMumbai, hardhat } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { infuraProvider } from 'wagmi/providers/infura';
import { publicProvider } from 'wagmi/providers/public';

// Custom Ganache chain configuration
const ganache = {
  id: 1337,
  name: 'Ganache Local',
  network: 'ganache',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['http://127.0.0.1:7545'] },
    default: { http: ['http://127.0.0.1:7545'] },
  },
      blockExplorers: {
    default: { name: 'Ganache Explorer', url: '' },
  },
  testnet: true,
} as const;

// Enhanced Hardhat configuration
const hardhatLocal = {
  ...hardhat,
  id: 31337,
  name: 'Hardhat Local',
  network: 'hardhat',
  rpcUrls: {
    public: { http: ['http://127.0.0.1:8545'] },
    default: { http: ['http://127.0.0.1:8545'] },
  },
  testnet: true,
} as const;

// Anvil network configuration (using default Anvil settings)
const anvilLocal = {
  id: 31338,
  name: 'Anvil Local',
  network: 'anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['http://127.0.0.1:8546'] },
    default: { http: ['http://127.0.0.1:8546'] },
  },
  blockExplorers: {
    default: { name: 'Anvil Explorer', url: '' },
  },
  testnet: true,
} as const;

// Configure supported chains - 简化配置，只使用公共提供商避免API密钥问题
const { chains, publicClient } = configureChains(
  [
    anvilLocal,
    hardhatLocal,
    ganache,
    ...(process.env.NODE_ENV === 'development' ? [sepolia, polygonMumbai] : []),
    ...(process.env.NODE_ENV === 'production' ? [mainnet, polygon, optimism, arbitrum] : []),
  ],
  [
    publicProvider(),
  ]
);

// Configure supported wallets - 简化配置避免WalletConnect问题
const { connectors } = getDefaultWallets({
  appName: 'Modern Web3 Smart Contract Platform',
  projectId: 'demo-project-id', // 使用固定的demo ID避免API问题
  chains,
});

// Create Wagmi configuration
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export { chains, ganache, hardhatLocal, anvilLocal };

// 注意：合约配置已移动到 src/config/contracts.ts 进行集中管理
// 这里保留这个注释作为提醒

// Enhanced network configuration
export const NETWORK_CONFIG = {
  [anvilLocal.id]: {
    name: 'Anvil Local Network',
    shortName: 'Anvil',
    blockExplorer: '',
    currency: 'ETH',
    rpcUrl: 'http://127.0.0.1:8546',
    chainId: 31338,
    description: 'Foundry Anvil local node with persistence and advanced features',
    features: ['State Persistence', 'Fork Support', 'Mining Control', 'Debug Traces'],
    icon: '⚒️',
    color: '#9333ea',
  },
  [hardhatLocal.id]: {
    name: 'Hardhat Local Network',
    shortName: 'Hardhat',
    blockExplorer: '',
    currency: 'ETH',
    rpcUrl: 'http://127.0.0.1:8545',
    chainId: 31337,
    description: 'Local development network with auto-deployment and debugging support',
    features: ['Auto Deploy', 'Gas Simulation', 'Debug Tools', 'Fast Confirmation'],
    icon: '🔨',
    color: '#f59e0b',
  },
  [ganache.id]: {
    name: 'Ganache Local Network',
    shortName: 'Ganache',
    blockExplorer: '',
    currency: 'ETH',
    rpcUrl: 'http://127.0.0.1:7545',
    chainId: 1337,
    description: 'Graphical local blockchain network for easy account management',
    features: ['GUI Interface', 'Account Management', 'Transaction History', 'State Viewer'],
    icon: '🟤',
    color: '#e97617',
  },
  [sepolia.id]: {
    name: 'Sepolia Testnet',
    shortName: 'Sepolia',
    blockExplorer: 'https://sepolia.etherscan.io',
    currency: 'ETH',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    chainId: 11155111,
    description: 'Ethereum official test network',
    features: ['Free Test ETH', 'Real Network Environment', 'Block Explorer', 'Faucet Support'],
    icon: '🧪',
    color: '#627eea',
  },
  [polygonMumbai.id]: {
    name: 'Polygon Mumbai',
    shortName: 'Mumbai',
    blockExplorer: 'https://mumbai.polygonscan.com',
    currency: 'MATIC',
    rpcUrl: 'https://polygon-mumbai.infura.io/v3/',
    chainId: 80001,
    description: 'Polygon test network',
    features: ['Low Gas Fees', 'Fast Transactions', 'Ethereum Compatible', 'Layer2 Scaling'],
    icon: '🔮',
    color: '#8247e5',
  },
  [mainnet.id]: {
    name: 'Ethereum Mainnet',
    shortName: 'Mainnet',
    blockExplorer: 'https://etherscan.io',
    currency: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    chainId: 1,
    description: 'Ethereum main network',
    features: ['Real Value', 'Decentralized', 'Global Network', 'Smart Contracts'],
    icon: '💎',
    color: '#627eea',
  },
  [polygon.id]: {
    name: 'Polygon Mainnet',
    shortName: 'Polygon',
    blockExplorer: 'https://polygonscan.com',
    currency: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    chainId: 137,
    description: 'Polygon Layer2 network',
    features: ['Low Fees', 'High Performance', 'Ethereum Compatible', 'DeFi Ecosystem'],
    icon: '🟣',
    color: '#8247e5',
  },
} as const;

// 扩展Window接口以包含ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// 网络切换工具函数
export const switchToNetwork = async (chainId: number) => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('没有检测到以太坊钱包');
  }

  const networkConfig = NETWORK_CONFIG[chainId as keyof typeof NETWORK_CONFIG];
  if (!networkConfig) {
    throw new Error(`不支持的网络ID: ${chainId}`);
  }

  try {
    // 尝试切换到目标网络
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (switchError: any) {
    // 如果网络不存在，尝试添加网络
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${chainId.toString(16)}`,
            chainName: networkConfig.name,
            nativeCurrency: {
              name: networkConfig.currency,
              symbol: networkConfig.currency,
              decimals: 18,
            },
            rpcUrls: [networkConfig.rpcUrl],
            blockExplorerUrls: networkConfig.blockExplorer ? [networkConfig.blockExplorer] : [],
          }],
        });
      } catch (addError) {
        throw new Error(`添加网络失败: ${addError}`);
      }
    } else {
      throw new Error(`切换网络失败: ${switchError.message}`);
    }
  }
};

// Toggle verbose debug output for local network checks
const DEBUG = false;

// 本地网络连接检查
export const checkLocalNetworkConnection = async (chainId: number): Promise<boolean> => {
  const networkConfig = NETWORK_CONFIG[chainId as keyof typeof NETWORK_CONFIG];
  if (DEBUG) console.log(`[Debug] Checking network: ${networkConfig.name} (ChainID: ${chainId}) at ${networkConfig.rpcUrl}`);

  if (!networkConfig || !networkConfig.rpcUrl.includes('127.0.0.1')) {
    if (DEBUG) console.log(`[Debug] ${networkConfig.name}: Invalid config or not a local network.`);
    return false;
  }

  try {
    if (DEBUG) console.log(`[Debug] ${networkConfig.name}: Sending fetch request...`);
    const response = await fetch(networkConfig.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: Date.now(), // 使用唯一ID防止缓存
      }),
      cache: 'no-cache', // 显式禁用缓存
    });

    if (DEBUG) console.log(`[Debug] ${networkConfig.name}: Response received. Status: ${response.status}, OK: ${response.ok}`);

    if (response.ok) {
      const data = await response.json();
      if (DEBUG) console.log(`[Debug] ${networkConfig.name}: Response data:`, data);
      const isMatch = data.result === `0x${chainId.toString(16)}`;
      if (DEBUG) console.log(`[Debug] ${networkConfig.name}: ChainID match? ${isMatch}. (Expected: 0x${chainId.toString(16)}, Got: ${data.result})`);
      return isMatch;
    }
    if (DEBUG) console.log(`[Debug] ${networkConfig.name}: Response not OK.`);
    return false;
  } catch (error) {
    if (DEBUG) console.error(`[Debug] ${networkConfig.name}: Fetch failed with error:`, error);
    return false;
  }
};

// 获取推荐的本地网络
export const getRecommendedLocalNetwork = async (): Promise<number | null> => {
  // 优先检查 Anvil 网络
  if (await checkLocalNetworkConnection(CHAIN_IDS.ANVIL)) {
    return CHAIN_IDS.ANVIL;
  }
  
  // 其次检查 Hardhat 网络
  if (await checkLocalNetworkConnection(CHAIN_IDS.HARDHAT)) {
    return CHAIN_IDS.HARDHAT;
  }
  
  // 最后检查 Ganache 网络
  if (await checkLocalNetworkConnection(CHAIN_IDS.GANACHE)) {
    return CHAIN_IDS.GANACHE;
  }
  
  return null;
};

// 注意：这个函数已被废弃，请使用 src/config/contracts.ts 中的 getContractAddress

// 导出常用的链ID常量
export const CHAIN_IDS = {
  GANACHE: ganache.id,
  HARDHAT: hardhatLocal.id,
  ANVIL: anvilLocal.id,
  SEPOLIA: sepolia.id,
  MUMBAI: polygonMumbai.id,
  MAINNET: mainnet.id,
  POLYGON: polygon.id,
} as const; 