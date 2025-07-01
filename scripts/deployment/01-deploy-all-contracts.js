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
    // Deploy PlatformNFT
    console.log("  -> Deploying PlatformNFT...");
    const PlatformNFT = await ethers.getContractFactory("PlatformNFT");
    const platformNFT = await PlatformNFT.deploy(deployerAddress);
    await platformNFT.waitForDeployment();
    const platformNFTAddress = await platformNFT.getAddress();
    deployedContracts.PlatformNFT = platformNFTAddress;
    deploymentCount++;
    console.log(`  ✅ PlatformNFT deployed to: ${platformNFTAddress}`);

    // Deploy NFTMarketplace
    console.log("  -> Deploying NFTMarketplace...");
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    const nftMarketplace = await NFTMarketplace.deploy(
      platformNFTAddress,
      deployerAddress // Fee recipient
    );
    await nftMarketplace.waitForDeployment();
    const nftMarketplaceAddress = await nftMarketplace.getAddress();
    deployedContracts.NFTMarketplace = nftMarketplaceAddress;
    deploymentCount++;
    console.log(`  ✅ NFTMarketplace deployed to: ${nftMarketplaceAddress}`);

    // 1. Deploy Bank
    console.log("\n🏦 Deploying Bank...");
    const Bank = await ethers.getContractFactory("Bank");
    const bank = await Bank.deploy();
    await bank.waitForDeployment();
    
    const bankAddress = await bank.getAddress();
    deployedContracts.Bank = bankAddress;
    deploymentCount++;
    console.log(`✅ Bank deployed: ${bankAddress}`);

    // Verify Bank features
    const minDeposit = await bank.minimumDeposit();
    console.log(`   💰 Minimum deposit: ${ethers.formatEther(minDeposit)} ETH`);

    // 2. Deploy Voting
    console.log("\n🗳️  Deploying Voting...");
    const Voting = await ethers.getContractFactory("Voting");
    const voting = await Voting.deploy();
    await voting.waitForDeployment();
    
    const votingAddress = await voting.getAddress();
    deployedContracts.Voting = votingAddress;
    deploymentCount++;
    console.log(`✅ Voting deployed: ${votingAddress}`);

    // Verify Voting
    const proposalCount = await voting.getProposalCount();
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