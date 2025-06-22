const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

// 引入其他部署脚本
const deployEnhancedBank = require('./deploy-enhanced-bank-v2');
const setupInitialPools = require('./setup-initial-pools');

async function main() {
    console.log('\n🚀 开始完整的增强银行系统设置...');
    console.log('============================================');
    
    const [deployer] = await ethers.getSigners();
    console.log('部署账户:', deployer.address);
    
    // 检查余额
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log('账户余额:', ethers.formatEther(balance), 'ETH');
    
    if (balance < ethers.parseEther('0.5')) {
        console.log('⚠️  建议余额至少0.5 ETH以确保完整设置');
    }
    
    let deployResult;
    let setupResult;
    
    try {
        // 第一步：部署增强版银行合约
        console.log('\n📦 第一步：部署增强版银行合约');
        console.log('--------------------------------------------');
        deployResult = await deployEnhancedBank();
        
        if (!deployResult || !deployResult.success) {
            throw new Error('合约部署失败');
        }
        
        console.log('✅ 合约部署成功!');
        console.log('合约地址:', deployResult.enhancedBank);
        
        // 等待一段时间确保合约完全部署
        console.log('\n⏱️  等待合约稳定...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 第二步：初始化社区池
        console.log('\n🏊 第二步：初始化社区储蓄池');
        console.log('--------------------------------------------');
        setupResult = await setupInitialPools();
        
        if (!setupResult || !setupResult.success) {
            console.log('⚠️  社区池初始化失败，但合约部署成功');
        } else {
            console.log('✅ 社区池初始化成功!');
            console.log(`创建池数量: ${setupResult.poolsCreated}`);
            console.log(`总资金池: ${setupResult.totalFunds} ETH`);
        }
        
        // 第三步：创建示例储蓄目标
        console.log('\n🎯 第三步：创建示例储蓄目标');
        console.log('--------------------------------------------');
        
        const addressesPath = path.join(__dirname, '../../src/contracts/addresses.json');
        const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
        
        const EnhancedBank = await ethers.getContractFactory('EnhancedBank');
        const enhancedBank = EnhancedBank.attach(addresses.enhancedBank);
        
        // 创建几个示例储蓄目标
        const sampleGoals = [
            { name: '买房首付', target: '5.0', days: 365 },
            { name: '旅行基金', target: '2.0', days: 180 },
            { name: '紧急备用金', target: '1.0', days: 90 }
        ];
        
        let goalsCreated = 0;
        for (const goal of sampleGoals) {
            try {
                console.log(`创建储蓄目标: ${goal.name} (目标: ${goal.target} ETH, ${goal.days}天)`);
                
                const tx = await enhancedBank.createSavingsGoal(
                    goal.name,
                    ethers.parseEther(goal.target),
                    goal.days,
                    { gasLimit: 200000 }
                );
                
                await tx.wait();
                goalsCreated++;
                console.log(`✅ ${goal.name} 创建成功`);
                
            } catch (error) {
                console.log(`❌ 创建 ${goal.name} 失败:`, error.message);
            }
        }
        
        console.log(`📊 成功创建 ${goalsCreated} 个储蓄目标`);
        
        // 第四步：生成系统状态报告
        console.log('\n📋 第四步：生成系统状态报告');
        console.log('--------------------------------------------');
        
        // 获取账户信息
        const account = await enhancedBank.accounts(deployer.address);
        
        // 获取池信息
        const activePools = await enhancedBank.getActivePools();
        let poolsInfo = null;
        
        // 安全获取池信息，避免ethers v6兼容性问题
        if (activePools.length > 0) {
            poolsInfo = {
                names: [],
                totalAmounts: [],
                participantCounts: []
            };
            
            for (let i = 0; i < activePools.length; i++) {
                try {
                    const poolId = activePools[i];
                    const info = await enhancedBank.getPoolInfo(poolId);
                    poolsInfo.names.push(info[0]);
                    poolsInfo.totalAmounts.push(info[1]);
                    poolsInfo.participantCounts.push(info[2]);
                } catch (error) {
                    console.log(`⚠️  跳过池 #${activePools[i]}: ${error.message}`);
                    poolsInfo.names.push('未知池');
                    poolsInfo.totalAmounts.push(0n);
                    poolsInfo.participantCounts.push(0);
                }
            }
        }
        
        // 获取储蓄目标
        const savingsGoals = await enhancedBank.getUserSavingsGoals(deployer.address);
        
        // 计算利息
        const currentInterest = await enhancedBank.calculateCurrentInterest(deployer.address);
        
        // 生成报告
        const report = {
            deployment: {
                contractAddress: addresses.enhancedBank,
                deployer: deployer.address,
                timestamp: new Date().toISOString(),
                network: (await ethers.provider.getNetwork()).name || 'localhost'
            },
            account: {
                balance: ethers.formatEther(account.balance),
                totalDeposited: ethers.formatEther(account.totalDeposited),
                totalWithdrawn: ethers.formatEther(account.totalWithdrawn),
                currentInterest: ethers.formatEther(currentInterest)
            },
            communityPools: {
                activeCount: activePools.length,
                pools: activePools.map((poolId, index) => ({
                    id: Number(poolId),
                    name: poolsInfo ? poolsInfo.names[index] : 'Unknown',
                    totalAmount: poolsInfo ? ethers.formatEther(poolsInfo.totalAmounts[index]) : '0',
                    participants: poolsInfo ? Number(poolsInfo.participantCounts[index]) : 0
                }))
            },
            savingsGoals: {
                count: savingsGoals.length,
                goals: savingsGoals.map((goal, index) => ({
                    id: index,
                    name: goal.name,
                    targetAmount: ethers.formatEther(goal.targetAmount),
                    currentAmount: ethers.formatEther(goal.currentAmount),
                    isActive: goal.isActive,
                    isAchieved: goal.isAchieved
                }))
            },
            features: {
                transferFunctions: ['transferInternal', 'transferExternal', 'batchTransfer', 'userToUserTransfer'],
                stakingFeatures: ['stake', 'unstake', 'calculateStakingReward'],
                loanFeatures: ['requestLoan', 'repayLoan', 'calculateLoanInterest'],
                defiFeatures: ['takeFlashLoan', 'repayFlashLoan'],
                socialFeatures: ['socialTransfer', 'createSavingsGoal', 'contributeToPool'],
                newFeatures: ['claimInterest', 'calculateCurrentInterest', 'getActivePools']
            }
        };
        
        // 保存报告
        const reportPath = path.join(__dirname, '../../deployment-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // 显示报告摘要
        console.log('\n🎉 完整设置完成！');
        console.log('============================================');
        console.log('📊 系统状态摘要:');
        console.log(`合约地址: ${report.deployment.contractAddress}`);
        console.log(`账户余额: ${report.account.balance} ETH`);
        console.log(`可领取利息: ${report.account.currentInterest} ETH`);
        console.log(`活跃社区池: ${report.communityPools.activeCount} 个`);
        console.log(`储蓄目标: ${report.savingsGoals.count} 个`);
        console.log(`部署网络: ${report.deployment.network}`);
        console.log('============================================');
        
        console.log('\n📄 详细报告已保存到: deployment-report.json');
        
        // 更新地址文件
        addresses.completeSetup = {
            timestamp: new Date().toISOString(),
            version: 'v2',
            status: 'completed',
            features: report.features,
            poolsCount: report.communityPools.activeCount,
            goalsCount: report.savingsGoals.count
        };
        
        fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
        
        console.log('\n💡 下一步操作建议:');
        console.log('1. 重启前端应用以加载新的合约地址');
        console.log('2. 测试存款、取款和转账功能');
        console.log('3. 验证利息计算和社区池功能');
        console.log('4. 测试储蓄目标和闪电贷功能');
        
        return {
            success: true,
            contractAddress: deployResult.enhancedBank,
            poolsCreated: setupResult ? setupResult.poolsCreated : 0,
            goalsCreated: goalsCreated,
            report: report
        };
        
    } catch (error) {
        console.error('\n❌ 完整设置失败:', error.message);
        
        // 尝试清理部分成功的部署
        if (deployResult && deployResult.success) {
            console.log('💡 合约已成功部署，可以手动继续设置');
            console.log('合约地址:', deployResult.enhancedBank);
        }
        
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main()
        .then((result) => {
            if (result && result.success) {
                console.log('\n✅ 完整设置成功执行');
                process.exit(0);
            }
        })
        .catch((error) => {
            console.error('\n❌ 设置脚本执行失败:', error);
            process.exit(1);
        });
}

module.exports = main; 