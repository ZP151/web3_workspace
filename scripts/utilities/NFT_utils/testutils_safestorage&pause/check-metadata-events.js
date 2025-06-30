const { ethers } = require("hardhat");

async function checkMetadataEvents() {
  console.log("🔍 检查元数据安全事件记录");
  console.log("=".repeat(50));

  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  console.log(`🌐 网络ID: ${chainId}`);

  // 读取合约地址
  const addresses = require("../../../../src/contracts/addresses.json");
  const networkAddresses = addresses[chainId];

  if (!networkAddresses || !networkAddresses.PlatformNFT) {
    console.error("❌ 未找到PlatformNFT合约地址");
    return;
  }

  try {
    const nftAddress = networkAddresses.PlatformNFT;
    const nftContract = await ethers.getContractAt("PlatformNFT", nftAddress);
    
    console.log(`📍 PlatformNFT地址: ${nftAddress}`);

    // 获取当前区块号
    const currentBlock = await ethers.provider.getBlockNumber();
    console.log(`📦 当前区块号: ${currentBlock}`);

    // 查询所有 MetadataSecurityWarning 事件
    console.log("\n🔍 查询MetadataSecurityWarning事件...");
    
    const filter = nftContract.filters.MetadataSecurityWarning();
    const events = await nftContract.queryFilter(filter, 0, currentBlock);
    
    console.log(`📊 找到 ${events.length} 个MetadataSecurityWarning事件`);

    if (events.length > 0) {
      console.log("\n📋 事件详情:");
      console.log("-".repeat(70));
      
      events.forEach((event, index) => {
        console.log(`事件 ${index + 1}:`);
        console.log(`  Token ID: ${event.args.tokenId}`);
        console.log(`  警告信息: ${event.args.reason}`);
        console.log(`  区块号: ${event.blockNumber}`);
        console.log(`  交易哈希: ${event.transactionHash}`);
        console.log("");
      });
    } else {
      console.log("ℹ️ 目前没有找到任何MetadataSecurityWarning事件");
      console.log("这可能意味着：");
      console.log("• 用户都使用了安全的IPFS/Arweave链接");
      console.log("• 用户在看到前端警告后选择了取消");
      console.log("• 还没有人尝试铸造NFT");
    }

    // 查询所有 NFTMinted 事件来对比
    console.log("\n🎨 查询NFTMinted事件进行对比...");
    
    const mintFilter = nftContract.filters.NFTMinted();
    const mintEvents = await nftContract.queryFilter(mintFilter, 0, currentBlock);
    
    console.log(`📊 找到 ${mintEvents.length} 个NFTMinted事件`);

    if (mintEvents.length > 0) {
      console.log("\n📋 铸造事件详情:");
      console.log("-".repeat(70));
      
      for (let i = 0; i < mintEvents.length; i++) {
        const event = mintEvents[i];
        console.log(`铸造事件 ${i + 1}:`);
        console.log(`  Token ID: ${event.args.tokenId}`);
        console.log(`  创建者: ${event.args.creator}`);
        console.log(`  Token URI: ${event.args.tokenURI}`);
        console.log(`  区块号: ${event.blockNumber}`);
        
        // 检查这个URI是否应该触发安全警告
        const uri = event.args.tokenURI;
        const isIPFS = uri.includes('ipfs://') || uri.includes('ipfs.io') || uri.includes('gateway.pinata.cloud');
        const isArweave = uri.includes('ar://') || uri.includes('arweave.net');
        
        if (!isIPFS && !isArweave) {
          console.log(`  ⚠️ 这个URI应该触发安全警告: ${uri}`);
        } else {
          console.log(`  ✅ 使用了安全存储: ${uri}`);
        }
        console.log("");
      }
    }

    // 统计分析
    console.log("\n📊 统计分析:");
    console.log("-".repeat(50));
    console.log(`总铸造事件: ${mintEvents.length}`);
    console.log(`安全警告事件: ${events.length}`);
    
    if (mintEvents.length > 0) {
      const warningRate = (events.length / mintEvents.length * 100).toFixed(1);
      console.log(`警告触发率: ${warningRate}%`);
    }

  } catch (error) {
    console.error("❌ 检查失败:", error.message);
  }
}

// 运行检查
checkMetadataEvents()
  .then(() => {
    console.log("\n✅ 元数据事件检查完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 检查脚本失败:", error);
    process.exit(1);
  }); 