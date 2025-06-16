const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 System Status Check");
  console.log("=".repeat(50));

  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("\n👤 Test Accounts:");
  console.log(`Deployer: ${deployer.address}`);
  console.log(`User1: ${user1.address}`);
  console.log(`User2: ${user2.address}`);

  // Contract addresses from deployment
  const contracts = {
    VotingCore: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    SimpleBank: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    TokenFactory: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    PlatformNFT: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    NFTMarketplace: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    DEXPlatform: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"
  };

  console.log("\n📋 Contract Status:");
  for (const [name, address] of Object.entries(contracts)) {
    try {
      const code = await ethers.provider.getCode(address);
      const status = code !== "0x" ? "✅ Active" : "❌ Not deployed";
      console.log(`${name}: ${status} (${address})`);
    } catch (error) {
      console.log(`${name}: ❌ Error checking status`);
    }
  }

  console.log("\n🧪 Function Tests:");

  try {
    // Test VotingCore
    console.log("\n1. Testing VotingCore...");
    const votingCore = await ethers.getContractAt("VotingCore", contracts.VotingCore);
    const proposalCount = await votingCore.getProposalCount();
    console.log(`   Current proposals: ${proposalCount}`);

    // Test SimpleBank
    console.log("\n2. Testing SimpleBank...");
    const simpleBank = await ethers.getContractAt("SimpleBank", contracts.SimpleBank);
    const accountInfo = await simpleBank.getAccountInfo(deployer.address);
    console.log(`   Deployer bank balance: ${ethers.formatEther(accountInfo[0])} ETH`);
    console.log(`   Total deposited: ${ethers.formatEther(accountInfo[2])} ETH`);

    // Test TokenFactory
    console.log("\n3. Testing TokenFactory...");
    const tokenFactory = await ethers.getContractAt("TokenFactory", contracts.TokenFactory);
    const tokenCount = await tokenFactory.getTokenCount();
    const creationFee = await tokenFactory.creationFee();
    console.log(`   Tokens created: ${tokenCount}`);
    console.log(`   Creation fee: ${ethers.formatEther(creationFee)} ETH`);

    console.log("\n🎉 All systems operational!");
    console.log("\n🌐 Frontend Access:");
    console.log("   Local: http://localhost:3000");
    console.log("   Network: Hardhat (Chain ID: 31337)");
    console.log("   RPC: http://127.0.0.1:8545");

    console.log("\n📝 Available Pages:");
    console.log("   Home: http://localhost:3000");
    console.log("   Voting: http://localhost:3000/voting");
    console.log("   Banking: http://localhost:3000/banking");
    console.log("   Token Factory: http://localhost:3000/tokens");

    console.log("\n💡 Test Instructions:");
    console.log("1. Open MetaMask and connect to Hardhat network");
    console.log("2. Import test account with private key:");
    console.log("   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
    console.log("3. Visit the frontend pages to test functionality");

  } catch (error) {
    console.error("❌ System test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 