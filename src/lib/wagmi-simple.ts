import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

// 本地网络配置
const ganacheChain = {
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
    default: { name: 'Local', url: '' },
  },
  testnet: true,
} as const;

// 超简化配置 - 只支持Ganache，不使用任何外部服务
const { chains, publicClient } = configureChains(
  [ganacheChain],
  [
    jsonRpcProvider({
      rpc: () => ({ http: 'http://127.0.0.1:7545' }),
    }),
  ]
);

// 最简单的钱包配置
const { connectors } = getDefaultWallets({
  appName: 'Local Web3 App',
  projectId: 'local-only', // 固定值，不从环境变量读取
  chains,
});

// 创建配置
export const wagmiSimpleConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export { chains as simpleChains, ganacheChain }; 