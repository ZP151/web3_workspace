const { ethers } = require('ethers');

// Anvil network configuration
const ANVIL_RPC_URL = 'http://127.0.0.1:8546';
const ACCOUNT_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Anvil default first account

async function checkBalance() {
    try {
        console.log('🔍 Connecting to Anvil network...');
        const provider = new ethers.JsonRpcProvider(ANVIL_RPC_URL);
        
        // 检查网络连接
        const network = await provider.getNetwork();
        console.log(`📡 Network connection successful: Chain ID ${network.chainId}`);
        
        // 查询账户余额
        console.log(`\n💰 Querying account balance: ${ACCOUNT_ADDRESS}`);
        const balance = await provider.getBalance(ACCOUNT_ADDRESS);
        const balanceInEth = ethers.formatEther(balance);
        
        console.log(`\n📊 Balance information:`);
        console.log(`   - Wei: ${balance.toString()}`);
        console.log(`   - ETH: ${balanceInEth}`);
        
        // Query transaction count (nonce)
        const nonce = await provider.getTransactionCount(ACCOUNT_ADDRESS);
        console.log(`   - Transaction count (nonce): ${nonce}`);
        
        // 获取最新区块信息
        const blockNumber = await provider.getBlockNumber();
        console.log(`\n🔗 Blockchain information:`);
        console.log(`   - Latest block number: ${blockNumber}`);
        
        if (blockNumber > 0) {
            const latestBlock = await provider.getBlock(blockNumber);
            console.log(`   - Latest block time: ${new Date(latestBlock.timestamp * 1000).toLocaleString()}`);
            console.log(`   - Block transaction count: ${latestBlock.transactions.length}`);
        }
        
        // Check if in initial state
        if (balanceInEth === '10000.0' && nonce === 0) {
            console.log(`\n⚠️  Warning: Account balance is at initial value 10000 ETH and nonce is 0, state data may not be loaded correctly`);
        } else {
            console.log(`\n✅ Account state has been modified, indicating state data loaded normally`);
        }
        
    } catch (error) {
        console.error('❌ Query failed:', error.message);
        if (error.code === 'NETWORK_ERROR') {
            console.log('💡 Please ensure Anvil network is running at http://127.0.0.1:8546');
        }
    }
}

// 运行查询
checkBalance();