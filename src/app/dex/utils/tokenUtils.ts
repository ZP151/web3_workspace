// 重新导出通用工具函数，保持DEX模块的兼容性
export { 
  type TokenAddresses,
  getTokenAddresses,
  erc20ABI,
  formatTokenAmount,
  TOKEN_SYMBOLS,
  TOKEN_NAMES,
  getTokenDisplayInfo
} from '@/utils/web3/tokenUtils'; 