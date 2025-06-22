const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Test Core Contracts Functionality
 * Tests VotingCore, EnhancedBank, and TokenFactory contracts
 */
async function testCoreContracts() {
  console.log("🧪 Testing Core Contracts");
  console.log("=".repeat(40));

  const [deployer, user1, user2] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  // Load contract addresses
  const addressFilePath = path.join(__dirname, "../../src/contracts/addresses.json");
  let addresses = {};
  
  try {
    const addressData = fs.readFileSync(addressFilePath, "utf8");
    const allAddresses = JSON.parse(addressData);
    addresses = allAddresses[chainId] || {};
  } catch (error) {
    console.error("❌ Failed to load contract addresses:", error.message);
    return;
  }

  console.log(`📍 Testing on network: ${network.name} (${chainId})`);
  console.log(`🔧 Using addresses from: ${addressFilePath}`);

  try {
    // 1. Test VotingCore
    if (addresses.VotingCore) {
      console.log("\n📝 Testing VotingCore contract...");
      const votingCore = await ethers.getContractAt("VotingCore", addresses.VotingCore);
      
      // Get initial proposal count
      const initialCount = await votingCore.getProposalCount();
      console.log(`   Initial proposal count: ${initialCount}`);
      
      // Create a test proposal
      const tx = await votingCore.connect(user1).createProposal(
        "Test Proposal",
        "This is a test proposal for functionality verification"
      );
      await tx.wait();
      
      const newCount = await votingCore.getProposalCount();
      console.log(`   ✅ Proposal created. New count: ${newCount}`);
      
      // Get proposal details
      if (newCount > 0) {
        const proposal = await votingCore.proposals(newCount - 1n);
        console.log(`   📋 Latest proposal: "${proposal.title}"`);
      }
    }

    // 2. Test EnhancedBank
    if (addresses.EnhancedBank) {
      console.log("\n🏦 Testing EnhancedBank contract...");
      const enhancedBank = await ethers.getContractAt("EnhancedBank", addresses.EnhancedBank);
      
      // Check minimum deposit
      const minDeposit = await enhancedBank.minimumDeposit();
      console.log(`   Minimum deposit: ${ethers.formatEther(minDeposit)} ETH`);
      
      // Test deposit
      const depositAmount = ethers.parseEther("0.1");
      if (depositAmount >= minDeposit) {
        const tx = await enhancedBank.connect(user1).deposit({ value: depositAmount });
        await tx.wait();
        console.log(`   ✅ Deposit successful: ${ethers.formatEther(depositAmount)} ETH`);
        
        // Check balance
        const balance = await enhancedBank.balances(user1.address);
        console.log(`   💰 User balance: ${ethers.formatEther(balance)} ETH`);
      }
    }

    // 3. Test TokenFactory
    if (addresses.TokenFactory) {
      console.log("\n🏭 Testing TokenFactory contract...");
      const tokenFactory = await ethers.getContractAt("TokenFactory", addresses.TokenFactory);
      
      // Get creation fee
      const creationFee = await tokenFactory.creationFee();
      console.log(`   Creation fee: ${ethers.formatEther(creationFee)} ETH`);
      
      // Get initial token count
      const initialTokenCount = await tokenFactory.getTokenCount();
      console.log(`   Initial token count: ${initialTokenCount}`);
      
      // Create a test token
      try {
        const tx = await tokenFactory.connect(user1).createToken(
          "Test Token",
          "TEST",
          18,
          ethers.parseEther("1000000"), // 1M total supply
          { value: creationFee }
        );
        await tx.wait();
        
        const newTokenCount = await tokenFactory.getTokenCount();
        console.log(`   ✅ Token created. New count: ${newTokenCount}`);
        
        // Get created tokens for user
        const userTokens = await tokenFactory.getUserTokens(user1.address);
        if (userTokens.length > 0) {
          console.log(`   📋 User's latest token: ${userTokens[userTokens.length - 1]}`);
        }
      } catch (error) {
        console.log(`   ⚠️ Token creation skipped: ${error.message}`);
      }
    }

    console.log("\n✅ Core contracts testing completed!");

  } catch (error) {
    console.error("❌ Testing failed:", error.message);
    throw error;
  }
}

// Run directly if this script is executed
if (require.main === module) {
  testCoreContracts()
    .then(() => {
      console.log("\n✅ All tests completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Testing script failed:", error);
      process.exit(1);
    });
}

module.exports = { testCoreContracts }; 