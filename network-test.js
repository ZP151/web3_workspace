const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Network Configuration Check");
  console.log("=".repeat(50));
  
  // 1. Hardhat network info
  console.log("🔧 Hardhat Configuration:");
  console.log(`  Current Network Name: ${hre.network.name}`);
  console.log(`  Available Networks: ${Object.keys(hre.config.networks).join(", ")}`);
  
  // 2. Provider network info
  const network = await ethers.provider.getNetwork();
  console.log("\n🌐 Provider Network Info:");
  console.log(`  Chain ID: ${network.chainId.toString()}`);
  console.log(`  Network Name: ${network.name}`);
  
  // 3. Network mapping check
  const networkNames = {
    "31338": "Anvil Local",
    "31337": "Hardhat Local", 
    "1337": "Ganache Local"
  };
  const chainId = network.chainId.toString();
  const mappedName = networkNames[chainId] || `Unknown Network (${chainId})`;
  console.log(`  Mapped Name: ${mappedName}`);
  
  // 4. Account info
  const [deployer] = await ethers.getSigners();
  console.log("\n👤 Deployer Info:");
  console.log(`  Address: ${await deployer.getAddress()}`);
  
  const balance = await ethers.provider.getBalance(await deployer.getAddress());
  console.log(`  Balance: ${ethers.formatEther(balance)} ETH`);
  
  // 5. Configuration verification
  console.log("\n⚙️ Network Config Verification:");
  if (hre.network.name === "anvil") {
    console.log("  ✅ Expected: anvil network");
    console.log("  ✅ Chain ID should be: 31338");
    console.log(`  ${chainId === "31338" ? "✅" : "❌"} Actual Chain ID: ${chainId}`);
  } else if (hre.network.name === "hardhat") {
    console.log("  ✅ Expected: hardhat network");
    console.log("  ✅ Chain ID should be: 31337");
    console.log(`  ${chainId === "31337" ? "✅" : "❌"} Actual Chain ID: ${chainId}`);
  } else {
    console.log(`  ⚠️ Unexpected network: ${hre.network.name}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 