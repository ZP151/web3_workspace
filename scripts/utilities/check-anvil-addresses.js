#!/usr/bin/env node

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

const ADDRESSES_FILE = path.join(__dirname, '../../src/contracts/addresses.json');
const ANVIL_CHAIN_ID = '31338';

/**
 * 检查 Anvil 持久化网络中的合约地址是否与配置文件匹配
 */
async function checkAnvilAddresses() {
  console.log('🔍 检查 Anvil 持久化网络的合约地址...');
  
  try {
    // 连接到 Anvil 网络
    const provider = new ethers.JsonRpcProvider('http://localhost:8546');
    
    // 检查网络连接
    try {
      const network = await provider.getNetwork();
      console.log(`📡 已连接到网络，Chain ID: ${network.chainId}`);
      
      if (network.chainId.toString() !== ANVIL_CHAIN_ID) {
        console.log(`⚠️  警告：当前网络 Chain ID (${network.chainId}) 与预期的 Anvil Chain ID (${ANVIL_CHAIN_ID}) 不匹配`);
      }
    } catch (error) {
      console.error('❌ 无法连接到 Anvil 网络 (http://localhost:8546)');
      console.error('   请确保 Anvil 正在运行：node scripts/start-networks.js anvil --persistent');
      return;
    }
    
    // 读取当前地址配置
    if (!fs.existsSync(ADDRESSES_FILE)) {
      console.error(`❌ 地址配置文件不存在: ${ADDRESSES_FILE}`);
      return;
    }
    
    const addresses = JSON.parse(fs.readFileSync(ADDRESSES_FILE, 'utf8'));
    
    if (!addresses[ANVIL_CHAIN_ID]) {
      console.log(`📝 配置文件中没有 Chain ID ${ANVIL_CHAIN_ID} 的地址配置`);
      return;
    }
    
    const anvilAddresses = addresses[ANVIL_CHAIN_ID];
    console.log('\n📋 检查配置文件中的合约地址...');
    
    const contractNames = Object.keys(anvilAddresses).filter(key => 
      !['network', 'deployedAt', 'deployer', 'totalContracts', 'operator', 'initialized', 'timestamp'].includes(key)
    );
    
    const results = [];
    
    for (const contractName of contractNames) {
      const address = anvilAddresses[contractName];
      
      if (!ethers.isAddress(address)) {
        console.log(`❓ ${contractName}: ${address} (非有效地址格式)`);
        continue;
      }
      
      try {
        const code = await provider.getCode(address);
        const hasCode = code !== '0x';
        
        console.log(`${hasCode ? '✅' : '❌'} ${contractName}: ${address} ${hasCode ? '(有合约代码)' : '(无合约代码)'}`);
        
        results.push({
          name: contractName,
          address: address,
          hasCode: hasCode
        });
      } catch (error) {
        console.log(`❌ ${contractName}: ${address} (检查失败: ${error.message})`);
        results.push({
          name: contractName,
          address: address,
          hasCode: false,
          error: error.message
        });
      }
    }
    
    // 统计结果
    const validContracts = results.filter(r => r.hasCode).length;
    const totalContracts = results.length;
    
    console.log(`\n📊 检查结果: ${validContracts}/${totalContracts} 个合约地址有效`);
    
    if (validContracts < totalContracts) {
      console.log('\n🔧 建议的解决方案:');
      console.log('1. 重新启动网络并部署合约:');
      console.log('   node scripts/start-networks.js anvil --fresh');
      console.log('   然后运行部署脚本');
      console.log('');
      console.log('2. 或者重新部署合约到当前持久化网络:');
      console.log('   npx hardhat run scripts/deploy-master.js --network anvil');
      console.log('');
      console.log('3. 或者更新地址配置文件以匹配当前网络状态');
    } else {
      console.log('✅ 所有合约地址都有效，网络状态正常！');
    }
    
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error.message);
  }
}

/**
 * 扫描网络上的所有合约地址（实验性功能）
 */
async function scanNetworkContracts() {
  console.log('\n🔍 扫描网络上的合约地址...');
  console.log('⚠️  这可能需要一些时间，正在检查最近的区块...');
  
  try {
    const provider = new ethers.JsonRpcProvider('http://localhost:8546');
    const latestBlock = await provider.getBlockNumber();
    
    console.log(`📋 当前区块高度: ${latestBlock}`);
    
    const contracts = new Set();
    
    // 检查最近的几个区块
    const blocksToCheck = Math.min(latestBlock, 50);
    for (let i = latestBlock; i > latestBlock - blocksToCheck; i--) {
      try {
        const block = await provider.getBlock(i, true);
        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (tx.to === null && tx.creates) {
              // 合约创建交易
              contracts.add(tx.creates);
            }
          }
        }
      } catch (error) {
        // 忽略个别区块的错误
      }
    }
    
    if (contracts.size > 0) {
      console.log('\n📋 发现的合约地址:');
      for (const address of contracts) {
        console.log(`   ${address}`);
      }
    } else {
      console.log('🤷 未在最近的区块中发现合约创建交易');
    }
    
  } catch (error) {
    console.error('❌ 扫描过程中发生错误:', error.message);
  }
}

// 主函数
async function main() {
  console.log('🔧 Anvil 地址检查工具\n');
  
  const args = process.argv.slice(2);
  
  if (args.includes('--scan')) {
    await scanNetworkContracts();
  } else {
    await checkAnvilAddresses();
    
    if (args.includes('--scan-contracts')) {
      await scanNetworkContracts();
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkAnvilAddresses, scanNetworkContracts }; 