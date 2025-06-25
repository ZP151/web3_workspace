const { ethers } = require('ethers');

async function checkPersistence() {
  console.log('🔍 Testing Anvil persistence after restart...\n');
  
  try {
    // Connect to Anvil network
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8546');
    
    // Get network info
    const network = await provider.getNetwork();
    console.log('📡 Connected to network:', {
      name: network.name,
      chainId: network.chainId.toString()
    });
    
    // Check account balances
    const account1 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // First account
    const account2 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Second account
    
    const balance1 = await provider.getBalance(account1);
    const balance2 = await provider.getBalance(account2);
    
    console.log('💰 Account balances:');
    console.log(`  Account 1: ${ethers.formatEther(balance1)} ETH`);
    console.log(`  Account 2: ${ethers.formatEther(balance2)} ETH`);
    
    // Get current block number
    const blockNumber = await provider.getBlockNumber();
    console.log(`🧱 Current block number: ${blockNumber}`);
    
    // Check if this is from a fresh start or restored state
    if (parseFloat(ethers.formatEther(balance1)) < 10000) {
      console.log('\n✅ SUCCESS: State has been restored from persistent storage!');
      console.log('🎯 The balances are not the default 10000 ETH, indicating successful persistence.');
    } else {
      console.log('\n⚠️  WARNING: Balances appear to be at default values.');
      console.log('🔄 This might be a fresh start or persistence failed.');
    }
    
    if (blockNumber > 0) {
      console.log('✅ Block number is greater than 0, indicating previous transactions were preserved.');
    }
    
    console.log('\n📊 Persistence Test Results:');
    console.log(`  - Account 1 Balance: ${ethers.formatEther(balance1)} ETH`);
    console.log(`  - Account 2 Balance: ${ethers.formatEther(balance2)} ETH`);
    console.log(`  - Block Number: ${blockNumber}`);
    console.log(`  - Persistence Status: ${parseFloat(ethers.formatEther(balance1)) < 10000 ? '✅ WORKING' : '❌ NEEDS CHECK'}`);
    
  } catch (error) {
    console.error('❌ Error testing persistence:', error.message);
  }
}

checkPersistence(); 