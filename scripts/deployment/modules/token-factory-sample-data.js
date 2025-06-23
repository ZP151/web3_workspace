const { ethers } = require("hardhat");

/**
 * TokenFactory示例数据设置模块
 * 包含：创建示例代币
 */
async function setupTokenFactorySampleData(tokenFactoryAddress, deployer) {
  console.log("🏭 Setting up Token Factory Sample Data...");
  
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const tokenFactory = TokenFactory.attach(tokenFactoryAddress);

  const results = {
    tokensCreated: 0,
    totalFeesPaid: ethers.parseEther("0")
  };

  const sampleTokens = [
    { name: "Community Token", symbol: "COMM", supply: "1000000" },
    { name: "Gaming Token", symbol: "GAME", supply: "500000" },
    { name: "Reward Points", symbol: "REWARD", supply: "2000000" }
  ];

  console.log(`   🏭 Creating ${sampleTokens.length} sample tokens...`);

  for (const token of sampleTokens) {
    try {
      const creationFee = await tokenFactory.creationFee();
      const feeRecipient = await tokenFactory.feeRecipient();
      console.log(`   🔧 Creating ${token.symbol} with fee: ${ethers.formatEther(creationFee)} ETH`);
      console.log(`   💰 Fee recipient: ${feeRecipient}`);
      
      // Check deployer balance
      const deployerBalance = await deployer.provider.getBalance(await deployer.getAddress());
      console.log(`   💳 Deployer balance: ${ethers.formatEther(deployerBalance)} ETH`);
      
      const tx = await tokenFactory.createToken(
        token.name,
        token.symbol,
        18, // decimals
        ethers.parseEther(token.supply), // initialSupply
        ethers.parseEther((parseInt(token.supply) * 2).toString()), // maxSupply (double the initial supply)
        {
          value: creationFee,
          gasLimit: 2000000 // 大幅增加gas限制，因为需要部署新合约
        }
      );
      await tx.wait();
      console.log(`   ✅ Token "${token.symbol}" created (${token.supply} supply)`);
      results.tokensCreated++;
      results.totalFeesPaid = results.totalFeesPaid + creationFee;
    } catch (error) {
      console.log(`   ⚠️ Token "${token.symbol}" creation failed:`, error.message);
    }
  }

  console.log("   📊 Token Factory sample data setup completed");
  console.log(`   📋 Results: ${results.tokensCreated} tokens created, ${ethers.formatEther(results.totalFeesPaid)} ETH fees paid`);
  
  return results;
}

module.exports = { setupTokenFactorySampleData }; 