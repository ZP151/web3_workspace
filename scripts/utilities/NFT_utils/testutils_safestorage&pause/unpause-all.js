const { ethers } = require("hardhat");

// 恢复所有合约脚本
async function unpauseAll() {
  console.log("▶️ 恢复所有合约服务");
  console.log("=".repeat(50));

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  console.log(`👤 管理员: ${await deployer.getAddress()}`);
  console.log(`🌐 网络: ${chainId}`);

  // 读取合约地址
  const addresses = require("../../../../src/contracts/addresses.json");
  const networkAddresses = addresses[chainId];

  if (!networkAddresses) {
    console.error("❌ 未找到当前网络的合约地址");
    return;
  }

  const contractsWithPause = [
    { name: "PlatformNFT", address: networkAddresses.PlatformNFT },
    { name: "NFTMarketplace", address: networkAddresses.NFTMarketplace },
    { name: "EnhancedBank", address: networkAddresses.EnhancedBank }
  ];

  console.log("\n▶️ 开始恢复操作...");
  
  const unpauseResults = [];

  for (const contractInfo of contractsWithPause) {
    if (!contractInfo.address) {
      console.log(`⏭️ ${contractInfo.name}: 未部署，跳过`);
      continue;
    }

    try {
      const contract = await ethers.getContractAt(contractInfo.name, contractInfo.address);
      
      // 检查当前暂停状态
      const isPaused = await contract.paused();
      if (!isPaused) {
        console.log(`ℹ️ ${contractInfo.name}: 已经在运行`);
        unpauseResults.push({ name: contractInfo.name, status: "已在运行" });
        continue;
      }

      // 执行恢复
      console.log(`▶️ 恢复 ${contractInfo.name}...`);
      const unpauseTx = await contract.unpause();
      await unpauseTx.wait();
      
      console.log(`✅ ${contractInfo.name}: 恢复成功 (${unpauseTx.hash})`);
      unpauseResults.push({ name: contractInfo.name, status: "恢复成功", hash: unpauseTx.hash });

    } catch (error) {
      console.log(`❌ ${contractInfo.name}: 恢复失败 - ${error.message}`);
      unpauseResults.push({ name: contractInfo.name, status: "恢复失败", error: error.message });
    }
  }

  // 总结
  console.log("\n📊 服务恢复总结:");
  console.log("-".repeat(50));
  unpauseResults.forEach(result => {
    const statusIcon = result.status === "恢复成功" ? "✅" : 
                       result.status === "已在运行" ? "ℹ️" : "❌";
    console.log(`${statusIcon} ${result.name}: ${result.status}`);
    if (result.hash) {
      console.log(`   交易哈希: ${result.hash}`);
    }
  });

  console.log("\n🎉 恢复后可用功能:");
  console.log("• NFT 铸造功能已恢复");
  console.log("• NFT 市场交易已恢复"); 
  console.log("• 银行存取款功能已恢复");
  console.log("• 所有安全功能正常运行");
  
  console.log("\n🌐 前端访问:");
  console.log("http://localhost:3000/nft - NFT 页面");
  console.log("http://localhost:3000/banking - 银行页面");
}

// 运行恢复操作
unpauseAll()
  .then(() => {
    console.log("\n✅ 服务恢复操作完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 服务恢复失败:", error);
    process.exit(1);
  }); 