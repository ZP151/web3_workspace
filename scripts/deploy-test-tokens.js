const { ethers } = require("hardhat");

async function main() {
  console.log("🪙 部署测试代币并初始化DEX...");
  
  const [deployer] = await ethers.getSigners();
  console.log("使用账户:", deployer.address);
  console.log("账户余额:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // 部署WETH代币
  console.log("\n=== 部署 WETH 代币 ===");
  const WETH = await ethers.getContractFactory("WETH");
  const weth = await WETH.deploy();
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();
  console.log("WETH 代币地址:", wethAddress);

  // 部署USDC代币
  console.log("\n=== 部署 USDC 代币 ===");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6, 1000000); // 1M USDC
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("USDC 代币地址:", usdcAddress);

  // 部署DAI代币
  console.log("\n=== 部署 DAI 代币 ===");
  const dai = await MockERC20.deploy("Dai Stablecoin", "DAI", 18, 1000000); // 1M DAI
  await dai.waitForDeployment();
  const daiAddress = await dai.getAddress();
  console.log("DAI 代币地址:", daiAddress);

  // 获取DEX合约
  const addresses = require("../src/contracts/addresses.json");
  const networkId = (await deployer.provider.getNetwork()).chainId.toString();
  const dexAddress = addresses[networkId]?.DEXPlatform;
  
  if (!dexAddress) {
    console.log("❌ DEX合约地址未找到");
    return;
  }

  console.log("DEX合约地址:", dexAddress);
  const DEXPlatform = await ethers.getContractFactory("DEXPlatform");
  const dex = DEXPlatform.attach(dexAddress);

  try {
    console.log("\n=== 创建 WETH/USDC 交易池 ===");
    let tx = await dex.createPool(wethAddress, usdcAddress);
    await tx.wait();
    console.log("✅ WETH/USDC 池创建成功");

    console.log("\n=== 创建 WETH/DAI 交易池 ===");
    tx = await dex.createPool(wethAddress, daiAddress);
    await tx.wait();
    console.log("✅ WETH/DAI 池创建成功");

    console.log("\n=== 创建 USDC/DAI 交易池 ===");
    tx = await dex.createPool(usdcAddress, daiAddress);
    await tx.wait();
    console.log("✅ USDC/DAI 池创建成功");

    console.log("\n=== 获取所有池子 ===");
    const allPools = await dex.getAllPools();
    console.log("总池子数量:", allPools.length);
    
    for (let i = 0; i < allPools.length; i++) {
      const poolId = allPools[i];
      const poolInfo = await dex.getPoolInfo(poolId);
      console.log(`池子 ${i + 1}:`, {
        poolId: poolId,
        tokenA: poolInfo[0],
        tokenB: poolInfo[1],
        reserveA: ethers.formatEther(poolInfo[2]),
        reserveB: ethers.formatEther(poolInfo[3]),
        totalLiquidity: ethers.formatEther(poolInfo[4])
      });
    }

    // 更新地址配置
    console.log("\n=== 更新合约地址配置 ===");
    addresses[networkId].USDC = usdcAddress;
    addresses[networkId].DAI = daiAddress;
    addresses[networkId].WETH = wethAddress;
    
    const fs = require('fs');
    fs.writeFileSync('./src/contracts/addresses.json', JSON.stringify(addresses, null, 2));
    console.log("✅ 地址配置已更新");

    console.log("\n🎉 测试代币部署和DEX初始化完成！");
    console.log("WETH:", wethAddress);
    console.log("USDC:", usdcAddress);
    console.log("DAI:", daiAddress);
    
  } catch (error) {
    console.error("❌ 初始化失败:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 