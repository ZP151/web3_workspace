const { ethers } = require('ethers');

async function quickAnvilTest() {
  console.log('⚡ Quick Anvil Status Check...\n');
  
  try {
    // Connect to Anvil network
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8546');
    
    // Basic network info
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const gasPrice = await provider.getFeeData();
    
    console.log('📊 Network Status:');
    console.log(`  ✅ Chain ID: ${network.chainId}`);
    console.log(`  ✅ Block Number: ${blockNumber}`);
    console.log(`  ✅ Gas Price: ${gasPrice.gasPrice} wei`);
    
    // Check account balances (first 3 accounts)
    const accounts = [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
    ];
    
    console.log('\n💰 Account Balances:');
    for (let i = 0; i < accounts.length; i++) {
      const balance = await provider.getBalance(accounts[i]);
      const ethBalance = ethers.formatEther(balance);
      console.log(`  Account ${i}: ${ethBalance} ETH`);
    }
    
    // Check if this is persistent data (not default 10000 ETH)
    const firstAccountBalance = await provider.getBalance(accounts[0]);
    const balanceEth = parseFloat(ethers.formatEther(firstAccountBalance));
    
    console.log('\n🔍 Persistence Check:');
    if (balanceEth < 10000) {
      console.log('  ✅ State is PERSISTENT (balance shows previous transactions)');
    } else {
      console.log('  📝 Fresh state detected (default balances)');
    }
    
    // Get latest block info
    const latestBlock = await provider.getBlock('latest');
    console.log('\n🧱 Latest Block:');
    console.log(`  Hash: ${latestBlock.hash}`);
    console.log(`  Transactions: ${latestBlock.transactions.length}`);
    console.log(`  Timestamp: ${new Date(latestBlock.timestamp * 1000).toLocaleString()}`);
    
    console.log('\n✅ Anvil is running successfully!');
    
  } catch (error) {
    console.error('❌ Cannot connect to Anvil:', error.message);
    console.log('\n💡 Make sure Anvil is running on port 8546:');
    console.log('   node scripts/start-networks.js anvil --persistent');
  }
}

// Run the test
quickAnvilTest(); 