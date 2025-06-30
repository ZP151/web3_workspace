const { ethers } = require("hardhat");

// 紧急暂停脚本 - 用于快速暂停所有关键合约
async function emergencyPause() {
  console.log("🚨 紧急暂停所有合约");
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

  console.log("\n🛑 开始紧急暂停操作...");
  
  const pauseResults = [];

  for (const contractInfo of contractsWithPause) {
    if (!contractInfo.address) {
      console.log(`⏭️ ${contractInfo.name}: 未部署，跳过`);
      continue;
    }

    try {
      const contract = await ethers.getContractAt(contractInfo.name, contractInfo.address);
      
      // 检查是否已经暂停
      const isPaused = await contract.paused();
      if (isPaused) {
        console.log(`ℹ️ ${contractInfo.name}: 已经暂停`);
        pauseResults.push({ name: contractInfo.name, status: "已暂停" });
        continue;
      }

      // 执行暂停
      console.log(`🛑 暂停 ${contractInfo.name}...`);
      const pauseTx = await contract.pause();
      await pauseTx.wait();
      
      console.log(`✅ ${contractInfo.name}: 暂停成功 (${pauseTx.hash})`);
      pauseResults.push({ name: contractInfo.name, status: "暂停成功", hash: pauseTx.hash });

    } catch (error) {
      console.log(`❌ ${contractInfo.name}: 暂停失败 - ${error.message}`);
      pauseResults.push({ name: contractInfo.name, status: "暂停失败", error: error.message });
    }
  }

  // 总结
  console.log("\n📊 紧急暂停总结:");
  console.log("-".repeat(50));
  pauseResults.forEach(result => {
    const statusIcon = result.status === "暂停成功" ? "✅" : 
                       result.status === "已暂停" ? "ℹ️" : "❌";
    console.log(`${statusIcon} ${result.name}: ${result.status}`);
    if (result.hash) {
      console.log(`   交易哈希: ${result.hash}`);
    }
  });

  console.log("\n⚠️ 暂停后的影响:");
  console.log("• NFT 铸造功能已停止");
  console.log("• NFT 市场交易已停止"); 
  console.log("• 银行存取款功能已停止");
  console.log("• 现有资金和NFT安全保存");
  
  console.log("\n🔧 要恢复服务，请运行:");
  console.log("npx hardhat run scripts/utilities/unpause-all.js --network anvil");
}

// 运行紧急暂停
emergencyPause()
  .then(() => {
    console.log("\n🚨 紧急暂停操作完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 紧急暂停失败:", error);
    process.exit(1);
  }); 