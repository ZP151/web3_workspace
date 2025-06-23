const { ethers } = require("hardhat");

/**
 * DEX示例数据设置模块  
 * 包含：流动性池创建、流动性添加
 */
async function setupDEXSampleData(deployedContracts, deployer) {
  console.log("💱 Setting up DEX Sample Data...");
  
  const DEXPlatform = await ethers.getContractFactory("DEXPlatform");
  const dexContract = DEXPlatform.attach(deployedContracts.DEXPlatform);

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const WETH = await ethers.getContractFactory("WETH");
  
  const wethContract = WETH.attach(deployedContracts.WETH);
  const usdcContract = MockERC20.attach(deployedContracts.USDC);
  const daiContract = MockERC20.attach(deployedContracts.DAI);

  const results = {
    poolsCreated: 0,
    liquidityAdded: 0,
    errors: []
  };

  console.log("   📋 DEX contract info:");
  console.log(`   DEX address: ${deployedContracts.DEXPlatform}`);
  console.log(`   WETH address: ${deployedContracts.WETH}`);
  console.log(`   USDC address: ${deployedContracts.USDC}`);
  console.log(`   DAI address: ${deployedContracts.DAI}`);

  // 1. Check token balances
  console.log("   💰 Checking token balances...");
  try {
    const deployerAddress = await deployer.getAddress();
    const usdcBalance = await usdcContract.balanceOf(deployerAddress);
    const daiBalance = await daiContract.balanceOf(deployerAddress);
    const wethBalance = await wethContract.balanceOf(deployerAddress);
    
    console.log(`   📊 USDC balance: ${ethers.formatUnits(usdcBalance, 6)}`);
    console.log(`   📊 DAI balance: ${ethers.formatEther(daiBalance)}`);
    console.log(`   📊 WETH balance: ${ethers.formatEther(wethBalance)}`);
  } catch (error) {
    console.log("   ⚠️ Token balance check failed:", error.message);
    results.errors.push("Token balance check failed");
  }

  // 2. Create liquidity pools
  console.log("   🏊 Creating liquidity pools...");
  const poolPairs = [
    [deployedContracts.WETH, deployedContracts.USDC, "WETH/USDC"],
    [deployedContracts.WETH, deployedContracts.DAI, "WETH/DAI"],
    [deployedContracts.USDC, deployedContracts.DAI, "USDC/DAI"]
  ];

  for (const [tokenA, tokenB, name] of poolPairs) {
    try {
      const tx = await dexContract.createPool(tokenA, tokenB, { gasLimit: 300000 });
      await tx.wait();
      console.log(`   ✅ ${name} pool created successfully`);
      results.poolsCreated++;
    } catch (error) {
      console.log(`   ⚠️ ${name} pool creation failed (may already exist):`, error.message);
      results.errors.push(`${name} pool creation failed`);
    }
  }

  // 3. Add liquidity
  console.log("   💧 Adding initial liquidity...");
  
  // Pool ID calculation helper function
  const calculatePoolId = (tokenA, tokenB) => {
    const [sortedA, sortedB] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];
    return ethers.keccak256(
      ethers.solidityPacked(['address', 'address'], [sortedA, sortedB])
    );
  };

  try {
    // Approve tokens
    console.log("   🔐 Approving tokens for DEX...");
    const wethAmount = ethers.parseEther('50'); // 增加到50 WETH
    const usdcAmount = ethers.parseUnits('100000', 6); // 增加到100,000 USDC
    const daiAmount = ethers.parseEther('100000'); // 增加到100,000 DAI

    const wethApproveTx = await wethContract.approve(deployedContracts.DEXPlatform, wethAmount);
    await wethApproveTx.wait();
    console.log(`   ✅ WETH approved: ${ethers.formatEther(wethAmount)}`);
    
    const usdcApproveTx = await usdcContract.approve(deployedContracts.DEXPlatform, usdcAmount);
    await usdcApproveTx.wait();
    console.log(`   ✅ USDC approved: ${ethers.formatUnits(usdcAmount, 6)}`);
    
    const daiApproveTx = await daiContract.approve(deployedContracts.DEXPlatform, daiAmount);
    await daiApproveTx.wait();
    console.log(`   ✅ DAI approved: ${ethers.formatEther(daiAmount)}`);
    
    console.log("   ✅ All token approvals completed");

    // Add WETH/USDC liquidity (price: 1 WETH = 2000 USDC)
    const wethUsdcPoolId = calculatePoolId(deployedContracts.WETH, deployedContracts.USDC);
    console.log(`   🏊 Adding WETH/USDC liquidity to pool: ${wethUsdcPoolId}`);
    
    // Check pool exists and determine token order
    let tokenAAmount, tokenBAmount, tokenAMin, tokenBMin;
    try {
      const poolInfo = await dexContract.getPoolInfo(wethUsdcPoolId);
      console.log(`   📊 Pool found - TokenA: ${poolInfo.tokenA}, TokenB: ${poolInfo.tokenB}`);
      
      // DEX合约按地址排序token，需要匹配正确的顺序
      if (poolInfo.tokenA.toLowerCase() === deployedContracts.WETH.toLowerCase()) {
        // WETH是TokenA，USDC是TokenB
        tokenAAmount = ethers.parseEther('1'); // 1 WETH
        tokenBAmount = ethers.parseUnits('2000', 6); // 2000 USDC
        tokenAMin = ethers.parseEther('0.9');
        tokenBMin = ethers.parseUnits('1800', 6);
      } else {
        // USDC是TokenA，WETH是TokenB  
        tokenAAmount = ethers.parseUnits('2000', 6); // 2000 USDC
        tokenBAmount = ethers.parseEther('1'); // 1 WETH
        tokenAMin = ethers.parseUnits('1800', 6);
        tokenBMin = ethers.parseEther('0.9');
      }
    } catch (error) {
      console.log(`   ⚠️ Pool info check failed: ${error.message}`);
      // 使用默认值
      tokenAAmount = ethers.parseEther('1');
      tokenBAmount = ethers.parseUnits('2000', 6);
      tokenAMin = ethers.parseEther('0.9');
      tokenBMin = ethers.parseUnits('1800', 6);
    }
    
    let tx = await dexContract.addLiquidity(
      wethUsdcPoolId,
      tokenAAmount,
      tokenBAmount,
      tokenAMin,
      tokenBMin,
      { gasLimit: 800000 }
    );
    await tx.wait();
    console.log("   ✅ WETH/USDC liquidity added successfully");
    results.liquidityAdded++;

    // Add WETH/DAI liquidity (price: 1 WETH = 2000 DAI)
    const wethDaiPoolId = calculatePoolId(deployedContracts.WETH, deployedContracts.DAI);
    tx = await dexContract.addLiquidity(
      wethDaiPoolId,
      ethers.parseEther('1'), // 1 WETH
      ethers.parseEther('2000'), // 2000 DAI
      ethers.parseEther('0.9'), // 最小0.9 WETH
      ethers.parseEther('1800'), // 最小1800 DAI
      { gasLimit: 800000 }
    );
    await tx.wait();
    console.log("   ✅ WETH/DAI liquidity added successfully");
    results.liquidityAdded++;

    // Add USDC/DAI liquidity (price: 1 USDC = 1 DAI)
    const usdcDaiPoolId = calculatePoolId(deployedContracts.USDC, deployedContracts.DAI);
    tx = await dexContract.addLiquidity(
      usdcDaiPoolId,
      ethers.parseUnits('1000', 6), // 1000 USDC
      ethers.parseEther('1000'), // 1000 DAI
      ethers.parseUnits('900', 6), // 最小900 USDC
      ethers.parseEther('900'), // 最小900 DAI
      { gasLimit: 800000 }
    );
    await tx.wait();
    console.log("   ✅ USDC/DAI liquidity added successfully");
    results.liquidityAdded++;

  } catch (error) {
    console.log("   ⚠️ Liquidity addition failed:", error.message);
    results.errors.push("Liquidity addition failed");
  }

  console.log("   📊 DEX sample data setup completed");
  console.log(`   📋 Results: ${results.poolsCreated} pools created, ${results.liquidityAdded} pools funded`);
  if (results.errors.length > 0) {
    console.log(`   ⚠️ Errors: ${results.errors.length} issues encountered`);
  }
  
  return results;
}

module.exports = { setupDEXSampleData }; 