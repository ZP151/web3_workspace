const { ethers } = require("hardhat");

// Import sample data modules
const { setupBankSampleData } = require("./modules/bank-sample-data");
const { setupTokenFactorySampleData } = require("./modules/token-factory-sample-data");
const { setupNFTSampleData } = require("./modules/nft-sample-data");
const { setupDEXSampleData } = require("./modules/dex-sample-data");

/**
 * Stage 3: Initialize contracts and setup sample data
 * This stage calls individual sample data modules for easy maintenance
 */
async function initializeAndSetup(deployedContracts) {
  console.log("🚀 Stage 3: Initialize and Setup Sample Data");
  console.log("=" .repeat(50));

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log(`🔧 Operator: ${deployerAddress}`);
  console.log(`💰 Current balance: ${ethers.formatEther(await ethers.provider.getBalance(deployerAddress))} ETH`);

  let setupResults = {};

  try {
    // Part 1: Bank sample data
    if (deployedContracts.EnhancedBank) {
      console.log("\n🏦 Part 1: Bank Sample Data Setup");
      setupResults.bankData = await setupBankSampleData(deployedContracts.EnhancedBank, deployer);
    } else {
      console.log("\n⚠️ EnhancedBank not found, skipping bank sample data");
    }

    // Part 2: Token Factory sample data
    if (deployedContracts.TokenFactory) {
      console.log("\n🏭 Part 2: Token Factory Sample Data Setup");
      setupResults.tokenFactoryData = await setupTokenFactorySampleData(deployedContracts.TokenFactory, deployer);
    } else {
      console.log("\n⚠️ TokenFactory not found, skipping token factory sample data");
    }

    // Part 3: NFT sample data
    if (deployedContracts.PlatformNFT) {
      console.log("\n🎨 Part 3: NFT Sample Data Setup");
      setupResults.nftData = await setupNFTSampleData(deployedContracts.PlatformNFT, deployer);
    } else {
      console.log("\n⚠️ PlatformNFT not found, skipping NFT sample data");
    }

    // Part 4: DEX sample data
    if (deployedContracts.DEXPlatform && deployedContracts.WETH && deployedContracts.USDC && deployedContracts.DAI) {
      console.log("\n💱 Part 4: DEX Sample Data Setup");
      setupResults.dexData = await setupDEXSampleData(deployedContracts, deployer);
    } else {
      console.log("\n⚠️ DEX or tokens not found, skipping DEX sample data");
    }

    console.log("\n✅ Initialize and setup completed!");
    
    // Summary
    console.log("\n📊 Sample Data Summary:");
    if (setupResults.bankData) {
      console.log(`   🏦 Bank: ${setupResults.bankData.communityPools} pools, ${setupResults.bankData.savingsGoals} goals, ${setupResults.bankData.stakes} stakes`);
    }
    if (setupResults.tokenFactoryData) {
      console.log(`   🏭 TokenFactory: ${setupResults.tokenFactoryData.tokensCreated} tokens created`);
    }
    if (setupResults.nftData) {
      console.log(`   🎨 NFTs: ${setupResults.nftData.nftsMinted} NFTs minted`);
    }
    if (setupResults.dexData) {
      console.log(`   💱 DEX: ${setupResults.dexData.poolsCreated} pools, ${setupResults.dexData.liquidityAdded} funded`);
    }
    
    return { 
      initialized: true,
      sampleDataCreated: true,
      timestamp: new Date().toISOString(),
      operator: deployerAddress,
      results: setupResults
    };

  } catch (error) {
    console.error("❌ Initialize and setup failed:", error.message);
    throw error;
  }
}

module.exports = { initializeAndSetup }; 