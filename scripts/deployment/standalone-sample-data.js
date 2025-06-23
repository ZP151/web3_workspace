const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Import sample data modules
const { setupBankSampleData } = require("./modules/bank-sample-data");
const { setupTokenFactorySampleData } = require("./modules/token-factory-sample-data");
const { setupNFTSampleData } = require("./modules/nft-sample-data");
const { setupDEXSampleData } = require("./modules/dex-sample-data");

/**
 * Standalone Sample Data Script
 * This script allows running individual sample data modules independently
 */
async function main() {
  console.log("🚀 Standalone Sample Data Setup");
  console.log("=".repeat(50));

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  console.log(`🔧 Configuration:`);
  console.log(`   Deployer: ${deployerAddress}`);
  console.log(`   Network: ${network.name} (${chainId})`);
  console.log(`   Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployerAddress))} ETH`);

  // Load deployed contracts
  const deployedContracts = await loadContractAddresses(chainId);
  console.log(`📄 Loaded ${Object.keys(deployedContracts).length} contract addresses`);

  // Command line argument parsing - check both args and environment variable
  const args = process.argv.slice(2);
  const module = process.env.SAMPLE_MODULE || args[0] || 'all';

  const setupResults = {};

  try {
    switch (module.toLowerCase()) {
      case 'bank':
        console.log("\n🏦 Running Bank Sample Data Only");
        setupResults.bankData = await setupBankSampleData(deployedContracts.EnhancedBank, deployer);
        break;

      case 'tokens':
      case 'tokenfactory':
        console.log("\n🏭 Running Token Factory Sample Data Only");
        setupResults.tokenFactoryData = await setupTokenFactorySampleData(deployedContracts.TokenFactory, deployer);
        break;

      case 'nft':
        console.log("\n🎨 Running NFT Sample Data Only");
        setupResults.nftData = await setupNFTSampleData(deployedContracts.PlatformNFT, deployer);
        break;

      case 'dex':
        console.log("\n💱 Running DEX Sample Data Only");
        setupResults.dexData = await setupDEXSampleData(deployedContracts, deployer);
        break;

      case 'all':
      default:
        console.log("\n🎯 Running All Sample Data Modules");
        
        if (deployedContracts.EnhancedBank) {
          console.log("\n🏦 Bank Sample Data");
          setupResults.bankData = await setupBankSampleData(deployedContracts.EnhancedBank, deployer);
        }

        if (deployedContracts.TokenFactory) {
          console.log("\n🏭 Token Factory Sample Data");
          setupResults.tokenFactoryData = await setupTokenFactorySampleData(deployedContracts.TokenFactory, deployer);
        }

        if (deployedContracts.PlatformNFT) {
          console.log("\n🎨 NFT Sample Data");
          setupResults.nftData = await setupNFTSampleData(deployedContracts.PlatformNFT, deployer);
        }

        if (deployedContracts.DEXPlatform && deployedContracts.WETH && deployedContracts.USDC && deployedContracts.DAI) {
          console.log("\n💱 DEX Sample Data");
          setupResults.dexData = await setupDEXSampleData(deployedContracts, deployer);
        }
        break;
    }

    // Summary
    console.log("\n✅ Sample Data Setup Completed!");
    console.log("=".repeat(50));
    console.log("📊 Summary:");
    
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

    console.log("\n💡 Usage Examples:");
    console.log("   npm run sample-data bank     - Run bank sample data only");
    console.log("   npm run sample-data tokens   - Run token factory sample data only");
    console.log("   npm run sample-data nft      - Run NFT sample data only");
    console.log("   npm run sample-data dex      - Run DEX sample data only");
    console.log("   npm run sample-data all      - Run all sample data modules");

  } catch (error) {
    console.error("❌ Sample data setup failed:", error.message);
    process.exit(1);
  }
}

/**
 * Load deployed contract addresses from the address file
 */
async function loadContractAddresses(chainId) {
  const addressFilePath = path.join(__dirname, "../../src/contracts/addresses.json");
  
  if (!fs.existsSync(addressFilePath)) {
    throw new Error("Address file not found. Please deploy contracts first.");
  }

  const addressData = JSON.parse(fs.readFileSync(addressFilePath, "utf8"));
  
  if (!addressData[chainId]) {
    throw new Error(`No contracts found for network ${chainId}. Please deploy contracts first.`);
  }

  // Filter out non-address fields
  const contracts = {};
  Object.entries(addressData[chainId]).forEach(([key, value]) => {
    if (typeof value === 'string' && value.startsWith('0x')) {
      contracts[key] = value;
    }
  });

  return contracts;
}

// Run the script
main()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 