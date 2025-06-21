const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 检查Ganache网络上的DEX池子状态...');
  
  try {
    // 连接到Ganache网络
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
    const privateKey = '0x09a7ec32e08d5fdc838ac88d987a330eddda23761dbd2d99c5ee5b7422b7386f';
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('👤 使用账户:', wallet.address);
    
    // 获取合约地址
    const contractAddresses = require('../src/contracts/addresses.json');
    const addresses = contractAddresses['1337'];
    
    console.log('📋 合约地址:');
    console.log('DEX:', addresses.DEXPlatform);
    console.log('WETH:', addresses.WETH);
    console.log('USDC:', addresses.USDC);
    console.log('DAI:', addresses.DAI);
    
    // 获取合约实例
    const dexPlatform = new ethers.Contract(addresses.DEXPlatform, 
      (await ethers.getContractFactory('DEXPlatform')).interface, wallet);
    
    // 检查池子数量
    const poolCount = await dexPlatform.getPoolCount();
    console.log('\n📊 总池子数量:', poolCount.toString());
    
    // 获取所有池子ID
    const allPools = await dexPlatform.getAllPools();
    console.log('所有池子ID:', allPools);
    
    // 计算Pool ID
    const wethUsdcPoolId = ethers.keccak256(
      ethers.solidityPacked(['address', 'address'], 
        addresses.WETH < addresses.USDC ? [addresses.WETH, addresses.USDC] : [addresses.USDC, addresses.WETH]
      )
    );
    
    const wethDaiPoolId = ethers.keccak256(
      ethers.solidityPacked(['address', 'address'], 
        addresses.WETH < addresses.DAI ? [addresses.WETH, addresses.DAI] : [addresses.DAI, addresses.WETH]
      )
    );
    
    console.log('\n🏊 计算的池子ID:');
    console.log('WETH-USDC Pool ID:', wethUsdcPoolId);
    console.log('WETH-DAI Pool ID:', wethDaiPoolId);
    
    // 检查每个池子
    for (let i = 0; i < allPools.length; i++) {
      const poolId = allPools[i];
      console.log(`\n🏊‍♂️ 池子 ${i + 1}:`, poolId);
      
      try {
        // 直接调用合约，返回结构体
        const poolInfo = await dexPlatform.getPoolInfo(poolId);
        
        console.log('  📋 池子详情:');
        console.log('    Token A:', poolInfo.tokenA);
        console.log('    Token B:', poolInfo.tokenB);
        console.log('    Reserve A:', ethers.formatEther(poolInfo.reserveA));
        console.log('    Reserve B:', ethers.formatEther(poolInfo.reserveB));
        console.log('    Total Liquidity:', ethers.formatEther(poolInfo.totalLiquidity));
        console.log('    APY:', poolInfo.apy.toString() / 100, '%');
        console.log('    Daily Volume:', ethers.formatEther(poolInfo.dailyVolume));
        console.log('    Total Fees:', ethers.formatEther(poolInfo.totalFees));
        
        // 检查这是哪个代币对
        let tokenAName = 'Unknown';
        let tokenBName = 'Unknown';
        
        if (poolInfo.tokenA === addresses.WETH) tokenAName = 'WETH';
        else if (poolInfo.tokenA === addresses.USDC) tokenAName = 'USDC';
        else if (poolInfo.tokenA === addresses.DAI) tokenAName = 'DAI';
        
        if (poolInfo.tokenB === addresses.WETH) tokenBName = 'WETH';
        else if (poolInfo.tokenB === addresses.USDC) tokenBName = 'USDC';
        else if (poolInfo.tokenB === addresses.DAI) tokenBName = 'DAI';
        
        console.log(`  🏷️  池子类型: ${tokenAName}-${tokenBName}`);
        
        // 如果有流动性，测试价格计算
        if (poolInfo.reserveA > 0 && poolInfo.reserveB > 0) {
          console.log(`\n💱 ${tokenAName}-${tokenBName}价格测试:`);
          const testAmounts = ['0.1', '1', '5'];
          
          for (const amount of testAmounts) {
            try {
              const amountIn = ethers.parseEther(amount);
              const amountOut = await dexPlatform.getAmountOut(poolId, poolInfo.tokenA, amountIn);
              const amountOutFormatted = ethers.formatEther(amountOut);
              const price = parseFloat(amountOutFormatted) / parseFloat(amount);
              console.log(`    ${amount} ${tokenAName} → ${amountOutFormatted} ${tokenBName} (价格: ${price.toFixed(4)})`);
            } catch (error) {
              console.log(`    ❌ ${amount} ${tokenAName} 计算失败:`, error.reason || error.message);
            }
          }
        } else {
          console.log('  ⚠️  池子没有流动性');
        }
        
      } catch (poolError) {
        console.log('  ❌ 获取池子信息失败:', poolError.reason || poolError.message);
      }
    }
    
    // 检查代币余额
    console.log('\n💰 检查代币余额:');
    const wethContract = new ethers.Contract(addresses.WETH, 
      ['function balanceOf(address) view returns (uint256)'], wallet);
    const usdcContract = new ethers.Contract(addresses.USDC, 
      ['function balanceOf(address) view returns (uint256)'], wallet);
    const daiContract = new ethers.Contract(addresses.DAI, 
      ['function balanceOf(address) view returns (uint256)'], wallet);
    
    const wethBalance = await wethContract.balanceOf(wallet.address);
    const usdcBalance = await usdcContract.balanceOf(wallet.address);
    const daiBalance = await daiContract.balanceOf(wallet.address);
    
    console.log('WETH余额:', ethers.formatEther(wethBalance));
    console.log('USDC余额:', ethers.formatEther(usdcBalance));
    console.log('DAI余额:', ethers.formatEther(daiBalance));
    
    console.log('\n✅ 检查完成！');
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 