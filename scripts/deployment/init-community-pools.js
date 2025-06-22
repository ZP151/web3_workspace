const { ethers } = require("hardhat");

async function main() {
  console.log("🏆 Initializing Community Pools");
  console.log("=".repeat(40));

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  // Load contract addresses
  const addresses = require("../../src/contracts/addresses.json");
  const contractAddresses = addresses[chainId];
  
  if (!contractAddresses || !contractAddresses.EnhancedBank) {
    console.log("❌ EnhancedBank contract not found for network", chainId);
    return;
  }

  const enhancedBankAddress = contractAddresses.EnhancedBank;
  console.log("📍 EnhancedBank address:", enhancedBankAddress);

  // Get contract
  const EnhancedBank = await ethers.getContractAt("EnhancedBank", enhancedBankAddress);

  try {
    // Create community pools
    console.log("\n🌟 Creating Beginner-Friendly Pool...");
    await EnhancedBank.createCommunityPool("Beginner-Friendly Pool");
    console.log("✅ Pool 1 created");

    console.log("\n💎 Creating Diamond Hands Pool...");
    await EnhancedBank.createCommunityPool("Diamond Hands Pool");
    console.log("✅ Pool 2 created");

    console.log("\n🚀 Creating Innovation Project Pool...");
    await EnhancedBank.createCommunityPool("Innovation Project Pool");
    console.log("✅ Pool 3 created");

    console.log("\n✅ All community pools initialized successfully!");

  } catch (error) {
    console.error("❌ Failed to initialize pools:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 