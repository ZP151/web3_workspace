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

async function checkMarketplaceStatus() {
  console.log("🔍 检查Marketplace合约状态");
  console.log("=" .repeat(50));
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  
  console.log(`👤 用户地址: ${await deployer.getAddress()}`);
  console.log(`🌐 网络ID: ${chainId}`);
  
  try {
    // 1. 检查NFTMarketplace状态
    console.log("\\n🏪 NFTMarketplace状态:");
    const marketplaceAddress = getContractAddress(chainId, 'NFTMarketplace');
    if (marketplaceAddress) {
      console.log(`  合约地址: ${marketplaceAddress}`);
      
      const marketplace = await ethers.getContractAt("NFTMarketplace", marketplaceAddress);
      
      try {
        const listingCount = await marketplace.getListingCount();
        console.log(`  总listing数: ${listingCount.toString()}`);
        
        const stats = await marketplace.getMarketplaceStats();
        console.log(`  市场统计:`);
        console.log(`    总listings: ${stats.totalListings.toString()}`);
        console.log(`    总销售: ${stats.totalSales.toString()}`);
        console.log(`    总交易量: ${ethers.formatEther(stats.totalVolume)} ETH`);
        console.log(`    总NFT数: ${stats.totalNFTs.toString()}`);
        console.log(`    活跃listings: ${stats.activeListings.toString()}`);
        
        // 检查前几个listings
        if (listingCount > 0) {
          console.log(`\\n  前几个listings:`);
          const checkCount = Math.min(3, Number(listingCount));
          for (let i = 0; i < checkCount; i++) {
            try {
              const listing = await marketplace.getListing(i);
              console.log(`    Listing ${i}:`);
              console.log(`      Token ID: ${listing.tokenId.toString()}`);
              console.log(`      卖家: ${listing.seller}`);
              console.log(`      价格: ${ethers.formatEther(listing.price)} ETH`);
              console.log(`      状态: ${listing.status} (0=ACTIVE, 1=SOLD, 2=CANCELLED)`);
            } catch (error) {
              console.log(`    Listing ${i}: 读取失败 - ${error.message}`);
            }
          }
        }
        
      } catch (contractError) {
        console.error(`  ❌ 合约调用失败: ${contractError.message}`);
      }
    } else {
      console.log("  ❌ 合约未部署");
    }
    
    // 2. 检查PlatformNFT状态
    console.log("\\n🖼️ PlatformNFT状态:");
    const nftAddress = getContractAddress(chainId, 'PlatformNFT');
    if (nftAddress) {
      console.log(`  合约地址: ${nftAddress}`);
      
      const nft = await ethers.getContractAt("PlatformNFT", nftAddress);
      
      try {
        const totalSupply = await nft.totalSupply();
        console.log(`  总NFT数: ${totalSupply.toString()}`);
        
        const currentTokenId = await nft.getCurrentTokenId();
        console.log(`  下一个Token ID: ${currentTokenId.toString()}`);
        
        const mintFee = await nft.mintFee();
        console.log(`  铸造费用: ${ethers.formatEther(mintFee)} ETH`);
        
      } catch (contractError) {
        console.error(`  ❌ 合约调用失败: ${contractError.message}`);
      }
    } else {
      console.log("  ❌ 合约未部署");
    }
    
  } catch (error) {
    console.error("\\n❌ 检查失败:", error.message);
  }
  
  console.log("\\n✅ 检查完成");
}

checkMarketplaceStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("脚本执行失败:", error);
    process.exit(1);
  }); 