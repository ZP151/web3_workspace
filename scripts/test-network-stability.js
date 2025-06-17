const { ethers } = require('hardhat');

async function testNetworkStability() {
    console.log('🔍 测试网络连接稳定性...\n');
    
    const provider = ethers.provider;
    let successCount = 0;
    let failCount = 0;
    const testCount = 10;
    
    console.log(`进行 ${testCount} 次网络连接测试:\n`);
    
    for (let i = 1; i <= testCount; i++) {
        try {
            const start = Date.now();
            const blockNumber = await provider.getBlockNumber();
            const end = Date.now();
            const latency = end - start;
            
            console.log(`✅ 测试 ${i}: 成功 - 区块号: ${blockNumber}, 延迟: ${latency}ms`);
            successCount++;
            
        } catch (error) {
            console.log(`❌ 测试 ${i}: 失败 - ${error.message}`);
            failCount++;
        }
        
        // 间隔500ms
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n📊 测试结果:');
    console.log(`✅ 成功: ${successCount}/${testCount} (${(successCount/testCount*100).toFixed(1)}%)`);
    console.log(`❌ 失败: ${failCount}/${testCount} (${(failCount/testCount*100).toFixed(1)}%)`);
    
    if (failCount > 0) {
        console.log('\n⚠️  网络连接不稳定，建议:');
        console.log('1. 检查Ganache是否正常运行');
        console.log('2. 重启Ganache');
        console.log('3. 检查网络配置');
        console.log('4. 尝试切换到其他网络');
    } else {
        console.log('\n✅ 网络连接稳定');
    }
}

async function testContractConnection() {
    console.log('\n🔍 测试智能合约连接...\n');
    
    try {
        // 获取部署的合约地址
        const fs = require('fs');
        const path = require('path');
        const addressesPath = path.join(__dirname, '../src/contracts/addresses.json');
        
        if (!fs.existsSync(addressesPath)) {
            console.log('❌ 合约地址文件不存在，请先部署合约');
            return;
        }
        
        const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
        const network = await ethers.provider.getNetwork();
        const chainId = network.chainId.toString();
        
        console.log(`当前网络: ${chainId}`);
        
        if (!addresses[chainId]) {
            console.log(`❌ 在网络 ${chainId} 上没有部署的合约`);
            return;
        }
        
        const contracts = addresses[chainId];
        console.log('测试合约连接:');
        
        for (const [contractName, contractAddress] of Object.entries(contracts)) {
            try {
                const code = await ethers.provider.getCode(contractAddress);
                if (code === '0x') {
                    console.log(`❌ ${contractName}: 合约不存在 (${contractAddress})`);
                } else {
                    console.log(`✅ ${contractName}: 连接成功 (${contractAddress})`);
                }
            } catch (error) {
                console.log(`❌ ${contractName}: 连接失败 - ${error.message}`);
            }
        }
        
    } catch (error) {
        console.log('❌ 测试合约连接时出错:', error.message);
    }
}

async function main() {
    console.log('🚀 开始网络诊断...\n');
    
    // 测试基础网络连接
    await testNetworkStability();
    
    // 测试合约连接
    await testContractConnection();
    
    console.log('\n🏁 诊断完成');
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('诊断过程中出错:', error);
            process.exit(1);
        });
}

module.exports = { testNetworkStability, testContractConnection }; 