#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 快速修复 Anvil 持久化网络地址不匹配问题
 */
async function fixAnvilAddresses() {
  console.log('🔧 Anvil 地址修复工具');
  console.log('');
  console.log('当使用持久化 Anvil 网络时，可能出现合约地址不匹配的问题。');
  console.log('这个工具将帮助您快速解决这个问题。');
  console.log('');

  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  // 检查当前是否有 Anvil 在运行
  console.log('🔍 检查当前网络状态...');
  
  if (args.includes('--fresh') || args.includes('-f')) {
    console.log('🆕 启动全新的 Anvil 网络...');
    await startFreshAnvil();
  } else if (args.includes('--redeploy') || args.includes('-r')) {
    console.log('🔄 重新部署合约到当前网络...');
    await redeployContracts();
  } else {
    // 默认行为：检查地址并提供选项
    await checkAndFixAddresses();
  }
}

function printHelp() {
  console.log('使用方法:');
  console.log('  node scripts/utilities/fix-anvil-addresses.js [选项]');
  console.log('');
  console.log('选项:');
  console.log('  --fresh, -f     启动全新的 Anvil 网络（推荐）');
  console.log('  --redeploy, -r  重新部署合约到当前网络');
  console.log('  --help, -h      显示此帮助信息');
  console.log('');
  console.log('默认行为（无选项）：检查地址匹配情况并提供交互式选择');
}

async function checkAndFixAddresses() {
  try {
    // 运行地址检查工具
    console.log('📋 运行地址检查...');
    
    const checkScript = path.join(__dirname, 'check-anvil-addresses.js');
    if (!fs.existsSync(checkScript)) {
      console.error('❌ 找不到地址检查脚本');
      return;
    }
    
    await runCommand('node', [checkScript]);
    
    console.log('');
    console.log('💡 推荐解决方案:');
    console.log('1. 启动全新网络（最简单，推荐）：');
    console.log('   node scripts/utilities/fix-anvil-addresses.js --fresh');
    console.log('');
    console.log('2. 重新部署到当前网络：');
    console.log('   node scripts/utilities/fix-anvil-addresses.js --redeploy');
    
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error.message);
  }
}

async function startFreshAnvil() {
  try {
    console.log('🛑 正在停止现有网络...');
    
    // 删除状态文件
    const stateFile = './anvil-state.json';
    if (fs.existsSync(stateFile)) {
      fs.unlinkSync(stateFile);
      console.log('🗑️ 已删除旧的状态文件');
    }
    
    console.log('🚀 启动全新的 Anvil 网络...');
    console.log('');
    console.log('请在新的终端窗口中运行以下命令：');
    console.log('');
    console.log('  node scripts/start-networks.js anvil --fresh');
    console.log('');
    console.log('网络启动后，运行部署脚本：');
    console.log('');
    console.log('  npx hardhat run scripts/deploy-master.js --network anvil');
    console.log('');
    console.log('✅ 这将确保地址配置与实际部署的合约匹配！');
    
  } catch (error) {
    console.error('❌ 启动过程中发生错误:', error.message);
  }
}

async function redeployContracts() {
  try {
    console.log('🔄 重新部署合约到当前 Anvil 网络...');
    
    // 检查网络是否运行
    const { ethers } = require('hardhat');
    try {
      const provider = new ethers.JsonRpcProvider('http://localhost:8546');
      await provider.getNetwork();
      console.log('✅ Anvil 网络正在运行');
    } catch (error) {
      console.error('❌ 无法连接到 Anvil 网络');
      console.error('   请先启动 Anvil: node scripts/start-networks.js anvil --persistent');
      return;
    }
    
    console.log('📦 正在重新部署所有合约...');
    
    const deployScript = path.join(__dirname, '../deploy-master.js');
    if (!fs.existsSync(deployScript)) {
      console.error('❌ 找不到部署脚本');
      return;
    }
    
    await runCommand('npx', ['hardhat', 'run', deployScript, '--network', 'anvil']);
    
    console.log('✅ 合约重新部署完成！');
    console.log('📝 地址配置文件已更新，前端应该可以正常工作了。');
    
  } catch (error) {
    console.error('❌ 部署过程中发生错误:', error.message);
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

if (require.main === module) {
  fixAnvilAddresses().catch(console.error);
}

module.exports = { fixAnvilAddresses }; 