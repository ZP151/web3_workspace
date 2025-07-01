const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// 网络配置
const networks = {
  anvil: {
    name: "Anvil",
    chainId: "31338",
    rpcUrl: "http://127.0.0.1:8546",
    color: "🟢"
  },
  hardhat: {
    name: "Hardhat", 
    chainId: "31337",
    rpcUrl: "http://127.0.0.1:8545",
    color: "🔵"
  }
};

async function checkNetworkStatus(networkKey, networkConfig) {
  console.log(`\n${networkConfig.color} === ${networkConfig.name} Network (${networkConfig.chainId}) ===`);
  
  try {
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    
    // 检查网络连接
    const network = await provider.getNetwork();
    const actualChainId = network.chainId.toString();
    
    if (actualChainId !== networkConfig.chainId) {
      console.log(`❌ Network ID mismatch! Expected: ${networkConfig.chainId}, Got: ${actualChainId}`);
      return false;
    }
    
    console.log(`✅ Network connected: Chain ID ${actualChainId}`);
    
    // 读取地址配置
    const addressesPath = path.join(__dirname, "../../src/contracts/addresses.json");
    if (!fs.existsSync(addressesPath)) {
      console.log(`❌ Addresses file not found`);
      return false;
    }
    
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const networkAddresses = addresses[networkConfig.chainId];
    
    if (!networkAddresses) {
      console.log(`❌ No addresses found for chain ${networkConfig.chainId}`);
      return false;
    }
    
    console.log(`📝 Addresses found for chain ${networkConfig.chainId}:`);
    console.log(`   Deployed at: ${networkAddresses.deployedAt || 'Unknown'}`);
    console.log(`   Total contracts: ${networkAddresses.totalContracts || 'Unknown'}`);
    
    // 检查关键合约
    const contractsToCheck = [
      "PlatformNFT",
      "NFTMarketplace", 
      "Bank",
      "Voting",
      "TokenFactory",
      "DEXPlatform"
    ];
    
    let deployedCount = 0;
    
    for (const contractName of contractsToCheck) {
      const contractAddress = networkAddresses[contractName];
      if (contractAddress) {
        try {
          const code = await provider.getCode(contractAddress);
          const isDeployed = code !== "0x";
          const status = isDeployed ? "✅" : "❌";
          console.log(`   ${status} ${contractName}: ${contractAddress}`);
          if (isDeployed) deployedCount++;
        } catch (error) {
          console.log(`   ❌ ${contractName}: ${contractAddress} (Check failed)`);
        }
      } else {
        console.log(`   ❌ ${contractName}: Not configured`);
      }
    }
    
    console.log(`📊 Deployment Status: ${deployedCount}/${contractsToCheck.length} contracts deployed`);
    return deployedCount > 0;
    
  } catch (error) {
    console.log(`❌ Network unreachable: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🔍 Dual Network Deployment Status Check");
  console.log("=".repeat(60));
  
  const results = {};
  
  // 检查所有网络
  for (const [key, config] of Object.entries(networks)) {
    results[key] = await checkNetworkStatus(key, config);
  }
  
  // 总结
  console.log("\n📋 Summary:");
  console.log("=".repeat(30));
  for (const [key, config] of Object.entries(networks)) {
    const status = results[key] ? "✅ Active" : "❌ Inactive";
    console.log(`${config.color} ${config.name} (${config.chainId}): ${status}`);
  }
  
  console.log("\n💡 Tips:");
  console.log("  - To deploy to Anvil: npx hardhat run scripts/deploy-master.js --network anvil");
  console.log("  - To deploy to Hardhat: npx hardhat run scripts/deploy-master.js --network hardhat");
  console.log("  - To clear deployments: node scripts/maintenance/clean-deployment.js");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 