const { ethers } = require("hardhat");

/**
 * Stage 1: Deploy All Contracts
 * - Deploy all core contracts and DeFi contracts
 * - Including Bank, Voting, DEX, NFT Marketplace, etc.
 */
async function deployAllContracts() {
  console.log("🚀 Stage 1: Deploying all contracts with V2 versions...");

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  let deployedContracts = {};
  let deploymentCount = 0;

  try {
    // Deploy PlatformNFTv2
    console.log("  -> Deploying PlatformNFTv2...");
    const PlatformNFTv2 = await ethers.getContractFactory("PlatformNFTv2");
    const platformNFT = await PlatformNFTv2.deploy(deployerAddress);
    await platformNFT.waitForDeployment();
    const platformNFTAddress = await platformNFT.getAddress();
    deployedContracts.PlatformNFT = platformNFTAddress;
    deploymentCount++;
    console.log(`  ✅ PlatformNFTv2 deployed to: ${platformNFTAddress}`);

    // Deploy NFTMarketplaceV2
    console.log("  -> Deploying NFTMarketplaceV2...");
    const NFTMarketplaceV2 = await ethers.getContractFactory("NFTMarketplaceV2");
    const nftMarketplace = await NFTMarketplaceV2.deploy(
      platformNFTAddress,
      deployerAddress // Fee recipient
    );
    await nftMarketplace.waitForDeployment();
    const nftMarketplaceAddress = await nftMarketplace.getAddress();
    deployedContracts.NFTMarketplace = nftMarketplaceAddress;
    deploymentCount++;
    console.log(`  ✅ NFTMarketplaceV2 deployed to: ${nftMarketplaceAddress}`);

    // 1. Deploy EnhancedBank
    console.log("\n🏦 Deploying EnhancedBank...");
    const EnhancedBank = await ethers.getContractFactory("EnhancedBank");
    const enhancedBank = await EnhancedBank.deploy();
    await enhancedBank.waitForDeployment();
    
    const enhancedBankAddress = await enhancedBank.getAddress();
    deployedContracts.EnhancedBank = enhancedBankAddress;
    deploymentCount++;
    console.log(`✅ EnhancedBank deployed: ${enhancedBankAddress}`);

    // Verify EnhancedBank features
    const minDeposit = await enhancedBank.minimumDeposit();
    console.log(`   💰 Minimum deposit: ${ethers.formatEther(minDeposit)} ETH`);

    // 2. Deploy VotingCore
    console.log("\n🗳️  Deploying VotingCore...");
    const VotingCore = await ethers.getContractFactory("VotingCore");
    const votingCore = await VotingCore.deploy();
    await votingCore.waitForDeployment();
    
    const votingCoreAddress = await votingCore.getAddress();
    deployedContracts.VotingCore = votingCoreAddress;
    deploymentCount++;
    console.log(`✅ VotingCore deployed: ${votingCoreAddress}`);

    // Verify VotingCore
    const proposalCount = await votingCore.getProposalCount();
    console.log(`   📊 Current proposal count: ${proposalCount.toString()}`);

    // 3. Deploy TokenFactory
    console.log("\n🏭 Deploying TokenFactory...");
    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    const tokenFactory = await TokenFactory.deploy(deployerAddress);
    await tokenFactory.waitForDeployment();
    
    const tokenFactoryAddress = await tokenFactory.getAddress();
    deployedContracts.TokenFactory = tokenFactoryAddress;
    deploymentCount++;
    console.log(`✅ TokenFactory deployed: ${tokenFactoryAddress}`);

    // Verify TokenFactory
    const creationFee = await tokenFactory.creationFee();
    console.log(`   💵 Creation fee: ${ethers.formatEther(creationFee)} ETH`);

    // 4. Deploy DEXPlatform
    console.log("\n💱 Deploying DEXPlatform...");
    const DEXPlatform = await ethers.getContractFactory("DEXPlatform");
    const dexPlatform = await DEXPlatform.deploy(
        deployerAddress, // feeRecipient
        deployerAddress  // rewardToken (placeholder)
    );
    await dexPlatform.waitForDeployment();
    const dexPlatformAddress = await dexPlatform.getAddress();
    deployedContracts.DEXPlatform = dexPlatformAddress;
    deploymentCount++;
    console.log(`✅ DEXPlatform deployed: ${dexPlatformAddress}`);

    // Verify DEXPlatform
    const dexFeeRecipient = await dexPlatform.feeRecipient();
    console.log(`   📊 Fee recipient: ${dexFeeRecipient}`);

    console.log(`\n📊 Stage 1 Summary: ${deploymentCount} contracts deployed successfully`);
    return deployedContracts;

  } catch (error) {
    console.error("❌ Contract deployment failed:", error.message);
    throw error;
  }
}

// If you run this script directly
if (require.main === module) {
  deployAllContracts()
    .then((contracts) => {
      console.log("\n✅ All contracts deployed:");
      Object.entries(contracts).forEach(([name, address]) => {
        console.log(`  ${name}: ${address}`);
      });
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Deployment script execution failure:", error);
      process.exit(1);
    });
}

module.exports = { deployAllContracts }; 