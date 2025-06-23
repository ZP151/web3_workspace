const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Import staged deployment modules
const { deployAllContracts } = require("./deployment/01-deploy-all-contracts");
const { deployAndMintTokens } = require("./deployment/02-deploy-tokens");
const { initializeAndSetup } = require("./deployment/03-initialize-and-setup");

async function main() {
  console.log("🚀 Starting Complete Deployment");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  console.log("🔧 Deployment Configuration:");
  console.log(`  Deployer Account: ${deployerAddress}`);
  console.log(`  Network ID: ${chainId}`);
  console.log(`  Network Name: ${network.name}`);

  // Check account balance
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log(`  Account Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther("0.1")) {
    console.warn("⚠️ Warning: Account balance may be insufficient for deployment");
  }

  // Network name mapping
  const networkNames = {
    "31337": "Hardhat Local",
    "1337": "Ganache Local",
    "11155111": "Sepolia Testnet",
    "80001": "Mumbai Testnet",
    "1": "Ethereum Mainnet",
    "137": "Polygon Mainnet",
    "56": "BSC Mainnet"
  };
  const networkName = networkNames[chainId] || `Unknown Network (${chainId})`;

  let allContracts = {};
  let deploymentStats = {
    totalDeployments: 0,
    startTime: Date.now(),
    networkName
  };

  try {
    // Stage 1: Deploy All Contracts
    console.log("\n" + "=".repeat(60));
    const allContractsResult = await deployAllContracts();
    allContracts = { ...allContracts, ...allContractsResult };
    deploymentStats.totalDeployments += Object.keys(allContractsResult).length;

    // Stage 2: Deploy and Mint Tokens
    console.log("\n" + "=".repeat(60));
    const tokenContracts = await deployAndMintTokens();
    allContracts = { ...allContracts, ...tokenContracts };
    deploymentStats.totalDeployments += Object.keys(tokenContracts).length;

    // Stage 3: Initialize and Setup Sample Data
    console.log("\n" + "=".repeat(60));
    const setupResult = await initializeAndSetup(allContracts);
    allContracts = { ...allContracts, ...setupResult };

    // Update address file
    console.log("\n📝 Updating address configuration file...");
    const deploymentInfo = {
      network: networkName,
      deployedAt: new Date().toISOString(),
      deployer: deployerAddress,
      totalContracts: deploymentStats.totalDeployments
    };
    await updateAddressFile(chainId, allContracts, deploymentInfo);

    // Deployment summary
    const deploymentTime = (Date.now() - deploymentStats.startTime) / 1000;
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Complete Deployment Finished!");
    console.log("=".repeat(60));
    console.log("📊 Deployment Summary:");
    console.log(`  Network: ${networkName} (${chainId})`);
    console.log(`  Total Contracts: ${deploymentStats.totalDeployments}`);
    console.log(`  Deployment Time: ${deploymentTime.toFixed(2)}s`);
    console.log(`  Deployed At: ${deploymentInfo.deployedAt}`);
    console.log(`  Sample Data: ${setupResult.sampleDataCreated ? '✅ Created' : '❌ Failed'}`);
    
    console.log("\n📋 Deployed Contracts:");
    Object.entries(allContracts).forEach(([name, address]) => {
      if (typeof address === 'string' && address.startsWith('0x')) {
        console.log(`  ✅ ${name}: ${address}`);
      }
    });

    console.log("\n📁 Address file updated: src/contracts/addresses.json");
    console.log("💡 Tip: Restart frontend application to load new contract addresses");
    console.log("🎯 Sample Data: Bank and DEX preloaded with sample data for testing");
    console.log("📖 Includes:");
    console.log("   • Bank: Community pools, savings goals, staking examples");
    console.log("   • DEX: Liquidity pools, token pairs, initial trading pair prices");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    console.error("Error details:", error.message);
    process.exit(1);
  }
}

// Update address file function
async function updateAddressFile(chainId, deployedContracts, deploymentInfo) {
  const addressFilePath = path.join(__dirname, "../src/contracts/addresses.json");
  
  let addressData = {};
  
  // Read existing address file
  try {
    if (fs.existsSync(addressFilePath)) {
      const existingData = fs.readFileSync(addressFilePath, "utf8");
      addressData = JSON.parse(existingData);
    }
  } catch (error) {
    console.log("⚠️ Cannot read existing address file, creating new one");
  }

  // Filter out non-address fields and BigInt values
  const contractAddresses = {};
  Object.entries(deployedContracts).forEach(([key, value]) => {
    if (typeof value === 'string' && value.startsWith('0x')) {
      contractAddresses[key] = value;
    }
  });

  // Update current network addresses
  addressData[chainId] = {
    ...contractAddresses,
    ...deploymentInfo
  };

  // Write to file
  try {
    // Ensure directory exists
    const dir = path.dirname(addressFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(addressFilePath, JSON.stringify(addressData, null, 2));
    console.log("✅ Address file updated successfully");
  } catch (error) {
    console.error("❌ Failed to update address file:", error.message);
    throw error;
  }
}

// Run deployment
main()
  .then(() => {
    console.log("\n✅ All operations completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment script failed:", error);
    process.exit(1);
  }); 