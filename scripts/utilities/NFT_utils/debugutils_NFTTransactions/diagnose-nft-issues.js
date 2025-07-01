const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔍 NFT Market Issues Diagnostic');
  console.log('='.repeat(50));
  
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8546');
  
  // 读取地址配置
  const addressesPath = path.join(__dirname, '../../../../src/contracts/addresses.json');
  const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  const anvilAddresses = addresses['31338'];
  
  if (!anvilAddresses) {
    console.log('❌ No addresses found for Anvil network');
    return;
  }
  
  console.log('📋 Using addresses:');
  console.log(`   NFT: ${anvilAddresses.PlatformNFT}`);
  console.log(`   Market: ${anvilAddresses.NFTMarketplace}`);
  
  const nftAbi = [
    'function totalSupply() view returns (uint256)',
    'function tokenURI(uint256) view returns (string)', 
    'function ownerOf(uint256) view returns (address)',
    'function balanceOf(address) view returns (uint256)'
  ];
  
  const marketAbi = [
    'function getListingCount() view returns (uint256)',
    'function getListing(uint256) view returns (uint256, address, uint256, uint8, uint8, uint256, address, uint256, uint256, uint256)',
    'function isApprovedForAll(address,address) view returns (bool)'
  ];
  
  try {
    const nft = new ethers.Contract(anvilAddresses.PlatformNFT, nftAbi, provider);
    const market = new ethers.Contract(anvilAddresses.NFTMarketplace, marketAbi, provider);
    
    // 检查NFT基本信息
    console.log('\n🎨 NFT Contract Status:');
    const totalSupply = await nft.totalSupply();
    console.log(`   Total Supply: ${totalSupply}`);
    
    const deployer = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const balance = await nft.balanceOf(deployer);
    console.log(`   Deployer Balance: ${balance}`);
    
    // 检查每个NFT
    console.log('\n🖼️ Individual NFT Status:');
    for(let i = 1; i <= Number(totalSupply); i++) {
      try {
        const owner = await nft.ownerOf(i);
        console.log(`   ✅ Token ${i}: Owner ${owner}`);
        
        try {
          const uri = await nft.tokenURI(i);
          console.log(`      URI: ${uri.length > 60 ? uri.substring(0, 60) + '...' : uri}`);
        } catch(e) {
          console.log(`      ❌ URI Error: ${e.reason || e.message}`);
        }
      } catch(e) {
        console.log(`   ❌ Token ${i}: ${e.reason || e.message}`);
      }
    }
    
    // 检查市场状态
    console.log('\n🏪 Marketplace Status:');
    const listingCount = await market.getListingCount();
    console.log(`   Listing Count: ${listingCount}`);
    
    // 模拟前端逻辑
    const listingsMap = new Map();
    const activeListings = [];
    
    if (Number(listingCount) > 0) {
      for(let i = 1; i <= Number(listingCount); i++) {
        try {
          const listing = await market.getListing(i);
          const tokenId = listing[0];
          const seller = listing[1];
          const price = listing[2];
          const listingType = listing[3];
          const status = listing[4];
          
          console.log(`   ✅ Listing ${i}:`, {
            tokenId: tokenId.toString(),
            seller: seller,
            price: ethers.formatEther(price) + ' ETH',
            listingType: listingType === 0n ? 'FIXED_PRICE' : 'AUCTION',
            status: status.toString(),
            statusType: typeof status,
            statusNumber: Number(status),
            active: Number(status) === 0
          });
          
          // 检查是否为活跃状态
          if (Number(status) === 0) {
            activeListings.push({
              listingId: i,
              tokenId: Number(tokenId),
              price: ethers.formatEther(price),
              seller
            });
            
            // 添加到前端使用的Map中
            listingsMap.set(Number(tokenId), {
              listingId: i,
              tokenId: Number(tokenId),
              price: ethers.formatEther(price),
              isListed: true,
              listingType: Number(listingType) === 0 ? 'FIXED_PRICE' : 'AUCTION',
              seller: seller,
            });
          }
        } catch(e) {
          console.log(`   ❌ Listing ${i}: ${e.reason || e.message}`);
        }
      }
    } else {
      console.log('   ℹ️ No listings found - this is expected for fresh deployment');
    }
    
    // 显示活跃listing数量
    console.log(`\n   🔵 Active listings found: ${activeListings.length}`);
    console.log(`   🔵 Listings in frontend map: ${listingsMap.size}`);
    
    // 检查授权状态
    console.log('\n🔐 Authorization Status:');
    try {
      const isApproved = await market.isApprovedForAll(deployer, anvilAddresses.NFTMarketplace);
      console.log(`   Global Approval: ${isApproved ? '✅ Enabled' : '❌ Disabled'}`);
    } catch(e) {
      console.log(`   ❌ Approval Check Failed: ${e.reason || e.message}`);
    }
    
    // 诊断建议
    console.log('\n💡 Diagnostic Summary:');
    if (Number(totalSupply) === 0) {
      console.log('   🔴 No NFTs minted - run deployment script to create sample NFTs');
    } else {
      console.log(`   🟢 ${totalSupply} NFTs found`);
    }
    
    if (activeListings.length === 0) {
      console.log('   🟡 No active listings found - this may be expected for fresh deployment');
      console.log('   💡 Create listings through the frontend to test marketplace');
    } else {
      console.log(`   🟢 ${activeListings.length} active listings found`);
    }
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. If tokenURI fails: Check IPFS service or metadata generation');
    console.log('   2. If listings fail: Try creating new listings through frontend');
    console.log('   3. If images fail to load: Check network connectivity');
    
  } catch(e) {
    console.error('❌ Contract Error:', e.message);
    console.log('\n🔧 Possible Solutions:');
    console.log('   1. Check if Anvil network is running on port 8546');
    console.log('   2. Verify contract addresses are correct');
    console.log('   3. Re-deploy contracts if needed');
  }
}

main().catch(console.error); 