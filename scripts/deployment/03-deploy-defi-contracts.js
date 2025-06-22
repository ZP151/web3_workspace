const { ethers } = require("hardhat");

/**
 * Stage 3: Deploy DeFi Contracts
 * - PlatformNFT: NFT collection contract
 * - NFTMarketplace: NFT trading marketplace  
 * - DEXPlatform: Decentralized exchange platform
 */
async function deployDeFiContracts(existingContracts = {}) {
  console.log("🏛️ Stage 3: Deploy DeFi Contracts");
  console.log("=".repeat(40));

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const deployedContracts = {};

  try {
    // 1. Deploy PlatformNFT contract
    console.log("\n🎨 Deploying PlatformNFT contract...");
    const PlatformNFT = await ethers.getContractFactory("PlatformNFT");
    const platformNFT = await PlatformNFT.deploy();
    await platformNFT.waitForDeployment();
    const platformNFTAddress = await platformNFT.getAddress();
    deployedContracts.PlatformNFT = platformNFTAddress;
    console.log("✅ PlatformNFT deployed successfully:", platformNFTAddress);

    // Verify PlatformNFT
    const nftName = await platformNFT.name();
    const nftSymbol = await platformNFT.symbol();
    console.log(`   📊 Name: ${nftName}, Symbol: ${nftSymbol}`);

    // 2. Deploy NFTMarketplace contract
    console.log("\n🛒 Deploying NFTMarketplace contract...");
    try {
      const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
      const nftMarketplace = await NFTMarketplace.deploy(
        platformNFTAddress, // nftContract
        deployerAddress     // feeRecipient
      );
      await nftMarketplace.waitForDeployment();
      const nftMarketplaceAddress = await nftMarketplace.getAddress();
      deployedContracts.NFTMarketplace = nftMarketplaceAddress;
      console.log("✅ NFTMarketplace deployed successfully:", nftMarketplaceAddress);

      // Verify NFTMarketplace
      const marketplaceFeeRecipient = await nftMarketplace.feeRecipient();
      console.log("   📊 Fee recipient:", marketplaceFeeRecipient);
    } catch (error) {
      console.log("⚠️ NFTMarketplace deployment skipped:", error.message);
    }

    // 3. Deploy DEXPlatform contract
    console.log("\n💱 Deploying DEXPlatform contract...");
    try {
      // Use USDC as reward token if available, otherwise use zero address
      let rewardToken = "0x0000000000000000000000000000000000000000";
      if (existingContracts.USDC) {
        rewardToken = existingContracts.USDC;
        console.log("   📊 Using USDC as reward token:", rewardToken);
      }

      const DEXPlatform = await ethers.getContractFactory("DEXPlatform");
      const dexPlatform = await DEXPlatform.deploy(
        deployerAddress, // feeRecipient
        rewardToken      // rewardToken
      );
      await dexPlatform.waitForDeployment();
      const dexPlatformAddress = await dexPlatform.getAddress();
      deployedContracts.DEXPlatform = dexPlatformAddress;
      console.log("✅ DEXPlatform deployed successfully:", dexPlatformAddress);

      // Verify DEXPlatform
      const dexFeeRecipient = await dexPlatform.feeRecipient();
      console.log("   📊 Fee recipient:", dexFeeRecipient);
    } catch (error) {
      console.log("⚠️ DEXPlatform deployment skipped:", error.message);
    }

    console.log("\n✅ DeFi contracts deployment completed!");
    return deployedContracts;

  } catch (error) {
    console.error("❌ DeFi contracts deployment failed:", error.message);
    throw error;
  }
}

// Run directly if this script is executed
if (require.main === module) {
  deployDeFiContracts()
    .then((contracts) => {
      console.log("\n📋 Deployment Summary:");
      Object.entries(contracts).forEach(([name, address]) => {
        console.log(`  ${name}: ${address}`);
      });
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { deployDeFiContracts }; 