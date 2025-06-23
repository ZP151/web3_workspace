const hre = require("hardhat");

async function comprehensiveLoanCheck() {
  try {
    console.log("🔍 全面检查贷款状态...");

    // 读取合约地址
    const addresses = require('../../src/contracts/addresses.json');
    const networkId = hre.network.config.chainId?.toString() || '1337';
    const contractAddresses = addresses[networkId];
    
    const bankAddress = contractAddresses.EnhancedBank;
    console.log("🏦 Bank v5 Address:", bankAddress);

    // 获取合约实例
    const EnhancedBank = await hre.ethers.getContractFactory("EnhancedBank");
    const bank = EnhancedBank.attach(bankAddress);

    // 获取签名者
    const [deployer] = await hre.ethers.getSigners();
    const userAddress = deployer.address;
    console.log("👤 User Address:", userAddress);

    // 获取所有贷款
    console.log("\n📋 获取用户所有贷款...");
    const allLoans = await bank.getUserLoans(userAddress);
    console.log(`用户总共有 ${allLoans.length} 个贷款记录`);

    const activeLoans = [];
    const repaidLoans = [];

    for (let i = 0; i < allLoans.length; i++) {
      const loan = allLoans[i];
      console.log(`\n🔍 贷款 #${i} 基本信息:`);
      console.log(`  原始金额: ${hre.ethers.formatEther(loan.amount)} ETH`);
      console.log(`  抵押品: ${hre.ethers.formatEther(loan.collateral)} ETH`);
      console.log(`  已还本金: ${hre.ethers.formatEther(loan.paidAmount || 0)} ETH`);
      console.log(`  已还利息: ${hre.ethers.formatEther(loan.paidInterest || 0)} ETH`);
      console.log(`  开始时间: ${new Date(Number(loan.startTime) * 1000).toLocaleString()}`);
      console.log(`  是否活跃: ${loan.isActive}`);

      if (loan.isActive) {
        activeLoans.push({ index: i, loan });
        
        try {
          // 获取活跃贷款的详细状态
          const loanStatus = await bank.getLoanStatus(userAddress, i);
          console.log(`\n📊 活跃贷款 #${i} 详细状态:`);
          console.log(`  [0] 原始金额: ${hre.ethers.formatEther(loanStatus[0])} ETH`);
          console.log(`  [1] 剩余本金: ${hre.ethers.formatEther(loanStatus[1])} ETH`);
          console.log(`  [2] 累计利息: ${hre.ethers.formatEther(loanStatus[2])} ETH`);
          console.log(`  [3] 未付利息: ${hre.ethers.formatEther(loanStatus[3])} ETH`);
          console.log(`  [4] 总欠款: ${hre.ethers.formatEther(loanStatus[4])} ETH`);
          console.log(`  [5] 是否活跃: ${loanStatus[5]}`);

          // 分析状态一致性
          const contractSaysActive = loanStatus[5];
          const loanSaysActive = loan.isActive;
          
          if (contractSaysActive !== loanSaysActive) {
            console.log(`⚠️ 状态不一致！getLoanStatus说: ${contractSaysActive}, loan.isActive说: ${loanSaysActive}`);
          }

          // 检查是否应该被标记为已还清
          const remainingPrincipal = loanStatus[1];
          const unpaidInterest = loanStatus[3];
          const tolerance = hre.ethers.parseEther("0.000001");
          
          if (remainingPrincipal <= tolerance && unpaidInterest <= tolerance) {
            console.log(`✅ 贷款 #${i} 应该被视为已还清（微量余额）`);
            if (contractSaysActive) {
              console.log(`⚠️ 但合约仍然标记为活跃，可能存在问题`);
            }
          }

        } catch (error) {
          console.log(`❌ 获取贷款 #${i} 详细状态失败:`, error.message);
        }
      } else {
        repaidLoans.push({ index: i, loan });
        console.log(`✅ 贷款 #${i} 已还清`);
      }
    }

    // 总结分类
    console.log(`\n📊 贷款分类总结:`);
    console.log(`  活跃贷款: ${activeLoans.length} 个`);
    console.log(`  已还清贷款: ${repaidLoans.length} 个`);
    console.log(`  总计: ${allLoans.length} 个`);

    if (activeLoans.length > 0) {
      console.log(`\n🔥 活跃贷款列表:`);
      activeLoans.forEach(({ index, loan }) => {
        const originalAmount = Number(loan.amount) / 1e18;
        const paidAmount = Number(loan.paidAmount || 0) / 1e18;
        const remaining = originalAmount - paidAmount;
        console.log(`  贷款 #${index}: 原始 ${originalAmount.toFixed(4)} ETH, 剩余 ${remaining.toFixed(6)} ETH`);
      });
    }

    if (repaidLoans.length > 0) {
      console.log(`\n✅ 已还清贷款历史:`);
      repaidLoans.forEach(({ index, loan }) => {
        const originalAmount = Number(loan.amount) / 1e18;
        const paidPrincipal = Number(loan.paidAmount || 0) / 1e18;
        const paidInterest = Number(loan.paidInterest || 0) / 1e18;
        const startTime = new Date(Number(loan.startTime) * 1000);
        console.log(`  贷款 #${index}: ${originalAmount.toFixed(4)} ETH, 已还本金 ${paidPrincipal.toFixed(6)} ETH + 利息 ${paidInterest.toFixed(6)} ETH, 开始于 ${startTime.toLocaleDateString()}`);
      });
    }

    // 检查合约整体状态
    console.log(`\n🏦 合约整体状态:`);
    const contractBalance = await bank.getContractBalance();
    console.log(`  合约总余额: ${hre.ethers.formatEther(contractBalance)} ETH`);

    return {
      totalLoans: allLoans.length,
      activeLoans: activeLoans.length,
      repaidLoans: repaidLoans.length,
      activeLoansList: activeLoans,
      repaidLoansList: repaidLoans
    };

  } catch (error) {
    console.error("❌ 检查失败:", error);
  }
}

comprehensiveLoanCheck()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  }); 