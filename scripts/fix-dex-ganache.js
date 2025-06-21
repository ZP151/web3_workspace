const { ethers } = require('hardhat');

async function main() {
  console.log('🔧 修复Ganache网络上的DEX流动性问题...');
  
  try {
    // 连接到Ganache网络
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
    
    // 使用Ganache第一个账户的私钥 (对应地址: 0x967f1B3E8396EfC041f07852103Fb85Ecca80311)
    // 注意：这是您Ganache网络的第一个账户私钥，仅用于开发测试
    const privateKey = '0x09a7ec32e08d5fdc838ac88d987a330eddda23761dbd2d99c5ee5b7422b7386f';
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('👤 使用账户:', wallet.address);
    console.log('💰 账户余额:', ethers.formatEther(await provider.getBalance(wallet.address)), 'ETH');
    
    // 获取部署的合约地址
    const contractAddresses = require('../src/contracts/addresses.json');
    const chainId = '1337'; // Ganache
    const addresses = contractAddresses[chainId];
    
    if (!addresses) {
      console.log('❌ 未找到合约地址');
      return;
    }
    
    console.log('\n📋 合约地址:');
    console.log('DEX:', addresses.DEXPlatform);
    console.log('WETH:', addresses.WETH);
    console.log('USDC:', addresses.USDC);
    console.log('DAI:', addresses.DAI);
    
    // 获取合约实例
    const dexPlatform = new ethers.Contract(addresses.DEXPlatform, 
      (await ethers.getContractFactory('DEXPlatform')).interface, wallet);
    const weth = new ethers.Contract(addresses.WETH,
      (await ethers.getContractFactory('WETH')).interface, wallet);
    const usdc = new ethers.Contract(addresses.USDC,
      (await ethers.getContractFactory('MockERC20')).interface, wallet);
    const dai = new ethers.Contract(addresses.DAI,
      (await ethers.getContractFactory('MockERC20')).interface, wallet);
    
    // 检查代币余额
    console.log('\n💰 检查代币余额:');
    try {
      const wethBalance = await weth.balanceOf(wallet.address);
      const usdcBalance = await usdc.balanceOf(wallet.address);
      const daiBalance = await dai.balanceOf(wallet.address);
      
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
        const mintTx = await usdc.mint(wallet.address, ethers.parseEther('500000'));
        await mintTx.wait();
        console.log('✅ 铸造500,000 USDC');
      }
      
      if (daiBalance < ethers.parseEther('100000')) {
        console.log('\n🔄 铸造DAI代币...');
        const mintTx = await dai.mint(wallet.address, ethers.parseEther('500000'));
        await mintTx.wait();
        console.log('✅ 铸造500,000 DAI');
      }
      
    } catch (balanceError) {
      console.log('⚠️ 代币余额检查失败，可能代币合约有问题:', balanceError.message);
      
      // 尝试重新部署代币
      console.log('\n🔄 重新部署代币合约...');
      
      // 部署WETH
      const WETHFactory = await ethers.getContractFactory('WETH');
      const wethNew = await WETHFactory.connect(wallet).deploy();
      await wethNew.waitForDeployment();
      console.log('✅ WETH重新部署成功:', await wethNew.getAddress());
      
      // 部署USDC
      const MockERC20Factory = await ethers.getContractFactory('MockERC20');
      const usdcNew = await MockERC20Factory.connect(wallet).deploy('USD Coin', 'USDC', 18, 1000000);
      await usdcNew.waitForDeployment();
      console.log('✅ USDC重新部署成功:', await usdcNew.getAddress());
      
      // 部署DAI
      const daiNew = await MockERC20Factory.connect(wallet).deploy('Dai Stablecoin', 'DAI', 18, 1000000);
      await daiNew.waitForDeployment();
      console.log('✅ DAI重新部署成功:', await daiNew.getAddress());
      
      // 更新地址
      const newAddresses = {
        ...addresses,
        WETH: await wethNew.getAddress(),
        USDC: await usdcNew.getAddress(),
        DAI: await daiNew.getAddress()
      };
      
      // 保存新地址
      const fs = require('fs');
      const addressesPath = '../src/contracts/addresses.json';
      const fullData = require(addressesPath);
      fullData[chainId] = newAddresses;
      fs.writeFileSync(addressesPath, JSON.stringify(fullData, null, 2));
      console.log('✅ 新地址已保存');
      
      return; // 重新运行脚本
    }
    
    // 计算Pool ID
    const wethUsdcPoolId = ethers.keccak256(
      ethers.solidityPacked(['address', 'address'], 
        addresses.WETH < addresses.USDC ? [addresses.WETH, addresses.USDC] : [addresses.USDC, addresses.WETH]
      )
    );
    
    console.log('\n🏊 WETH-USDC Pool ID:', wethUsdcPoolId);
    
    // 检查并创建WETH-USDC池子
    console.log('\n🔨 检查WETH-USDC池子...');
    try {
      const poolInfo = await dexPlatform.getPoolInfo(wethUsdcPoolId);
      console.log('✅ WETH-USDC池子已存在');
      console.log('  Token A:', poolInfo.tokenA);
      console.log('  Token B:', poolInfo.tokenB);
      console.log('  Reserve A:', ethers.formatEther(poolInfo.reserveA));
      console.log('  Reserve B:', ethers.formatEther(poolInfo.reserveB));
      
      // 测试价格计算
      console.log('\n💱 测试价格计算:');
      const testAmounts = ['1', '5', '10', '11'];
      for (const amount of testAmounts) {
        try {
          const amountIn = ethers.parseEther(amount);
          const usdcOut = await dexPlatform.getAmountOut(wethUsdcPoolId, addresses.WETH, amountIn);
          const usdcFormatted = ethers.formatEther(usdcOut);
          const price = parseFloat(usdcFormatted) / parseFloat(amount);
          console.log(`${amount} WETH → ${usdcFormatted} USDC (价格: ${price.toFixed(2)} USDC/WETH)`);
        } catch (error) {
          console.log(`❌ ${amount} WETH 计算失败:`, error.message);
        }
      }
      
    } catch (error) {
      console.log('❌ 池子不存在，创建新池子...');
      
      // 创建池子
      const createTx = await dexPlatform.createPool(addresses.WETH, addresses.USDC);
      await createTx.wait();
      console.log('✅ WETH-USDC池子创建成功');
      
      // 添加流动性
      console.log('💧 添加WETH-USDC流动性...');
      const wethAmount = ethers.parseEther('100');
      const usdcAmount = ethers.parseEther('220000');
      
      // 先授权
      console.log('🔐 授权代币...');
      const approveTx1 = await weth.approve(addresses.DEXPlatform, wethAmount);
      await approveTx1.wait();
      const approveTx2 = await usdc.approve(addresses.DEXPlatform, usdcAmount);
      await approveTx2.wait();
      console.log('✅ 代币授权完成');
      
      const addLiqTx = await dexPlatform.addLiquidity(
        wethUsdcPoolId,
        wethAmount,
        usdcAmount,
        ethers.parseEther('95'), // 5% slippage
        ethers.parseEther('209000') // 5% slippage
      );
      await addLiqTx.wait();
      console.log('✅ WETH-USDC流动性添加成功');
      
      // 测试价格
      console.log('\n💱 测试价格计算:');
      const amountOut = await dexPlatform.getAmountOut(wethUsdcPoolId, addresses.WETH, ethers.parseEther('11'));
      console.log('11 WETH →', ethers.formatEther(amountOut), 'USDC');
    }
    
    console.log('\n✅ Ganache DEX流动性修复完成！');
    
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