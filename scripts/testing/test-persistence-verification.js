const { ethers } = require('ethers');

async function verifyPersistence() {
  console.log('🔍 Thorough Persistence Verification...\n');
  
  try {
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8546');
    
    // Get all account balances
    const accounts = [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
    ];
    
    console.log('💰 Current Account Balances:');
    let totalChanged = 0;
    
    for (let i = 0; i < accounts.length; i++) {
      const balance = await provider.getBalance(accounts[i]);
      const ethBalance = parseFloat(ethers.formatEther(balance));
      console.log(`  Account ${i}: ${ethBalance} ETH`);
      
      if (ethBalance !== 10000) {
        totalChanged++;
        console.log(`    ↳ 🔄 Changed from default (10000 ETH)`);
      } else {
        console.log(`    ↳ 📝 At default value (10000 ETH)`);
      }
    }
    
    // Check block number
    const blockNumber = await provider.getBlockNumber();
    console.log(`\n🧱 Block Number: ${blockNumber}`);
    
    if (blockNumber > 0) {
      console.log(`  ↳ ✅ ${blockNumber} blocks mined (shows activity)`);
    } else {
      console.log(`  ↳ 📝 Genesis block (no activity yet)`);
    }
    
    // Check for transactions in recent blocks
    if (blockNumber > 0) {
      console.log('\n📋 Recent Block Analysis:');
      
      for (let i = Math.max(1, blockNumber - 2); i <= blockNumber; i++) {
        const block = await provider.getBlock(i);
        console.log(`  Block ${i}: ${block.transactions.length} transaction(s)`);
        
        if (block.transactions.length > 0) {
          for (const txHash of block.transactions) {
            const tx = await provider.getTransaction(txHash);
            console.log(`    TX: ${tx.from} → ${tx.to} (${ethers.formatEther(tx.value)} ETH)`);
          }
        }
      }
    }
    
    // Final assessment
    console.log('\n🎯 Persistence Assessment:');
    
    if (totalChanged > 0 || blockNumber > 0) {
      console.log('  ✅ PERSISTENCE IS WORKING!');
      console.log(`    - ${totalChanged} accounts have non-default balances`);
      console.log(`    - ${blockNumber} blocks have been mined`);
    } else {
      console.log('  ❌ NO PERSISTENCE DETECTED');
      console.log('    - All accounts at default 10000 ETH');
      console.log('    - No blocks mined');
      console.log('    - This appears to be a fresh start');
    }
    
    // Check state file
    console.log('\n📄 State File Check:');
    const fs = require('fs');
    if (fs.existsSync('./anvil-state.json')) {
      const stats = fs.statSync('./anvil-state.json');
      const fileSize = (stats.size / 1024).toFixed(2);
      console.log(`  ✅ anvil-state.json exists (${fileSize} KB)`);
      console.log(`  📅 Last modified: ${stats.mtime.toLocaleString()}`);
      
      if (stats.size > 100) {
        console.log('  🎯 File size suggests it contains state data');
      } else {
        console.log('  ⚠️  File size is very small, might be empty');
      }
    } else {
      console.log('  ❌ anvil-state.json does NOT exist');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

verifyPersistence(); 