const { ethers } = require("hardhat");

async function testPauseFunctions() {
  console.log("🔒 测试合约暂停功能");
  console.log("=".repeat(50));

  const [deployer, user1] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  console.log(`👤 管理员地址: ${await deployer.getAddress()}`);
  console.log(`👤 测试用户地址: ${await user1.getAddress()}`);
  console.log(`🌐 网络ID: ${chainId}`);

  // 读取合约地址
  const addresses = require("../../../../src/contracts/addresses.json");
  const networkAddresses = addresses[chainId];

  if (!networkAddresses) {
    console.error("❌ 未找到当前网络的合约地址");
    return;
  }

  try {
    // 测试 PlatformNFT 暂停功能
    console.log("\n🖼️ 测试 PlatformNFT 暂停功能:");
    const nftAddress = networkAddresses.PlatformNFT;
    const nftContract = await ethers.getContractAt("PlatformNFT", nftAddress);

    // 检查当前暂停状态
    const isPausedBefore = await nftContract.paused();
    console.log(`  当前暂停状态: ${isPausedBefore ? '已暂停' : '正常运行'}`);

    // 检查管理员权限
    const owner = await nftContract.owner();
    console.log(`  合约所有者: ${owner}`);
    console.log(`  是否为管理员: ${owner.toLowerCase() === (await deployer.getAddress()).toLowerCase()}`);

    if (!isPausedBefore) {
      // 暂停合约
      console.log("\n  🛑 暂停 NFT 合约...");
      const pauseTx = await nftContract.pause();
      await pauseTx.wait();
      console.log(`  ✅ NFT 合约已暂停: ${pauseTx.hash}`);

      // 测试铸造功能（应该失败）
      console.log("\n  🧪 测试暂停状态下的铸造功能...");
      try {
        await nftContract.connect(user1).mint(
          await user1.getAddress(),
          "https://example.com/test.json",
          250,
          { value: ethers.parseEther("0.001") }
        );
        console.log("  ❌ 错误：暂停状态下铸造应该失败");
      } catch (error) {
        console.log("  ✅ 正确：暂停状态下铸造被阻止");
        console.log(`  错误信息: ${error.message.includes("EnforcedPause") ? "合约已暂停" : error.message}`);
      }

      // 恢复合约
      console.log("\n  ▶️ 恢复 NFT 合约...");
      const unpauseTx = await nftContract.unpause();
      await unpauseTx.wait();
      console.log(`  ✅ NFT 合约已恢复: ${unpauseTx.hash}`);

      // 测试铸造功能（应该成功）
      console.log("\n  🧪 测试恢复后的铸造功能...");
      try {
        const mintTx = await nftContract.connect(user1).mint(
          await user1.getAddress(),
          "ipfs://test-secure-uri",
          250,
          { value: ethers.parseEther("0.001") }
        );
        await mintTx.wait();
        console.log("  ✅ 恢复后铸造成功");
      } catch (error) {
        console.log(`  ❌ 恢复后铸造失败: ${error.message}`);
      }
    } else {
      console.log("  ℹ️ 合约已处于暂停状态，先恢复...");
      const unpauseTx = await nftContract.unpause();
      await unpauseTx.wait();
      console.log("  ✅ 合约已恢复");
    }

    // 测试 NFTMarketplace 暂停功能
    console.log("\n🏪 测试 NFTMarketplace 暂停功能:");
    const marketplaceAddress = networkAddresses.NFTMarketplace;
    const marketplaceContract = await ethers.getContractAt("NFTMarketplace", marketplaceAddress);

    const isMarketPausedBefore = await marketplaceContract.paused();
    console.log(`  当前暂停状态: ${isMarketPausedBefore ? '已暂停' : '正常运行'}`);

    if (!isMarketPausedBefore) {
      // 暂停市场
      console.log("\n  🛑 暂停 NFT 市场...");
      const pauseMarketTx = await marketplaceContract.pause();
      await pauseMarketTx.wait();
      console.log(`  ✅ NFT 市场已暂停: ${pauseMarketTx.hash}`);

      // 恢复市场
      console.log("\n  ▶️ 恢复 NFT 市场...");
      const unpauseMarketTx = await marketplaceContract.unpause();
      await unpauseMarketTx.wait();
      console.log(`  ✅ NFT 市场已恢复: ${unpauseMarketTx.hash}`);
    }

    // 测试非管理员权限（应该失败）
    console.log("\n🔐 测试非管理员权限:");
    try {
      await nftContract.connect(user1).pause();
      console.log("  ❌ 错误：非管理员不应该能暂停合约");
    } catch (error) {
      console.log("  ✅ 正确：非管理员无法暂停合约");
      console.log(`  错误信息: ${error.message.includes("OwnableUnauthorizedAccount") ? "权限不足" : error.message}`);
    }

  } catch (error) {
    console.error("❌ 测试失败:", error.message);
  }
}

// 运行测试
testPauseFunctions()
  .then(() => {
    console.log("\n✅ 暂停功能测试完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 测试脚本失败:", error);
    process.exit(1);
  }); 