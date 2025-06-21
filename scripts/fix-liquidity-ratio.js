const { ethers } = require('hardhat');

async function main() {
  console.log('🔧 按当前比例修复WETH-USDC流动性...');
  
  try {
    // 连接到Ganache网络
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
    const privateKey = '0x09a7ec32e08d5fdc838ac88d987a330eddda23761dbd2d99c5ee5b7422b7386f';
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('👤 使用账户:', wallet.address);
    
    // 获取合约地址
    const contractAddresses = require('../src/contracts/addresses.json');
    const addresses = contractAddresses['1337'];
    
    // 当前池子储备（从之前解析得到）
    const currentWETHReserve = 5.0;
    const currentUSDCReserve = 0.00000001;
    const currentRatio = currentUSDCReserve / currentWETHReserve;
    
    console.log('\n📊 当前池子状态:');
    console.log('WETH储备:', currentWETHReserve);
    console.log('USDC储备:', currentUSDCReserve);
    console.log('当前比例 (USDC/WETH):', currentRatio);
    console.log('问题：USDC储备过少，导致价格异常');
    
    // 策略：大量增加USDC，按比例添加少量WETH
    console.log('\n💡 修复策略:');
    console.log('1. 按当前异常比例添加大量流动性');
    console.log('2. 然后创建新的WETH-DAI池子作为替代');
    
    // 计算按比例添加的流动性
    const additionalWETH = 100; // 添加100 WETH
    const additionalUSDC = additionalWETH * currentRatio; // 按比例计算USDC
    
    console.log('\n💧 按比例添加流动性:');
    console.log('WETH:', additionalWETH);
    console.log('USDC:', additionalUSDC);
    console.log('预期增加后的USDC储备:', currentUSDCReserve + additionalUSDC);
    
    const wethAmount = ethers.parseEther(additionalWETH.toString());
    const usdcAmount = ethers.parseEther(additionalUSDC.toString());
    
    // 获取合约实例
    const DEXPlatform = await ethers.getContractFactory('DEXPlatform');
    const dexPlatform = DEXPlatform.attach(addresses.DEXPlatform).connect(wallet);
    
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
    
    // 如果USDC不够，铸造更多
    const usdcNeeded = ethers.parseEther('1'); // 至少需要1 USDC做测试
    if (usdcBalance < usdcNeeded) {
      console.log('\n🪙 铸造更多USDC...');
      const mintAmount = ethers.parseEther('1000'); // 铸造1000 USDC
      const mintTx = await usdcContract.mint(wallet.address, mintAmount);
      await mintTx.wait();
      console.log('✅ 铸造成功:', ethers.formatEther(mintAmount), 'USDC');
    }
    
    // 计算池子ID
    const wethUsdcPoolId = ethers.keccak256(
      ethers.solidityPacked(['address', 'address'], 
        addresses.WETH < addresses.USDC ? [addresses.WETH, addresses.USDC] : [addresses.USDC, addresses.WETH]
      )
    );
    
    // 检查授权
    const wethAllowance = await wethContract.allowance(wallet.address, addresses.DEXPlatform);
    const usdcAllowance = await usdcContract.allowance(wallet.address, addresses.DEXPlatform);
    
    console.log('\n🔐 检查授权:');
    console.log('WETH授权:', ethers.formatEther(wethAllowance));
    console.log('USDC授权:', ethers.formatEther(usdcAllowance));
    
    // 设置充足授权
    const bigAllowance = ethers.parseEther('1000000');
    if (wethAllowance < wethAmount) {
      console.log('🔓 授权WETH...');
      const approveTx = await wethContract.approve(addresses.DEXPlatform, bigAllowance);
      await approveTx.wait();
      console.log('✅ WETH授权完成');
    }
    
    if (usdcAllowance < usdcNeeded) {
      console.log('🔓 授权USDC...');
      const approveTx = await usdcContract.approve(addresses.DEXPlatform, bigAllowance);
      await approveTx.wait();
      console.log('✅ USDC授权完成');
    }
    
    // 方案A：尝试按异常比例添加流动性
    console.log('\n🏊 方案A: 按当前异常比例添加流动性...');
    try {
      // 使用极小的USDC数量，匹配当前比例
      const smallWETH = ethers.parseEther('10'); // 10 WETH
      const smallUSDC = ethers.parseEther('0.00000002'); // 0.00000002 USDC
      
      console.log('尝试添加:', ethers.formatEther(smallWETH), 'WETH +', ethers.formatEther(smallUSDC), 'USDC');
      
      const addLiquidityTx = await dexPlatform.addLiquidity(
        wethUsdcPoolId,
        smallWETH,
        smallUSDC,
        ethers.parseEther('5'), // 最小WETH: 5
        0, // 最小USDC: 0 (因为数量太小)
        { gasLimit: 500000 }
      );
      
      const receipt = await addLiquidityTx.wait();
      console.log('✅ 方案A成功！流动性添加完成');
      console.log('交易哈希:', receipt.hash);
      
    } catch (liquidityError) {
      console.log('❌ 方案A失败:', liquidityError.reason || liquidityError.message);
      
      // 方案B：创建新的WETH-DAI池子
      console.log('\n🏊 方案B: 创建WETH-DAI池子作为替代...');
      try {
        console.log('检查WETH-DAI池子是否存在...');
        
        const wethDaiPoolId = ethers.keccak256(
          ethers.solidityPacked(['address', 'address'], 
            addresses.WETH < addresses.DAI ? [addresses.WETH, addresses.DAI] : [addresses.DAI, addresses.WETH]
          )
        );
        
        console.log('WETH-DAI池子ID:', wethDaiPoolId);
        
        // 尝试创建池子
        try {
          const createPoolTx = await dexPlatform.createPool(addresses.WETH, addresses.DAI);
          await createPoolTx.wait();
          console.log('✅ WETH-DAI池子创建成功');
        } catch (createError) {
          console.log('池子可能已存在:', createError.reason || createError.message);
        }
        
        // 添加WETH-DAI流动性
        const daiContract = new ethers.Contract(addresses.DAI, [
          'function balanceOf(address) view returns (uint256)',
          'function allowance(address, address) view returns (uint256)',
          'function approve(address, uint256) returns (bool)'
        ], wallet);
        
        const daiBalance = await daiContract.balanceOf(wallet.address);
        console.log('DAI余额:', ethers.formatEther(daiBalance));
        
        // 授权DAI
        const daiAllowance = await daiContract.allowance(wallet.address, addresses.DEXPlatform);
        if (daiAllowance < ethers.parseEther('10000')) {
          console.log('🔓 授权DAI...');
          const approveTx = await daiContract.approve(addresses.DEXPlatform, bigAllowance);
          await approveTx.wait();
          console.log('✅ DAI授权完成');
        }
        
        // 添加WETH-DAI流动性 (1 WETH = 3000 DAI)
        const wethForDai = ethers.parseEther('10'); // 10 WETH
        const daiForWeth = ethers.parseEther('30000'); // 30,000 DAI
        
        console.log('添加WETH-DAI流动性:', ethers.formatEther(wethForDai), 'WETH +', ethers.formatEther(daiForWeth), 'DAI');
        
        const addDaiLiquidityTx = await dexPlatform.addLiquidity(
          wethDaiPoolId,
          wethForDai,
          daiForWeth,
          ethers.parseEther('8'), // 最小WETH: 8
          ethers.parseEther('24000'), // 最小DAI: 24000
          { gasLimit: 500000 }
        );
        
        const daiReceipt = await addDaiLiquidityTx.wait();
        console.log('✅ WETH-DAI流动性添加成功！');
        console.log('交易哈希:', daiReceipt.hash);
        
        // 测试WETH-DAI价格
        console.log('\n💱 测试WETH-DAI交换价格:');
        const testAmount = ethers.parseEther('1');
        const daiOutput = await dexPlatform.getAmountOut(wethDaiPoolId, addresses.WETH, testAmount);
        const daiOutputFormatted = ethers.formatEther(daiOutput);
        console.log(`1 WETH → ${daiOutputFormatted} DAI`);
        console.log('WETH-DAI价格:', parseFloat(daiOutputFormatted), 'DAI/WETH');
        
        if (parseFloat(daiOutputFormatted) > 1000) {
          console.log('🎉 WETH-DAI池子价格正常！可以用作替代！');
        }
        
      } catch (daiError) {
        console.log('❌ 方案B也失败:', daiError.reason || daiError.message);
      }
    }
    
    console.log('\n✅ 流动性修复尝试完成！');
    console.log('\n💡 建议:');
    console.log('1. 如果WETH-USDC池子价格仍然异常，建议使用WETH-DAI池子进行交换测试');
    console.log('2. 前端可以优先显示流动性充足的池子');
    console.log('3. 可以考虑重置Ganache网络，重新部署合约');
    
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