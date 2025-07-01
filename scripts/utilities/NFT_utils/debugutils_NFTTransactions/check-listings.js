const { ethers } = require('ethers');
const path = require('path');

async function checkListings() {
  const addresses = JSON.parse(require('fs').readFileSync(path.join(__dirname, '../../../../src/contracts/addresses.json')));
  const provider = new ethers.JsonRpcProvider('http://localhost:8546');
  const marketAbi = [
    'function getListingCount() view returns (uint256)',
    'function getListing(uint256) view returns (uint256,address,uint256,uint8,uint8,uint256,address,uint256,uint256,uint256)'
  ];
  const marketplace = new ethers.Contract(addresses['31338'].NFTMarketplace, marketAbi, provider);
  
  const count = await marketplace.getListingCount();
  console.log('Total listings:', count.toString());
  
  for (let i = 0; i < Number(count); i++) {
    try {
      const listing = await marketplace.getListing(i);
      console.log(`Listing ${i}:`, {
        tokenId: listing[0].toString(),
        seller: listing[1],
        price: ethers.formatEther(listing[2]),
        listingType: listing[3].toString(),
        status: listing[4].toString()
      });
    } catch(e) {
      console.log(`Listing ${i}: ERROR -`, e.message);
    }
  }
}

checkListings().catch(console.error); 