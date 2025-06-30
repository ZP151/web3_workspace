const { ethers } = require("hardhat");

async function checkLatestNFTs() {
  console.log("🔍 检查最新NFT的详细信息");
  console.log("=".repeat(50));

  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

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

    // 获取当前区块号和总NFT数量
    const currentBlock = await ethers.provider.getBlockNumber();
    const totalSupply = await nftContract.totalSupply();
    
    console.log(`📦 当前区块号: ${currentBlock}`);
    console.log(`🎨 总NFT数量: ${totalSupply}`);

    // 查询最近的 NFTMinted 事件（最后5个）
    const mintFilter = nftContract.filters.NFTMinted();
    const mintEvents = await nftContract.queryFilter(mintFilter, Math.max(0, currentBlock - 20), currentBlock);
    
    console.log(`\n📋 最近的NFT铸造事件 (最后${Math.min(5, mintEvents.length)}个):`);
    console.log("-".repeat(70));

    // 只显示最后5个
    const recentEvents = mintEvents.slice(-5);
    
    for (let i = 0; i < recentEvents.length; i++) {
      const event = recentEvents[i];
      const tokenId = event.args.tokenId;
      
      console.log(`\n🎨 NFT #${tokenId} (区块 ${event.blockNumber}):`);
      console.log(`  创建者: ${event.args.creator}`);
      console.log(`  Token URI: ${event.args.tokenURI}`);
      
      // 分析URI安全性
      const uri = event.args.tokenURI;
      const isIPFS = uri.includes('ipfs://') || uri.includes('ipfs.io') || uri.includes('gateway.pinata.cloud') || uri.includes('pinata.cloud/ipfs');
      const isArweave = uri.includes('ar://') || uri.includes('arweave.net');
      
      if (isIPFS) {
        console.log(`  🟢 安全存储: IPFS`);
      } else if (isArweave) {
        console.log(`  🟢 安全存储: Arweave`);
      } else {
        console.log(`  🟡 中心化存储: ${uri.startsWith('http') ? '外部HTTP' : '其他'}`);
      }

      // 检查是否有对应的安全警告事件
      const warningFilter = nftContract.filters.MetadataSecurityWarning(tokenId);
      const warningEvents = await nftContract.queryFilter(warningFilter, event.blockNumber, event.blockNumber);
      
      if (warningEvents.length > 0) {
        console.log(`  ⚠️ 触发安全警告: ${warningEvents[0].args.reason}`);
      } else {
        console.log(`  ✅ 无安全警告`);
      }
      
      console.log(`  🔗 交易: ${event.transactionHash}`);
    }

    // 检查是否有任何使用安全存储的NFT
    console.log(`\n📊 安全性统计分析:`);
    console.log("-".repeat(50));
    
    let secureCount = 0;
    let insecureCount = 0;
    
    const allMintEvents = await nftContract.queryFilter(mintFilter, 0, currentBlock);
    
    for (const event of allMintEvents) {
      const uri = event.args.tokenURI;
      const isIPFS = uri.includes('ipfs://') || uri.includes('ipfs.io') || uri.includes('gateway.pinata.cloud') || uri.includes('pinata.cloud/ipfs');
      const isArweave = uri.includes('ar://') || uri.includes('arweave.net');
      
      if (isIPFS || isArweave) {
        secureCount++;
      } else {
        insecureCount++;
      }
    }
    
    console.log(`🟢 使用安全存储的NFT: ${secureCount}`);
    console.log(`🟡 使用中心化存储的NFT: ${insecureCount}`);
    console.log(`📈 安全存储使用率: ${totalSupply > 0 ? (secureCount / totalSupply * 100).toFixed(1) : 0}%`);

  } catch (error) {
    console.error("❌ 检查失败:", error.message);
  }
}

// 运行检查
checkLatestNFTs()
  .then(() => {
    console.log("\n✅ 最新NFT检查完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 检查脚本失败:", error);
    process.exit(1);
  }); 