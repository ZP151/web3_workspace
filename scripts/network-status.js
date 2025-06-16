const { ethers } = require('hardhat');

async function checkNetworkStatus() {
  console.log('🔍 Web3 Network Status Check');
  console.log('==================================================\n');

  const networks = [
    {
      name: 'Hardhat Local',
      url: 'http://127.0.0.1:8545',
      chainId: 31337
    },
    {
      name: 'Ganache Local', 
      url: 'http://127.0.0.1:7545',
      chainId: 1337
    }
  ];

  for (const network of networks) {
    console.log(`📡 Checking ${network.name} (${network.url})`);
    console.log('─'.repeat(50));
    
    try {
      // 创建provider
      const provider = new ethers.JsonRpcProvider(network.url);
      
      // 检查网络连接
      const networkInfo = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();
      
      console.log(`✅ Status: CONNECTED`);
      console.log(`🔗 Chain ID: ${networkInfo.chainId}`);
      console.log(`📦 Latest Block: ${blockNumber}`);
      
      // 获取账户列表
      try {
        const accounts = await provider.send('eth_accounts', []);
        console.log(`👥 Available Accounts: ${accounts.length}`);
        
        if (accounts.length > 0) {
          console.log('\n💰 Account Details:');
          for (let i = 0; i < Math.min(accounts.length, 5); i++) {
            const balance = await provider.getBalance(accounts[i]);
            const balanceInEth = ethers.formatEther(balance);
            console.log(`  Account ${i}: ${accounts[i]}`);
            console.log(`  Balance: ${parseFloat(balanceInEth).toFixed(4)} ETH\n`);
          }
          
          if (accounts.length > 5) {
            console.log(`  ... and ${accounts.length - 5} more accounts\n`);
          }
        } else {
          console.log('⚠️  No accounts found on this network\n');
        }
        
      } catch (accountError) {
        console.log(`⚠️  Could not fetch accounts: ${accountError.message}\n`);
      }
      
    } catch (error) {
      console.log(`❌ Status: DISCONNECTED`);
      console.log(`💥 Error: ${error.message}`);
      
      if (error.message.includes('ECONNREFUSED')) {
        console.log(`💡 Suggestion: Start ${network.name} on port ${network.url.split(':')[2]}`);
      }
      console.log('');
    }
  }
  
  // 检查端口占用情况
  console.log('🔍 Port Usage Analysis');
  console.log('─'.repeat(50));
  await checkPortUsage();
}

async function checkPortUsage() {
  const { spawn } = require('child_process');
  
  return new Promise((resolve) => {
    const netstat = spawn('netstat', ['-an']);
    let output = '';
    
    netstat.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    netstat.on('close', () => {
      const lines = output.split('\n');
      const relevantPorts = ['8545', '7545', '3000', '3001', '3002', '3003', '3004'];
      
      console.log('Port Status:');
      relevantPorts.forEach(port => {
        const portInUse = lines.some(line => 
          line.includes(`:${port}`) && line.includes('LISTENING')
        );
        
        const status = portInUse ? '🔴 IN USE' : '🟢 FREE';
        const purpose = getPurpose(port);
        console.log(`  Port ${port}: ${status} ${purpose}`);
      });
      
      console.log('\n💡 Recommendations:');
      if (lines.some(line => line.includes(':8545') && line.includes('LISTENING'))) {
        console.log('  ✅ Hardhat network is running on port 8545');
      } else {
        console.log('  ⚠️  Hardhat network not detected. Run: npm run node');
      }
      
      if (lines.some(line => line.includes(':7545') && line.includes('LISTENING'))) {
        console.log('  ✅ Ganache network is running on port 7545');
      } else {
        console.log('  ⚠️  Ganache network not detected. Start Ganache on port 7545');
      }
      
      resolve();
    });
  });
}

function getPurpose(port) {
  const purposes = {
    '8545': '(Hardhat)',
    '7545': '(Ganache)', 
    '3000': '(Next.js)',
    '3001': '(Next.js)',
    '3002': '(Next.js)', 
    '3003': '(Next.js)',
    '3004': '(Next.js)'
  };
  return purposes[port] || '';
}

async function getNetworkUsers() {
  console.log('\n🎯 Getting Current Network Users');
  console.log('==================================================\n');
  
  try {
    // 获取当前网络的signers
    const signers = await ethers.getSigners();
    console.log(`📊 Found ${signers.length} signers on current network:`);
    
    for (let i = 0; i < signers.length; i++) {
      const signer = signers[i];
      const address = await signer.getAddress();
      const balance = await signer.provider.getBalance(address);
      const balanceInEth = ethers.formatEther(balance);
      
      console.log(`\n👤 Signer ${i}:`);
      console.log(`   Address: ${address}`);
      console.log(`   Balance: ${parseFloat(balanceInEth).toFixed(4)} ETH`);
      
      // 如果是Hardhat网络，显示私钥（仅用于开发）
      if (signer._signingKey) {
        console.log(`   Private Key: ${signer._signingKey.privateKey}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error getting network users:', error.message);
  }
}

// 主函数
async function main() {
  await checkNetworkStatus();
  await getNetworkUsers();
  
  console.log('\n🚀 Network Setup Commands:');
  console.log('─'.repeat(50));
  console.log('Start Hardhat:  npm run node');
  console.log('Start Ganache:  ganache-cli --port 7545 --networkId 1337');
  console.log('Start Frontend: npm run dev');
  console.log('Deploy to Ganache: npm run deploy:ganache');
  console.log('');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkNetworkStatus, getNetworkUsers }; 