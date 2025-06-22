/**
 * Test NFT data persistence
 * This script can be run in the browser console to test localStorage functionality
 */

const testNFTPersistence = () => {
  const storageKey = 'web3_nft_marketplace_data';
  
  console.log('🧪 Testing NFT Data Persistence...');
  
  // Check if localStorage is available
  if (typeof localStorage === 'undefined') {
    console.error('❌ localStorage is not available');
    return false;
  }
  
  // Check current stored data
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      console.log('📦 Current stored data:');
      console.log(`  - Version: ${data.version}`);
      console.log(`  - Timestamp: ${new Date(data.timestamp).toLocaleString()}`);
      console.log(`  - NFT Count: ${data.nfts?.length || 0}`);
      
      // Show first few NFTs
      if (data.nfts && data.nfts.length > 0) {
        console.log('📋 Stored NFTs:');
        data.nfts.slice(0, 3).forEach((nft, index) => {
          console.log(`  ${index + 1}. ${nft.name} (Token ID: ${nft.tokenId}, Owner: ${nft.owner})`);
        });
        if (data.nfts.length > 3) {
          console.log(`  ... and ${data.nfts.length - 3} more`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to parse stored data:', error);
      return false;
    }
  } else {
    console.log('ℹ️ No NFT data found in localStorage');
    return false;
  }
};

// Test function to simulate adding an NFT
const testAddNFT = () => {
  const storageKey = 'web3_nft_marketplace_data';
  
  try {
    let data = { nfts: [], timestamp: Date.now(), version: '1.0' };
    
    // Load existing data
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      data = JSON.parse(stored);
    }
    
    // Add a test NFT
    const testNFT = {
      id: `test-${Date.now()}`,
      tokenId: (data.nfts.length || 0) + 1000,
      name: 'Test NFT',
      description: 'A test NFT for persistence testing',
      image: 'https://via.placeholder.com/400x400?text=Test+NFT',
      price: '0.001',
      owner: '0xTest...Address',
      creator: '0xTest...Address',
      category: 'art',
      isListed: false,
      likes: 0,
      views: 0,
      rarity: 'Common',
      metadataUri: 'ipfs://QmTestHash',
      attributes: [
        { trait_type: 'Type', value: 'Test' },
        { trait_type: 'Purpose', value: 'Persistence Testing' }
      ]
    };
    
    data.nfts.unshift(testNFT);
    data.timestamp = Date.now();
    
    localStorage.setItem(storageKey, JSON.stringify(data));
    console.log('✅ Test NFT added successfully');
    console.log('🔄 Refresh the page to see the test NFT in the marketplace');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to add test NFT:', error);
    return false;
  }
};

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testNFTPersistence, testAddNFT };
} else {
  // Make available globally in browser
  window.testNFTPersistence = testNFTPersistence;
  window.testAddNFT = testAddNFT;
  console.log('🧪 NFT Persistence Tester loaded.');
  console.log('Available functions:');
  console.log('- testNFTPersistence(): Check current stored data');
  console.log('- testAddNFT(): Add a test NFT to storage');
} 