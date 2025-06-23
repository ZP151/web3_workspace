// Web3工具统一导出
export * from './tokenUtils';

// 可以在这里添加其他Web3相关的工具函数
// 比如：格式化地址、交易工具、网络工具等 

/**
 * 动态获取当前网络中的所有可用账户地址
 * 优先尝试从提供者获取，如果失败则使用备用地址
 * @param currentAddress 当前用户地址，会被过滤掉
 * @param maxCount 最大返回地址数量，默认9个
 * @returns Promise<string[]> 可用的地址列表
 */
export async function getNetworkAccounts(
  currentAddress?: string, 
  maxCount: number = 9
): Promise<string[]> {
  console.log('🔍 获取网络账户，当前用户:', currentAddress);
  
  // 备用地址列表
  const FALLBACK_ADDRESSES = [
    '0x8742BF796efE417CF777d04866eD47654F913EB7',
    '0x2cE2Adb7cef953843a9594d94D7A22Fe49e4d151',
    '0x24baD0F00Ee583575A25CDED282C6527c823564C',
    '0xfA940a1b896f08114610731BbC7b0f3d96ceaea6',
    '0x64E8Af94d630CbAfB41cB6B17485EE0042c052c4',
    '0x8968C41bdCb3cf46018EdaD49cae7ba7f3515833',
    '0x127c52dF397D280afc94403F715746849ea2ABcF',
    '0x959fd7ef9089b7142b6b908dc3a8af7aa8ff0fa1',
    '0x405e367b91c442b088845e552157734aa4e7ae14',
    '0x1cbddb976d1cf01c5ba57dc8b02e6e3a8c64bcdc'
  ];
  
  try {
    // 直接通过RPC获取Ganache 7545端口的账户
    console.log('🔗 连接 Ganache 端口 7545...');
    
    const response = await fetch('http://127.0.0.1:7545', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_accounts',
        params: []
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.result && Array.isArray(data.result) && data.result.length > 0) {
        console.log(`✅ 成功连接端口 7545，获取到 ${data.result.length} 个账户`);
        
        // 过滤掉当前用户账户
        const filteredAccounts = data.result.filter(
          (account: string) => account.toLowerCase() !== currentAddress?.toLowerCase()
        );
        
        console.log(`📋 过滤后获得 ${filteredAccounts.length} 个可用账户`);
        return filteredAccounts.slice(0, maxCount);
      }
    }
    
  } catch (error) {
    console.error('❌ 连接端口 7545 失败:', error);
  }
  
  // 如果RPC失败，使用备用地址
  console.log('⚠️ 使用备用地址列表');
  const availableAddresses = FALLBACK_ADDRESSES
    .filter(addr => addr.toLowerCase() !== currentAddress?.toLowerCase())
    .slice(0, maxCount);
  
  console.log(`📋 最终返回 ${availableAddresses.length} 个地址`);
  return availableAddresses;
} 