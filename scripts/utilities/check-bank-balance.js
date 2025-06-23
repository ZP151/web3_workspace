const hre = require("hardhat");

async function checkBankBalance() {
  try {
    console.log("🏦 检查银行合约余额...");

    // 读取合约地址
    const addresses = require('../../src/contracts/addresses.json');
    const networkId = hre.network.config.chainId?.toString() || '1337';
    const contractAddresses = addresses[networkId];
    
    if (!contractAddresses?.EnhancedBank) {
      console.error("❌ 找不到 EnhancedBank 合约地址");
      return;
    }

    const bankAddress = contractAddresses.EnhancedBank;
    console.log("🏦 Bank Address:", bankAddress);

    // 获取银行合约余额
    const bankBalance = await hre.ethers.provider.getBalance(bankAddress);
    console.log(`💰 银行合约余额: ${hre.ethers.formatEther(bankBalance)} ETH`);

    // 获取合约实例
    const EnhancedBank = await hre.ethers.getContractFactory("EnhancedBank");
    const bank = EnhancedBank.attach(bankAddress);

    // 获取签名者
    const [deployer] = await hre.ethers.getSigners();
    const userAddress = deployer.address;
    console.log("👤 User Address:", userAddress);

    // 获取用户余额
    const userBalance = await hre.ethers.provider.getBalance(userAddress);
    console.log(`👤 用户余额: ${hre.ethers.formatEther(userBalance)} ETH`);

    // 获取用户贷款详情
    const userLoans = await bank.getUserLoans(userAddress);
    console.log(`📈 用户贷款数量: ${userLoans.length}`);

    let totalLoanAmount = 0n;
    let totalCollateral = 0n;

    for (let i = 0; i < userLoans.length; i++) {
      const loan = userLoans[i];
      if (loan.isActive) {
        totalLoanAmount += loan.amount;
        totalCollateral += loan.collateral;
        console.log(`📋 贷款 #${i}: ${hre.ethers.formatEther(loan.amount)} ETH (抵押: ${hre.ethers.formatEther(loan.collateral)} ETH)`);
      }
    }

    console.log(`\n💼 总计:`);
    console.log(`  活跃贷款总额: ${hre.ethers.formatEther(totalLoanAmount)} ETH`);
    console.log(`  用户抵押总额: ${hre.ethers.formatEther(totalCollateral)} ETH`);
    
    // 理论上银行应该有的余额 = 初始余额 + 用户抵押 - 贷出金额
    console.log(`\n🧮 余额分析:`);
    console.log(`  银行实际余额: ${hre.ethers.formatEther(bankBalance)} ETH`);
    console.log(`  用户抵押在银行: ${hre.ethers.formatEther(totalCollateral)} ETH`);
    console.log(`  银行贷出金额: ${hre.ethers.formatEther(totalLoanAmount)} ETH`);
    
    // 检查银行是否有足够的资金
    if (bankBalance < totalCollateral) {
      console.log(`⚠️ 警告: 银行余额 (${hre.ethers.formatEther(bankBalance)} ETH) 小于用户抵押总额 (${hre.ethers.formatEther(totalCollateral)} ETH)`);
    }

    // 检查贷款发放逻辑 - 查看最近的交易
    console.log(`\n📜 检查最近的区块和交易...`);
    
    const latestBlock = await hre.ethers.provider.getBlock('latest');
    console.log(`最新区块: ${latestBlock.number}`);
    
    // 检查过去10个区块的交易
    for (let i = Math.max(0, latestBlock.number - 10); i <= latestBlock.number; i++) {
      const block = await hre.ethers.provider.getBlock(i, true);
      if (block && block.transactions) {
        for (const tx of block.transactions) {
          if (tx.to === bankAddress) {
            console.log(`📝 银行交易 (块 ${i}): ${tx.hash}`);
            console.log(`   From: ${tx.from}`);
            console.log(`   Value: ${hre.ethers.formatEther(tx.value || 0)} ETH`);
            
            // 获取交易receipt
            const receipt = await hre.ethers.provider.getTransactionReceipt(tx.hash);
            if (receipt && receipt.logs) {
              console.log(`   Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
              console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
            }
          }
        }
      }
    }

  } catch (error) {
    console.error("❌ 检查失败:", error);
  }
}

checkBankBalance()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  }); 