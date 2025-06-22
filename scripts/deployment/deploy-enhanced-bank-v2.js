const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('\n🏦 部署增强版银行合约 v2...');
    
    // 获取部署账户
    const [deployer] = await ethers.getSigners();
    console.log('部署账户:', deployer.address);
    
    // 检查余额
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log('账户余额:', ethers.formatEther(balance), 'ETH');
    
    if (balance < ethers.parseEther('0.1')) {
        console.log('⚠️  余额不足，请确保有足够的ETH进行部署');
        return;
    }
    
    try {
        // 部署增强版银行合约
        console.log('\n📦 部署 EnhancedBank 合约...');
        const EnhancedBank = await ethers.getContractFactory('EnhancedBank');
        
        console.log('开始部署合约...');
        
        const enhancedBank = await EnhancedBank.deploy({
            gasLimit: 6000000 // 设置足够的gas限制
        });
        
        await enhancedBank.waitForDeployment();
        const enhancedBankAddress = await enhancedBank.getAddress();
        
        console.log('✅ EnhancedBank 部署成功!');
        console.log('合约地址:', enhancedBankAddress);
        
        // 验证合约功能
        console.log('\n🧪 验证合约功能...');
        
        // 测试存款功能
        const depositAmount = ethers.parseEther('0.1');
        console.log('测试存款:', ethers.formatEther(depositAmount), 'ETH');
        
        const depositTx = await enhancedBank.deposit({ 
            value: depositAmount,
            gasLimit: 200000
        });
        await depositTx.wait();
        console.log('✅ 存款测试成功');
        
        // 检查余额
        const account = await enhancedBank.accounts(deployer.address);
        console.log('银行账户余额:', ethers.formatEther(account.balance), 'ETH');
        
        // 测试新增的claimInterest功能
        try {
            // 等待一秒以产生一些利息（在真实网络中需要更长时间）
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const currentInterest = await enhancedBank.calculateCurrentInterest(deployer.address);
            console.log('当前可领取利息:', ethers.formatEther(currentInterest), 'ETH');
            
            if (currentInterest > 0) {
                const claimTx = await enhancedBank.claimInterest({ gasLimit: 200000 });
                await claimTx.wait();
                console.log('✅ 利息领取测试成功');
            } else {
                console.log('📝 利息为0（正常情况，需要更长时间积累）');
            }
        } catch (error) {
            console.log('📝 利息功能测试:', error.message);
        }
        
        // 测试获取活跃池功能
        try {
            const activePools = await enhancedBank.getActivePools();
            console.log('当前活跃池数量:', activePools.length);
            console.log('✅ 社区池功能正常');
        } catch (error) {
            console.log('❌ 社区池功能测试失败:', error.message);
        }
        
        // 更新合约地址配置
        const addressesPath = path.join(__dirname, '../../src/contracts/addresses.json');
        let addresses = {};
        
        if (fs.existsSync(addressesPath)) {
            const addressesData = fs.readFileSync(addressesPath, 'utf8');
            addresses = JSON.parse(addressesData);
        }
        
        // 备份旧地址
        if (addresses.enhancedBank) {
            addresses.enhancedBankV1 = addresses.enhancedBank;
            console.log('📄 旧合约地址已备份为 enhancedBankV1');
        }
        
        // 更新新地址
        addresses.enhancedBank = enhancedBankAddress;
        addresses.lastDeployment = {
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            network: (await ethers.provider.getNetwork()).name || 'localhost',
            version: 'v2',
            features: [
                'claimInterest',
                'calculateCurrentInterest', 
                'getActivePools',
                'getMultiplePoolsInfo',
                'getUserParticipatingPools',
                'Enhanced transfer functions',
                'Improved community pools'
            ]
        };
        
        fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
        console.log('📄 合约地址已更新到:', addressesPath);
        
        // 显示合约信息摘要
        console.log('\n📋 部署摘要:');
        console.log('==========================================');
        console.log('合约名称: EnhancedBank v2');
        console.log('合约地址:', enhancedBankAddress);
        console.log('部署者:', deployer.address);
        console.log('网络:', (await ethers.provider.getNetwork()).name || 'localhost');
        console.log('部署时间:', new Date().toLocaleString());
        console.log('新增功能:');
        console.log('  - claimInterest(): 手动领取存款利息');
        console.log('  - calculateCurrentInterest(): 计算当前可领取利息');
        console.log('  - getActivePools(): 获取所有活跃社区池');
        console.log('  - getMultiplePoolsInfo(): 批量获取池信息');
        console.log('  - getUserParticipatingPools(): 获取用户参与的池');
        console.log('==========================================');
        
        console.log('\n🎉 EnhancedBank v2 部署完成！');
        console.log('💡 请记得更新前端配置以使用新的合约地址');
        
        return {
            enhancedBank: enhancedBankAddress,
            deployer: deployer.address,
            success: true
        };
        
    } catch (error) {
        console.error('\n❌ 部署失败:', error.message);
        if (error.code === 'CALL_EXCEPTION') {
            console.log('💡 这可能是合约构造函数问题或网络问题');
        }
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main()
        .then((result) => {
            if (result && result.success) {
                console.log('\n✅ 部署脚本执行成功');
                process.exit(0);
            }
        })
        .catch((error) => {
            console.error('\n❌ 部署脚本执行失败:', error);
            process.exit(1);
        });
}

module.exports = main; 