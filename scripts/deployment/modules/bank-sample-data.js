const { ethers } = require("hardhat");

/**
 * 银行示例数据设置模块
 * 包含：社区池、存款、储蓄目标、质押
 */
async function setupBankSampleData(bankAddress, deployer) {
  console.log("🏦 Setting up Bank Sample Data...");
  
  const EnhancedBank = await ethers.getContractFactory("EnhancedBank");
  const enhancedBank = EnhancedBank.attach(bankAddress);

  const results = {
    communityPools: 0,
    deposits: 0,
    savingsGoals: 0,
    stakes: 0
  };

  // 1. Create community pools
  const communityPools = [
    'Community Development Fund',
    'Education Scholarship Pool', 
    'Environmental Action Fund',
    'Startup Incubator Pool',
    'Medical Aid Fund',
    'Arts & Culture Support'
  ];

  console.log(`   📦 Creating ${communityPools.length} community pools...`);
  for (let i = 0; i < communityPools.length; i++) {
    try {
      const poolName = communityPools[i];
      console.log(`   Creating pool: ${poolName}`);
      const tx = await enhancedBank.createCommunityPool(poolName, {
        gasLimit: 300000
      });
      await tx.wait();
      console.log(`   ✅ ${poolName} created successfully`);
      results.communityPools++;
    } catch (error) {
      console.log(`   ⚠️ Pool creation failed (may already exist)`);
    }
  }

  // 2. Make initial deposit
  console.log("   💰 Deployer making initial deposit...");
  try {
    const depositAmount = ethers.parseEther("2.0");
    const tx = await enhancedBank.deposit({
      value: depositAmount,
      gasLimit: 200000
    });
    await tx.wait();
    console.log(`   ✅ Deposit ${ethers.formatEther(depositAmount)} ETH successful`);
    results.deposits++;
  } catch (error) {
    console.log("   ⚠️ Deposit failed:", error.message);
  }

  // 3. Contribute to community pools
  console.log("   🤝 Contributing to community pools...");
  try {
    const activePools = await enhancedBank.getActivePools();
    if (activePools.length > 0) {
      const contributionAmount = ethers.parseEther('0.1'); // 0.1 ETH per pool
      
      for (let i = 0; i < Math.min(3, activePools.length); i++) {
        const poolId = activePools[i];
        try {
          const tx = await enhancedBank.contributeToPool(poolId, {
            value: contributionAmount,
            gasLimit: 200000
          });
          await tx.wait();
          console.log(`   ✅ Contributed ${ethers.formatEther(contributionAmount)} ETH to pool #${poolId}`);
        } catch (error) {
          console.log(`   ⚠️ Contribution failed:`, error.message);
        }
      }
    }
  } catch (error) {
    console.log("   ⚠️ Failed to get active pools:", error.message);
  }

  // 4. Create savings goals
  console.log("   🎯 Creating sample savings goals...");
  const savingsGoals = [
    { name: "Emergency Fund", target: "1.0", days: 90 },
    { name: "Travel Fund", target: "0.5", days: 180 },
    { name: "New Device Purchase", target: "0.3", days: 60 }
  ];

  for (const goal of savingsGoals) {
    try {
      const tx = await enhancedBank.createSavingsGoal(
        goal.name,
        ethers.parseEther(goal.target),
        goal.days, // duration in days (contract expects days, not seconds)
        { gasLimit: 200000 }
      );
      await tx.wait();
      console.log(`   ✅ Savings goal "${goal.name}" created (target: ${goal.target} ETH)`);
      results.savingsGoals++;
    } catch (error) {
      console.log(`   ⚠️ Savings goal creation failed:`, error.message);
    }
  }

  // 5. Create stake
  console.log("   🔒 Creating sample stake...");
  try {
    const stakeAmount = ethers.parseEther("0.5"); // 0.5 ETH
    const tx = await enhancedBank.stake({
      value: stakeAmount,
      gasLimit: 200000
    });
    await tx.wait();
    console.log(`   ✅ Stake ${ethers.formatEther(stakeAmount)} ETH successful`);
    results.stakes++;
  } catch (error) {
    console.log("   ⚠️ Stake creation failed:", error.message);
  }

  console.log("   📊 Bank sample data setup completed");
  console.log(`   📋 Results: ${results.communityPools} pools, ${results.deposits} deposits, ${results.savingsGoals} goals, ${results.stakes} stakes`);
  
  return results;
}

module.exports = { setupBankSampleData }; 