import VotingABI from '../../artifacts/contracts/Voting.sol/Voting.json';
import BankABI from '../../artifacts/contracts/Bank.sol/Bank.json';
import TokenFactoryABI from '../../artifacts/contracts/TokenFactory.sol/TokenFactory.json';
import PlatformNFTABI from '../../artifacts/contracts/PlatformNFT.sol/PlatformNFT.json';
import NFTMarketplaceABI from '../../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json';
import DEXPlatformABI from '../../artifacts/contracts/DEXPlatform.sol/DEXPlatform.json';

// 动态加载地址配置
let dynamicAddresses: any = {};
try {
  dynamicAddresses = require('../contracts/addresses.json');
} catch (error) {
  console.warn('Unable to load dynamic address configuration, use default configuration');
}

// 网络信息配置
export const NETWORK_CONFIG = {
  31338: { 
    name: "Anvil Local", 
    type: "development",
    currency: "ETH",
    blockExplorer: "http://localhost:8546",
    rpc: "http://127.0.0.1:8546"
  },
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

// 动态生成合约地址配置 - 从 addresses.json 读取实际部署的地址
function generateContractAddresses() {
  const addresses: Record<number, Record<string, string>> = {};
  
  // 支持的网络列表
  const supportedNetworks = [31338, 31337, 1337, 11155111, 80001, 1, 137, 56];
  
  // 支持的合约列表
  const contractNames = ['Voting', 'Bank', 'TokenFactory', 'PlatformNFT', 'NFTMarketplace', 'DEXPlatform'];
  
  // 为每个网络生成配置
  supportedNetworks.forEach(chainId => {
    addresses[chainId] = {};
    contractNames.forEach(contractName => {
      // 优先使用动态地址，如果没有则为空字符串（表示未部署）
      addresses[chainId][contractName] = dynamicAddresses[chainId.toString()]?.[contractName] || '';
    });
  });
  
  return addresses;
}

// 合约地址配置 - 完全基于 addresses.json 动态生成
export const CONTRACT_ADDRESSES = generateContractAddresses();

// ABI 导出
export const ABIS = {
  Voting: VotingABI.abi as any,
  Bank: BankABI.abi as any,
  TokenFactory: TokenFactoryABI.abi as any,
  PlatformNFT: PlatformNFTABI.abi as any,
  NFTMarketplace: NFTMarketplaceABI.abi as any,
  DEXPlatform: DEXPlatformABI.abi as any
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

// 获取合约地址
export function getContractAddress(chainId: number, contractName: string) {
  const addresses = CONTRACT_ADDRESSES[chainId];
  if (!addresses) {
    console.warn(`不支持的网络 Chain ID: ${chainId}`);
    
    // 回退：尝试从顶级地址读取（新格式兼容性）
    if (dynamicAddresses[contractName] || dynamicAddresses[contractName.toLowerCase()]) {
      const fallbackAddress = dynamicAddresses[contractName] || dynamicAddresses[contractName.toLowerCase()];
      console.log(`从顶级地址获取 ${contractName}:`, fallbackAddress);
      return fallbackAddress;
    }
    
    // 特殊处理 Bank
    if (contractName === 'Bank' && dynamicAddresses.bank) {
      console.log(`使用 bank 地址:`, dynamicAddresses.bank);
      return dynamicAddresses.bank;
    }
    
    return null;
  }
  
  const address = addresses[contractName];
  if (!address) {
    // 回退：尝试从顶级地址读取
    if (dynamicAddresses[contractName] || dynamicAddresses[contractName.toLowerCase()]) {
      const fallbackAddress = dynamicAddresses[contractName] || dynamicAddresses[contractName.toLowerCase()];
      console.log(`从顶级地址获取 ${contractName}:`, fallbackAddress);
      return fallbackAddress;
    }
    
    // 特殊处理 Bank
    if (contractName === 'Bank' && dynamicAddresses.bank) {
      console.log(`使用 bank 地址:`, dynamicAddresses.bank);
      return dynamicAddresses.bank;
    }
    
    console.warn(`合约 ${contractName} 在网络 ${chainId} 上未部署`);
    return null;
  }
  return address;
}

// 获取合约ABI
export function getContractABI(contractName: keyof typeof ABIS) {
  return ABIS[contractName];
}

// 检查合约是否已部署
export function isContractDeployed(chainId: number, contractName: string): boolean {
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

// 更新合约地址
export function updateContractAddress(chainId: number, contractName: string, address: string) {
  if (CONTRACT_ADDRESSES[chainId]) {
    CONTRACT_ADDRESSES[chainId][contractName] = address;
    console.log(`已更新 ${contractName} 地址，网络 ${chainId}: ${address}`);
  }
}

// 获取所有已部署的合约地址
export function getAllContractAddresses(chainId: number) {
  return CONTRACT_ADDRESSES[chainId] || {};
} 