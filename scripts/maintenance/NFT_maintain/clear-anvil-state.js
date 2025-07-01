#!/usr/bin/env node

/**
 * Anvil状态清理脚本
 * 
 * 该脚本用于清理Anvil状态文件，解决由于状态持久化导致的合约地址不匹配问题。
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 配置
const ANVIL_STATE_FILE = path.join(__dirname, '../../anvil-state.json');

// 创建命令行交互
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 询问确认
function askConfirmation(question) {
  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// 主函数
async function main() {
  console.log('🧹 Anvil状态清理工具');
  console.log('='.repeat(50));
  
  // 检查状态文件是否存在
  const stateExists = fs.existsSync(ANVIL_STATE_FILE);
  
  if (stateExists) {
    console.log(`\n📋 发现Anvil状态文件: ${ANVIL_STATE_FILE}`);
    console.log('\n⚠️  警告: 删除此文件将导致:');
    console.log('   - 所有已部署的合约地址将失效');
    console.log('   - 所有账户余额将重置');
    console.log('   - 所有交易历史将被清除');
    
    const confirmed = await askConfirmation('\n确定要删除Anvil状态文件吗?');
    if (!confirmed) {
      console.log('\n❌ 操作已取消');
      rl.close();
      return;
    }
    
    // 删除状态文件
    try {
      fs.unlinkSync(ANVIL_STATE_FILE);
      console.log('\n✅ Anvil状态文件已成功删除!');
      console.log('\n🔧 接下来的步骤:');
      console.log('   1. 重启Anvil网络: node scripts/start-networks.js anvil --fresh');
      console.log('   2. 重新部署合约: npx hardhat run scripts/deploy-master.js --network anvil');
    } catch (error) {
      console.error(`\n❌ 删除文件时出错: ${error.message}`);
    }
  } else {
    console.log('\n✅ Anvil状态文件不存在，无需清理');
    console.log('\n💡 如果你遇到合约地址不匹配问题，可能是:');
    console.log('   1. 合约部署在了错误的网络上');
    console.log('   2. 前端配置的地址不正确');
    console.log('   3. 网络连接问题');
  }
  
  rl.close();
}

// 运行主函数
main().catch(console.error); 