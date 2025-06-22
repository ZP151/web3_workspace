const { ethers } = require("hardhat");

/**
 * Stage 2: Deploy Test Tokens
 * - USDC: Mock USD Coin (6 decimals)
 * - DAI: Mock Dai Stablecoin (18 decimals)  
 * - WETH: Wrapped Ethereum contract
 */
async function deployTestTokens() {
  console.log("💰 Stage 2: Deploy Test Tokens");
  console.log("=".repeat(40));

  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  const deployedContracts = {};

  // Only deploy test tokens on local networks
  if (chainId !== "31337" && chainId !== "1337") {
    console.log("⚠️ Skipping test tokens deployment on non-local network");
    return deployedContracts;
  }

  try {
    // 1. Deploy USDC (6 decimals)
    console.log("\n💵 Deploying USDC token...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USD Coin", "USDC", 6, 1000000); // 1M initial supply
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    deployedContracts.USDC = usdcAddress;
    console.log("✅ USDC deployed successfully:", usdcAddress);

    // Verify USDC
    const usdcSymbol = await usdc.symbol();
    const usdcDecimals = await usdc.decimals();
    console.log(`   📊 Symbol: ${usdcSymbol}, Decimals: ${usdcDecimals}`);

    // 2. Deploy DAI (18 decimals)
    console.log("\n💳 Deploying DAI token...");
    const dai = await MockERC20.deploy("Dai Stablecoin", "DAI", 18, 1000000); // 1M initial supply
    await dai.waitForDeployment();
    const daiAddress = await dai.getAddress();
    deployedContracts.DAI = daiAddress;
    console.log("✅ DAI deployed successfully:", daiAddress);

    // Verify DAI
    const daiSymbol = await dai.symbol();
    const daiDecimals = await dai.decimals();
    console.log(`   📊 Symbol: ${daiSymbol}, Decimals: ${daiDecimals}`);

    // 3. Deploy WETH
    console.log("\n🔄 Deploying WETH contract...");
    const WETH = await ethers.getContractFactory("WETH");
    const weth = await WETH.deploy();
    await weth.waitForDeployment();
    const wethAddress = await weth.getAddress();
    deployedContracts.WETH = wethAddress;
    console.log("✅ WETH deployed successfully:", wethAddress);

    // Verify WETH
    const wethSymbol = await weth.symbol();
    const wethName = await weth.name();
    console.log(`   📊 Name: ${wethName}, Symbol: ${wethSymbol}`);

    console.log("\n✅ Test tokens deployment completed!");
    return deployedContracts;

  } catch (error) {
    console.error("❌ Test tokens deployment failed:", error.message);
    throw error;
  }
}

// Run directly if this script is executed
if (require.main === module) {
  deployTestTokens()
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

module.exports = { deployTestTokens }; 