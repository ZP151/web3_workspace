const hre = require("hardhat");

async function debugV5LoanIssue() {
  try {
    console.log("🔍 调试 v5 合约贷款问题...");

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

    // 检查所有贷款
    console.log("\n📋 检查用户所有贷款...");
    const userLoans = await bank.getUserLoans(userAddress);
    console.log(`用户共有 ${userLoans.length} 个贷款`);

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

          // 详细分析微量数值
          const remainingPrincipal = loanStatus[1];
          const unpaidInterest = loanStatus[3];
          const totalOwed = loanStatus[4];
          
          console.log(`\n🧮 Wei级别分析 (贷款 #${i}):`);
          console.log(`  剩余本金 (wei): ${remainingPrincipal.toString()}`);
          console.log(`  未付利息 (wei): ${unpaidInterest.toString()}`);
          console.log(`  总欠款 (wei): ${totalOwed.toString()}`);
          
          const tolerance = hre.ethers.parseEther("0.000001");
          console.log(`  容忍阈值 (wei): ${tolerance.toString()}`);
          console.log(`  本金 ≤ 阈值: ${remainingPrincipal <= tolerance}`);
          console.log(`  利息 ≤ 阈值: ${unpaidInterest <= tolerance}`);
          console.log(`  应该被标记为已还清: ${remainingPrincipal <= tolerance && unpaidInterest <= tolerance}`);

          // 如果应该被标记为已还清但仍然活跃，那就有问题
          if (remainingPrincipal <= tolerance && unpaidInterest <= tolerance && loanStatus[5]) {
            console.log(`⚠️ 发现问题：贷款 #${i} 应该已还清但仍标记为活跃`);
          }

          // 尝试估算还款gas
          if (i === 2) { // 检查贷款ID 2
            console.log(`\n⛽ 尝试估算贷款 #${i} 的还款gas...`);
            try {
              const repayAmount = hre.ethers.parseEther("20");
              const gasEstimate = await bank.repayLoan.estimateGas(i, { value: repayAmount });
              console.log(`  估算gas: ${gasEstimate.toString()}`);
              
              // 尝试模拟调用
              console.log(`\n🔬 尝试模拟调用还款...`);
              const result = await bank.repayLoan.staticCall(i, { value: repayAmount });
              console.log(`  模拟调用成功`);
              
            } catch (gasError) {
              console.log(`  ❌ Gas估算失败:`, gasError.message);
              
              // 尝试更小的金额
              try {
                console.log(`  🔄 尝试更小金额还款...`);
                const smallAmount = totalOwed > 0 ? totalOwed + hre.ethers.parseEther("0.001") : hre.ethers.parseEther("0.001");
                const smallGasEstimate = await bank.repayLoan.estimateGas(i, { value: smallAmount });
                console.log(`  小额还款gas估算: ${smallGasEstimate.toString()}`);
              } catch (smallError) {
                console.log(`  小额还款也失败:`, smallError.message);
                
                // 检查是否是revert原因
                if (smallError.message.includes('revert')) {
                  console.log(`  🔍 检测到revert，可能的原因:`);
                  console.log(`    - 贷款不存在`);
                  console.log(`    - 贷款已经被标记为非活跃`);
                  console.log(`    - 合约逻辑错误`);
                }
              }
            }
          }

        } catch (error) {
          console.log(`  ⚠️ 无法获取详细状态: ${error.message}`);
        }
      }
    }

    // 检查合约状态
    console.log(`\n🏦 合约整体状态:`);
    const contractBalance = await bank.getContractBalance();
    console.log(`  合约余额: ${hre.ethers.formatEther(contractBalance)} ETH`);

  } catch (error) {
    console.error("❌ 调试失败:", error);
  }
}

debugV5LoanIssue()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  }); 