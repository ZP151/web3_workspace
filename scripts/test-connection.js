const { ethers } = require('hardhat');
const addresses = require('../src/contracts/addresses.json');

async function testConnection() {
  console.log('🔍 测试网络连接和合约状态...\n');
  
  try {
    // 测试网络连接
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
    
    // 获取网络信息
    const network = await provider.getNetwork();
    console.log('✅ 网络连接成功');
    console.log(`   Chain ID: ${network.chainId}`);
    console.log(`   Network Name: ${network.name || 'ganache'}\n`);
    
    // 获取账户列表
    const accounts = await provider.listAccounts();
    console.log(`✅ 发现 ${accounts.length} 个账户`);
    if (accounts.length > 0) {
      const balance = await provider.getBalance(accounts[0]);
      console.log(`   第一个账户: ${accounts[0]}`);
      console.log(`   余额: ${ethers.formatEther(balance)} ETH\n`);
    }
    
    // 检查合约部署状态
    const chainId = network.chainId.toString();
    const contractAddresses = addresses[chainId];
    
    if (!contractAddresses) {
      console.log(`❌ 没有找到 Chain ID ${chainId} 的合约地址`);
      return;
    }
    
    console.log('📋 检查合约部署状态:');
    
    // 检查每个合约
    const contracts = ['VotingCore', 'SimpleBank', 'TokenFactory', 'PlatformNFT', 'NFTMarketplace', 'DEXPlatform'];
    
    for (const contractName of contracts) {
      const address = contractAddresses[contractName];
      if (address) {
        try {
          const code = await provider.getCode(address);
          if (code !== '0x') {
            console.log(`   ✅ ${contractName}: ${address}`);
            
            // 尝试调用一个简单的只读函数
            if (contractName === 'SimpleBank') {
              try {
                const contract = new ethers.Contract(
                  address,
                  ['function minimumDeposit() view returns (uint256)'],
                  provider
                );
                const minDeposit = await contract.minimumDeposit();
                console.log(`      最小存款: ${ethers.formatEther(minDeposit)} ETH`);
              } catch (error) {
                console.log(`      ⚠️  无法读取合约数据: ${error.message}`);
              }
            }
            
            if (contractName === 'VotingCore') {
              try {
                const contract = new ethers.Contract(
                  address,
                  ['function proposalCount() view returns (uint256)'],
                  provider
                );
                const count = await contract.proposalCount();
                console.log(`      提案数量: ${count.toString()}`);
              } catch (error) {
                console.log(`      ⚠️  无法读取合约数据: ${error.message}`);
              }
            }
          } else {
            console.log(`   ❌ ${contractName}: ${address} (没有合约代码)`);
          }
        } catch (error) {
          console.log(`   ❌ ${contractName}: ${address} (检查失败: ${error.message})`);
        }
      } else {
        console.log(`   ❌ ${contractName}: 地址未找到`);
      }
    }
    
    // 测试gas价格
    console.log('\n⛽ Gas 信息:');
    try {
      const gasPrice = await provider.getFeeData();
      console.log(`   Gas Price: ${ethers.formatUnits(gasPrice.gasPrice || 0n, 'gwei')} Gwei`);
      console.log(`   Max Fee: ${ethers.formatUnits(gasPrice.maxFeePerGas || 0n, 'gwei')} Gwei`);
    } catch (error) {
      console.log(`   ⚠️  无法获取Gas信息: ${error.message}`);
    }
    
    // 测试区块信息
    console.log('\n🔗 区块信息:');
    try {
      const blockNumber = await provider.getBlockNumber();
      const block = await provider.getBlock(blockNumber);
      console.log(`   最新区块: #${blockNumber}`);
      console.log(`   区块时间: ${new Date(Number(block.timestamp) * 1000).toLocaleString()}`);
    } catch (error) {
      console.log(`   ⚠️  无法获取区块信息: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ 连接测试失败:', error.message);
    console.log('\n🔧 可能的解决方案:');
    console.log('1. 确保 Ganache 正在运行在端口 7545');
    console.log('2. 检查防火墙设置');
    console.log('3. 重启 Ganache 服务');
  }
}

testConnection().catch(console.error); 