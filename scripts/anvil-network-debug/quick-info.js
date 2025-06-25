// Anvil network quick information query script
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuration
const ANVIL_RPC_URL = 'http://127.0.0.1:8546';
const CONTRACTS_FILE = path.join(__dirname, '../../src/contracts/addresses.json');

// Anvil default test accounts
const TEST_ACCOUNTS = [
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'
];

async function quickInfo() {
    try {
        console.log('🚀 Anvil Network Quick Information Query\n');
        
        const provider = new ethers.JsonRpcProvider(ANVIL_RPC_URL);
        
        // 网络基本信息
        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();
        const gasPrice = await provider.getFeeData();
        
        console.log('🌐 Network Status:');
        console.log(`   Chain ID: ${network.chainId}`);
        console.log(`   Latest Block: ${blockNumber}`);
        console.log(`   Gas Price: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} Gwei\n`);
        
        // 测试账户余额
        console.log('💰 Test Account Balances:');
        for (let i = 0; i < TEST_ACCOUNTS.length; i++) {
            const balance = await provider.getBalance(TEST_ACCOUNTS[i]);
            const nonce = await provider.getTransactionCount(TEST_ACCOUNTS[i]);
            console.log(`   Account ${i}: ${ethers.formatEther(balance).substring(0, 10)} ETH (nonce: ${nonce})`);
        }
        
        // 已部署合约
        console.log('\n📋 Deployed Contracts:');
        try {
            const contracts = JSON.parse(fs.readFileSync(CONTRACTS_FILE, 'utf8'));
            
            let contractCount = 0;
            
            // Check if the structure is network-based (nested) or flat
            const firstKey = Object.keys(contracts)[0];
            const isNetworkBased = typeof contracts[firstKey] === 'object' && 
                                  contracts[firstKey] !== null && 
                                  !Array.isArray(contracts[firstKey]);
            
            if (isNetworkBased) {
                // Handle network-based structure
                for (const [networkId, networkContracts] of Object.entries(contracts)) {
                    if (typeof networkContracts === 'object' && networkContracts !== null) {
                        console.log(`   Network ${networkId}:`);
                        
                        for (const [contractName, contractAddress] of Object.entries(networkContracts)) {
                            // Skip metadata fields
                            if (['initialized', 'timestamp', 'network', 'deployedAt', 'deployer', 'totalContracts', 'operator'].includes(contractName)) {
                                continue;
                            }
                            
                            if (typeof contractAddress === 'string' && contractAddress.startsWith('0x')) {
                                try {
                                    const code = await provider.getCode(contractAddress);
                                    const isDeployed = code !== '0x';
                                    const status = isDeployed ? '✅' : '❌';
                                    console.log(`     ${status} ${contractName}: ${contractAddress.substring(0, 10)}...`);
                                    contractCount++;
                                } catch (error) {
                                    console.log(`     ❓ ${contractName}: ${contractAddress.substring(0, 10)}...`);
                                    contractCount++;
                                }
                            }
                        }
                    }
                }
            } else {
                // Handle flat structure (name: address)
                for (const [name, address] of Object.entries(contracts)) {
                    if (typeof address === 'string' && address.startsWith('0x')) {
                        try {
                            const code = await provider.getCode(address);
                            const isDeployed = code !== '0x';
                            const status = isDeployed ? '✅' : '❌';
                            console.log(`   ${status} ${name}: ${address.substring(0, 10)}...`);
                            contractCount++;
                        } catch (error) {
                            console.log(`   ❓ ${name}: ${address.substring(0, 10)}...`);
                            contractCount++;
                        }
                    }
                }
            }
            
            if (contractCount === 0) {
                console.log('   - No known contracts');
            }
        } catch (error) {
            console.log('   - Unable to load contract addresses file');
        }
        
        // 最近区块活动
        console.log('\n📦 Recent Block Activity:');
        const recentBlocks = [];
        for (let i = Math.max(0, blockNumber - 4); i <= blockNumber; i++) {
            const block = await provider.getBlock(i);
            if (block) {
                recentBlocks.push(block);
            }
        }
        
        recentBlocks.forEach(block => {
            const time = new Date(block.timestamp * 1000).toLocaleTimeString();
            console.log(`   Block #${block.number}: ${block.transactions.length} transactions (${time})`);
        });
        
        // 最近交易
        if (blockNumber > 0) {
            console.log('\n📜 Recent Transactions:');
            let txCount = 0;
            
            for (let i = blockNumber; i >= 0 && txCount < 5; i--) {
                const block = await provider.getBlock(i, true);
                if (block && block.transactions.length > 0) {
                    for (const tx of block.transactions.slice(-3)) {
                        if (txCount >= 5) break;
                        
                        const txData = typeof tx === 'string' ? await provider.getTransaction(tx) : tx;
                        if (txData) {
                            const value = ethers.formatEther(txData.value);
                            const shortHash = txData.hash.substring(0, 10) + '...';
                            const shortFrom = txData.from.substring(0, 8) + '...';
                            const shortTo = txData.to ? txData.to.substring(0, 8) + '...' : 'Contract Creation';
                            
                            console.log(`   ${shortHash} | ${shortFrom} → ${shortTo} | ${value} ETH`);
                            txCount++;
                        }
                    }
                }
            }
            
            if (txCount === 0) {
                console.log('   - No transaction records');
            }
        }
        
        console.log('\n💡 Use "node anvil-explorer.js" for more detailed information');
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        if (error.code === 'NETWORK_ERROR') {
            console.log('💡 Please ensure Anvil network is running at http://127.0.0.1:8546');
            console.log('   Start command: node scripts/start-networks.js anvil --persistent');
        }
    }
}

// 运行快速信息查询
quickInfo();