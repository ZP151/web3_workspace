const { ethers } = require("hardhat");

async function checkOwnerStatus() {
  console.log("👑 检查所有合约的管理员状态");
  console.log("=".repeat(50));

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  console.log(`👤 当前账户: ${await deployer.getAddress()}`);
  console.log(`🌐 网络ID: ${chainId}`);

  // 读取合约地址
  const addresses = require("../../../../src/contracts/addresses.json");
  const networkAddresses = addresses[chainId];

  if (!networkAddresses) {
    console.error("❌ 未找到当前网络的合约地址");
    return;
  }

  const contractsToCheck = [
    { name: "PlatformNFT", address: networkAddresses.PlatformNFT },
    { name: "NFTMarketplace", address: networkAddresses.NFTMarketplace },
    { name: "EnhancedBank", address: networkAddresses.EnhancedBank },
    { name: "DEXPlatform", address: networkAddresses.DEXPlatform },
    { name: "VotingCore", address: networkAddresses.VotingCore },
    { name: "TokenFactory", address: networkAddresses.TokenFactory }
  ];

  console.log("\n📋 合约管理员状态:");
  console.log("-".repeat(70));

  for (const contractInfo of contractsToCheck) {
    if (!contractInfo.address) {
      console.log(`❌ ${contractInfo.name}: 未部署`);
      continue;
    }

    try {
      const contract = await ethers.getContractAt(contractInfo.name, contractInfo.address);
      
      // 检查所有者
      const owner = await contract.owner();
      const isCurrentOwner = owner.toLowerCase() === (await deployer.getAddress()).toLowerCase();
      
      // 检查暂停状态（如果支持）
      let pauseStatus = "不支持";
      try {
        const isPaused = await contract.paused();
        pauseStatus = isPaused ? "已暂停" : "正常运行";
      } catch (error) {
        // 合约不支持暂停功能
      }

      console.log(`✅ ${contractInfo.name}:`);
      console.log(`   地址: ${contractInfo.address}`);
      console.log(`   所有者: ${owner}`);
      console.log(`   您是管理员: ${isCurrentOwner ? '是' : '否'}`);
      console.log(`   暂停状态: ${pauseStatus}`);
      console.log("");

    } catch (error) {
      console.log(`❌ ${contractInfo.name}: 检查失败 - ${error.message}`);
    }
  }

  // 显示管理员可用操作
  console.log("🛠️ 作为管理员，您可以执行的操作:");
  console.log("-".repeat(50));
  console.log("• pause() / unpause() - 暂停/恢复合约操作");
  console.log("• setMintFee() - 设置铸造费用 (PlatformNFT)");
  console.log("• setMarketplaceFee() - 设置市场费用 (NFTMarketplace)");
  console.log("• emergencyWithdraw() - 紧急提取资金");
  console.log("• transferOwnership() - 转移管理员权限");

  console.log("\n⚠️ 安全建议:");
  console.log("• 考虑使用多重签名钱包管理合约");
  console.log("• 定期备份私钥");
  console.log("• 谨慎使用紧急暂停功能");
}

// 运行检查
checkOwnerStatus()
  .then(() => {
    console.log("\n✅ 管理员状态检查完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 检查脚本失败:", error);
    process.exit(1);
  }); 