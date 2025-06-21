const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 测试DEX流动性和价格计算...');
  
  try {
    // 获取部署的合约地址
    const contractAddresses = require('../src/contracts/addresses.json');
    const chainId = '1337'; // Ganache
    const addresses = contractAddresses[chainId];
    
    if (!addresses) {
      console.log('❌ 未找到合约地址');
      return;
    }
    
    console.log('📋 合约地址:');
    console.log('DEX:', addresses.DEXPlatform);
    console.log('WETH:', addresses.WETH);
    console.log('USDC:', addresses.USDC);
    console.log('DAI:', addresses.DAI);
    
    // 获取合约实例
    const dexPlatform = await ethers.getContractAt('DEXPlatform', addresses.DEXPlatform);
    const weth = await ethers.getContractAt('MockERC20', addresses.WETH);
    const usdc = await ethers.getContractAt('MockERC20', addresses.USDC);
    const dai = await ethers.getContractAt('MockERC20', addresses.DAI);
    
    // 计算Pool ID
    const poolId = ethers.keccak256(
      ethers.solidityPacked(['address', 'address'], 
        addresses.WETH < addresses.USDC ? [addresses.WETH, addresses.USDC] : [addresses.USDC, addresses.WETH]
      )
    );
    
    console.log('\n💧 检查池子流动性:');
    console.log('Pool ID:', poolId);
    
    try {
      const poolInfo = await dexPlatform.getPoolInfo(poolId);
      console.log('✅ 池子信息:');
      console.log('  Token A:', poolInfo.tokenA);
      console.log('  Token B:', poolInfo.tokenB);
      console.log('  Reserve A:', ethers.formatEther(poolInfo.reserveA));
      console.log('  Reserve B:', ethers.formatEther(poolInfo.reserveB));
      console.log('  Total Liquidity:', ethers.formatEther(poolInfo.totalLiquidity));
      console.log('  APY:', poolInfo.apy.toString() / 100, '%');
      
      // 测试价格计算
      console.log('\n💱 测试价格计算:');
      const testAmounts = ['1', '5', '10', '11'];
      
      for (const amount of testAmounts) {
        try {
          const amountIn = ethers.parseEther(amount);
          const amountOut = await dexPlatform.getAmountOut(poolId, addresses.WETH, amountIn);
          const outputFormatted = ethers.formatEther(amountOut);
          const price = parseFloat(outputFormatted) / parseFloat(amount);
          
          console.log(`  ${amount} WETH → ${outputFormatted} USDC (价格: ${price.toFixed(6)} USDC/WETH)`);
          
          if (parseFloat(outputFormatted) < 1e-12) {
            console.log('    ⚠️ 输出金额过小，可能是流动性不足');
          }
        } catch (error) {
          console.log(`    ❌ ${amount} WETH 计算失败:`, error.message);
        }
      }
      
      // 反向测试 USDC → WETH
      console.log('\n  反向测试 USDC → WETH:');
      for (const amount of ['1000', '5000', '10000']) {
        try {
          const amountIn = ethers.parseEther(amount);
          const amountOut = await dexPlatform.getAmountOut(poolId, addresses.USDC, amountIn);
          const outputFormatted = ethers.formatEther(amountOut);
          const price = parseFloat(amount) / parseFloat(outputFormatted);
          
          console.log(`  ${amount} USDC → ${outputFormatted} WETH (价格: ${price.toFixed(2)} USDC/WETH)`);
        } catch (error) {
          console.log(`    ❌ ${amount} USDC 计算失败:`, error.message);
        }
      }
      
    } catch (error) {
      console.log('❌ 池子不存在或未激活:', error.message);
      
      // 尝试创建池子
      console.log('\n🔨 尝试创建WETH-USDC池子...');
      try {
        const [deployer] = await ethers.getSigners();
        const tx = await dexPlatform.connect(deployer).createPool(addresses.WETH, addresses.USDC);
        await tx.wait();
        console.log('✅ 池子创建成功!');
        
        // 添加初始流动性
        console.log('\n💧 添加初始流动性...');
        
        // 先授权
        const wethAmount = ethers.parseEther('100');
        const usdcAmount = ethers.parseEther('220000');
        
        await weth.connect(deployer).approve(addresses.DEXPlatform, wethAmount);
        await usdc.connect(deployer).approve(addresses.DEXPlatform, usdcAmount);
        
        const addLiqTx = await dexPlatform.connect(deployer).addLiquidity(
          poolId,
          wethAmount,
          usdcAmount,
          ethers.parseEther('95'), // 5% slippage
          ethers.parseEther('209000') // 5% slippage
        );
        await addLiqTx.wait();
        
        console.log('✅ 初始流动性添加成功!');
        
        // 重新测试价格
        console.log('\n💱 重新测试价格:');
        const amountOut = await dexPlatform.getAmountOut(poolId, addresses.WETH, ethers.parseEther('11'));
        console.log('11 WETH →', ethers.formatEther(amountOut), 'USDC');
        
      } catch (createError) {
        console.log('❌ 创建池子失败:', createError.message);
      }
    }
    
    // 检查代币余额
    console.log('\n💰 检查代币余额:');
    const [deployer] = await ethers.getSigners();
    const wethBalance = await weth.balanceOf(deployer.address);
    const usdcBalance = await usdc.balanceOf(deployer.address);
    const daiBalance = await dai.balanceOf(deployer.address);
    
    console.log('WETH余额:', ethers.formatEther(wethBalance));
    console.log('USDC余额:', ethers.formatEther(usdcBalance));
    console.log('DAI余额:', ethers.formatEther(daiBalance));
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 