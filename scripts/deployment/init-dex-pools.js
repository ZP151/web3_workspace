const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 初始化DEX交易池...");
  
  const [deployer] = await ethers.getSigners();
  console.log("使用账户:", deployer.address);
  console.log("账户余额:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // 获取合约地址
  const addresses = require("../src/contracts/addresses.json");
  const networkId = (await deployer.provider.getNetwork()).chainId.toString();
  const dexAddress = addresses[networkId]?.DEXPlatform;
  
  if (!dexAddress) {
    console.log("❌ DEX合约地址未找到");
    return;
  }

  console.log("DEX合约地址:", dexAddress);

  // 连接到DEX合约
  const DEXPlatform = await ethers.getContractFactory("DEXPlatform");
  const dex = DEXPlatform.attach(dexAddress);

  // 获取实际部署的代币地址
  const WETH_ADDRESS = addresses[networkId]?.WETH;
  const USDC_ADDRESS = addresses[networkId]?.USDC;
  const DAI_ADDRESS = addresses[networkId]?.DAI;
  
  if (!WETH_ADDRESS || !USDC_ADDRESS || !DAI_ADDRESS) {
    console.log("❌ 代币地址未找到");
    console.log("WETH:", WETH_ADDRESS);
    console.log("USDC:", USDC_ADDRESS);
    console.log("DAI:", DAI_ADDRESS);
    return;
  }
  
  console.log("代币地址:");
  console.log("WETH:", WETH_ADDRESS);
  console.log("USDC:", USDC_ADDRESS);
  console.log("DAI:", DAI_ADDRESS);

  try {
    console.log("\n=== 创建 WETH/USDC 交易池 ===");
    let tx = await dex.createPool(WETH_ADDRESS, USDC_ADDRESS);
    await tx.wait();
    console.log("✅ WETH/USDC 池创建成功");

    console.log("\n=== 创建 WETH/DAI 交易池 ===");
    tx = await dex.createPool(WETH_ADDRESS, DAI_ADDRESS);
    await tx.wait();
    console.log("✅ WETH/DAI 池创建成功");

    console.log("\n=== 创建 USDC/DAI 交易池 ===");
    tx = await dex.createPool(USDC_ADDRESS, DAI_ADDRESS);
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

    console.log("\n🎉 DEX池子初始化完成！");
    
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