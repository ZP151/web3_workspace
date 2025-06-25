const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Anvil network configuration
const ANVIL_RPC_URL = 'http://127.0.0.1:8546';
const CONTRACTS_FILE = path.join(__dirname, '../../src/contracts/addresses.json');

class AnvilExplorer {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(ANVIL_RPC_URL);
        this.contracts = this.loadContracts();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    loadContracts() {
        try {
            if (fs.existsSync(CONTRACTS_FILE)) {
                return JSON.parse(fs.readFileSync(CONTRACTS_FILE, 'utf8'));
            }
        } catch (error) {
            console.log('⚠️  Unable to load contract addresses file');
        }
        return {};
    }

    async getNetworkInfo() {
        try {
            const network = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();
            const gasPrice = await this.provider.getFeeData();
            
            console.log('\n🌐 Network Information:');
            console.log(`   - Chain ID: ${network.chainId}`);
            console.log(`   - Latest Block: ${blockNumber}`);
            console.log(`   - Gas Price: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} Gwei`);
            console.log(`   - Base Fee: ${gasPrice.maxFeePerGas ? ethers.formatUnits(gasPrice.maxFeePerGas, 'gwei') + ' Gwei' : 'N/A'}`);
            
            return { network, blockNumber, gasPrice };
        } catch (error) {
            console.error('❌ Failed to get network information:', error.message);
            return null;
        }
    }

    async getBlockInfo(blockNumber = 'latest') {
        try {
            const block = await this.provider.getBlock(blockNumber, true);
            if (!block) {
                console.log('❌ Block does not exist');
                return null;
            }

            console.log(`\n📦 Block #${block.number} Information:`);
            console.log(`   - Hash: ${block.hash}`);
            console.log(`   - Parent Hash: ${block.parentHash}`);
            console.log(`   - Timestamp: ${new Date(block.timestamp * 1000).toLocaleString()}`);
            console.log(`   - Gas Used: ${block.gasUsed.toString()} / ${block.gasLimit.toString()}`);
            console.log(`   - Transactions: ${block.transactions.length}`);
            
            if (block.transactions.length > 0) {
                console.log('   - Transaction Hashes:');
                block.transactions.slice(0, 5).forEach((tx, index) => {
                    console.log(`     ${index + 1}. ${typeof tx === 'string' ? tx : tx.hash}`);
                });
                if (block.transactions.length > 5) {
                    console.log(`     ... and ${block.transactions.length - 5} more`);
                }
            }
            
            return block;
        } catch (error) {
            console.error('❌ Failed to get block information:', error.message);
            return null;
        }
    }

    async getTransactionInfo(txHash) {
        try {
            const tx = await this.provider.getTransaction(txHash);
            const receipt = await this.provider.getTransactionReceipt(txHash);
            
            if (!tx) {
                console.log('❌ Transaction not found');
                return null;
            }

            console.log(`\n📄 Transaction Information:`);
            console.log(`   - Hash: ${tx.hash}`);
            console.log(`   - Block: ${tx.blockNumber}`);
            console.log(`   - From: ${tx.from}`);
            console.log(`   - To: ${tx.to || 'Contract Creation'}`);
            console.log(`   - Value: ${ethers.formatEther(tx.value)} ETH`);
            console.log(`   - Gas Limit: ${tx.gasLimit.toString()}`);
            console.log(`   - Gas Price: ${ethers.formatUnits(tx.gasPrice, 'gwei')} Gwei`);
            
            if (receipt) {
                console.log(`   - Status: ${receipt.status === 1 ? '✅ Success' : '❌ Failed'}`);
                console.log(`   - Gas Used: ${receipt.gasUsed.toString()}`);
                console.log(`   - Logs: ${receipt.logs.length}`);
                
                if (receipt.contractAddress) {
                    console.log(`   - Contract Created: ${receipt.contractAddress}`);
                }
            }
            
            return { tx, receipt };
        } catch (error) {
            console.error('❌ Failed to get transaction information:', error.message);
            return null;
        }
    }

    async getAccountInfo(address) {
        try {
            const balance = await this.provider.getBalance(address);
            const nonce = await this.provider.getTransactionCount(address);
            const code = await this.provider.getCode(address);
            
            console.log(`\n👤 Account Information:`);
            console.log(`   - Address: ${address}`);
            console.log(`   - Balance: ${ethers.formatEther(balance)} ETH`);
            console.log(`   - Nonce: ${nonce}`);
            console.log(`   - Type: ${code === '0x' ? 'EOA (Externally Owned Account)' : 'Contract'}`);
            
            if (code !== '0x') {
                console.log(`   - Code Size: ${(code.length - 2) / 2} bytes`);
            }
            
            return { balance, nonce, code };
        } catch (error) {
            console.error('❌ Failed to get account information:', error.message);
            return null;
        }
    }

    async listDeployedContracts() {
        console.log('\n📋 Deployed Contracts:');
        
        if (Object.keys(this.contracts).length === 0) {
            console.log('   No contracts found in addresses.json');
            return;
        }
        
        // Check if the structure is network-based (nested) or flat
        const firstKey = Object.keys(this.contracts)[0];
        const isNetworkBased = typeof this.contracts[firstKey] === 'object' && 
                              this.contracts[firstKey] !== null && 
                              !Array.isArray(this.contracts[firstKey]) &&
                              typeof this.contracts[firstKey].constructor === 'function' &&
                              this.contracts[firstKey].constructor === Object;
        
        if (isNetworkBased) {
            // Handle network-based structure
            for (const [networkId, contracts] of Object.entries(this.contracts)) {
                if (typeof contracts === 'object' && contracts !== null) {
                    console.log(`\n   Network ${networkId}:`);
                    let contractCount = 0;
                    
                    for (const [contractName, contractAddress] of Object.entries(contracts)) {
                        // Skip metadata fields
                        if (['initialized', 'timestamp', 'network', 'deployedAt', 'deployer', 'totalContracts', 'operator'].includes(contractName)) {
                            continue;
                        }
                        
                        if (typeof contractAddress === 'string' && contractAddress.startsWith('0x')) {
                            try {
                                const code = await this.provider.getCode(contractAddress);
                                const isDeployed = code !== '0x';
                                console.log(`     ${isDeployed ? '✅' : '❌'} ${contractName}: ${contractAddress}`);
                                contractCount++;
                            } catch (error) {
                                console.log(`     ❓ ${contractName}: ${contractAddress}`);
                                contractCount++;
                            }
                        }
                    }
                    
                    if (contractCount === 0) {
                        console.log('     No contracts found in this network');
                    }
                }
            }
        } else {
            // Handle flat structure (name: address)
            for (const [name, address] of Object.entries(this.contracts)) {
                if (typeof address === 'string' && address.startsWith('0x')) {
                    try {
                        const code = await this.provider.getCode(address);
                        const isDeployed = code !== '0x';
                        console.log(`   - ${name}: ${address} ${isDeployed ? '✅' : '❌'}`);
                    } catch (error) {
                        console.log(`   - ${name}: ${address} ❓`);
                    }
                }
            }
        }
    }

    async getRecentTransactions(count = 10) {
        try {
            const latestBlock = await this.provider.getBlockNumber();
            const transactions = [];
            
            console.log(`\n📜 Recent ${count} Transactions:`);
            
            for (let i = 0; i < Math.min(count, 10) && latestBlock - i >= 0; i++) {
                const block = await this.provider.getBlock(latestBlock - i, true);
                if (block && block.transactions.length > 0) {
                    for (const tx of block.transactions.slice(0, Math.ceil(count / 10))) {
                        const txHash = typeof tx === 'string' ? tx : tx.hash;
                        const txData = typeof tx === 'string' ? await this.provider.getTransaction(tx) : tx;
                        
                        console.log(`   - Block ${block.number}: ${txHash}`);
                        console.log(`     From: ${txData.from} → To: ${txData.to || 'Contract Creation'}`);
                        console.log(`     Value: ${ethers.formatEther(txData.value)} ETH`);
                        
                        transactions.push(txData);
                        if (transactions.length >= count) break;
                    }
                }
                if (transactions.length >= count) break;
            }
            
            return transactions;
        } catch (error) {
            console.error('❌ Failed to get recent transactions:', error.message);
            return [];
        }
    }

    showMenu() {
        console.log('\n' + '='.repeat(50));
        console.log('🔍 Anvil Blockchain Explorer');
        console.log('='.repeat(50));
        console.log('1. Network Information');
        console.log('2. Block Information');
        console.log('3. Transaction Information');
        console.log('4. Account Information');
        console.log('5. List Deployed Contracts');
        console.log('6. Recent Transactions');
        console.log('7. Test Account Balances');
        console.log('0. Exit');
        console.log('='.repeat(50));
    }

    async getTestAccountBalances() {
        console.log('\n💰 Test Account Balances:');
        
        // Default Anvil test accounts
        const testAccounts = [
            '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
            '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
            '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'
        ];
        
        for (let i = 0; i < testAccounts.length; i++) {
            try {
                const balance = await this.provider.getBalance(testAccounts[i]);
                const nonce = await this.provider.getTransactionCount(testAccounts[i]);
                console.log(`   Account ${i + 1}: ${testAccounts[i]}`);
                console.log(`   Balance: ${ethers.formatEther(balance)} ETH (Nonce: ${nonce})`);
                console.log('');
            } catch (error) {
                console.log(`   Account ${i + 1}: Error getting balance`);
            }
        }
    }

    async promptInput(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    async run() {
        console.log('🚀 Starting Anvil Explorer...');
        
        // Check connection
        try {
            await this.provider.getNetwork();
            console.log('✅ Connected to Anvil network');
        } catch (error) {
            console.error('❌ Failed to connect to Anvil network. Make sure Anvil is running on http://127.0.0.1:8546');
            this.rl.close();
            return;
        }

        while (true) {
            this.showMenu();
            const choice = await this.promptInput('Enter your choice (0-7): ');

            switch (choice) {
                case '1':
                    await this.getNetworkInfo();
                    break;
                    
                case '2':
                    const blockInput = await this.promptInput('Enter block number (or press Enter for latest): ');
                    const blockNumber = blockInput === '' ? 'latest' : parseInt(blockInput);
                    await this.getBlockInfo(blockNumber);
                    break;
                    
                case '3':
                    const txHash = await this.promptInput('Enter transaction hash: ');
                    if (txHash) {
                        await this.getTransactionInfo(txHash);
                    }
                    break;
                    
                case '4':
                    const address = await this.promptInput('Enter account address: ');
                    if (address) {
                        await this.getAccountInfo(address);
                    }
                    break;
                    
                case '5':
                    await this.listDeployedContracts();
                    break;
                    
                case '6':
                    const countInput = await this.promptInput('Enter number of transactions to show (default 10): ');
                    const count = countInput === '' ? 10 : parseInt(countInput) || 10;
                    await this.getRecentTransactions(count);
                    break;
                    
                case '7':
                    await this.getTestAccountBalances();
                    break;
                    
                case '0':
                    console.log('👋 Goodbye!');
                    this.rl.close();
                    return;
                    
                default:
                    console.log('❌ Invalid choice. Please enter a number between 0-7.');
            }
            
            await this.promptInput('\nPress Enter to continue...');
        }
    }
}

// Run the explorer
if (require.main === module) {
    const explorer = new AnvilExplorer();
    explorer.run().catch(console.error);
}

module.exports = AnvilExplorer;