const { ethers } = require('hardhat');

async function main() {
  console.log('🔧 修复DEX流动性问题...');
  
  try {
    // 获取部署的合约地址
    const contractAddresses = require('../src/contracts/addresses.json');
    const chainId = '1337'; // Ganache
    const addresses = contractAddresses[chainId];
    
    if (!addresses) {
      console.log('❌ 未找到合约地址，切换到硬编码地址');
      // 使用当前已知的地址
      addresses = {
        DEXPlatform: '0x26626478fE2c71d0DFF0c82a47d3618E7F0F4fDB',
        WETH: '0x07203C354938E1316f0b99C0810771d4F64f53e1',
        USDC: '0xe799BB3A9A4A3246918c9Bb6C611823b5d51DbED',
        DAI: '0x518c04379678E90F8EdfC9121Fe96B96e2f2fC1A'
      };
    }
    
    console.log('📋 使用合约地址:');
    Object.entries(addresses).forEach(([name, addr]) => {
      if (name !== 'network' && name !== 'deployedAt') {
        console.log(`${name}: ${addr}`);
      }
    });
    
    const [deployer] = await ethers.getSigners();
    console.log('👤 操作账户:', deployer.address);
    
    // 获取合约实例
    const dexPlatform = await ethers.getContractAt('DEXPlatform', addresses.DEXPlatform);
    const weth = await ethers.getContractAt('WETH', addresses.WETH);
    const usdc = await ethers.getContractAt('MockERC20', addresses.USDC);
    const dai = await ethers.getContractAt('MockERC20', addresses.DAI);
    
    // 检查代币余额
    console.log('\n💰 检查代币余额:');
    const wethBalance = await weth.balanceOf(deployer.address);
    const usdcBalance = await usdc.balanceOf(deployer.address);
    const daiBalance = await dai.balanceOf(deployer.address);
    
    console.log('WETH余额:', ethers.formatEther(wethBalance));
    console.log('USDC余额:', ethers.formatEther(usdcBalance));
    console.log('DAI余额:', ethers.formatEther(daiBalance));
    
    // 如果余额不足，先铸造一些代币
    if (wethBalance < ethers.parseEther('100')) {
      console.log('\n🔄 铸造WETH代币...');
      // WETH需要存入ETH
      const depositTx = await weth.deposit({ value: ethers.parseEther('500') });
      await depositTx.wait();
      console.log('✅ 存入500 ETH，获得500 WETH');
    }
    
    if (usdcBalance < ethers.parseEther('100000')) {
      console.log('\n🔄 铸造USDC代币...');
      const mintTx = await usdc.mint(deployer.address, ethers.parseEther('500000'));
      await mintTx.wait();
      console.log('✅ 铸造500,000 USDC');
    }
    
    if (daiBalance < ethers.parseEther('100000')) {
      console.log('\n🔄 铸造DAI代币...');
      const mintTx = await dai.mint(deployer.address, ethers.parseEther('500000'));
      await mintTx.wait();
      console.log('✅ 铸造500,000 DAI');
    }
    
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
    
    console.log('\n🏊 Pool IDs:');
    console.log('WETH-USDC:', wethUsdcPoolId);
    console.log('WETH-DAI:', wethDaiPoolId);
    
    // 检查并创建WETH-USDC池子
    console.log('\n🔨 创建/检查WETH-USDC池子...');
    try {
      const poolInfo = await dexPlatform.getPoolInfo(wethUsdcPoolId);
      console.log('✅ WETH-USDC池子已存在');
      console.log('  Reserve A:', ethers.formatEther(poolInfo.reserveA));
      console.log('  Reserve B:', ethers.formatEther(poolInfo.reserveB));
    } catch (error) {
      console.log('🔨 创建WETH-USDC池子...');
      const createTx = await dexPlatform.createPool(addresses.WETH, addresses.USDC);
      await createTx.wait();
      console.log('✅ WETH-USDC池子创建成功');
      
      // 添加流动性
      console.log('💧 添加WETH-USDC流动性...');
      const wethAmount = ethers.parseEther('100');
      const usdcAmount = ethers.parseEther('220000');
      
      // 先授权
      await weth.approve(addresses.DEXPlatform, wethAmount);
      await usdc.approve(addresses.DEXPlatform, usdcAmount);
      
      const addLiqTx = await dexPlatform.addLiquidity(
        wethUsdcPoolId,
        wethAmount,
        usdcAmount,
        ethers.parseEther('95'), // 5% slippage
        ethers.parseEther('209000') // 5% slippage
      );
      await addLiqTx.wait();
      console.log('✅ WETH-USDC流动性添加成功');
    }
    
    // 检查并创建WETH-DAI池子
    console.log('\n🔨 创建/检查WETH-DAI池子...');
    try {
      const poolInfo = await dexPlatform.getPoolInfo(wethDaiPoolId);
      console.log('✅ WETH-DAI池子已存在');
      console.log('  Reserve A:', ethers.formatEther(poolInfo.reserveA));
      console.log('  Reserve B:', ethers.formatEther(poolInfo.reserveB));
    } catch (error) {
      console.log('🔨 创建WETH-DAI池子...');
      const createTx = await dexPlatform.createPool(addresses.WETH, addresses.DAI);
      await createTx.wait();
      console.log('✅ WETH-DAI池子创建成功');
      
      // 添加流动性
      console.log('💧 添加WETH-DAI流动性...');
      const wethAmount = ethers.parseEther('50');
      const daiAmount = ethers.parseEther('110000');
      
      // 先授权
      await weth.approve(addresses.DEXPlatform, wethAmount);
      await dai.approve(addresses.DEXPlatform, daiAmount);
      
      const addLiqTx = await dexPlatform.addLiquidity(
        wethDaiPoolId,
        wethAmount,
        daiAmount,
        ethers.parseEther('47.5'), // 5% slippage
        ethers.parseEther('104500') // 5% slippage
      );
      await addLiqTx.wait();
      console.log('✅ WETH-DAI流动性添加成功');
    }
    
    // 测试价格计算
    console.log('\n💱 测试价格计算:');
    
    const testAmounts = ['1', '5', '10', '11'];
    for (const amount of testAmounts) {
      try {
        const amountIn = ethers.parseEther(amount);
        
        // WETH → USDC
        const usdcOut = await dexPlatform.getAmountOut(wethUsdcPoolId, addresses.WETH, amountIn);
        const usdcFormatted = ethers.formatEther(usdcOut);
        console.log(`${amount} WETH → ${usdcFormatted} USDC`);
        
        // WETH → DAI
        const daiOut = await dexPlatform.getAmountOut(wethDaiPoolId, addresses.WETH, amountIn);
        const daiFormatted = ethers.formatEther(daiOut);
        console.log(`${amount} WETH → ${daiFormatted} DAI`);
        
      } catch (error) {
        console.log(`❌ ${amount} WETH 计算失败:`, error.message);
      }
    }
    
    console.log('\n✅ DEX流动性修复完成！');
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 