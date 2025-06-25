const { ethers } = require('ethers');

class AnvilDebugger {
  constructor(url = 'http://127.0.0.1:8546') {
    this.provider = new ethers.JsonRpcProvider(url);
    this.url = url;
  }

  // 网络基本信息
  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getFeeData();
      
      console.log('🌐 Anvil Network Information:');
      console.log(`  Chain ID: ${network.chainId}`);
      console.log(`  RPC URL: ${this.url}`);
      console.log(`  Current Block: ${blockNumber}`);
      console.log(`  Gas Price: ${gasPrice.gasPrice} wei`);
      console.log('');
      
      return { network, blockNumber, gasPrice };
    } catch (error) {
      console.error('❌ Cannot connect to Anvil:', error.message);
      return null;
    }
  }

  // 获取所有账户及余额
  async getAccounts() {
    try {
      const accounts = [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
        '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
        '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
        '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
        '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720'
      ];

      console.log('💰 Account Balances:');
      const balanceInfo = [];
      
      for (let i = 0; i < accounts.length; i++) {
        const balance = await this.provider.getBalance(accounts[i]);
        const ethBalance = ethers.formatEther(balance);
        const nonce = await this.provider.getTransactionCount(accounts[i]);
        
        console.log(`  Account ${i}: ${accounts[i]}`);
        console.log(`    Balance: ${ethBalance} ETH`);
        console.log(`    Nonce: ${nonce}`);
        console.log('');
        
        balanceInfo.push({
          index: i,
          address: accounts[i],
          balance: ethBalance,
          nonce
        });
      }
      
      return balanceInfo;
    } catch (error) {
      console.error('❌ Error fetching accounts:', error.message);
      return [];
    }
  }

  // 获取最近的区块和交易
  async getRecentBlocks(count = 5) {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const startBlock = Math.max(1, currentBlock - count + 1);
      
      console.log(`🧱 Recent Blocks (${startBlock} to ${currentBlock}):`);
      
      for (let i = startBlock; i <= currentBlock; i++) {
        const block = await this.provider.getBlock(i);
        console.log(`  Block ${i}:`);
        console.log(`    Hash: ${block.hash}`);
        console.log(`    Timestamp: ${new Date(block.timestamp * 1000).toLocaleString()}`);
        console.log(`    Transactions: ${block.transactions.length}`);
        
        // 显示交易详情
        for (const txHash of block.transactions) {
          const tx = await this.provider.getTransaction(txHash);
          console.log(`    TX: ${tx.from} → ${tx.to} (${ethers.formatEther(tx.value)} ETH)`);
        }
        console.log('');
      }
    } catch (error) {
      console.error('❌ Error fetching blocks:', error.message);
    }
  }

  // 查看特定交易
  async getTransaction(txHash) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      console.log(`📋 Transaction Details: ${txHash}`);
      console.log(`  From: ${tx.from}`);
      console.log(`  To: ${tx.to}`);
      console.log(`  Value: ${ethers.formatEther(tx.value)} ETH`);
      console.log(`  Gas Limit: ${tx.gasLimit}`);
      console.log(`  Gas Price: ${tx.gasPrice} wei`);
      console.log(`  Nonce: ${tx.nonce}`);
      console.log(`  Block: ${receipt.blockNumber}`);
      console.log(`  Gas Used: ${receipt.gasUsed}`);
      console.log(`  Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
      console.log('');
      
      return { tx, receipt };
    } catch (error) {
      console.error('❌ Error fetching transaction:', error.message);
      return null;
    }
  }

  // 检查合约信息
  async checkContract(address) {
    try {
      const code = await this.provider.getCode(address);
      const balance = await this.provider.getBalance(address);
      
      console.log(`📜 Contract Analysis: ${address}`);
      console.log(`  Balance: ${ethers.formatEther(balance)} ETH`);
      console.log(`  Code Size: ${(code.length - 2) / 2} bytes`);
      console.log(`  Is Contract: ${code !== '0x' ? 'Yes' : 'No'}`);
      console.log('');
      
      return { code, balance, isContract: code !== '0x' };
    } catch (error) {
      console.error('❌ Error checking contract:', error.message);
      return null;
    }
  }

  // 监听新区块
  async watchBlocks() {
    console.log('👀 Watching for new blocks... (Press Ctrl+C to stop)');
    
    this.provider.on('block', async (blockNumber) => {
      console.log(`\n🆕 New Block: ${blockNumber}`);
      const block = await this.provider.getBlock(blockNumber);
      console.log(`  Timestamp: ${new Date(block.timestamp * 1000).toLocaleString()}`);
      console.log(`  Transactions: ${block.transactions.length}`);
      
      if (block.transactions.length > 0) {
        console.log('  New Transactions:');
        for (const txHash of block.transactions) {
          const tx = await this.provider.getTransaction(txHash);
          console.log(`    ${tx.from} → ${tx.to} (${ethers.formatEther(tx.value)} ETH)`);
        }
      }
    });
  }

  // 完整状态报告
  async fullReport() {
    console.log('=' .repeat(60));
    console.log('📊 ANVIL NETWORK FULL STATUS REPORT');
    console.log('=' .repeat(60));
    console.log('');
    
    await this.getNetworkInfo();
    await this.getAccounts();
    await this.getRecentBlocks();
    
    console.log('=' .repeat(60));
  }
}

// 命令行使用
async function main() {
  const anvilDebugger = new AnvilDebugger();
  const command = process.argv[2];
  
  switch (command) {
    case 'info':
      await anvilDebugger.getNetworkInfo();
      break;
    case 'accounts':
      await anvilDebugger.getAccounts();
      break;
    case 'blocks':
      const count = parseInt(process.argv[3]) || 5;
      await anvilDebugger.getRecentBlocks(count);
      break;
    case 'tx':
      const txHash = process.argv[3];
      if (txHash) {
        await anvilDebugger.getTransaction(txHash);
      } else {
        console.log('Usage: node anvil-debugger.js tx <transaction_hash>');
      }
      break;
    case 'contract':
      const address = process.argv[3];
      if (address) {
        await anvilDebugger.checkContract(address);
      } else {
        console.log('Usage: node anvil-debugger.js contract <contract_address>');
      }
      break;
    case 'watch':
      await anvilDebugger.watchBlocks();
      break;
    case 'report':
    default:
      await anvilDebugger.fullReport();
      break;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

module.exports = AnvilDebugger; 