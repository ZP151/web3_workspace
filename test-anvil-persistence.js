const { ethers } = require('ethers');

async function testAnvilPersistence() {
  console.log('🧪 Testing Anvil Persistence...');
  
  // Connect to Anvil network
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8546');
  
  try {
    // Get network info
    const network = await provider.getNetwork();
    console.log('📡 Connected to network:', {
      name: network.name,
      chainId: network.chainId.toString()
    });
    
    // Get first account
    const accounts = await provider.listAccounts();
    console.log('👤 Available accounts:', accounts.length);
    
    // Create a wallet with the first account
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log('💰 Wallet address:', wallet.address);
    
    // Check initial balance
    const initialBalance = await provider.getBalance(wallet.address);
    console.log('💵 Initial balance:', ethers.formatEther(initialBalance), 'ETH');
    
    // Send a test transaction to create some state
    const recipient = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const amount = ethers.parseEther('1.0');
    
    console.log('📤 Sending 1 ETH to', recipient);
    const tx = await wallet.sendTransaction({
      to: recipient,
      value: amount
    });
    
    console.log('⏳ Transaction hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    
    // Check balances after transaction
    const senderBalance = await provider.getBalance(wallet.address);
    const recipientBalance = await provider.getBalance(recipient);
    
    console.log('💰 Updated balances:');
    console.log('  Sender:', ethers.formatEther(senderBalance), 'ETH');
    console.log('  Recipient:', ethers.formatEther(recipientBalance), 'ETH');
    
    // Get current block number
    const blockNumber = await provider.getBlockNumber();
    console.log('🧱 Current block number:', blockNumber);
    
    console.log('\n✅ Test completed! State has been created.');
    console.log('💾 State will be saved when Anvil is stopped.');
    console.log('🔄 Restart Anvil with --persistent to restore this state.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testAnvilPersistence().catch(console.error); 