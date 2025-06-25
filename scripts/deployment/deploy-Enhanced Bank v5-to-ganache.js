const { ethers } = require("hardhat");
const fs = require('fs');

async function deployToGanache() {
  console.log('🚀 开始部署 Enhanced Bank v5 到 Ganache 网络...');
  
  try {
    // 直接连接到Ganache
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
    
    console.log(`📍 网络: Chain ID ${(await provider.getNetwork()).chainId}`);
    
    // 动态获取Ganache账户列表
    console.log('🔍 获取Ganache账户列表...');
    const accounts = await provider.send("eth_accounts", []);
    console.log(`📊 发现 ${accounts.length} 个账户`);
    
    // 找到有足够余额的账户
    let deployerAccount = null;
    let deployerBalance = 0n;
    let deployerPrivateKey = null;
    
    // Ganache的默认私钥（按顺序对应账户）
    const ganachePrivateKeys = [
      "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
      "0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1",
      "0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c",
      "0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913",
      "0xadd53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743",
      "0x395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd",
      "0xe485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52",
      "0xa453611d9419d0e56f499079478fd72c37b251a94bfde4d19872c44cf65386e3",
      "0x829e924fdf021ba3dbbc4225edfece9aca04b929d6e75613329ca6f1d31c0bb4",
      "0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773"
    ];
    
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      const balance = await provider.getBalance(account);
      console.log(`👤 账户 ${i}: ${account} - ${ethers.formatEther(balance)} ETH`);
      
      // 检查是否有对应的私钥且有足够余额
      if (balance >= ethers.parseEther("1.0") && i < ganachePrivateKeys.length && !deployerAccount) {
        try {
          const testWallet = new ethers.Wallet(ganachePrivateKeys[i]);
          if (testWallet.address.toLowerCase() === account.toLowerCase()) {
            deployerAccount = account;
            deployerBalance = balance;
            deployerPrivateKey = ganachePrivateKeys[i];
            console.log(`   ✅ 找到匹配的私钥，选择此账户作为部署者`);
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    if (!deployerAccount) {
      console.log('❌ 没有找到余额足够的账户来部署合约');
      return;
    }
    
    console.log(`\n✅ 选择部署者账户: ${deployerAccount}`);
    console.log(`💰 部署者余额: ${ethers.formatEther(deployerBalance)} ETH`);
    
    // 先检查原来的合约是否还存在
    const oldContractAddress = "0xde901A1C8118f639415c305773ce78a56B1303B0";
    const oldCode = await provider.getCode(oldContractAddress);
    
    if (oldCode !== '0x') {
      console.log(`\n✅ 发现原合约仍然存在: ${oldContractAddress}`);
      console.log(`📄 合约代码长度: ${oldCode.length}`);
      
      // 测试合约连接
      try {
        const testContract = new ethers.Contract(
          oldContractAddress,
          ["function minDeposit() view returns (uint256)"],
          provider
        );
        const minDeposit = await testContract.minDeposit();
        console.log(`🧪 合约测试成功 - 最小存款: ${ethers.formatEther(minDeposit)} ETH`);
        
        // 更新地址配置文件指向原合约
        const addressesPath = './src/contracts/addresses.json';
        let addresses = {};
        
        if (fs.existsSync(addressesPath)) {
          addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
        }
        
        if (!addresses["1337"]) {
          addresses["1337"] = {};
        }
        
        addresses["1337"].EnhancedBank = oldContractAddress;
        addresses["1337"].timestamp = new Date().toISOString();
        addresses["1337"].network = "Ganache Local (Existing)";
        
        fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
        console.log(`📄 地址已更新到: ${addressesPath}`);
        
        console.log('\n✅ 使用现有合约!');
        console.log(`🔗 合约地址: ${oldContractAddress}`);
        console.log('💡 前端应该可以正常连接到现有的合约');
        
        return;
        
      } catch (error) {
        console.log(`⚠️ 原合约测试失败: ${error.message}`);
        console.log('🔄 将部署新的合约...');
      }
    }
    
    // 部署新合约
    console.log('\n📋 开始部署新的 Enhanced Bank 合约...');
    
    // 需要私钥来签署交易 - 这里我们使用Ganache的默认私钥
    const wallet = new ethers.Wallet(deployerPrivateKey, provider);
    console.log(`🔑 使用私钥创建钱包: ${wallet.address}`);
    
    // 部署合约
    const EnhancedBank = await ethers.getContractFactory("EnhancedBank", wallet);
    console.log('⏳ 正在部署合约...');
    
    const enhancedBank = await EnhancedBank.deploy();
    await enhancedBank.waitForDeployment();
    
    const contractAddress = await enhancedBank.getAddress();
    console.log(`\n✅ Enhanced Bank v5 部署成功!`);
    console.log(`🔗 合约地址: ${contractAddress}`);
    
    // 验证合约
    const minDeposit = await enhancedBank.minDeposit();
    const minLoan = await enhancedBank.minLoanAmount();
    console.log(`💰 最小存款: ${ethers.formatEther(minDeposit)} ETH`);
    console.log(`🏦 最小贷款: ${ethers.formatEther(minLoan)} ETH`);
    
    // 更新地址配置文件
    const addressesPath = './src/contracts/addresses.json';
    let addresses = {};
    
    if (fs.existsSync(addressesPath)) {
      addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
    }
    
    if (!addresses["1337"]) {
      addresses["1337"] = {};
    }
    
    addresses["1337"].EnhancedBank = contractAddress;
    addresses["1337"].timestamp = new Date().toISOString();
    addresses["1337"].network = "Ganache Local (New Deployment)";
    addresses["1337"].deployedBy = deployerAccount;
    
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
    console.log(`📄 地址已更新到: ${addressesPath}`);
    
    // 保存部署报告
    const reportPath = './scripts/deployment/deployment-report-ganache.json';
    const report = {
      network: "ganache",
      chainId: 1337,
      timestamp: new Date().toISOString(),
      deployedBy: deployerAccount,
      contracts: {
        EnhancedBank: {
          address: contractAddress,
          version: "v5 - Ganache Dynamic Deployment"
        }
      },
      features: [
        "支持部分还款功能",
        "本金微量误差容忍（≤0.000001 ETH）",
        "利息微量误差容忍（≤0.000001 ETH）",
        "完整的贷款管理系统",
        "闪电贷支持"
      ]
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📋 部署报告已保存: ${reportPath}`);
    
    console.log('\n🎉 部署完成!');
    console.log('💡 现在可以在前端使用新的合约地址进行测试');
    
  } catch (error) {
    console.error('❌ 部署失败:', error);
  }
}

deployToGanache(); 