import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

// 本地Ganache网络配置
const ganacheLocal = {
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

// 本地Hardhat网络配置
const hardhatLocal = {
  id: 31337,
  name: 'Hardhat Local',
  network: 'hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['http://127.0.0.1:8545'] },
    default: { http: ['http://127.0.0.1:8545'] },
  },
  blockExplorers: {
    default: { name: 'Hardhat Explorer', url: '' },
  },
  testnet: true,
} as const;

// 配置链和提供商 - 只使用JSON-RPC提供商，避免WebSocket问题
const { chains, publicClient } = configureChains(
  [ganacheLocal, hardhatLocal],
  [
    jsonRpcProvider({
      rpc: (chain) => {
        if (chain.id === 1337) {
          return { http: 'http://127.0.0.1:7545' };
        }
        if (chain.id === 31337) {
          return { http: 'http://127.0.0.1:8545' };
        }
        return null;
      },
    }),
  ]
);

// 配置钱包连接器
const { connectors } = getDefaultWallets({
  appName: 'Web3 Local Development',
  projectId: 'local-dev', // 本地开发专用ID
  chains,
});

// 创建Wagmi配置
export const wagmiLocalConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export { chains as localChains, ganacheLocal, hardhatLocal };

// 网络信息
export const LOCAL_NETWORK_CONFIG = {
  [ganacheLocal.id]: {
    name: 'Ganache Local',
    rpcUrl: 'http://127.0.0.1:7545',
    chainId: 1337,
  },
  [hardhatLocal.id]: {
    name: 'Hardhat Local', 
    rpcUrl: 'http://127.0.0.1:8545',
    chainId: 31337,
  },
} as const; 