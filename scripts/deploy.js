#!/usr/bin/env node

/**
 * Web3 DApp 完整部署脚本
 * 
 * 使用方法:
 * node deploy.js
 * 
 * 或者使用 PowerShell:
 * node deploy.js; if ($?) { Write-Host "部署成功" } else { Write-Host "部署失败" }
 */

const { spawn } = require('child_process');

console.log('🚀 启动 Web3 DApp 完整部署...');
console.log('============================================');

// 设置环境变量
process.env.NODE_ENV = 'development';

// 构造命令
const command = 'npx';
const args = ['hardhat', 'run', 'scripts/deploy-master.js', '--network', 'ganache'];

console.log('执行命令:', command, args.join(' '));
console.log('============================================\n');

// 启动部署进程
const deployProcess = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
});

// 处理进程退出
deployProcess.on('close', (code) => {
    console.log('\n============================================');
    
    if (code === 0) {
        console.log('🎉 部署完成！退出代码:', code);
        console.log('');
        console.log('✅ 成功部署的合约:');
        console.log('  - VotingCore: 治理投票合约');
        console.log('  - EnhancedBank v2: 增强版银行合约');
        console.log('  - TokenFactory: 代币工厂合约');
        console.log('  - USDC/DAI/WETH: 测试代币');
        console.log('  - PlatformNFT: NFT 合约');
        console.log('  - NFTMarketplace: NFT 市场');
        console.log('  - DEXPlatform: 去中心化交易所');
        console.log('');
        console.log('🏗️ 初始化完成:');
        console.log('  - 4个社区储蓄池已创建');
        console.log('  - 示例储蓄目标已创建');
        console.log('  - 初始资金已添加');
        console.log('');
        console.log('📄 查看合约地址: src/contracts/addresses.json');
        console.log('');
        console.log('💡 接下来的步骤:');
        console.log('  1. 启动前端: npm run dev');
        console.log('  2. 访问所有功能模块测试');
        console.log('  3. 银行系统现在支持利息领取');
        console.log('  4. 社区池和储蓄目标显示真实数据');
        
    } else {
        console.log('❌ 部署失败！退出代码:', code);
        console.log('');
        console.log('🔍 可能的解决方案:');
        console.log('  1. 检查 Ganache 网络是否正在运行');
        console.log('  2. 确保账户有足够的 ETH 余额');
        console.log('  3. 检查合约编译是否成功: npx hardhat compile');
        console.log('  4. 查看具体错误信息并相应处理');
    }
    
    console.log('============================================');
    process.exit(code);
});

// 处理中断信号
process.on('SIGINT', () => {
    console.log('\n\n⏹️  部署过程被用户中断');
    deployProcess.kill('SIGINT');
    process.exit(1);
});

// 处理错误
deployProcess.on('error', (error) => {
    console.error('\n❌ 部署进程启动失败:', error.message);
    console.log('\n🔍 请检查:');
    console.log('  1. Node.js 和 npm 是否正确安装');
    console.log('  2. 项目依赖是否安装: npm install');
    console.log('  3. Hardhat 是否正确配置');
    process.exit(1);
}); 