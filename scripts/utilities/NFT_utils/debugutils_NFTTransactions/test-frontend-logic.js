const { ethers } = require('hardhat');
const path = require('path');

async function testFrontendLogic() {
  try {
    const provider = new ethers.JsonRpcProvider('http://localhost:8546');
    const addresses = JSON.parse(require('fs').readFileSync(path.join(__dirname, '../../../../src/contracts/addresses.json')));
    const marketAddress = addresses['31338'].NFTMarketplace;
    
    const marketAbi = [
      'function getListingCount() view returns (uint256)',
      'function getListing(uint256) view returns (uint256, address, uint256, uint8, uint8, uint256, address, uint256, uint256, uint256)'
    ];
    
    const market = new ethers.Contract(marketAddress, marketAbi, provider);
    
    console.log('🧪 Testing Frontend Marketplace Logic...\n');
    
    // Simulate frontend loadMarketplaceData function
    const listingsMap = new Map();
    
    const listingCount = await market.getListingCount();
    console.log(`Total listing count: ${listingCount}`);
    
    const listingPromises = [];
    for (let i = 0; i < Number(listingCount); i++) {
      listingPromises.push(
        market.getListing(i)
          .then(listingResult => {
            console.log(`✅ Successfully fetched listing ${i}`);
            const [tokenId, seller, price, listingType, status] = listingResult;
            return { tokenId, seller, price, listingType, status, listingId: i };
          })
          .catch(err => {
            console.warn(`⚠️ Could not fetch listing #${i}, it might be invalid.`, err.reason || err.message);
            return null; // Return null on failure
          })
      );
    }

    const settledListings = await Promise.all(listingPromises);
    const validListings = settledListings.filter(l => l !== null);
    
    console.log(`\nValid listings found: ${validListings.length}`);
    
    validListings.forEach((listing) => {
      console.log(`\nProcessing listing ${listing.listingId}:`);
      console.log(`  Token ID: ${listing.tokenId}`);
      console.log(`  Status: ${listing.status} (type: ${typeof listing.status})`);
      console.log(`  Status === 0: ${listing.status === 0}`);
      console.log(`  Status == 0: ${listing.status == 0}`);
      console.log(`  Number(status): ${Number(listing.status)}`);
      
      // ListingStatus enum: 0: Active, 1: Sold, 2: Cancelled, 3: Ended
      if (listing && Number(listing.status) === 0) {
        const listingData = {
          listingId: listing.listingId,
          tokenId: Number(listing.tokenId),
          price: ethers.formatEther(listing.price),
          isListed: true,
          listingType: Number(listing.listingType) === 0 ? 'FIXED_PRICE' : 'AUCTION',
          seller: listing.seller,
        };
        
        listingsMap.set(Number(listing.tokenId), listingData);
        console.log(`  ✅ Added to listings map: Token ${listing.tokenId}`);
      } else {
        console.log(`  ❌ Skipped (status: ${listing.status})`);
      }
    });
    
    console.log(`\n📊 Final Result:`);
    console.log(`Active listings in map: ${listingsMap.size}`);
    
    listingsMap.forEach((listing, tokenId) => {
      console.log(`  Token ${tokenId}: ${listing.price} ETH (${listing.listingType})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFrontendLogic(); 