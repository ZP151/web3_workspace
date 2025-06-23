const hre = require("hardhat");

async function debugPartialRepayment() {
  try {
    console.log("🐛 调试部分还款问题...");

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

    // 获取贷款#1的详细状态
    const loanIndex = 1;
    console.log(`\n🔍 检查贷款 #${loanIndex} 的状态...`);

    try {
      const loanStatus = await bank.getLoanStatus(userAddress, loanIndex);
      console.log("📊 贷款状态 (getLoanStatus):");
      console.log(`  [0] 原始金额: ${hre.ethers.formatEther(loanStatus[0])} ETH`);
      console.log(`  [1] 剩余本金: ${hre.ethers.formatEther(loanStatus[1])} ETH`);
      console.log(`  [2] 累计利息: ${hre.ethers.formatEther(loanStatus[2])} ETH`);
      console.log(`  [3] 未付利息: ${hre.ethers.formatEther(loanStatus[3])} ETH`);
      console.log(`  [4] 总欠款: ${hre.ethers.formatEther(loanStatus[4])} ETH`);
      console.log(`  [5] 是否活跃: ${loanStatus[5]}`);

      if (!loanStatus[5]) {
        console.log("❌ 贷款已不活跃，无法进行还款");
        return;
      }

      // 获取用户贷款原始数据
      const userLoans = await bank.getUserLoans(userAddress);
      const loan = userLoans[loanIndex];
      console.log("\n📋 原始贷款数据:");
      console.log(`  原始金额: ${hre.ethers.formatEther(loan.amount)} ETH`);
      console.log(`  抵押品: ${hre.ethers.formatEther(loan.collateral)} ETH`);
      console.log(`  已还本金: ${hre.ethers.formatEther(loan.paidAmount || 0)} ETH`);
      console.log(`  已还利息: ${hre.ethers.formatEther(loan.paidInterest || 0)} ETH`);
      console.log(`  是否活跃: ${loan.isActive}`);

      // 模拟20 ETH的第二次还款
      const repaymentAmount = hre.ethers.parseEther("20");
      console.log(`\n💸 模拟第二次还款: ${hre.ethers.formatEther(repaymentAmount)} ETH`);

      // 检查各种可能的失败原因
      console.log("\n🔍 检查可能的失败原因:");

      // 1. 检查用户余额
      const userBalance = await hre.ethers.provider.getBalance(userAddress);
      console.log(`💰 用户余额: ${hre.ethers.formatEther(userBalance)} ETH`);
      
      if (userBalance < repaymentAmount) {
        console.log("❌ 用户余额不足");
        return;
      }

      // 2. 检查是否超过总欠款
      const totalOwed = loanStatus[4];
      if (repaymentAmount > totalOwed) {
        console.log(`❌ 还款金额 (${hre.ethers.formatEther(repaymentAmount)} ETH) 超过总欠款 (${hre.ethers.formatEther(totalOwed)} ETH)`);
      } else {
        console.log(`✅ 还款金额在允许范围内`);
      }

      // 3. 尝试静态调用以获取更详细的错误信息
      console.log("\n🧪 执行静态调用测试...");
      try {
        await bank.repayLoan.staticCall(loanIndex, { value: repaymentAmount });
        console.log("✅ 静态调用成功，应该不会失败");
      } catch (staticError) {
        console.log("❌ 静态调用失败:", staticError.message);
        
        // 分析错误原因
        if (staticError.message.includes("Loan not active")) {
          console.log("💡 原因: 贷款不活跃");
        } else if (staticError.message.includes("repayment amount")) {
          console.log("💡 原因: 还款金额问题");
        } else if (staticError.message.includes("overflow")) {
          console.log("💡 原因: 数值溢出");
        } else if (staticError.message.includes("underflow")) {
          console.log("💡 原因: 数值下溢");
        } else {
          console.log("💡 未知错误，需要查看合约代码");
        }
        
        // 打印详细的错误数据
        if (staticError.data) {
          console.log("🔍 错误数据:", staticError.data);
        }
        
        return;
      }

      // 4. 如果静态调用成功，检查gas估算
      try {
        const gasEstimate = await bank.repayLoan.estimateGas(loanIndex, { value: repaymentAmount });
        console.log(`⛽ Gas 估算: ${gasEstimate.toString()}`);
      } catch (gasError) {
        console.log("❌ Gas 估算失败:", gasError.message);
      }

      // 5. 检查合约状态
      const contractBalance = await hre.ethers.provider.getBalance(bankAddress);
      console.log(`🏦 银行合约余额: ${hre.ethers.formatEther(contractBalance)} ETH`);

      // 6. 检查是否有其他活跃贷款会造成冲突
      console.log("\n📋 检查所有用户贷款:");
      for (let i = 0; i < userLoans.length; i++) {
        const loan = userLoans[i];
        console.log(`  贷款 #${i}: ${loan.isActive ? '活跃' : '已还清'} - ${hre.ethers.formatEther(loan.amount)} ETH`);
      }

    } catch (error) {
      console.log(`❌ 无法获取贷款状态: ${error.message}`);
      console.log("💡 这可能表明合约版本不匹配或贷款不存在");
    }

  } catch (error) {
    console.error("❌ 调试失败:", error);
  }
}

debugPartialRepayment()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  }); 