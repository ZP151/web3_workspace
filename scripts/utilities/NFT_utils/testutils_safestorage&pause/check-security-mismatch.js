const { ethers } = require("hardhat");

async function checkSecurityMismatch() {
  console.log("🔍 检查安全警告匹配情况");
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

    // 获取当前区块号
    const currentBlock = await ethers.provider.getBlockNumber();
    console.log(`📦 当前区块号: ${currentBlock}`);

    // 获取所有NFTMinted事件
    const mintFilter = nftContract.filters.NFTMinted();
    const mintEvents = await nftContract.queryFilter(mintFilter, 0, currentBlock);
    
    // 获取所有MetadataSecurityWarning事件
    const warningFilter = nftContract.filters.MetadataSecurityWarning();
    const warningEvents = await nftContract.queryFilter(warningFilter, 0, currentBlock);
    
    console.log(`📊 总铸造事件: ${mintEvents.length}`);
    console.log(`⚠️ 总安全警告事件: ${warningEvents.length}`);

    // 创建警告事件的tokenId集合
    const warningTokenIds = new Set(warningEvents.map(event => event.args.tokenId.toString()));

    console.log("\n📋 详细匹配分析:");
    console.log("-".repeat(70));

    let secureNFTs = [];
    let insecureNFTs = [];

    for (const mintEvent of mintEvents) {
      const tokenId = mintEvent.args.tokenId.toString();
      const uri = mintEvent.args.tokenURI;
      const hasWarning = warningTokenIds.has(tokenId);
      
      // 前端逻辑：检查URI是否安全
      const isIPFS = uri.includes('ipfs://') || 
                     uri.includes('ipfs.io') || 
                     uri.includes('gateway.pinata.cloud/ipfs/') ||
                     uri.includes('pinata.cloud/ipfs/');
      
      const isArweave = uri.includes('ar://') || 
                        uri.includes('arweave.net');
      
      const shouldBeSecure = isIPFS || isArweave;

      console.log(`\n🎨 Token #${tokenId}:`);
      console.log(`  URI: ${uri}`);
      console.log(`  前端判断: ${shouldBeSecure ? '🟢 安全' : '🟡 不安全'}`);
      console.log(`  合约警告: ${hasWarning ? '⚠️ 有' : '✅ 无'}`);
      
      // 检查是否匹配
      if (shouldBeSecure && !hasWarning) {
        console.log(`  ✅ 匹配正确 - 安全URI，无警告`);
        secureNFTs.push({ tokenId, uri, type: 'secure_correct' });
      } else if (!shouldBeSecure && hasWarning) {
        console.log(`  ✅ 匹配正确 - 不安全URI，有警告`);
        insecureNFTs.push({ tokenId, uri, type: 'insecure_correct' });
      } else if (shouldBeSecure && hasWarning) {
        console.log(`  ❌ 不匹配 - 安全URI但有警告`);
        secureNFTs.push({ tokenId, uri, type: 'secure_mismatch' });
      } else if (!shouldBeSecure && !hasWarning) {
        console.log(`  ❌ 不匹配 - 不安全URI但无警告`);
        insecureNFTs.push({ tokenId, uri, type: 'insecure_mismatch' });
      }
    }

    // 汇总统计
    console.log("\n📊 匹配统计:");
    console.log("-".repeat(50));
    
    const secureCorrect = secureNFTs.filter(nft => nft.type === 'secure_correct').length;
    const secureMismatch = secureNFTs.filter(nft => nft.type === 'secure_mismatch').length;
    const insecureCorrect = insecureNFTs.filter(nft => nft.type === 'insecure_correct').length;
    const insecureMismatch = insecureNFTs.filter(nft => nft.type === 'insecure_mismatch').length;
    
    console.log(`🟢 安全URI + 无警告 (正确): ${secureCorrect}`);
    console.log(`🟡 不安全URI + 有警告 (正确): ${insecureCorrect}`);
    console.log(`❌ 安全URI + 有警告 (错误): ${secureMismatch}`);
    console.log(`❌ 不安全URI + 无警告 (错误): ${insecureMismatch}`);
    
    const totalCorrect = secureCorrect + insecureCorrect;
    const totalMismatch = secureMismatch + insecureMismatch;
    const accuracy = mintEvents.length > 0 ? (totalCorrect / mintEvents.length * 100).toFixed(1) : 0;
    
    console.log(`\n📈 安全检查准确率: ${accuracy}% (${totalCorrect}/${mintEvents.length})`);

    if (totalMismatch > 0) {
      console.log(`\n⚠️ 发现 ${totalMismatch} 个不匹配的情况，可能需要检查：`);
      console.log("• 前端安全检查逻辑");
      console.log("• 合约安全检查逻辑");
      console.log("• URL格式判断标准");
    }

    // 回答用户的问题
    if (secureCorrect > 0) {
      console.log(`\n🎯 找到 ${secureCorrect} 个使用安全存储且无警告的NFT`);
      console.log("这说明您的IPFS测试**可能**成功了，但没有在最近的记录中显示");
    } else {
      console.log(`\n🤔 没有找到使用安全存储的NFT`);
      console.log("这可能意味着：");
      console.log("• 您的IPFS测试没有完成铸造");
      console.log("• 您点击了'取消'按钮");
      console.log("• 或者遇到了其他技术问题");
    }

  } catch (error) {
    console.error("❌ 检查失败:", error.message);
  }
}

// 运行检查
checkSecurityMismatch()
  .then(() => {
    console.log("\n✅ 安全匹配检查完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 检查脚本失败:", error);
    process.exit(1);
  }); 