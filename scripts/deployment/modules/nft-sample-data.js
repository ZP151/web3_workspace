const { ethers } = require("hardhat");

/**
 * NFT示例数据设置模块
 * 包含：铸造示例NFT
 */
async function setupNFTSampleData(platformNFTAddress, deployer) {
  console.log("🎨 Setting up NFT Sample Data...");
  
  const PlatformNFT = await ethers.getContractFactory("PlatformNFT");
  const platformNFT = PlatformNFT.attach(platformNFTAddress);

  const results = {
    nftsMinted: 0,
    totalFeesPaid: ethers.parseEther("0")
  };

  const sampleNFTs = [
    {
      name: "Genesis Badge",
      description: "First badge for early platform users",
      attributes: [
        { trait_type: "Rarity", value: "Common" },
        { trait_type: "Category", value: "Badge" }
      ]
    },
    {
      name: "Community Builder",
      description: "Special NFT for community contributors",
      attributes: [
        { trait_type: "Rarity", value: "Rare" },
        { trait_type: "Category", value: "Achievement" }
      ]
    },
    {
      name: "Early Adopter",
      description: "NFT for early platform adopters",
      attributes: [
        { trait_type: "Rarity", value: "Epic" },
        { trait_type: "Category", value: "Limited" }
      ]
    }
  ];

  console.log(`   🎨 Creating ${sampleNFTs.length} sample NFTs...`);

  for (const nft of sampleNFTs) {
    try {
      const mintFee = await platformNFT.mintFee();
      
      // Create metadata
      const metadata = {
        name: nft.name,
        description: nft.description,
        image: "https://via.placeholder.com/300x300.png?text=NFT", // Placeholder image
        attributes: nft.attributes
      };

      const tx = await platformNFT.mint(
        await deployer.getAddress(),
        JSON.stringify(metadata),
        250, // 2.5% royalty in basis points
        {
          value: mintFee,
          gasLimit: 800000
        }
      );
      await tx.wait();
      console.log(`   ✅ NFT "${nft.name}" minted successfully`);
      results.nftsMinted++;
      results.totalFeesPaid = results.totalFeesPaid + mintFee;
    } catch (error) {
      console.log(`   ⚠️ NFT "${nft.name}" minting failed:`, error.message);
    }
  }

  console.log("   📊 NFT sample data setup completed");
  console.log(`   📋 Results: ${results.nftsMinted} NFTs minted, ${ethers.formatEther(results.totalFeesPaid)} ETH fees paid`);
  
  // Check total supply
  try {
    const totalSupply = await platformNFT.totalSupply();
    console.log(`   📊 Total NFT supply: ${totalSupply.toString()}`);
  } catch (error) {
    console.log(`   ⚠️ Could not get NFT total supply:`, error.message);
  }
  
  return results;
}

module.exports = { setupNFTSampleData }; 