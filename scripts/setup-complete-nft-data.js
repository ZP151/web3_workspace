const { ethers } = require("hardhat");

async function main() {
  console.log("🎨 开始设置完整的NFT测试数据...");
  console.log("=" * 60);

  // 获取合约实例
  const contractsConfig = require('../src/contracts/addresses.json');
  const chainId = 1337; // Ganache
  
  if (!contractsConfig[chainId] || !contractsConfig[chainId].PlatformNFT || !contractsConfig[chainId].NFTMarketplace) {
    console.error("❌ 找不到合约地址，请先部署合约");
    console.log("💡 请运行: npx hardhat run scripts/deploy-ganache.js --network ganache");
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
  
  // 获取当前Token ID
  let currentTokenId = Number(await nftContract.getCurrentTokenId());
  console.log(`📋 当前Token ID: ${currentTokenId}`);

  // 完整的NFT数据模板
  const nftTemplates = [
    // 艺术类NFT
    {
      name: "Cosmic Dream #001",
      description: "A beautiful cosmic landscape with vibrant colors and ethereal beauty. This piece captures the infinite wonder of space.",
      category: "art",
      price: "0.1",
      rarity: "Rare",
      shouldList: true
    },
    {
      name: "Digital Harmony",
      description: "An abstract digital artwork representing the harmony of technology and nature in perfect balance.",
      category: "art", 
      price: "0.05",
      rarity: "Common",
      shouldList: true
    },
    {
      name: "Cosmic Warrior #001",
      description: "A legendary warrior from the cosmic realm, wielding the power of stars and ancient magic.",
      category: "art",
      price: "0.15",
      rarity: "Legendary",
      shouldList: true
    },
    {
      name: "Digital Landscape #042",
      description: "A serene digital landscape with floating islands and aurora lights dancing in the sky.",
      category: "art", 
      price: "0.08",
      rarity: "Rare",
      shouldList: true
    },
    {
      name: "Abstract Geometry #07",
      description: "Complex geometric patterns creating mesmerizing visual effects that challenge perception.",
      category: "art",
      price: "0.25",
      rarity: "Legendary",
      shouldList: false // 保留在钱包中
    },
    {
      name: "Portrait of the Future",
      description: "An AI-generated portrait showing humanity's future evolution through digital transformation.",
      category: "art",
      price: "0.14",
      rarity: "Rare",
      shouldList: true
    },
    
    // 头像类NFT
    {
      name: "Cyber Punk Avatar #123",
      description: "A futuristic avatar with neon implants and holographic accessories from the year 2077.",
      category: "avatars",
      price: "0.12",
      rarity: "Epic",
      shouldList: true
    },
    {
      name: "Mystic Warrior Avatar",
      description: "A mystical warrior avatar with ancient runes and magical aura surrounding the character.",
      category: "avatars",
      price: "0.16",
      rarity: "Epic",
      shouldList: true
    },
    
    // 游戏类NFT
    {
      name: "Virtual Pet Dragon",
      description: "A cute virtual dragon pet that can breathe digital fire and has special bonding abilities.",
      category: "gaming",
      price: "0.06",
      rarity: "Common",
      shouldList: true
    },
    {
      name: "Gaming Weapon Skin",
      description: "An exclusive weapon skin with particle effects and animations for ultimate gaming experience.",
      category: "gaming",
      price: "0.07",
      rarity: "Common",
      shouldList: true
    },
    {
      name: "Legendary Sword of Light",
      description: "A legendary gaming weapon with divine light effects and massive damage multipliers.",
      category: "gaming",
      price: "0.22",
      rarity: "Legendary",
      shouldList: false
    },
    
    // 音乐类NFT
    {
      name: "Music Visualizer NFT",
      description: "An animated NFT that responds to music frequencies and beats, creating stunning visual symphonies.",
      category: "music",
      price: "0.18",
      rarity: "Epic",
      shouldList: true
    },
    {
      name: "Electronic Beat #001",
      description: "A unique electronic music composition with exclusive rights and remix capabilities.",
      category: "music",
      price: "0.13",
      rarity: "Rare",
      shouldList: true
    },
    
    // 体育类NFT
    {
      name: "Sports Moment #456",
      description: "A historic sports moment captured in digital perfection, commemorating an epic victory.",
      category: "sports",
      price: "0.09",
      rarity: "Rare",
      shouldList: true
    },
    {
      name: "Championship Trophy",
      description: "A digital representation of the ultimate championship trophy with interactive celebrations.",
      category: "sports",
      price: "0.20",
      rarity: "Epic",
      shouldList: true
    },
    
    // 收藏品类NFT
    {
      name: "Collectible Card Alpha",
      description: "A rare collectible card from the Alpha series with special holographic effects.",
      category: "collectibles",
      price: "0.30",
      rarity: "Legendary",
      shouldList: false
    },
    {
      name: "Vintage Digital Watch",
      description: "A vintage-style digital watch NFT with functional time display and customizable faces.",
      category: "collectibles",
      price: "0.11",
      rarity: "Rare",
      shouldList: true
    },
    {
      name: "Rare Gem Collection",
      description: "A collection of rare digital gems with unique properties and investment potential.",
      category: "collectibles",
      price: "0.17",
      rarity: "Epic",
      shouldList: true
    },
    
    // 摄影类NFT
    {
      name: "Sunset Over Digital City",
      description: "A breathtaking sunset photograph over a futuristic digital cityscape.",
      category: "photography",
      price: "0.08",
      rarity: "Common",
      shouldList: true
    },
    {
      name: "Nature's Digital Mirror",
      description: "A stunning nature photograph that blends reality with digital enhancement.",
      category: "photography",
      price: "0.12",
      rarity: "Rare",
      shouldList: true
    }
  ];

  let nftsCreated = 0;
  let nftsListed = 0;
  
  console.log("\n🚀 开始创建NFT...");
  console.log("-" * 40);

  // 为每个用户创建NFT（跳过第一个用户，保留给部署者）
  for (let i = 1; i < Math.min(accounts.length, 9) && nftsCreated < nftTemplates.length; i++) {
    const creator = accounts[i];
    console.log(`\n👤 用户 ${i} (${creator.address.slice(0, 6)}...${creator.address.slice(-4)}):`);

    // 每个用户创建1-3个NFT
    const nftCount = Math.min(
      Math.floor(Math.random() * 3) + 1, // 1-3个NFT
      nftTemplates.length - nftsCreated   // 不超过剩余模板数量
    );
    
    for (let j = 0; j < nftCount && nftsCreated < nftTemplates.length; j++) {
      const template = nftTemplates[nftsCreated];
      
      try {
        console.log(`  🎨 创建: ${template.name} (Token ID: ${currentTokenId})`);
        
        // 生成tokenURI
        const tokenURI = `https://api.nft-platform.com/metadata/${currentTokenId}`;
        
        // 铸造NFT (包含铸造费用 0.001 ETH)
        const mintTx = await nftContract.connect(creator).mint(
          creator.address,
          tokenURI,
          250, // 2.5% royalty
          { value: ethers.parseEther("0.001") }
        );
        await mintTx.wait();
        
        console.log(`  ✅ 铸造成功 | 稀有度: ${template.rarity}`);
        
        // 根据模板决定是否上架销售
        if (template.shouldList) {
          console.log(`  🏪 上架到市场 (${template.price} ETH)...`);
          
          // 首先批准市场合约
          const approveTx = await nftContract.connect(creator).approve(marketplaceAddress, currentTokenId);
          await approveTx.wait();
          
          const listTx = await marketplaceContract.connect(creator).listItem(
            currentTokenId,
            ethers.parseEther(template.price),
            0, // FIXED_PRICE
            0  // 拍卖持续时间
          );
          await listTx.wait();
          
          console.log(`  ✅ 上架成功`);
          nftsListed++;
        } else {
          console.log(`  📦 保留在钱包中`);
        }
        
        currentTokenId++;
        nftsCreated++;
        
        // 添加延迟避免网络拥堵
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  ❌ 创建失败: ${error.message}`);
        // 继续处理下一个NFT
      }
    }
  }

  console.log("\n" + "=" * 60);
  console.log("🎉 NFT数据设置完成！");
  console.log(`📊 统计信息:`);
  console.log(`   - 总计创建: ${nftsCreated} 个NFT`);
  console.log(`   - 已上架销售: ${nftsListed} 个NFT`);
  console.log(`   - 保留钱包: ${nftsCreated - nftsListed} 个NFT`);
  
  // 显示市场统计
  try {
    const totalListings = await marketplaceContract.getCurrentListingId();
    console.log(`   - 市场总上架: ${totalListings} 个listing`);
    
    // 显示每个类别的统计
    const categoryStats = {};
    nftTemplates.slice(0, nftsCreated).forEach(nft => {
      categoryStats[nft.category] = (categoryStats[nft.category] || 0) + 1;
    });
    
    console.log(`\n📋 分类统计:`);
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`   - ${category}: ${count} 个NFT`);
    });
    
    // 显示稀有度统计
    const rarityStats = {};
    nftTemplates.slice(0, nftsCreated).forEach(nft => {
      rarityStats[nft.rarity] = (rarityStats[nft.rarity] || 0) + 1;
    });
    
    console.log(`\n🌟 稀有度统计:`);
    Object.entries(rarityStats).forEach(([rarity, count]) => {
      console.log(`   - ${rarity}: ${count} 个NFT`);
    });
    
  } catch (error) {
    console.log("📊 无法获取详细统计信息");
  }

  console.log("\n💡 提示:");
  console.log("   - 现在可以在前端查看这些NFT");
  console.log("   - 可以使用不同账户进行购买测试");
  console.log("   - 拥有NFT的用户可以重新上架销售");
  console.log("\n🔄 如需重新设置，请重新运行此脚本");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 脚本执行失败:", error);
    process.exit(1);
  }); 