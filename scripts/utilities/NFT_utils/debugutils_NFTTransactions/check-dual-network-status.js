#!/usr/bin/env node

/**
 * 双网络状态检查工具
 * 
 * 该脚本用于同时检查Anvil和Hardhat两个网络的状态，
 * 帮助诊断由于网络混淆导致的合约地址不匹配问题。
 */

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

// 配置
const ADDRESSES_FILE = path.join(__dirname, '../../../../src/contracts/addresses.json');
const ANVIL_RPC = 'http://localhost:8546';
const HARDHAT_RPC = 'http://localhost:8545';
const ANVIL_CHAIN_ID = '31338';
const HARDHAT_CHAIN_ID = '31337';

// 主函数
async function main() {
  console.log('🔍 双网络状态检查工具');
  console.log('='.repeat(50));
  
  // 读取地址配置
  let addresses;
  try {
    addresses = JSON.parse(fs.readFileSync(ADDRESSES_FILE, 'utf8'));
    console.log('✅ 成功读取地址配置文件');
  } catch (error) {
    console.error(`❌ 无法读取地址配置文件: ${error.message}`);
    return;
  }
  
  // 检查Anvil网络
  console.log('\n📡 检查Anvil网络 (Chain ID 31338)...');
  await checkNetwork(ANVIL_RPC, ANVIL_CHAIN_ID, addresses[ANVIL_CHAIN_ID]);
  
  // 检查Hardhat网络
  console.log('\n📡 检查Hardhat网络 (Chain ID 31337)...');
  await checkNetwork(HARDHAT_RPC, HARDHAT_CHAIN_ID, addresses[HARDHAT_CHAIN_ID]);
  
  // 比较两个网络
  console.log('\n🔄 网络比较:');
  if (addresses[ANVIL_CHAIN_ID] && addresses[HARDHAT_CHAIN_ID]) {
    console.log('   Anvil和Hardhat网络配置均存在');
    
    // 检查关键合约地址是否相同
    const keyContracts = ['PlatformNFT', 'NFTMarketplace', 'Bank', 'Voting'];
    for (const contract of keyContracts) {
      if (addresses[ANVIL_CHAIN_ID][contract] && addresses[HARDHAT_CHAIN_ID][contract]) {
        const isSame = addresses[ANVIL_CHAIN_ID][contract] === addresses[HARDHAT_CHAIN_ID][contract];
        console.log(`   ${contract}: ${isSame ? '⚠️ 地址相同!' : '✅ 地址不同'}`);
      }
    }
  } else {
    console.log('   ❓ 无法比较网络，配置不完整');
  }
  
  console.log('\n💡 建议:');
  console.log('   1. 确保使用正确的网络参数部署合约');
  console.log('   2. 使用 --network anvil 或 --network hardhat 参数指定网络');
  console.log('   3. 如果地址混淆，考虑重置环境: node scripts/maintenance/reset-development.js');
}

// 检查网络状态
async function checkNetwork(rpcUrl, chainId, addressConfig) {
  try {
    // 连接到网络
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // 检查网络连接
    try {
      const network = await provider.getNetwork();
      console.log(`   ✅ 网络连接成功，Chain ID: ${network.chainId}`);
      
      if (network.chainId.toString() !== chainId) {
        console.log(`   ⚠️ 警告：实际Chain ID (${network.chainId}) 与预期Chain ID (${chainId}) 不匹配`);
      }
      
      // 检查区块高度
      const blockNumber = await provider.getBlockNumber();
      console.log(`   📊 当前区块高度: ${blockNumber}`);
      
      // 检查账户余额
      const accounts = await provider.listAccounts();
      if (accounts && accounts.length > 0) {
        const balance = await provider.getBalance(accounts[0]);
        console.log(`   💰 第一个账户余额: ${ethers.formatEther(balance)} ETH`);
      }
    } catch (error) {
      console.log(`   ❌ 无法连接到网络: ${error.message}`);
      console.log(`   💡 请确保网络正在运行，端口正确`);
      return;
    }
    
    // 检查合约配置
    if (!addressConfig) {
      console.log(`   ❓ 配置文件中没有Chain ID ${chainId} 的地址配置`);
      return;
    }
    
    // 检查关键合约
    console.log('   📋 检查关键合约:');
    const keyContracts = ['PlatformNFT', 'NFTMarketplace', 'Bank', 'Voting'];
    
    for (const contract of keyContracts) {
      const address = addressConfig[contract];
      if (!address) {
        console.log(`      ❓ ${contract}: 未配置`);
        continue;
      }
      
      try {
        const code = await provider.getCode(address);
        const hasCode = code !== '0x';
        console.log(`      ${hasCode ? '✅' : '❌'} ${contract}: ${address} ${hasCode ? '(有合约代码)' : '(无合约代码)'}`);
      } catch (error) {
        console.log(`      ❌ ${contract}: ${address} (检查失败: ${error.message})`);
      }
    }
    
  } catch (error) {
    console.error(`   ❌ 检查网络时出错: ${error.message}`);
  }
}

// 运行主函数
main().catch(console.error); 