const hre = require("hardhat");

async function checkLoanStatus() {
  try {
    console.log("📊 检查用户贷款状态...");

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

    // 获取合约实例
    const EnhancedBank = await hre.ethers.getContractFactory("EnhancedBank");
    const bank = EnhancedBank.attach(bankAddress);

    // 获取签名者
    const [deployer] = await hre.ethers.getSigners();
    const userAddress = deployer.address;
    console.log("👤 User Address:", userAddress);

    // 获取用户贷款
    console.log("\n📋 获取用户贷款列表...");
    const userLoans = await bank.getUserLoans(userAddress);
    
    console.log(`📈 用户共有 ${userLoans.length} 个贷款`);
    
    if (userLoans.length === 0) {
      console.log("💡 用户没有任何贷款");
      return;
    }

    // 检查每个贷款的详细状态
    for (let i = 0; i < userLoans.length; i++) {
      const loan = userLoans[i];
      console.log(`\n🔍 贷款 #${i}:`);
      console.log(`  原始金额: ${hre.ethers.formatEther(loan.amount)} ETH`);
      console.log(`  抵押品: ${hre.ethers.formatEther(loan.collateral)} ETH`);
      console.log(`  开始时间: ${new Date(Number(loan.startTime) * 1000).toLocaleString()}`);
      console.log(`  利率: ${Number(loan.interestRate) / 100}%`);
      console.log(`  已还本金: ${hre.ethers.formatEther(loan.paidAmount || 0)} ETH`);
      console.log(`  已还利息: ${hre.ethers.formatEther(loan.paidInterest || 0)} ETH`);
      console.log(`  是否活跃: ${loan.isActive}`);

      if (loan.isActive) {
        try {
          // 尝试使用新的 getLoanStatus 函数
          const loanStatus = await bank.getLoanStatus(userAddress, i);
          console.log(`\n📊 详细状态 (贷款 #${i}):`);
          console.log(`  原始金额: ${hre.ethers.formatEther(loanStatus[0])} ETH`);
          console.log(`  剩余本金: ${hre.ethers.formatEther(loanStatus[1])} ETH`);
          console.log(`  累计利息: ${hre.ethers.formatEther(loanStatus[2])} ETH`);
          console.log(`  未付利息: ${hre.ethers.formatEther(loanStatus[3])} ETH`);
          console.log(`  总欠款: ${hre.ethers.formatEther(loanStatus[4])} ETH`);
          console.log(`  是否活跃: ${loanStatus[5]}`);
        } catch (statusError) {
          console.log(`  ⚠️ 无法获取详细状态: ${statusError.message}`);
          
          // 计算传统利息
          try {
            const interest = await bank.calculateLoanInterest(userAddress, i);
            console.log(`  传统利息计算: ${hre.ethers.formatEther(interest)} ETH`);
          } catch (interestError) {
            console.log(`  ⚠️ 利息计算失败: ${interestError.message}`);
          }
        }
      }
    }

    // 检查用户余额
    const balance = await hre.ethers.provider.getBalance(userAddress);
    console.log(`\n💰 用户钱包余额: ${hre.ethers.formatEther(balance)} ETH`);

  } catch (error) {
    console.error("❌ 检查失败:", error);
  }
}

checkLoanStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  }); 