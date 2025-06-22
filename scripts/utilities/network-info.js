const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Network Information Utility
 * Displays current network status and deployed contract information
 */
async function getNetworkInfo() {
  console.log("🌐 Network Information");
  console.log("=".repeat(40));

  try {
    // Get network details
    const network = await ethers.provider.getNetwork();
    const chainId = network.chainId.toString();
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    const balance = await ethers.provider.getBalance(deployerAddress);

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

    console.log("📍 Network Details:");
    console.log(`  Network Name: ${networkName}`);
    console.log(`  Chain ID: ${chainId}`);
    console.log(`  Network Name (Provider): ${network.name}`);
    
    console.log("\n👤 Account Information:");
    console.log(`  Deployer Address: ${deployerAddress}`);
    console.log(`  Balance: ${ethers.formatEther(balance)} ETH`);

    // Get gas price
    try {
      const gasPrice = await ethers.provider.getFeeData();
      console.log("\n⛽ Gas Information:");
      if (gasPrice.gasPrice) {
        console.log(`  Gas Price: ${ethers.formatUnits(gasPrice.gasPrice, "gwei")} Gwei`);
      }
      if (gasPrice.maxFeePerGas) {
        console.log(`  Max Fee Per Gas: ${ethers.formatUnits(gasPrice.maxFeePerGas, "gwei")} Gwei`);
      }
      if (gasPrice.maxPriorityFeePerGas) {
        console.log(`  Max Priority Fee: ${ethers.formatUnits(gasPrice.maxPriorityFeePerGas, "gwei")} Gwei`);
      }
    } catch (error) {
      console.log("⚠️ Gas information not available");
    }

    // Load and display deployed contracts
    const addressFilePath = path.join(__dirname, "../../src/contracts/addresses.json");
    
    try {
      if (fs.existsSync(addressFilePath)) {
        const addressData = fs.readFileSync(addressFilePath, "utf8");
        const allAddresses = JSON.parse(addressData);
        const networkAddresses = allAddresses[chainId];

        if (networkAddresses) {
          console.log("\n📋 Deployed Contracts:");
          
          // Core contracts
          const coreContracts = ["VotingCore", "EnhancedBank", "TokenFactory"];
          coreContracts.forEach(contractName => {
            if (networkAddresses[contractName]) {
              console.log(`  ✅ ${contractName}: ${networkAddresses[contractName]}`);
            } else {
              console.log(`  ❌ ${contractName}: Not deployed`);
            }
          });

          // Test tokens
          const testTokens = ["USDC", "DAI", "WETH"];
          const deployedTokens = testTokens.filter(token => networkAddresses[token]);
          if (deployedTokens.length > 0) {
            console.log("\n💰 Test Tokens:");
            deployedTokens.forEach(token => {
              console.log(`  ✅ ${token}: ${networkAddresses[token]}`);
            });
          }

          // DeFi contracts
          const defiContracts = ["PlatformNFT", "NFTMarketplace", "DEXPlatform"];
          const deployedDefi = defiContracts.filter(contract => networkAddresses[contract]);
          if (deployedDefi.length > 0) {
            console.log("\n🏛️ DeFi Contracts:");
            deployedDefi.forEach(contract => {
              console.log(`  ✅ ${contract}: ${networkAddresses[contract]}`);
            });
          }

          // Deployment info
          if (networkAddresses.deployedAt) {
            console.log("\n📊 Deployment Information:");
            console.log(`  Deployed At: ${new Date(networkAddresses.deployedAt).toLocaleString()}`);
            console.log(`  Deployer: ${networkAddresses.deployer || 'Unknown'}`);
            if (networkAddresses.totalContracts) {
              console.log(`  Total Contracts: ${networkAddresses.totalContracts}`);
            }
          }
        } else {
          console.log(`\n⚠️ No contracts deployed on network ${networkName} (${chainId})`);
        }
      } else {
        console.log("\n⚠️ No address file found. Run deployment first.");
      }
    } catch (error) {
      console.log("❌ Failed to load contract addresses:", error.message);
    }

    // Block information
    try {
      const blockNumber = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNumber);
      
      console.log("\n🧱 Latest Block Information:");
      console.log(`  Block Number: ${blockNumber}`);
      console.log(`  Block Hash: ${block.hash}`);
      console.log(`  Timestamp: ${new Date(block.timestamp * 1000).toLocaleString()}`);
      console.log(`  Gas Limit: ${block.gasLimit.toString()}`);
      console.log(`  Gas Used: ${block.gasUsed.toString()}`);
    } catch (error) {
      console.log("⚠️ Block information not available");
    }

  } catch (error) {
    console.error("❌ Failed to get network information:", error.message);
    throw error;
  }
}

// Run directly if this script is executed
if (require.main === module) {
  getNetworkInfo()
    .then(() => {
      console.log("\n✅ Network information query completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Network info script failed:", error);
      process.exit(1);
    });
}

module.exports = { getNetworkInfo }; 