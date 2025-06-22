const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Gas Estimation for EnhancedBank Contract");
  console.log("=".repeat(50));

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`Network: ${network.name} (${network.chainId})`);
  console.log(`Deployer: ${await deployer.getAddress()}`);
  
  try {
    // Get contract factory
    const EnhancedBank = await ethers.getContractFactory("EnhancedBank");
    
    // Estimate deployment gas
    const deploymentData = EnhancedBank.interface.encodeDeploy([]);
    const gasEstimate = await ethers.provider.estimateGas({
      data: deploymentData
    });
    
    console.log(`\n📊 Gas Estimation Results:`);
    console.log(`  Estimated Gas: ${gasEstimate.toString()}`);
    console.log(`  Gas in millions: ${(Number(gasEstimate) / 1000000).toFixed(2)}M`);
    
    // Get bytecode size
    const bytecode = EnhancedBank.bytecode;
    const bytecodeSize = bytecode.length / 2 - 1; // Remove '0x' and convert to bytes
    
    console.log(`\n📏 Contract Size:`);
    console.log(`  Bytecode size: ${bytecodeSize} bytes`);
    console.log(`  Bytecode size: ${(bytecodeSize / 1024).toFixed(2)} KB`);
    
    // Ethereum contract size limit is 24,576 bytes (24KB)
    const sizeLimit = 24576;
    console.log(`  Size limit: ${sizeLimit} bytes (24 KB)`);
    console.log(`  Within limit: ${bytecodeSize <= sizeLimit ? '✅ YES' : '❌ NO'}`);
    
    if (bytecodeSize > sizeLimit) {
      console.log(`  Overflow: ${bytecodeSize - sizeLimit} bytes (${((bytecodeSize - sizeLimit) / 1024).toFixed(2)} KB)`);
    }
    
    // Recommended gas limits
    console.log(`\n💡 Recommended Gas Settings:`);
    console.log(`  Block Gas Limit: ${Math.ceil(Number(gasEstimate) * 1.2).toLocaleString()}`);
    console.log(`  Gas Limit (safe): ${Math.ceil(Number(gasEstimate) * 1.5).toLocaleString()}`);
    
  } catch (error) {
    console.error("❌ Gas estimation failed:", error.message);
    
    if (error.message.includes("exceeds block gas limit")) {
      console.log("\n🚨 Contract is too large for current network settings!");
      console.log("Suggested solutions:");
      console.log("1. Increase Ganache block gas limit to at least 15,000,000");
      console.log("2. Split contract into smaller modules");
      console.log("3. Use proxy patterns");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 