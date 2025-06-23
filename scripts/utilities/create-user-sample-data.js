const { ethers } = require("hardhat");
const { getContractAddress, getContractABI } = require("../../src/config/contracts");

async function createUserSampleData(userAddress) {
  console.log("🎯 为用户创建示例数据");
  console.log("=".repeat(50));
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  
  console.log(`📋 配置信息:`);
  console.log(`  网络ID: ${chainId}`);
  console.log(`  目标用户: ${userAddress}`);
  console.log(`  部署者: ${await deployer.getAddress()}`);
  
  try {
    // 1. 为用户创建代币
    console.log("\n🪙 为用户创建代币...");
    const tokenFactoryAddress = getContractAddress(chainId, 'TokenFactory');
    const tokenFactoryABI = getContractABI('TokenFactory');
    
    if (!tokenFactoryAddress) {
      throw new Error("TokenFactory合约未部署");
    }
    
    const tokenFactory = await ethers.getContractAt(tokenFactoryABI, tokenFactoryAddress);
    const creationFee = await tokenFactory.creationFee();
    
    const userTokens = [
      {
        name: "My Personal Token",
        symbol: "MPT",
        supply: ethers.parseEther("1000"),
        description: "我的个人代币"
      },
      {
        name: "Community Reward",
        symbol: "CREWARD", 
        supply: ethers.parseEther("5000"),
        description: "社区奖励代币"
      }
    ];
    
    // 发送ETH给用户用于支付gas和费用
    console.log(`💰 向用户发送ETH用于创建代币...`);
    const ethAmount = ethers.parseEther("1.0"); // 1 ETH用于gas费用
    await deployer.sendTransaction({
      to: userAddress,
      value: ethAmount
    });
    console.log(`✅ 已发送 1 ETH 到用户账户`);
    
    // 使用impersonation来模拟用户创建代币
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [userAddress],
    });
    
    const userSigner = await ethers.getSigner(userAddress);
    const tokenFactoryAsUser = tokenFactory.connect(userSigner);
    
    for (const token of userTokens) {
      console.log(`\n  创建代币: ${token.name} (${token.symbol})`);
      
      const tx = await tokenFactoryAsUser.createToken(
        token.name,
        token.symbol,
        token.supply,
        token.description,
        { value: creationFee, gasLimit: 2000000 }
      );
      
      const receipt = await tx.wait();
      console.log(`✅ 代币创建成功: ${token.symbol}`);
      console.log(`   交易哈希: ${receipt.hash}`);
    }
    
    // 2. 为用户铸造NFT
    console.log("\n🖼️ 为用户铸造NFT...");
    const nftAddress = getContractAddress(chainId, 'PlatformNFT');
    const nftABI = getContractABI('PlatformNFT');
    
    if (!nftAddress) {
      throw new Error("PlatformNFT合约未部署");
    }
    
    const nftContract = await ethers.getContractAt(nftABI, nftAddress);
    const mintFee = await nftContract.mintFee();
    
    const userNFTs = [
      {
        name: "My First NFT",
        description: "我的第一个NFT",
        image: "https://via.placeholder.com/400x400/6366f1/ffffff?text=My+First+NFT"
      },
      {
        name: "Digital Art #1", 
        description: "我的数字艺术作品",
        image: "https://via.placeholder.com/400x400/8b5cf6/ffffff?text=Digital+Art"
      },
      {
        name: "Collector Item",
        description: "收藏品NFT", 
        image: "https://via.placeholder.com/400x400/06b6d4/ffffff?text=Collector+Item"
      }
    ];
    
    const nftContractAsUser = nftContract.connect(userSigner);
    
    for (const nft of userNFTs) {
      console.log(`\n  铸造NFT: ${nft.name}`);
      
      const tx = await nftContractAsUser.mint(
        userAddress,
        nft.name,
        nft.description,
        nft.image,
        { value: mintFee, gasLimit: 800000 }
      );
      
      const receipt = await tx.wait();
      console.log(`✅ NFT铸造成功: ${nft.name}`);
      console.log(`   交易哈希: ${receipt.hash}`);
    }
    
    // 停止模拟用户
    await network.provider.request({
      method: "hardhat_stopImpersonatingAccount", 
      params: [userAddress],
    });
    
    // 3. 获取最新状态
    console.log("\n📊 创建完成 - 最新状态:");
    
    const tokenCount = await tokenFactory.getTokenCount();
    console.log(`  TokenFactory总代币数: ${tokenCount}`);
    
    const totalSupply = await nftContract.totalSupply();
    console.log(`  NFT总供应量: ${totalSupply}`);
    
    // 检查用户余额
    const userBalance = await ethers.provider.getBalance(userAddress);
    console.log(`  用户ETH余额: ${ethers.formatEther(userBalance)} ETH`);
    
    console.log("\n🎉 用户示例数据创建完成!");
    console.log("💡 提示: 刷新前端页面查看您的NFT和代币");
    
  } catch (error) {
    console.error("❌ 创建用户示例数据失败:", error.message);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const userAddress = process.argv[2];
  
  if (!userAddress) {
    console.error("❌ 请提供用户地址");
    console.log("用法: npx hardhat run scripts/utilities/create-user-sample-data.js --network localhost -- <用户地址>");
    process.exit(1);
  }
  
  if (!ethers.isAddress(userAddress)) {
    console.error("❌ 无效的用户地址");
    process.exit(1);
  }
  
  createUserSampleData(userAddress)
    .then(() => {
      console.log("✅ 脚本执行完成");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ 脚本执行失败:", error);
      process.exit(1);
    });
}

module.exports = { createUserSampleData }; 