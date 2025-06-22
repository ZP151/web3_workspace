const { ethers } = require("hardhat");

async function main() {
  console.log("🎨 开始创建更多NFT测试数据...");

  // 获取合约实例
  const contractsConfig = require('../src/contracts/addresses.json');
  const chainId = 1337; // Ganache
  
  if (!contractsConfig[chainId] || !contractsConfig[chainId].PlatformNFT || !contractsConfig[chainId].NFTMarketplace) {
    console.error("❌ 找不到合约地址，请先部署合约");
    return;
  }

  const nftAddress = contractsConfig[chainId].PlatformNFT;
  const marketplaceAddress = contractsConfig[chainId].NFTMarketplace;

  console.log("📄 NFT合约地址:", nftAddress);
  console.log("🏪 市场合约地址:", marketplaceAddress);

  // 获取合约实例
  const PlatformNFT = await ethers.getContractFactory("PlatformNFT");
  const nftContract = PlatformNFT.attach(nftAddress);
  
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplaceContract = NFTMarketplace.attach(marketplaceAddress);

  // 获取所有Ganache账户
  const accounts = await ethers.getSigners();
  console.log(`👥 找到 ${accounts.length} 个账户`);

  // NFT模板数据
  const nftTemplates = [
    {
      name: "Cosmic Warrior #001",
      description: "A legendary warrior from the cosmic realm, wielding the power of stars.",
      category: "art",
      price: "0.15",
      rarity: "Legendary"
    },
    {
      name: "Digital Landscape #042",
      description: "A serene digital landscape with floating islands and aurora lights.",
      category: "art", 
      price: "0.08",
      rarity: "Rare"
    },
    {
      name: "Cyber Punk Avatar #123",
      description: "A futuristic avatar with neon implants and holographic accessories.",
      category: "avatars",
      price: "0.12",
      rarity: "Epic"
    },
    {
      name: "Virtual Pet Dragon",
      description: "A cute virtual dragon pet that can breathe digital fire.",
      category: "gaming",
      price: "0.06",
      rarity: "Common"
    },
    {
      name: "Abstract Geometry #07",
      description: "Complex geometric patterns creating mesmerizing visual effects.",
      category: "art",
      price: "0.25",
      rarity: "Legendary"
    },
    {
      name: "Music Visualizer NFT",
      description: "An animated NFT that responds to music frequencies and beats.",
      category: "music",
      price: "0.18",
      rarity: "Epic"
    },
    {
      name: "Sports Moment #456",
      description: "A historic sports moment captured in digital perfection.",
      category: "sports",
      price: "0.09",
      rarity: "Rare"
    },
    {
      name: "Collectible Card Alpha",
      description: "A rare collectible card from the Alpha series.",
      category: "collectibles",
      price: "0.30",
      rarity: "Legendary"
    },
    {
      name: "Gaming Weapon Skin",
      description: "An exclusive weapon skin with particle effects and animations.",
      category: "gaming",
      price: "0.07",
      rarity: "Common"
    },
    {
      name: "Portrait of the Future",
      description: "A AI-generated portrait showing humanity's future evolution.",
      category: "art",
      price: "0.14",
      rarity: "Rare"
    }
  ];

  // 获取当前Token ID
  let currentTokenId = Number(await nftContract.getCurrentTokenId());
  console.log(`📋 当前Token ID: ${currentTokenId}`);
  
  let nftsCreated = 0;
  
  // 为每个用户创建NFT（跳过第一个用户，保留给部署者）
  for (let i = 1; i < Math.min(accounts.length, 8); i++) {
    const creator = accounts[i];
    console.log(`\n👤 为用户 ${i} (${creator.address}) 创建NFT...`);

    // 每个用户创建1-2个NFT
    const nftCount = Math.random() > 0.5 ? 2 : 1;
    
    for (let j = 0; j < nftCount && nftsCreated < nftTemplates.length; j++) {
      const templateIndex = nftsCreated % nftTemplates.length;
      const template = nftTemplates[templateIndex];
      
      try {
        console.log(`  🎨 创建NFT: ${template.name} (Token ID: ${currentTokenId})`);
        
        // 生成tokenURI
        const tokenURI = `https://api.example.com/nft/${currentTokenId}`;
        
        // 铸造NFT (包含铸造费用 0.001 ETH)
        const mintTx = await nftContract.connect(creator).mint(
          creator.address,
          tokenURI,
          250, // 2.5% royalty
          { value: ethers.parseEther("0.001") }
        );
        await mintTx.wait();
        
        console.log(`  ✅ NFT铸造成功，Token ID: ${currentTokenId}`);
        
        // 随机决定是否上架销售（70%概率）
        if (Math.random() > 0.3) {
          console.log(`  🏪 准备上架NFT到市场...`);
          
          // 首先批准市场合约
          const approveTx = await nftContract.connect(creator).approve(marketplaceAddress, currentTokenId);
          await approveTx.wait();
          console.log(`  ✅ 已批准市场合约操作NFT`);
          
          const listTx = await marketplaceContract.connect(creator).listItem(
            currentTokenId,
            ethers.parseEther(template.price),
            0, // FIXED_PRICE
            0  // 拍卖持续时间
          );
          await listTx.wait();
          
          console.log(`  ✅ NFT上架成功，价格: ${template.price} ETH`);
        } else {
          console.log(`  📦 NFT保留在钱包中，未上架`);
        }
        
        currentTokenId++;
        nftsCreated++;
        
        // 添加延迟避免网络拥堵
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        console.error(`  ❌ 创建NFT失败:`, error.message);
      }
    }
  }

  console.log(`\n🎉 NFT创建完成！总共创建了 ${nftsCreated} 个新NFT`);
  
  // 显示市场统计
  try {
    const totalListings = await marketplaceContract.getCurrentListingId();
    console.log(`📊 市场统计:`);
    console.log(`   - 总上架数量: ${totalListings}`);
    console.log(`   - 总NFT数量: ${currentTokenId - 1}`);
  } catch (error) {
    console.log("📊 无法获取市场统计信息");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  }); 