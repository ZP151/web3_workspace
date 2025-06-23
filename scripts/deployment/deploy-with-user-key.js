const { ethers } = require("hardhat");
const fs = require('fs');

async function deployWithUserKey() {
  console.log('🚀 使用用户私钥部署 Enhanced Bank v5 到 Ganache 网络...');
  
  try {
    // 直接连接到Ganache
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
    
    console.log(`📍 网络: Chain ID ${(await provider.getNetwork()).chainId}`);
    
    // 使用用户提供的完整私钥
    const userPrivateKey = "0xa6a29b8562332a29a33a5692819053e8a4aa22a5bdb5d5e2385554e36302591f";
    const wallet = new ethers.Wallet(userPrivateKey, provider);
    
    console.log(`👤 部署者账户: ${wallet.address}`);
    
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 部署者余额: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < ethers.parseEther("0.1")) {
      console.log('❌ 部署者余额不足，需要至少0.1 ETH');
      return;
    }
    
    // 先检查原来的合约是否还存在且可用
    const oldContractAddress = "0xde901A1C8118f639415c305773ce78a56B1303B0";
    const oldCode = await provider.getCode(oldContractAddress);
    
    if (oldCode !== '0x') {
      console.log(`\n✅ 发现原合约: ${oldContractAddress}`);
      console.log(`📄 合约代码长度: ${oldCode.length}`);
      
      // 测试原合约是否可用
      try {
        const testContract = new ethers.Contract(
          oldContractAddress,
          [
            "function minDeposit() view returns (uint256)",
            "function getUserLoans(address) view returns (tuple(address borrower, uint256 amount, uint256 collateral, uint256 interestRate, uint256 startTime, bool isActive, uint256 paidAmount, uint256 paidInterest)[])"
          ],
          provider
        );
        
        const minDeposit = await testContract.minDeposit();
        console.log(`🧪 合约功能测试成功 - 最小存款: ${ethers.formatEther(minDeposit)} ETH`);
        
        // 测试获取用户贷款
        const userLoans = await testContract.getUserLoans(wallet.address);
        console.log(`📋 用户贷款数量: ${userLoans.length}`);
        
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
        addresses["1337"].network = "Ganache Local (Verified Existing)";
        addresses["1337"].verifiedBy = wallet.address;
        
        fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
        console.log(`📄 地址已更新到: ${addressesPath}`);
        
        console.log('\n✅ 使用现有合约!');
        console.log(`🔗 合约地址: ${oldContractAddress}`);
        console.log('💡 原合约功能正常，前端应该可以正常使用');
        
        return;
        
      } catch (error) {
        console.log(`⚠️ 原合约测试失败: ${error.message}`);
        console.log('🔄 将部署新的合约...');
      }
    }
    
    // 部署新合约
    console.log('\n📋 开始部署新的 Enhanced Bank 合约...');
    
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
    
    // 测试基本功能
    console.log('\n🧪 测试合约基本功能...');
    const userBalance = await enhancedBank.accounts(wallet.address);
    console.log(`📊 用户银行账户余额: ${ethers.formatEther(userBalance.balance)} ETH`);
    
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
    addresses["1337"].deployedBy = wallet.address;
    
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
    console.log(`📄 地址已更新到: ${addressesPath}`);
    
    // 保存部署报告
    const reportPath = './scripts/deployment/deployment-report-ganache.json';
    const report = {
      network: "ganache",
      chainId: 1337,
      timestamp: new Date().toISOString(),
      deployedBy: wallet.address,
      contracts: {
        EnhancedBank: {
          address: contractAddress,
          version: "v5 - User Key Deployment"
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

deployWithUserKey();