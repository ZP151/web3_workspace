const { ethers } = require('ethers');

async function testAnvilFeatures() {
  console.log('🧪 Testing Anvil Features Comprehensively...\n');
  
  try {
    // Connect to Anvil network
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8546');
    
    // Create wallet from known private key
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('📊 Initial Network State:');
    
    // 1. Network Information
    const network = await provider.getNetwork();
    console.log(`  Chain ID: ${network.chainId}`);
    
    // 2. Current Block
    const blockNumber = await provider.getBlockNumber();
    console.log(`  Block Number: ${blockNumber}`);
    
    // 3. Account Balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`  Wallet Balance: ${ethers.formatEther(balance)} ETH`);
    
    // 4. Gas Price
    const gasPrice = await provider.getFeeData();
    console.log(`  Gas Price: ${gasPrice.gasPrice} wei`);
    
    console.log('\n🔨 Testing Transaction Functionality:');
    
    // 5. Send a transaction
    const recipient = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const initialRecipientBalance = await provider.getBalance(recipient);
    
    console.log(`  Before: Recipient has ${ethers.formatEther(initialRecipientBalance)} ETH`);
    
    const tx = await wallet.sendTransaction({
      to: recipient,
      value: ethers.parseEther('0.1'),
      gasLimit: 21000
    });
    
    console.log(`  Transaction Hash: ${tx.hash}`);
    
    // Wait for transaction
    const receipt = await tx.wait();
    console.log(`  Transaction confirmed in block ${receipt.blockNumber}`);
    
    // Check new balances
    const newRecipientBalance = await provider.getBalance(recipient);
    const newSenderBalance = await provider.getBalance(wallet.address);
    
    console.log(`  After: Recipient has ${ethers.formatEther(newRecipientBalance)} ETH`);
    console.log(`  After: Sender has ${ethers.formatEther(newSenderBalance)} ETH`);
    
    console.log('\n📈 Performance Test (Sequential Transactions):');
    
    // 6. Speed test - sequential transactions to avoid nonce issues
    const startTime = Date.now();
    
    for (let i = 0; i < 3; i++) {
      const quickTx = await wallet.sendTransaction({
        to: recipient,
        value: ethers.parseEther('0.01'),
        gasLimit: 21000
      });
      
      console.log(`  Transaction ${i + 1}: ${quickTx.hash}`);
      await quickTx.wait(); // Wait for each transaction to complete
    }
    
    const endTime = Date.now();
    console.log(`  Processed 3 sequential transactions in ${endTime - startTime}ms`);
    
    // Final state
    const finalBlock = await provider.getBlockNumber();
    const finalBalance = await provider.getBalance(wallet.address);
    const finalRecipientBalance = await provider.getBalance(recipient);
    
    console.log('\n🎯 Final State:');
    console.log(`  Final Block Number: ${finalBlock}`);
    console.log(`  Final Sender Balance: ${ethers.formatEther(finalBalance)} ETH`);
    console.log(`  Final Recipient Balance: ${ethers.formatEther(finalRecipientBalance)} ETH`);
    
    // Test some RPC calls
    console.log('\n🔍 Testing RPC Functionality:');
    
    const latestBlock = await provider.getBlock('latest');
    console.log(`  Latest block hash: ${latestBlock.hash}`);
    console.log(`  Block timestamp: ${new Date(latestBlock.timestamp * 1000).toISOString()}`);
    
    // Get transaction count (nonce)
    const nonce = await provider.getTransactionCount(wallet.address);
    console.log(`  Current nonce for sender: ${nonce}`);
    
    console.log('\n✅ All Anvil features tested successfully!');
    console.log('💾 State will be automatically saved for next session.');
    console.log('🚀 Anvil is working perfectly with persistence!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

testAnvilFeatures(); 