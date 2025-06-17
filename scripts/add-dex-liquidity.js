const { ethers } = require('hardhat');
const fs = require('fs');

async function main() {
  console.log('💧 向DEX添加流动性...');

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
  const [deployer] = await ethers.getSigners();
  
  const DEXPlatform = await ethers.getContractFactory('DEXPlatform');
  const dexContract = DEXPlatform.attach(contractAddresses.DEXPlatform);

  const MockERC20 = await ethers.getContractFactory('MockERC20');
  const WETH = await ethers.getContractFactory('WETH');
  
  const wethContract = WETH.attach(contractAddresses.WETH);
  const usdcContract = MockERC20.attach(contractAddresses.USDC);
  const daiContract = MockERC20.attach(contractAddresses.DAI);

  console.log('📋 合约信息:');
  console.log('DEX合约地址:', contractAddresses.DEXPlatform);
  console.log('WETH地址:', contractAddresses.WETH);
  console.log('USDC地址:', contractAddresses.USDC);
  console.log('DAI地址:', contractAddresses.DAI);
  console.log('部署者地址:', deployer.address);

  try {
    // 检查代币余额
    console.log('\n💳 检查代币余额...');
    const wethBalance = await wethContract.balanceOf(deployer.address);
    const usdcBalance = await usdcContract.balanceOf(deployer.address);
    const daiBalance = await daiContract.balanceOf(deployer.address);
    
    console.log('WETH余额:', ethers.formatEther(wethBalance));
    console.log('USDC余额:', ethers.formatUnits(usdcBalance, 6));
    console.log('DAI余额:', ethers.formatEther(daiBalance));

    // 计算池ID
    const calculatePoolId = (tokenA, tokenB) => {
      const [sortedA, sortedB] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];
      return ethers.keccak256(
        ethers.solidityPacked(['address', 'address'], [sortedA, sortedB])
      );
    };

    const wethUsdcPoolId = calculatePoolId(contractAddresses.WETH, contractAddresses.USDC);
    const wethDaiPoolId = calculatePoolId(contractAddresses.WETH, contractAddresses.DAI);
    const usdcDaiPoolId = calculatePoolId(contractAddresses.USDC, contractAddresses.DAI);

    console.log('\n🏊 池子ID:');
    console.log('WETH/USDC池ID:', wethUsdcPoolId);
    console.log('WETH/DAI池ID:', wethDaiPoolId);
    console.log('USDC/DAI池ID:', usdcDaiPoolId);

    // 授权代币给DEX合约
    console.log('\n🔐 授权代币...');
    const wethAmount = ethers.parseEther('10'); // 10 WETH
    const usdcAmount = ethers.parseUnits('20000', 6); // 20,000 USDC
    const daiAmount = ethers.parseEther('20000'); // 20,000 DAI

    console.log('授权WETH...');
    let tx = await wethContract.approve(contractAddresses.DEXPlatform, wethAmount);
    await tx.wait();

    console.log('授权USDC...');
    tx = await usdcContract.approve(contractAddresses.DEXPlatform, usdcAmount);
    await tx.wait();

    console.log('授权DAI...');
    tx = await daiContract.approve(contractAddresses.DEXPlatform, daiAmount);
    await tx.wait();

    console.log('✅ 代币授权完成');

    // 添加流动性到WETH/USDC池
    console.log('\n💧 添加WETH/USDC流动性...');
    const wethForUsdc = ethers.parseEther('5'); // 5 WETH
    const usdcForWeth = ethers.parseUnits('10000', 6); // 10,000 USDC (价格 = 2000 USDC/WETH)
    
    tx = await dexContract.addLiquidity(
      wethUsdcPoolId,
      wethForUsdc,
      usdcForWeth,
      ethers.parseEther('4.9'), // 最小WETH (2% slippage)
      ethers.parseUnits('9800', 6) // 最小USDC (2% slippage)
    );
    await tx.wait();
    console.log('✅ WETH/USDC流动性添加成功');

    // 添加流动性到WETH/DAI池
    console.log('\n💧 添加WETH/DAI流动性...');
    const wethForDai = ethers.parseEther('3'); // 3 WETH
    const daiForWeth = ethers.parseEther('6000'); // 6,000 DAI (价格 = 2000 DAI/WETH)
    
    tx = await dexContract.addLiquidity(
      wethDaiPoolId,
      wethForDai,
      daiForWeth,
      ethers.parseEther('2.9'), // 最小WETH (2% slippage)
      ethers.parseEther('5880') // 最小DAI (2% slippage)
    );
    await tx.wait();
    console.log('✅ WETH/DAI流动性添加成功');

    // 添加流动性到USDC/DAI池
    console.log('\n💧 添加USDC/DAI流动性...');
    const usdcForDai = ethers.parseUnits('5000', 6); // 5,000 USDC
    const daiForUsdc = ethers.parseEther('5000'); // 5,000 DAI (价格 = 1 USDC/DAI)
    
    tx = await dexContract.addLiquidity(
      usdcDaiPoolId,
      usdcForDai,
      daiForUsdc,
      ethers.parseUnits('4900', 6), // 最小USDC (2% slippage)
      ethers.parseEther('4900') // 最小DAI (2% slippage)
    );
    await tx.wait();
    console.log('✅ USDC/DAI流动性添加成功');

    // 检查池子状态
    console.log('\n📊 检查池子状态...');
    
    const wethUsdcInfo = await dexContract.getPoolInfo(wethUsdcPoolId);
    console.log('WETH/USDC池:', {
      tokenA: wethUsdcInfo[0],
      tokenB: wethUsdcInfo[1],
      reserveA: ethers.formatEther(wethUsdcInfo[2]),
      reserveB: ethers.formatUnits(wethUsdcInfo[3], 6),
      totalLiquidity: ethers.formatEther(wethUsdcInfo[4])
    });

    const wethDaiInfo = await dexContract.getPoolInfo(wethDaiPoolId);
    console.log('WETH/DAI池:', {
      tokenA: wethDaiInfo[0],
      tokenB: wethDaiInfo[1],
      reserveA: ethers.formatEther(wethDaiInfo[2]),
      reserveB: ethers.formatEther(wethDaiInfo[3]),
      totalLiquidity: ethers.formatEther(wethDaiInfo[4])
    });

    console.log('\n✅ DEX流动性添加完成！');
    console.log('现在可以在前端测试DEX交换功能了');

  } catch (error) {
    console.error('❌ 添加流动性失败:', error.message);
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