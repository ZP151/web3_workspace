const { ethers } = require("hardhat");

/**
 * Stage 4: Initialize Deployed Contracts
 * - Initialize EnhancedBank with community pools
 * - Set up initial savings goals
 * - Configure initial settings
 */
async function initializeContracts(deployedContracts) {
  console.log("🔧 Stage 4: Initialize Deployed Contracts");
  console.log("=".repeat(40));

  const [deployer] = await ethers.getSigners();

  try {
    // Initialize EnhancedBank
    if (deployedContracts.EnhancedBank) {
      console.log("\n🏦 Initializing EnhancedBank...");
      await initializeEnhancedBank(deployedContracts.EnhancedBank);
    }

    console.log("\n✅ Contract initialization completed!");
    return { initialized: true, timestamp: new Date().toISOString() };

  } catch (error) {
    console.error("❌ Contract initialization failed:", error.message);
    throw error;
  }
}

async function initializeEnhancedBank(bankAddress) {
  const EnhancedBank = await ethers.getContractFactory("EnhancedBank");
  const enhancedBank = EnhancedBank.attach(bankAddress);

  // Create initial community pools
  const initialPools = [
    '社区发展基金',
    '教育奖学金池', 
    '环保行动基金',
    '创业孵化池'
  ];

  console.log(`   📦 创建 ${initialPools.length} 个社区池...`);
  
  for (let i = 0; i < initialPools.length; i++) {
    try {
      const poolName = initialPools[i];
      console.log(`   创建池: ${poolName}`);
      
      const tx = await enhancedBank.createCommunityPool(poolName, {
        gasLimit: 300000
      });
      await tx.wait();
      console.log(`   ✅ ${poolName} 创建成功`);
      
    } catch (error) {
      console.log(`   ❌ 创建池失败:`, error.message);
    }
  }

  // Verify pools created
  try {
    const activePools = await enhancedBank.getActivePools();
    console.log(`   📊 成功创建 ${activePools.length} 个活跃池`);
    
    // Add initial funding to first pool if any exist
    if (activePools.length > 0) {
      console.log("   💰 为首个池添加初始资金...");
      const tx = await enhancedBank.contributeToPool(activePools[0], {
        value: ethers.parseEther('0.1'),
        gasLimit: 200000
      });
      await tx.wait();
      console.log("   ✅ 初始资金添加成功");
    }
    
  } catch (error) {
    console.log("   ⚠️  池验证失败:", error.message);
  }

  // Create a sample savings goal
  try {
    console.log("   🎯 创建示例储蓄目标...");
    const tx = await enhancedBank.createSavingsGoal(
      "紧急备用金",
      ethers.parseEther("1.0"),
      90, // 90 days
      { gasLimit: 200000 }
    );
    await tx.wait();
    console.log("   ✅ 示例储蓄目标创建成功");
  } catch (error) {
    console.log("   ⚠️  储蓄目标创建失败:", error.message);
  }
}

// Run directly if this script is executed
if (require.main === module) {
  // For standalone execution, need deployed contracts
  console.log("❌ This script requires deployed contracts as input");
  console.log("💡 Use this script through deploy-master.js");
  process.exit(1);
}

module.exports = { initializeContracts }; 