const hre = require("hardhat");

async function checkCurrentLoanStatus() {
  try {
    console.log("🔍 检查当前贷款状态...");

    // 读取合约地址
    const addresses = require('../../src/contracts/addresses.json');
    const networkId = hre.network.config.chainId?.toString() || '1337';
    const contractAddresses = addresses[networkId];
    
    const bankAddress = contractAddresses.EnhancedBank;
    console.log("🏦 Bank Address:", bankAddress);

    // 获取合约实例
    const EnhancedBank = await hre.ethers.getContractFactory("EnhancedBank");
    const bank = EnhancedBank.attach(bankAddress);

    // 获取签名者
    const [deployer] = await hre.ethers.getSigners();
    const userAddress = deployer.address;
    console.log("👤 User Address:", userAddress);

    // 获取所有贷款
    const userLoans = await bank.getUserLoans(userAddress);
    console.log(`📈 用户共有 ${userLoans.length} 个贷款`);

    for (let i = 0; i < userLoans.length; i++) {
      const loan = userLoans[i];
      console.log(`\n🔍 贷款 #${i}:`);
      console.log(`  原始金额: ${hre.ethers.formatEther(loan.amount)} ETH`);
      console.log(`  抵押品: ${hre.ethers.formatEther(loan.collateral)} ETH`);
      console.log(`  已还本金: ${hre.ethers.formatEther(loan.paidAmount || 0)} ETH`);
      console.log(`  已还利息: ${hre.ethers.formatEther(loan.paidInterest || 0)} ETH`);
      console.log(`  是否活跃: ${loan.isActive}`);

      if (loan.isActive) {
        try {
          // 获取详细状态
          const loanStatus = await bank.getLoanStatus(userAddress, i);
          console.log(`\n📊 详细状态 (贷款 #${i}):`);
          console.log(`  [0] 原始金额: ${hre.ethers.formatEther(loanStatus[0])} ETH`);
          console.log(`  [1] 剩余本金: ${hre.ethers.formatEther(loanStatus[1])} ETH`);
          console.log(`  [2] 累计利息: ${hre.ethers.formatEther(loanStatus[2])} ETH`);
          console.log(`  [3] 未付利息: ${hre.ethers.formatEther(loanStatus[3])} ETH`);
          console.log(`  [4] 总欠款: ${hre.ethers.formatEther(loanStatus[4])} ETH`);
          console.log(`  [5] 是否活跃: ${loanStatus[5]}`);

          // 计算详细的数值
          const remainingPrincipal = loanStatus[1];
          const unpaidInterest = loanStatus[3];
          const totalOwed = loanStatus[4];
          
          console.log(`\n🧮 数值分析 (贷款 #${i}):`);
          console.log(`  剩余本金 (wei): ${remainingPrincipal.toString()}`);
          console.log(`  未付利息 (wei): ${unpaidInterest.toString()}`);
          console.log(`  总欠款 (wei): ${totalOwed.toString()}`);
          
          // 检查是否应该被标记为已还清
          const threshold = hre.ethers.parseEther("0.000001"); // 0.000001 ETH
          console.log(`  容忍阈值 (wei): ${threshold.toString()}`);
          console.log(`  本金是否为0: ${remainingPrincipal == 0}`);
          console.log(`  利息是否 ≤ 阈值: ${unpaidInterest <= threshold}`);
          console.log(`  总欠款是否 ≤ 阈值: ${totalOwed <= threshold}`);
          
          if (remainingPrincipal == 0 && unpaidInterest <= threshold) {
            console.log(`  ✅ 按新逻辑应该被标记为已还清`);
          } else {
            console.log(`  ❌ 按新逻辑仍需继续还款`);
          }

          // 如果总欠款很小，尝试一次性还清
          if (totalOwed > 0 && totalOwed <= hre.ethers.parseEther("0.000001")) {
            console.log(`\n💸 建议还款金额: ${hre.ethers.formatEther(totalOwed)} ETH (微量清零)`);
          }

        } catch (error) {
          console.log(`  ⚠️ 无法获取详细状态: ${error.message}`);
        }
      }
    }

  } catch (error) {
    console.error("❌ 检查失败:", error);
  }
}

checkCurrentLoanStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  }); 