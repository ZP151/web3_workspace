const { ethers } = require("hardhat");

/**
 * Stage 1: Deploy Core Contracts
 * - VotingCore: Governance voting contract
 * - EnhancedBank: Enhanced banking contract  
 * - TokenFactory: Token creation factory contract
 */
async function deployCoreContracts() {
  console.log("🏗️ Stage 1: Deploy Core Contracts");
  console.log("=".repeat(40));

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const deployedContracts = {};

  try {
    // 1. Deploy VotingCore contract
    console.log("\n📝 Deploying VotingCore contract...");
    const VotingCore = await ethers.getContractFactory("VotingCore");
    const votingCore = await VotingCore.deploy();
    await votingCore.waitForDeployment();
    const votingCoreAddress = await votingCore.getAddress();
    deployedContracts.VotingCore = votingCoreAddress;
    console.log("✅ VotingCore deployed successfully:", votingCoreAddress);

    // Verify VotingCore
    const proposalCount = await votingCore.getProposalCount();
    console.log("   📊 Current proposal count:", proposalCount.toString());

    // 2. Deploy EnhancedBank contract
    console.log("\n🏦 Deploying EnhancedBank contract...");
    const EnhancedBank = await ethers.getContractFactory("EnhancedBank");
    const enhancedBank = await EnhancedBank.deploy();
    await enhancedBank.waitForDeployment();
    const enhancedBankAddress = await enhancedBank.getAddress();
    deployedContracts.EnhancedBank = enhancedBankAddress;
    console.log("✅ EnhancedBank deployed successfully:", enhancedBankAddress);

    // Verify EnhancedBank
    const minDeposit = await enhancedBank.minimumDeposit();
    console.log("   💰 Minimum deposit:", ethers.formatEther(minDeposit), "ETH");

    // 3. Deploy TokenFactory contract
    console.log("\n🏭 Deploying TokenFactory contract...");
    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    const tokenFactory = await TokenFactory.deploy(deployerAddress);
    await tokenFactory.waitForDeployment();
    const tokenFactoryAddress = await tokenFactory.getAddress();
    deployedContracts.TokenFactory = tokenFactoryAddress;
    console.log("✅ TokenFactory deployed successfully:", tokenFactoryAddress);

    // Verify TokenFactory
    const creationFee = await tokenFactory.creationFee();
    console.log("   💵 Creation fee:", ethers.formatEther(creationFee), "ETH");

    console.log("\n✅ Core contracts deployment completed!");
    return deployedContracts;

  } catch (error) {
    console.error("❌ Core contracts deployment failed:", error.message);
    throw error;
  }
}

// Run directly if this script is executed
if (require.main === module) {
  deployCoreContracts()
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

module.exports = { deployCoreContracts }; 