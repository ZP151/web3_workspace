const { ethers } = require("hardhat");

/**
 * Stage 2: Deploy and Mint Tokens
 * - Deploy test tokens and WETH
 * - Mint initial token balances for deployer
 * - Configure basic token parameters
 */
async function deployAndMintTokens() {
  console.log("💰 Stage 2: Deploy and Mint Tokens");
  console.log("=".repeat(40));

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  const deployedContracts = {};

  // Only deploy test tokens on local networks
  if (chainId !== "31337" && chainId !== "1337" && chainId !== "31338") {
    console.log("⚠️ Skipping test token deployment on non-local network");
    return deployedContracts;
  }

  console.log(`🔧 Minting tokens for deployer: ${deployerAddress}`);

  try {
    // 1. Deploy USDC (6 decimals)
    console.log("\n💵 Deploying USDC token...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const initialSupply = 1000000; // 1M initial supply
    const usdc = await MockERC20.deploy("USD Coin", "USDC", 6, initialSupply);
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    deployedContracts.USDC = usdcAddress;
    console.log(`✅ USDC deployed successfully: ${usdcAddress}`);

    // Verify USDC balance
    const usdcBalance = await usdc.balanceOf(deployerAddress);
    console.log(`   💰 Deployer USDC balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);

    // 2. Deploy DAI (18 decimals)
    console.log("\n💳 Deploying DAI token...");
    const dai = await MockERC20.deploy("Dai Stablecoin", "DAI", 18, initialSupply);
    await dai.waitForDeployment();
    const daiAddress = await dai.getAddress();
    deployedContracts.DAI = daiAddress;
    console.log(`✅ DAI deployed successfully: ${daiAddress}`);

    // Verify DAI balance
    const daiBalance = await dai.balanceOf(deployerAddress);
    console.log(`   💰 Deployer DAI balance: ${ethers.formatEther(daiBalance)} DAI`);

    // 3. Deploy WETH
    console.log("\n🔄 Deploying WETH contract...");
    const WETH = await ethers.getContractFactory("WETH");
    const weth = await WETH.deploy();
    await weth.waitForDeployment();
    const wethAddress = await weth.getAddress();
    deployedContracts.WETH = wethAddress;
    console.log(`✅ WETH deployed successfully: ${wethAddress}`);

    // Verify WETH (initial balance is 0, need to deposit ETH to mint)
    const wethBalance = await weth.balanceOf(deployerAddress);
    console.log(`   💰 Deployer WETH balance: ${ethers.formatEther(wethBalance)} WETH`);

    // 4. Mint some WETH for testing convenience
    console.log("\n💧 Minting initial WETH for testing...");
    const ethAmount = ethers.parseEther("10"); // Mint 10 WETH
    const depositTx = await weth.deposit({ value: ethAmount });
    await depositTx.wait();
    
    const newWethBalance = await weth.balanceOf(deployerAddress);
    console.log(`   ✅ Minting completed, current WETH balance: ${ethers.formatEther(newWethBalance)} WETH`);

    console.log("\n✅ Token deployment and minting completed!");
    console.log("📊 Token balance summary:");
    console.log(`   💵 USDC: ${ethers.formatUnits(usdcBalance, 6)}`);
    console.log(`   💳 DAI: ${ethers.formatEther(daiBalance)}`);
    console.log(`   🔄 WETH: ${ethers.formatEther(newWethBalance)}`);
    
    return deployedContracts;

  } catch (error) {
    console.error("❌ Token deployment failed:", error.message);
    throw error;
  }
}

// Run directly if this script is executed
if (require.main === module) {
  deployAndMintTokens()
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

module.exports = { deployAndMintTokens }; 