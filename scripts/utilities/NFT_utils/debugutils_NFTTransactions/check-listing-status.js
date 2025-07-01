const { ethers } = require('hardhat');
const path = require('path');

async function checkListingStatus() {
  try {
    const provider = new ethers.JsonRpcProvider('http://localhost:8546');
    const addresses = JSON.parse(require('fs').readFileSync(path.join(__dirname, '../../../../src/contracts/addresses.json')));
    const marketAddress = addresses['31338'].NFTMarketplace;
    
    // 使用简化的ABI
    const marketAbi = [
      'function getListingCount() view returns (uint256)',
      'function getListing(uint256) view returns (uint256, address, uint256, uint8, uint8, uint256, address, uint256, uint256, uint256)'
    ];
    
    const market = new ethers.Contract(marketAddress, marketAbi, provider);
    
    console.log('🏪 Checking Marketplace Listing Status...\n');
    
    const count = await market.getListingCount();
    console.log(`Total listings: ${count}\n`);
    
    for(let i = 0; i < Number(count); i++) {
      try {
        console.log(`Attempting to get listing ${i}...`);
        const result = await market.getListing(i);
        console.log(`Listing ${i} (SUCCESS):`);
        console.log(`  Token ID: ${result[0]}`);
        console.log(`  Seller: ${result[1]}`);
        console.log(`  Price: ${ethers.formatEther(result[2])} ETH`);
        console.log(`  Type: ${result[3] === 0 ? 'FIXED_PRICE' : 'AUCTION'}`);
        console.log(`  Status: ${result[4]} (${getStatusName(result[4])})`);
        console.log(`  End Time: ${result[5]}`);
        console.log(`  Highest Bidder: ${result[6]}`);
        console.log(`  Highest Bid: ${ethers.formatEther(result[7])} ETH`);
        console.log(`  Created: ${new Date(Number(result[8]) * 1000).toISOString()}`);
        console.log(`  Updated: ${new Date(Number(result[9]) * 1000).toISOString()}`);
        console.log('---');
      } catch(e) {
        console.log(`Listing ${i} (ERROR): ${e.reason || e.message}`);
        console.log(`  Full error:`, e.shortMessage || e.message);
        console.log('---');
      }
    }
    
    // Additional debugging - check if listing index is 0-based instead of 1-based
    console.log('\n🔍 Testing 0-based indexing...');
    for(let i = 0; i < Number(count); i++) {
      try {
        const result = await market.getListing(i);
        console.log(`Listing[${i}] works! Token ID: ${result[0]}, Status: ${result[4]}`);
      } catch(e) {
        console.log(`Listing[${i}] failed: ${e.reason || e.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

function getStatusName(status) {
  const statuses = ['ACTIVE', 'SOLD', 'CANCELLED', 'ENDED'];
  return statuses[status] || 'UNKNOWN';
}

checkListingStatus(); 