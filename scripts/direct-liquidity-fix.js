const { ethers } = require('hardhat');

async function main() {
  console.log('🔧 直接修复WETH-USDC流动性...');
  
  try {
    // 连接到Ganache网络
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
    const privateKey = '0x09a7ec32e08d5fdc838ac88d987a330eddda23761dbd2d99c5ee5b7422b7386f';
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('👤 使用账户:', wallet.address);
    
    // 获取合约地址
    const contractAddresses = require('../src/contracts/addresses.json');
    const addresses = contractAddresses['1337'];
    
    console.log('\n📋 合约地址:');
    console.log('DEX:', addresses.DEXPlatform);
    console.log('WETH:', addresses.WETH);
    console.log('USDC:', addresses.USDC);
    
    // 简单的代币合约实例
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
    
    // 检查余额
    const wethBalance = await wethContract.balanceOf(wallet.address);
    const usdcBalance = await usdcContract.balanceOf(wallet.address);
    
    console.log('\n💰 当前余额:');
    console.log('WETH:', ethers.formatEther(wethBalance));
    console.log('USDC:', ethers.formatEther(usdcBalance));
    
    // 铸造更多USDC
    console.log('\n🪙 铸造更多USDC...');
    const mintAmount = ethers.parseEther('100000'); // 100,000 USDC
    try {
      const mintTx = await usdcContract.mint(wallet.address, mintAmount);
      await mintTx.wait();
      console.log('✅ 铸造成功:', ethers.formatEther(mintAmount), 'USDC');
    } catch (mintError) {
      console.log('❌ 铸造失败:', mintError.reason || mintError.message);
    }
    
    // 检查新余额
    const newUsdcBalance = await usdcContract.balanceOf(wallet.address);
    console.log('新USDC余额:', ethers.formatEther(newUsdcBalance));
    
    // 计算池子ID
    const wethUsdcPoolId = ethers.keccak256(
      ethers.solidityPacked(['address', 'address'], 
        addresses.WETH < addresses.USDC ? [addresses.WETH, addresses.USDC] : [addresses.USDC, addresses.WETH]
      )
    );
    
    console.log('\n🏊 池子ID:', wethUsdcPoolId);
    
    // 准备添加大量流动性
    const liquidityWETH = ethers.parseEther('20'); // 20 WETH 
    const liquidityUSDC = ethers.parseEther('60000'); // 60,000 USDC (目标价格: 3000 USDC/WETH)
    
    console.log('\n💧 准备添加流动性:');
    console.log('WETH:', ethers.formatEther(liquidityWETH));
    console.log('USDC:', ethers.formatEther(liquidityUSDC));
    
    // 先检查和设置大额授权
    console.log('\n🔐 设置大额授权...');
    
    const wethAllowance = await wethContract.allowance(wallet.address, addresses.DEXPlatform);
    const usdcAllowance = await usdcContract.allowance(wallet.address, addresses.DEXPlatform);
    
    console.log('当前WETH授权:', ethers.formatEther(wethAllowance));
    console.log('当前USDC授权:', ethers.formatEther(usdcAllowance));
    
    // 设置大额授权 (1M 代币)
    const bigAllowance = ethers.parseEther('1000000');
    
    if (wethAllowance < liquidityWETH) {
      console.log('🔓 授权WETH...');
      const approveTx = await wethContract.approve(addresses.DEXPlatform, bigAllowance);
      await approveTx.wait();
      console.log('✅ WETH授权完成');
    }
    
    if (usdcAllowance < liquidityUSDC) {
      console.log('🔓 授权USDC...');
      const approveTx = await usdcContract.approve(addresses.DEXPlatform, bigAllowance);
      await approveTx.wait();
      console.log('✅ USDC授权完成');
    }
    
    // 直接调用addLiquidity
    console.log('\n🏊 直接调用addLiquidity...');
    try {
      
      // 构造addLiquidity函数调用
      const addLiquiditySelector = '0x02751cec'; // addLiquidity(bytes32,uint256,uint256,uint256,uint256)的函数选择器
      
      const callData = ethers.concat([
        addLiquiditySelector,
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes32', 'uint256', 'uint256', 'uint256', 'uint256'],
          [
            wethUsdcPoolId,
            liquidityWETH,
            liquidityUSDC,
            ethers.parseEther('15'), // 最小WETH: 15
            ethers.parseEther('45000') // 最小USDC: 45000
          ]
        )
      ]);
      
      console.log('调用数据长度:', callData.length);
      
      // 发送交易
      const tx = await wallet.sendTransaction({
        to: addresses.DEXPlatform,
        data: callData,
        gasLimit: 500000 // 设置较高的gas限制
      });
      
      console.log('交易已发送，哈希:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ 流动性添加成功！');
      console.log('Gas使用:', receipt.gasUsed.toString());
      
    } catch (liquidityError) {
      console.log('❌ 添加流动性失败:', liquidityError.reason || liquidityError.message);
      
      // 尝试其他方法：使用原始工厂合约创建
      console.log('\n🔨 尝试使用getContractFactory方法...');
      try {
        const DEXPlatform = await ethers.getContractFactory('DEXPlatform');
        const dexPlatform = DEXPlatform.attach(addresses.DEXPlatform).connect(wallet);
        
        console.log('使用工厂合约调用addLiquidity...');
        const addLiquidityTx = await dexPlatform.addLiquidity(
          wethUsdcPoolId,
          liquidityWETH,
          liquidityUSDC,
          ethers.parseEther('15'),
          ethers.parseEther('45000'),
          { gasLimit: 500000 }
        );
        
        const receipt = await addLiquidityTx.wait();
        console.log('✅ 使用工厂合约添加流动性成功！');
        console.log('交易哈希:', receipt.hash);
        
      } catch (factoryError) {
        console.log('❌ 工厂合约方法也失败:', factoryError.reason || factoryError.message);
      }
    }
    
    // 最后测试价格计算
    console.log('\n💱 测试最终交换价格...');
    try {
      const DEXPlatform = await ethers.getContractFactory('DEXPlatform');
      const dexPlatform = DEXPlatform.attach(addresses.DEXPlatform).connect(wallet);
      
      const testAmount = ethers.parseEther('1');
      const outputAmount = await dexPlatform.getAmountOut(wethUsdcPoolId, addresses.WETH, testAmount);
      const outputFormatted = ethers.formatEther(outputAmount);
      
      console.log(`1 WETH → ${outputFormatted} USDC`);
      console.log('价格:', parseFloat(outputFormatted), 'USDC/WETH');
      
      if (parseFloat(outputFormatted) > 100) {
        console.log('🎉 流动性修复成功！价格正常！');
      } else {
        console.log('⚠️ 价格仍然异常，需要进一步调整');
      }
      
    } catch (priceError) {
      console.log('❌ 价格测试失败:', priceError.reason || priceError.message);
    }
    
    console.log('\n✅ 修复操作完成！');
    
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