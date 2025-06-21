const { ethers } = require('hardhat');

async function main() {
  console.log('🔧 向WETH-USDC池子添加USDC流动性...');
  
  try {
    // 连接到Ganache网络
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
    const privateKey = '0x09a7ec32e08d5fdc838ac88d987a330eddda23761dbd2d99c5ee5b7422b7386f';
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('👤 使用账户:', wallet.address);
    
    // 获取合约地址
    const contractAddresses = require('../src/contracts/addresses.json');
    const addresses = contractAddresses['1337'];
    
    // 获取合约实例
    const dexPlatform = new ethers.Contract(addresses.DEXPlatform, [
      'function pools(bytes32) view returns (address, address, uint256, uint256, uint256, uint256, bool, uint256, uint256)',
      'function addLiquidity(bytes32, uint256, uint256, uint256, uint256) returns (uint256, uint256, uint256)',
      'function getAmountOut(bytes32, address, uint256) view returns (uint256)'
    ], wallet);
    
    const wethContract = new ethers.Contract(addresses.WETH, [
      'function balanceOf(address) view returns (uint256)',
      'function allowance(address, address) view returns (uint256)',
      'function approve(address, uint256) returns (bool)'
    ], wallet);
    
    const usdcContract = new ethers.Contract(addresses.USDC, [
      'function balanceOf(address) view returns (uint256)',
      'function allowance(address, address) view returns (uint256)',
      'function approve(address, uint256) returns (bool)',
      'function mint(address, uint256) returns (bool)'
    ], wallet);
    
    // 计算池子ID
    const wethUsdcPoolId = ethers.keccak256(
      ethers.solidityPacked(['address', 'address'], 
        addresses.WETH < addresses.USDC ? [addresses.WETH, addresses.USDC] : [addresses.USDC, addresses.WETH]
      )
    );
    
    console.log('🏊 池子ID:', wethUsdcPoolId);
    
    // 检查当前余额
    const wethBalance = await wethContract.balanceOf(wallet.address);
    const usdcBalance = await usdcContract.balanceOf(wallet.address);
    
    console.log('\n💰 当前余额:');
    console.log('WETH:', ethers.formatEther(wethBalance));
    console.log('USDC:', ethers.formatEther(usdcBalance));
    
    // 检查当前池子状态
    const poolData = await dexPlatform.pools(wethUsdcPoolId);
    const [,, reserveA, reserveB] = poolData;
    
    console.log('\n🏊 当前池子储备:');
    console.log('Reserve A (WETH):', ethers.formatEther(reserveA));
    console.log('Reserve B (USDC):', ethers.formatEther(reserveB));
    
    // 铸造更多USDC
    console.log('\n🪙 铸造更多USDC...');
    try {
      const mintAmount = ethers.parseEther('50000'); // 50,000 USDC
      const mintTx = await usdcContract.mint(wallet.address, mintAmount);
      await mintTx.wait();
      console.log('✅ 铸造成功:', ethers.formatEther(mintAmount), 'USDC');
      
      const newUsdcBalance = await usdcContract.balanceOf(wallet.address);
      console.log('新USDC余额:', ethers.formatEther(newUsdcBalance));
    } catch (mintError) {
      console.log('❌ 铸造失败:', mintError.reason || mintError.message);
    }
    
    // 计算合理的流动性比例
    // 目标：1 WETH = 3000 USDC
    const additionalWETH = ethers.parseEther('5'); // 额外5 WETH
    const additionalUSDC = ethers.parseEther('15000'); // 15,000 USDC (5 * 3000)
    
    console.log('\n💧 准备添加流动性:');
    console.log('WETH:', ethers.formatEther(additionalWETH));
    console.log('USDC:', ethers.formatEther(additionalUSDC));
    
    // 检查并设置授权
    const wethAllowance = await wethContract.allowance(wallet.address, addresses.DEXPlatform);
    const usdcAllowance = await usdcContract.allowance(wallet.address, addresses.DEXPlatform);
    
    console.log('\n🔐 检查授权:');
    console.log('WETH授权:', ethers.formatEther(wethAllowance));
    console.log('USDC授权:', ethers.formatEther(usdcAllowance));
    
    if (wethAllowance < additionalWETH) {
      console.log('🔓 授权WETH...');
      const approveTx = await wethContract.approve(addresses.DEXPlatform, additionalWETH * 2n);
      await approveTx.wait();
      console.log('✅ WETH授权完成');
    }
    
    if (usdcAllowance < additionalUSDC) {
      console.log('🔓 授权USDC...');
      const approveTx = await usdcContract.approve(addresses.DEXPlatform, additionalUSDC * 2n);
      await approveTx.wait();
      console.log('✅ USDC授权完成');
    }
    
    // 添加流动性
    console.log('\n🏊 添加流动性到池子...');
    try {
      const addLiquidityTx = await dexPlatform.addLiquidity(
        wethUsdcPoolId,
        additionalWETH,
        additionalUSDC,
        ethers.parseEther('4'), // 最小WETH: 4
        ethers.parseEther('12000') // 最小USDC: 12000
      );
      
      const receipt = await addLiquidityTx.wait();
      console.log('✅ 流动性添加成功！');
      console.log('交易哈希:', receipt.hash);
      console.log('Gas使用:', receipt.gasUsed.toString());
      
      // 检查新的池子状态
      const newPoolData = await dexPlatform.pools(wethUsdcPoolId);
      const [,, newReserveA, newReserveB, newTotalLiquidity] = newPoolData;
      
      console.log('\n🏊 新的池子状态:');
      console.log('Reserve A (WETH):', ethers.formatEther(newReserveA));
      console.log('Reserve B (USDC):', ethers.formatEther(newReserveB));
      console.log('Total Liquidity:', ethers.formatEther(newTotalLiquidity));
      
      // 计算新价格
      const wethReserve = Number(ethers.formatEther(newReserveA));
      const usdcReserve = Number(ethers.formatEther(newReserveB));
      const price = usdcReserve / wethReserve;
      console.log('新价格:', price.toFixed(2), 'USDC/WETH');
      
      // 测试交换
      console.log('\n💱 测试交换计算:');
      const testAmounts = [0.1, 1, 5];
      for (const amount of testAmounts) {
        try {
          const amountIn = ethers.parseEther(amount.toString());
          const amountOut = await dexPlatform.getAmountOut(wethUsdcPoolId, addresses.WETH, amountIn);
          const amountOutFormatted = ethers.formatEther(amountOut);
          const effectivePrice = parseFloat(amountOutFormatted) / amount;
          console.log(`  ${amount} WETH → ${amountOutFormatted} USDC (价格: ${effectivePrice.toFixed(2)})`);
        } catch (swapError) {
          console.log(`  ❌ ${amount} WETH 计算失败:`, swapError.reason || swapError.message);
        }
      }
      
    } catch (liquidityError) {
      console.log('❌ 添加流动性失败:', liquidityError.reason || liquidityError.message);
    }
    
    console.log('\n✅ 流动性修复完成！');
    
  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 