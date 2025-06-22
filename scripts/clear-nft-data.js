/**
 * Clear NFT localStorage data for development/testing
 * Run this script in the browser console to reset NFT data
 */

const clearNFTData = () => {
  const storageKey = 'web3_nft_marketplace_data';
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      localStorage.removeItem(storageKey);
      console.log('✅ NFT marketplace data cleared successfully');
      console.log('🔄 Please refresh the page to see the default NFTs');
      return true;
    } else {
      console.log('ℹ️ No NFT data found in localStorage');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to clear NFT data:', error);
    return false;
  }
};

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { clearNFTData };
} else {
  // Make available globally in browser
  window.clearNFTData = clearNFTData;
  console.log('🛠️ NFT Data Cleaner loaded. Run clearNFTData() to reset data.');
} 