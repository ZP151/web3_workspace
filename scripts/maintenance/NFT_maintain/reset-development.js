#!/usr/bin/env node

/**
 * 开发环境重置脚本
 * 
 * 该脚本用于完全重置开发环境，包括：
 * 1. 停止正在运行的Anvil和Hardhat网络
 * 2. 清理Anvil状态文件
 * 3. 重启网络
 * 4. 重新部署合约
 */

const { execSync } = require('child_process');
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

// 执行命令并打印输出
function runCommand(command, silent = false) {
  try {
    if (!silent) console.log(`\n🔄 Running: ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    if (!silent && output) console.log(output);
    return output;
  } catch (error) {
    if (!silent) console.error(`❌ Command failed: ${error.message}`);
    return null;
  }
}

// 检查进程是否在运行
function isProcessRunning(processName) {
  try {
    const command = process.platform === 'win32' 
      ? `tasklist /FI "IMAGENAME eq ${processName}*" /NH` 
      : `ps aux | grep ${processName} | grep -v grep`;
    
    const output = execSync(command, { encoding: 'utf8' });
    return output.toLowerCase().includes(processName.toLowerCase());
  } catch (error) {
    return false;
  }
}

// 主函数
async function main() {
  console.log('🔧 开发环境重置工具');
  console.log('='.repeat(50));
  
  // 显示警告
  console.log('\n⚠️  警告: 此操作将重置整个开发环境，包括:');
  console.log('   - 停止所有正在运行的区块链网络');
  console.log('   - 删除Anvil状态文件');
  console.log('   - 重新部署所有合约');
  console.log('   - 重置前端配置');
  
  const confirmed = await askConfirmation('\n确定要继续吗?');
  if (!confirmed) {
    console.log('\n❌ 操作已取消');
    rl.close();
    return;
  }
  
  // 步骤1: 检查并停止正在运行的网络
  console.log('\n🔍 步骤1: 检查并停止正在运行的网络...');
  
  // 检查是否有网络在运行
  const isAnvilRunning = isProcessRunning('anvil');
  const isHardhatRunning = isProcessRunning('hardhat');
  
  if (isAnvilRunning || isHardhatRunning) {
    console.log('   发现正在运行的网络进程，尝试停止...');
    
    if (process.platform === 'win32') {
      if (isAnvilRunning) runCommand('taskkill /F /IM "anvil.exe" /T');
      if (isHardhatRunning) runCommand('taskkill /F /IM "node.exe" /FI "WINDOWTITLE eq hardhat*" /T');
    } else {
      if (isAnvilRunning) runCommand('pkill -f anvil');
      if (isHardhatRunning) runCommand('pkill -f "hardhat node"');
    }
    
    console.log('   ✅ 网络进程已停止');
  } else {
    console.log('   ✅ 没有发现正在运行的网络进程');
  }
  
  // 步骤2: 清理Anvil状态文件
  console.log('\n🔍 步骤2: 清理Anvil状态文件...');
  
  if (fs.existsSync(ANVIL_STATE_FILE)) {
    fs.unlinkSync(ANVIL_STATE_FILE);
    console.log(`   ✅ 已删除Anvil状态文件: ${ANVIL_STATE_FILE}`);
  } else {
    console.log(`   ✅ Anvil状态文件不存在，无需清理`);
  }
  
  // 步骤3: 启动网络
  console.log('\n🔍 步骤3: 启动网络...');
  
  // 启动网络（后台运行）
  console.log('   启动Anvil网络...');
  
  // 使用node启动网络脚本，以便在后台运行
  const startNetworkCmd = 'start cmd.exe /k "node scripts/start-networks.js anvil --fresh"';
  runCommand(startNetworkCmd);
  
  // 等待网络启动
  console.log('   ⏳ 等待网络启动 (10秒)...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // 步骤4: 部署合约
  console.log('\n🔍 步骤4: 部署合约...');
  
  runCommand('npx hardhat run scripts/deploy-master.js --network anvil');
  
  console.log('\n✅ 开发环境重置完成!');
  console.log('\n🔧 接下来的步骤:');
  console.log('   1. 重启前端应用');
  console.log('   2. 确认网络连接正常');
  console.log('   3. 验证合约功能');
  
  rl.close();
}

// 运行主函数
main().catch(console.error); 