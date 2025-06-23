const hre = require("hardhat");

async function checkBankFundingSource() {
  try {
    console.log("🔍 追踪银行资金来源...");

    // 读取合约地址
    const addresses = require('../../src/contracts/addresses.json');
    const networkId = hre.network.config.chainId?.toString() || '1337';
    const contractAddresses = addresses[networkId];
    
    const bankAddress = contractAddresses.EnhancedBank;
    console.log("🏦 Bank Address:", bankAddress);

    // 获取银行合约余额
    const bankBalance = await hre.ethers.provider.getBalance(bankAddress);
    console.log(`💰 当前银行余额: ${hre.ethers.formatEther(bankBalance)} ETH`);

    // 获取签名者信息
    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 部署者地址:", deployer.address);
    console.log(`👤 部署者余额: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address))} ETH`);

    // 分析区块链上的所有交易
    console.log("\n📜 分析银行合约的所有交易...");
    
    const latestBlock = await hre.ethers.provider.getBlock('latest');
    console.log(`最新区块: ${latestBlock.number}`);

    let totalReceived = 0n;
    let totalSent = 0n;
    let transactionCount = 0;

    // 扫描从创世区块到最新区块的所有交易
    for (let blockNumber = 1; blockNumber <= latestBlock.number; blockNumber++) {
      const block = await hre.ethers.provider.getBlock(blockNumber, true);
      
      if (block && block.transactions) {
        for (const tx of block.transactions) {
          // 检查到银行的交易
          if (tx.to === bankAddress) {
            transactionCount++;
            totalReceived += tx.value || 0n;
            
            console.log(`📝 收到交易 (块 ${blockNumber}):`);
            console.log(`   Hash: ${tx.hash}`);
            console.log(`   From: ${tx.from}`);
            console.log(`   Value: ${hre.ethers.formatEther(tx.value || 0n)} ETH`);
            console.log(`   Gas Price: ${tx.gasPrice ? hre.ethers.formatUnits(tx.gasPrice, 'gwei') : '0'} Gwei`);
            
            // 获取交易receipt以查看状态
            const receipt = await hre.ethers.provider.getTransactionReceipt(tx.hash);
            console.log(`   Status: ${receipt.status === 1 ? '✅ Success' : '❌ Failed'}`);
            
            // 尝试解码交易数据
            if (tx.data && tx.data !== '0x') {
              console.log(`   Function: ${tx.data.slice(0, 10)}`);
            }
            console.log('');
          }
          
          // 检查从银行发出的交易
          if (tx.from === bankAddress) {
            totalSent += tx.value || 0n;
            console.log(`📤 银行发出交易 (块 ${blockNumber}):`);
            console.log(`   Hash: ${tx.hash}`);
            console.log(`   To: ${tx.to}`);
            console.log(`   Value: ${hre.ethers.formatEther(tx.value || 0n)} ETH`);
            console.log('');
          }
        }
      }
    }

    console.log("\n📊 银行资金流分析:");
    console.log("=".repeat(40));
    console.log(`总交易数: ${transactionCount}`);
    console.log(`总收到: ${hre.ethers.formatEther(totalReceived)} ETH`);
    console.log(`总发出: ${hre.ethers.formatEther(totalSent)} ETH`);
    console.log(`净收入: ${hre.ethers.formatEther(totalReceived - totalSent)} ETH`);
    console.log(`当前余额: ${hre.ethers.formatEther(bankBalance)} ETH`);
    
    const difference = bankBalance - (totalReceived - totalSent);
    if (difference !== 0n) {
      console.log(`⚠️  余额差异: ${hre.ethers.formatEther(difference)} ETH`);
      console.log("   这可能是由于内部合约操作或gas费用");
    }

  } catch (error) {
    console.error("❌ 分析失败:", error);
  }
}

checkBankFundingSource()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  }); 