import VotingCoreABI from '../../artifacts/contracts/VotingCore.sol/VotingCore.json';
import SimpleBankABI from '../../artifacts/contracts/SimpleBank.sol/SimpleBank.json';
import TokenFactoryABI from '../../artifacts/contracts/TokenFactory.sol/TokenFactory.json';

// 动态加载地址配置
let dynamicAddresses: any = {};
try {
  dynamicAddresses = require('../contracts/addresses.json');
} catch (error) {
  console.warn('Unable to load dynamic address configuration, use default configuration');
}

// 网络信息配置
export const NETWORK_CONFIG = {
  // 开发环境
  31337: { 
    name: "Hardhat Local", 
    type: "development",
    currency: "ETH",
    blockExplorer: "http://localhost:8545",
    rpc: "http://127.0.0.1:8545"
  },
  1337: { 
    name: "Ganache Local", 
    type: "development",
    currency: "ETH",
    blockExplorer: "http://localhost:7545",
    rpc: "http://127.0.0.1:7545"
  },
  
  // 测试网络
  11155111: { 
    name: "Sepolia Testnet", 
    type: "testnet",
    currency: "SepoliaETH",
    blockExplorer: "https://sepolia.etherscan.io",
    rpc: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
  },
  80001: { 
    name: "Mumbai Testnet", 
    type: "testnet",
    currency: "MATIC",
    blockExplorer: "https://mumbai.polygonscan.com",
    rpc: "https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY"
  },
  
  // 主网络
  1: { 
    name: "Ethereum Mainnet", 
    type: "mainnet",
    currency: "ETH",
    blockExplorer: "https://etherscan.io",
    rpc: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY"
  },
  137: { 
    name: "Polygon Mainnet", 
    type: "mainnet",
    currency: "MATIC",
    blockExplorer: "https://polygonscan.com",
    rpc: "https://polygon-rpc.com"
  },
  56: { 
    name: "BSC Mainnet", 
    type: "mainnet",
    currency: "BNB",
    blockExplorer: "https://bscscan.com",
    rpc: "https://bsc-dataseed.binance.org"
  }
} as const;

// 合约地址配置 - 支持多网络部署
export const CONTRACT_ADDRESSES = {
  // 开发环境
  31337: {
    VotingCore: dynamicAddresses['31337']?.VotingCore || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    SimpleBank: dynamicAddresses['31337']?.SimpleBank || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    TokenFactory: dynamicAddresses['31337']?.TokenFactory || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    PlatformNFT: dynamicAddresses['31337']?.PlatformNFT || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    NFTMarketplace: dynamicAddresses['31337']?.NFTMarketplace || '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    DEXPlatform: dynamicAddresses['31337']?.DEXPlatform || '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'
  },
  1337: {
    VotingCore: dynamicAddresses['1337']?.VotingCore || '0x675D3E317a36E11D554D2dB12E8d8971D939Dd05',
    SimpleBank: dynamicAddresses['1337']?.SimpleBank || '0x65aaF4239c648f7ff93811dCe4F961b83f084b11',
    TokenFactory: dynamicAddresses['1337']?.TokenFactory || '0xF87d5c794C1F3636DE9D18dc3FA151546539573E',
    PlatformNFT: dynamicAddresses['1337']?.PlatformNFT || '0x9f91D1900930b7a0Dd48F84ae09B720eFB1e8dE3',
    NFTMarketplace: dynamicAddresses['1337']?.NFTMarketplace || '0x6Fec4a50c50913A4223dcE9AEeDB52507D3dB728',
    DEXPlatform: dynamicAddresses['1337']?.DEXPlatform || '0xf8102d5cdc702bc8B9DffEBa03196f5E5b728Ed0'
  },
  
  // 测试网络 - 用于公开测试
  11155111: {
    VotingCore: dynamicAddresses['11155111']?.VotingCore || '',
    SimpleBank: dynamicAddresses['11155111']?.SimpleBank || '',
    TokenFactory: dynamicAddresses['11155111']?.TokenFactory || '',
    PlatformNFT: dynamicAddresses['11155111']?.PlatformNFT || '',
    NFTMarketplace: dynamicAddresses['11155111']?.NFTMarketplace || '',
    DEXPlatform: dynamicAddresses['11155111']?.DEXPlatform || ''
  },
  80001: {
    VotingCore: dynamicAddresses['80001']?.VotingCore || '',
    SimpleBank: dynamicAddresses['80001']?.SimpleBank || '',
    TokenFactory: dynamicAddresses['80001']?.TokenFactory || '',
    PlatformNFT: dynamicAddresses['80001']?.PlatformNFT || '',
    NFTMarketplace: dynamicAddresses['80001']?.NFTMarketplace || '',
    DEXPlatform: dynamicAddresses['80001']?.DEXPlatform || ''
  },
  
  // 主网络 - 生产环境
  1: {
    VotingCore: dynamicAddresses['1']?.VotingCore || '',
    SimpleBank: dynamicAddresses['1']?.SimpleBank || '',
    TokenFactory: dynamicAddresses['1']?.TokenFactory || '',
    PlatformNFT: dynamicAddresses['1']?.PlatformNFT || '',
    NFTMarketplace: dynamicAddresses['1']?.NFTMarketplace || '',
    DEXPlatform: dynamicAddresses['1']?.DEXPlatform || ''
  },
  137: {
    VotingCore: dynamicAddresses['137']?.VotingCore || '',
    SimpleBank: dynamicAddresses['137']?.SimpleBank || '',
    TokenFactory: dynamicAddresses['137']?.TokenFactory || '',
    PlatformNFT: dynamicAddresses['137']?.PlatformNFT || '',
    NFTMarketplace: dynamicAddresses['137']?.NFTMarketplace || '',
    DEXPlatform: dynamicAddresses['137']?.DEXPlatform || ''
  },
  56: {
    VotingCore: dynamicAddresses['56']?.VotingCore || '',
    SimpleBank: dynamicAddresses['56']?.SimpleBank || '',
    TokenFactory: dynamicAddresses['56']?.TokenFactory || '',
    PlatformNFT: dynamicAddresses['56']?.PlatformNFT || '',
    NFTMarketplace: dynamicAddresses['56']?.NFTMarketplace || '',
    DEXPlatform: dynamicAddresses['56']?.DEXPlatform || ''
  }
} as const;

// ABI 导出
export const ABIS = {
  VotingCore: VotingCoreABI.abi as any,
  SimpleBank: SimpleBankABI.abi as any,
  TokenFactory: TokenFactoryABI.abi as any
} as const;

// 获取网络信息
export function getNetworkInfo(chainId: number) {
  return NETWORK_CONFIG[chainId as keyof typeof NETWORK_CONFIG] || {
    name: `Unknown Network (${chainId})`,
    type: "unknown",
    currency: "Unknown",
    blockExplorer: "",
    rpc: ""
  };
}

// 获取合约地址的辅助函数
export function getContractAddress(chainId: number, contractName: keyof typeof CONTRACT_ADDRESSES[31337]) {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) {
    console.warn(`不支持的网络 Chain ID: ${chainId}，使用 Hardhat 默认值`);
    return CONTRACT_ADDRESSES[31337][contractName];
  }
  const address = addresses[contractName];
  if (!address) {
    console.warn(`合约 ${contractName} 在网络 ${chainId} 上未部署`);
    return null;
  }
  return address;
}

// 获取合约ABI的辅助函数
export function getContractABI(contractName: keyof typeof ABIS) {
  return ABIS[contractName];
}

// 检查合约是否已部署的辅助函数
export function isContractDeployed(chainId: number, contractName: keyof typeof CONTRACT_ADDRESSES[31337]): boolean {
  const address = getContractAddress(chainId, contractName);
  return address !== null && address !== undefined && address !== '';
}

// 检查网络类型
export function isTestNetwork(chainId: number): boolean {
  const network = getNetworkInfo(chainId);
  return network.type === 'testnet' || network.type === 'development';
}

export function isMainNetwork(chainId: number): boolean {
  const network = getNetworkInfo(chainId);
  return network.type === 'mainnet';
}

// 更新合约地址的函数
export function updateContractAddress(chainId: number, contractName: keyof typeof CONTRACT_ADDRESSES[31337], address: string) {
  if (CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]) {
    (CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] as any)[contractName] = address;
    console.log(`已更新 ${contractName} 地址，网络 ${chainId}: ${address}`);
  }
}

// 获取所有已部署的合约地址
export function getAllContractAddresses(chainId: number) {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || {};
} 