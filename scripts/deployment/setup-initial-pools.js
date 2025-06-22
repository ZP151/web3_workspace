const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('\n🏊 初始化社区储蓄池...');
    
    // 读取合约地址
    const addressesPath = path.join(__dirname, '../../src/contracts/addresses.json');
    if (!fs.existsSync(addressesPath)) {
        console.error('❌ 找不到合约地址文件，请先部署合约');
        return;
    }
    
    const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
    if (!addresses.enhancedBank) {
        console.error('❌ 找不到EnhancedBank合约地址');
        return;
    }
    
    const [deployer] = await ethers.getSigners();
    console.log('操作账户:', deployer.address);
    
    // 连接到合约
    const EnhancedBank = await ethers.getContractFactory('EnhancedBank');
    const enhancedBank = EnhancedBank.attach(addresses.enhancedBank);
    
    console.log('连接到合约:', addresses.enhancedBank);
    
    try {
        // 定义要创建的初始社区池
        const initialPools = [
            '社区发展基金',
            '教育奖学金池', 
            '环保行动基金',
            '创业孵化池',
            '医疗援助基金',
            '艺术文化支持'
        ];
        
        console.log(`\n📦 准备创建 ${initialPools.length} 个初始社区池...`);
        
        // 批量创建社区池
        for (let i = 0; i < initialPools.length; i++) {
            const poolName = initialPools[i];
            console.log(`创建池 ${i + 1}/${initialPools.length}: ${poolName}`);
            
            try {
                const tx = await enhancedBank.createCommunityPool(poolName, {
                    gasLimit: 300000
                });
                
                const receipt = await tx.wait();
                console.log(`✅ ${poolName} 创建成功, Gas费用: ${receipt.gasUsed.toString()}`);
                
                // 等待一小段时间避免网络拥堵
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`❌ 创建 ${poolName} 失败:`, error.message);
            }
        }
        
        // 验证创建结果
        console.log('\n🔍 验证创建结果...');
        const activePools = await enhancedBank.getActivePools();
        console.log(`当前活跃池数量: ${activePools.length}`);
        
        if (activePools.length > 0) {
            console.log('\n📋 活跃池列表:');
            
            // 使用单独查询方式避免ethers v6兼容性问题
            for (let i = 0; i < activePools.length; i++) {
                try {
                    const poolId = activePools[i];
                    const poolInfo = await enhancedBank.getPoolInfo(poolId);
                    
                    console.log(`池 #${poolId}: ${poolInfo[0]}`);
                    console.log(`  总金额: ${ethers.formatEther(poolInfo[1])} ETH`);
                    console.log(`  参与者: ${poolInfo[2].toString()} 人`);
                    console.log(`  奖励率: ${(Number(poolInfo[3]) / 100).toFixed(1)}%`);
                    console.log(`  状态: ${poolInfo[4] ? '活跃' : '非活跃'}`);
                    console.log('  ---');
                } catch (poolError) {
                    console.log(`❌ 获取池 #${activePools[i]} 信息失败:`, poolError.message);
                }
            }
        }
        
        // 可选：向一些池子添加初始资金
        console.log('\n💰 为社区池添加初始资金...');
        if (activePools.length > 0) {
            const initialContribution = ethers.parseEther('0.05'); // 0.05 ETH per pool
            
            for (let i = 0; i < Math.min(3, activePools.length); i++) {
                const poolId = activePools[i];
                const poolName = (await enhancedBank.getPoolInfo(poolId))[0];
                
                try {
                    console.log(`向 ${poolName} (Pool #${poolId}) 贡献 ${ethers.formatEther(initialContribution)} ETH`);
                    
                    const tx = await enhancedBank.contributeToPool(poolId, {
                        value: initialContribution,
                        gasLimit: 200000
                    });
                    
                    await tx.wait();
                    console.log(`✅ 贡献成功`);
                    
                } catch (error) {
                    console.error(`❌ 贡献失败:`, error.message);
                }
            }
        }
        
        // 最终状态检查
        console.log('\n🏁 最终状态检查...');
        const finalActivePools = await enhancedBank.getActivePools();
        
        let totalFunds = 0n;
        let totalParticipants = 0;
        
        // 使用单独查询避免ethers v6兼容性问题
        for (let i = 0; i < finalActivePools.length; i++) {
            try {
                const poolId = finalActivePools[i];
                const poolInfo = await enhancedBank.getPoolInfo(poolId);
                totalFunds += poolInfo[1]; // totalAmount
                totalParticipants += Number(poolInfo[2]); // participantCount
            } catch (error) {
                console.log(`⚠️  跳过池 #${finalActivePools[i]}: ${error.message}`);
            }
        }
        
        console.log('==========================================');
        console.log('社区池初始化完成!');
        console.log(`活跃池数量: ${finalActivePools.length}`);
        console.log(`总资金池: ${ethers.formatEther(totalFunds)} ETH`);
        console.log(`总参与者: ${totalParticipants} 人`);
        console.log('==========================================');
        
        // 更新地址文件，记录初始化状态
        addresses.communityPoolsInitialized = {
            timestamp: new Date().toISOString(),
            poolCount: finalActivePools.length,
            totalFunds: ethers.formatEther(totalFunds),
            initializer: deployer.address
        };
        
        fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
        console.log('📄 初始化状态已记录到地址文件');
        
        return {
            poolsCreated: finalActivePools.length,
            totalFunds: ethers.formatEther(totalFunds),
            success: true
        };
        
    } catch (error) {
        console.error('\n❌ 初始化失败:', error.message);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main()
        .then((result) => {
            if (result && result.success) {
                console.log('\n✅ 社区池初始化成功');
                process.exit(0);
            }
        })
        .catch((error) => {
            console.error('\n❌ 初始化脚本执行失败:', error);
            process.exit(1);
        });
}

module.exports = main; 