const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

function getContractAddress(chainId, contractName) {
  try {
    const addressesPath = path.join(__dirname, "../../src/contracts/addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    return addresses[chainId]?.[contractName];
  } catch (error) {
    console.error("Error reading addresses:", error.message);
    return null;
  }
}

async function checkUserData() {
  console.log("🔍 检查用户数据状态");
  console.log("=".repeat(50));
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  const userAddress = await deployer.getAddress();
  
  console.log(`👤 用户地址: ${userAddress}`);
  console.log(`🌐 网络ID: ${chainId}`);
  
  try {
    // 1. 检查TokenFactory状态
    console.log("\n🪙 TokenFactory状态:");
    const tokenFactoryAddress = getContractAddress(chainId, 'TokenFactory');
    if (tokenFactoryAddress) {
      const tokenFactory = await ethers.getContractAt("TokenFactory", tokenFactoryAddress);
      
      const totalTokens = await tokenFactory.getTokenCount();
      console.log(`  总代币数: ${totalTokens}`);
      
      const userTokenIndexes = await tokenFactory.getCreatorTokens(userAddress);
      console.log(`  用户创建的代币索引: [${userTokenIndexes.join(', ')}]`);
      
      for (let i = 0; i < userTokenIndexes.length; i++) {
        const index = userTokenIndexes[i];
        const tokenInfo = await tokenFactory.getTokenInfo(index);
        console.log(`  代币 ${i + 1}:`);
        console.log(`    名称: ${tokenInfo.name}`);
        console.log(`    符号: ${tokenInfo.symbol}`);
        console.log(`    地址: ${tokenInfo.tokenAddress}`);
        console.log(`    总供应量: ${ethers.formatEther(tokenInfo.totalSupply)} tokens`);
      }
    } else {
      console.log("  ❌ TokenFactory合约未部署");
    }
    
    // 2. 检查NFT状态
    console.log("\n🖼️ NFT状态:");
    const nftAddress = getContractAddress(chainId, 'PlatformNFT');
    if (nftAddress) {
      const nftContract = await ethers.getContractAt("PlatformNFT", nftAddress);
      
      const totalSupply = await nftContract.totalSupply();
      console.log(`  总NFT数量: ${totalSupply}`);
      
      // 检查用户拥有的NFT
      let userNFTs = [];
      for (let tokenId = 1; tokenId <= totalSupply; tokenId++) {
        try {
          const owner = await nftContract.ownerOf(tokenId);
          if (owner.toLowerCase() === userAddress.toLowerCase()) {
            const tokenURI = await nftContract.tokenURI(tokenId);
            userNFTs.push({ tokenId, tokenURI });
          }
        } catch (error) {
          // Token可能不存在，跳过
        }
      }
      
      console.log(`  用户拥有的NFT数量: ${userNFTs.length}`);
      userNFTs.forEach((nft, index) => {
        console.log(`  NFT ${index + 1}:`);
        console.log(`    Token ID: ${nft.tokenId}`);
        console.log(`    URI: ${nft.tokenURI}`);
      });
    } else {
      console.log("  ❌ PlatformNFT合约未部署");
    }
    
    // 3. 检查用户余额
    console.log("\n💰 用户余额:");
    const balance = await ethers.provider.getBalance(userAddress);
    console.log(`  ETH余额: ${ethers.formatEther(balance)} ETH`);
    
  } catch (error) {
    console.error("❌ 检查失败:", error.message);
  }
}

checkUserData()
  .then(() => {
    console.log("\n✅ 检查完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  }); 