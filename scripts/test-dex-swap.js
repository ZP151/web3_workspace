const { ethers } = require('hardhat');
const fs = require('fs');

async function main() {
  console.log('🔄 开始DEX交换测试...');

  // 读取合约地址
  const addressesPath = './src/contracts/addresses.json';
  let addresses;
  try {
    addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  } catch (error) {
    console.error('❌ 无法读取合约地址文件:', error.message);
    return;
  }

  const chainId = '1337'; // Ganache
  const contractAddresses = addresses[chainId];
  
  if (!contractAddresses) {
    console.error('❌ 未找到网络 1337 的合约地址');
    return;
  }

  // 获取合约实例
  const [deployer, user1, user2] = await ethers.getSigners();
  
  const DEXPlatform = await ethers.getContractFactory('DEXPlatform');
  const dexContract = DEXPlatform.attach(contractAddresses.DEXPlatform);

  console.log('📋 DEX合约信息:');
  console.log('DEX合约地址:', contractAddresses.DEXPlatform);
  console.log('测试账户:', deployer.address);

  try {
    // 检查所有池子
    console.log('\n🏊 检查流动性池状态...');
    
    // 计算池ID (WETH/USDC)
    const wethAddress = contractAddresses.WETH;
    const usdcAddress = contractAddresses.USDC;
    
    console.log('WETH地址:', wethAddress);
    console.log('USDC地址:', usdcAddress);
    
    // 获取池子信息
    const poolId = ethers.keccak256(
      ethers.solidityPacked(['address', 'address'], 
        wethAddress < usdcAddress ? [wethAddress, usdcAddress] : [usdcAddress, wethAddress]
      )
    );
    
    console.log('池ID:', poolId);
    
    const poolInfo = await dexContract.getPoolInfo(poolId);
    console.log('池子信息:', {
      tokenA: poolInfo[0],
      tokenB: poolInfo[1],
      reserveA: ethers.formatEther(poolInfo[2]),
      reserveB: ethers.formatEther(poolInfo[3]),
      totalLiquidity: ethers.formatEther(poolInfo[4])
    });

    // 测试价格查询
    console.log('\n💰 测试价格查询...');
    const inputAmount = ethers.parseEther('0.1'); // 0.1 WETH
    
    try {
      const outputAmount = await dexContract.getAmountOut(poolId, wethAddress, inputAmount);
      console.log('输入 0.1 WETH，预计输出:', ethers.formatEther(outputAmount), 'USDC');
      
      // 计算价格
      const price = parseFloat(ethers.formatEther(outputAmount)) / 0.1;
      console.log('WETH/USDC 价格:', price.toFixed(2));
      
    } catch (error) {
      console.error('❌ 价格查询失败:', error.message);
      
      // 检查是否需要添加流动性
      if (poolInfo[2] === 0n || poolInfo[3] === 0n) {
        console.log('⚠️ 池子为空，需要添加流动性');
        console.log('请运行: npx hardhat run scripts/init-dex-pools.js --network ganache');
      }
    }

    // 获取用户余额
    console.log('\n💳 检查用户代币余额...');
    const MockERC20 = await ethers.getContractFactory('MockERC20');
    const wethContract = MockERC20.attach(wethAddress);
    const usdcContract = MockERC20.attach(usdcAddress);
    
    const wethBalance = await wethContract.balanceOf(deployer.address);
    const usdcBalance = await usdcContract.balanceOf(deployer.address);
    
    console.log('WETH余额:', ethers.formatEther(wethBalance));
    console.log('USDC余额:', ethers.formatEther(usdcBalance));

    // 检查授权
    console.log('\n🔐 检查代币授权...');
    const wethAllowance = await wethContract.allowance(deployer.address, contractAddresses.DEXPlatform);
    const usdcAllowance = await usdcContract.allowance(deployer.address, contractAddresses.DEXPlatform);
    
    console.log('WETH授权额度:', ethers.formatEther(wethAllowance));
    console.log('USDC授权额度:', ethers.formatEther(usdcAllowance));

    if (wethAllowance < inputAmount) {
      console.log('⚠️ WETH授权不足，正在授权...');
      const approveTx = await wethContract.approve(contractAddresses.DEXPlatform, ethers.parseEther('1000'));
      await approveTx.wait();
      console.log('✅ WETH授权完成');
    }

    console.log('\n✅ DEX测试完成！');
    console.log('\n📝 测试结果:');
    console.log('- 池子状态: ', poolInfo[2] > 0n && poolInfo[3] > 0n ? '正常' : '需要流动性');
    console.log('- 价格查询: ', poolInfo[2] > 0n ? '正常' : '失败');
    console.log('- 用户余额: ', wethBalance > 0n ? '充足' : '不足');
    console.log('- 授权状态: ', wethAllowance >= inputAmount ? '正常' : '需要授权');

  } catch (error) {
    console.error('❌ DEX测试失败:', error.message);
    if (error.data) {
      console.error('错误数据:', error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 