const { ethers } = require('hardhat');
const path = require('path');

async function checkNFTContracts() {
  try {
    const provider = new ethers.JsonRpcProvider('http://localhost:8546');
    const addresses = JSON.parse(require('fs').readFileSync(path.join(__dirname, '../../../../src/contracts/addresses.json')));
    const anvilAddresses = addresses['31338'];
    
    console.log('🔍 Checking NFT contract deployments...\n');
    
    // Check PlatformNFT
    const nftAddress = anvilAddresses.PlatformNFT;
    const nftCode = await provider.getCode(nftAddress);
    console.log(`PlatformNFT (${nftAddress}):`);
    console.log(`  Status: ${nftCode !== '0x' ? '✅ HAS CODE' : '❌ NO CODE'}`);
    console.log(`  Code length: ${nftCode.length}`);
    
    // Check NFTMarketplace  
    const marketAddress = anvilAddresses.NFTMarketplace;
    const marketCode = await provider.getCode(marketAddress);
    console.log(`\nNFTMarketplace (${marketAddress}):`);
    console.log(`  Status: ${marketCode !== '0x' ? '✅ HAS CODE' : '❌ NO CODE'}`);
    console.log(`  Code length: ${marketCode.length}`);
    
    // Check network
    const network = await provider.getNetwork();
    console.log(`\nNetwork Chain ID: ${network.chainId}`);
    
    // Try to check latest block
    const latest = await provider.getBlockNumber();
    console.log(`Latest block: ${latest}`);
    
    // If contracts exist, try basic calls
    if (nftCode !== '0x' && marketCode !== '0x') {
      console.log('\n🧪 Testing basic contract calls...');
      
      const nftAbi = ['function totalSupply() view returns (uint256)'];
      const marketAbi = ['function getListingCount() view returns (uint256)'];
      
      const nft = new ethers.Contract(nftAddress, nftAbi, provider);
      const market = new ethers.Contract(marketAddress, marketAbi, provider);
      
      try {
        const supply = await nft.totalSupply();
        console.log(`  NFT Total Supply: ${supply}`);
      } catch(e) {
        console.log(`  NFT Call Error: ${e.message}`);
      }
      
      try {
        const count = await market.getListingCount();
        console.log(`  Marketplace Listing Count: ${count}`);
      } catch(e) {
        console.log(`  Marketplace Call Error: ${e.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkNFTContracts(); 