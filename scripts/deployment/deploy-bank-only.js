#!/usr/bin/env node

/**
 * 增强银行系统 v2 部署脚本
 * 
 * 使用方法:
 * node deploy-v2.js
 * 
 * 或者使用 PowerShell:
 * node deploy-v2.js; if ($?) { Write-Host "部署成功" } else { Write-Host "部署失败" }
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动增强银行系统 v2 部署...');
console.log('============================================');

// 设置环境变量
process.env.NODE_ENV = 'development';

// 构造命令
const command = 'npx';
const args = ['hardhat', 'run', 'scripts/deployment/complete-enhanced-setup.js', '--network', 'ganache'];

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
        console.log('✅ 成功项目:');
        console.log('  - EnhancedBank v2 合约部署');
        console.log('  - 社区储蓄池初始化');
        console.log('  - 示例储蓄目标创建');
        console.log('  - 系统状态报告生成');
        console.log('');
        console.log('📄 查看详细报告: deployment-report.json');
        console.log('🔧 合约地址配置: src/contracts/addresses.json');
        console.log('');
        console.log('💡 接下来的步骤:');
        console.log('  1. 启动前端: npm run dev');
        console.log('  2. 访问银行系统测试功能');
        console.log('  3. 测试新增的利息领取功能');
        console.log('  4. 验证社区池和储蓄目标');
        
    } else {
        console.log('❌ 部署失败！退出代码:', code);
        console.log('');
        console.log('🔍 可能的解决方案:');
        console.log('  1. 检查 Hardhat 网络是否正在运行: npx hardhat node');
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