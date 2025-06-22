const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 简单检查Ganache网络上的DEX状态...');
  
  try {
    // 连接到Ganache网络
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
    const privateKey = '0x09a7ec32e08d5fdc838ac88d987a330eddda23761dbd2d99c5ee5b7422b7386f';
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('👤 使用账户:', wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log('💰 ETH余额:', ethers.formatEther(balance));
    
    // 获取合约地址
    const contractAddresses = require('../src/contracts/addresses.json');
    const addresses = contractAddresses['1337'];
    
    console.log('\n📋 合约地址:');
    console.log('DEX:', addresses.DEXPlatform);
    console.log('WETH:', addresses.WETH);
    console.log('USDC:', addresses.USDC);
    console.log('DAI:', addresses.DAI);
    
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
    
    // 计算池子ID
    const wethUsdcPoolId = ethers.keccak256(
      ethers.solidityPacked(['address', 'address'], 
        addresses.WETH < addresses.USDC ? [addresses.WETH, addresses.USDC] : [addresses.USDC, addresses.WETH]
      )
    );
    
    console.log('\n🏊 WETH-USDC池子ID:', wethUsdcPoolId);
    
    // 检查DEX合约代码
    const dexCode = await provider.getCode(addresses.DEXPlatform);
    console.log('DEX合约代码长度:', dexCode.length);
    
    if (dexCode === '0x') {
      console.log('❌ DEX合约未部署或地址错误');
      return;
    }
    
    // 尝试调用简单的view函数
    console.log('\n🔧 测试DEX合约调用...');
    
    const dexPlatform = new ethers.Contract(addresses.DEXPlatform, [
      'function pools(bytes32) view returns (address, address, uint256, uint256, uint256, uint256, bool, uint256, uint256)',
      'function createPool(address, address) returns (bytes32)',
      'function getAmountOut(bytes32, address, uint256) view returns (uint256)',
      'function addLiquidity(bytes32, uint256, uint256, uint256, uint256) returns (uint256, uint256, uint256)'
    ], wallet);
    
    try {
      // 检查WETH-USDC池子是否存在
      const poolData = await dexPlatform.pools(wethUsdcPoolId);
      console.log('✅ 原始池子数据解析成功!');
      
      // 解构池子数据: [tokenA, tokenB, reserveA, reserveB, totalLiquidity, lastUpdate, active, totalFees, apy]
      const [tokenA, tokenB, reserveA, reserveB, totalLiquidity, lastUpdate, active, totalFees, apy] = poolData;
      
      if (active === true) {
        console.log('✅ WETH-USDC池子存在且激活');
        console.log('Token A:', tokenA);
        console.log('Token B:', tokenB);
        console.log('Reserve A:', ethers.formatEther(reserveA));
        console.log('Reserve B:', ethers.formatEther(reserveB));
        console.log('Total Liquidity:', ethers.formatEther(totalLiquidity));
        console.log('Last Update:', new Date(Number(lastUpdate) * 1000).toLocaleString());
        console.log('Total Fees:', ethers.formatEther(totalFees));
        console.log('APY:', Number(apy) / 100, '%');
        
        // 如果有流动性，测试价格计算
        if (reserveA > 0 && reserveB > 0) {
          console.log('\n💱 测试价格计算:');
          try {
            const testAmount = ethers.parseEther('1');
            const outputAmount = await dexPlatform.getAmountOut(wethUsdcPoolId, addresses.WETH, testAmount);
            console.log('1 WETH 可兑换:', ethers.formatEther(outputAmount), 'USDC');
            
            // 计算价格比率
            const wethReserve = ethers.formatEther(reserveA);
            const usdcReserve = ethers.formatEther(reserveB);
            const price = parseFloat(usdcReserve) / parseFloat(wethReserve);
            console.log('当前池子价格:', price.toFixed(2), 'USDC/WETH');
            
          } catch (priceError) {
            console.log('❌ 价格计算失败:', priceError.reason || priceError.message);
          }
        } else {
          console.log('⚠️  池子没有流动性，准备添加初始流动性...');
          
          // 尝试添加流动性
          console.log('\n🏊 添加初始流动性...');
          try {
            // 先检查授权
            const wethContract = new ethers.Contract(addresses.WETH, [
              'function allowance(address, address) view returns (uint256)',
              'function approve(address, uint256) returns (bool)'
            ], wallet);
            const usdcContract = new ethers.Contract(addresses.USDC, [
              'function allowance(address, address) view returns (uint256)', 
              'function approve(address, uint256) returns (bool)'
            ], wallet);
            
            const wethAllowance = await wethContract.allowance(wallet.address, addresses.DEXPlatform);
            const usdcAllowance = await usdcContract.allowance(wallet.address, addresses.DEXPlatform);
            
            console.log('WETH授权额度:', ethers.formatEther(wethAllowance));
            console.log('USDC授权额度:', ethers.formatEther(usdcAllowance));
            
            const liquidityWETH = ethers.parseEther('10'); // 10 WETH
            const liquidityUSDC = ethers.parseEther('30000'); // 30000 USDC (假设价格1 WETH = 3000 USDC)
            
            // 检查是否需要授权
            if (wethAllowance < liquidityWETH) {
              console.log('🔐 授权WETH...');
              const approveTx = await wethContract.approve(addresses.DEXPlatform, liquidityWETH);
              await approveTx.wait();
              console.log('✅ WETH授权完成');
            }
            
            if (usdcAllowance < liquidityUSDC) {
              console.log('🔐 授权USDC...');
              const approveTx = await usdcContract.approve(addresses.DEXPlatform, liquidityUSDC);
              await approveTx.wait();
              console.log('✅ USDC授权完成');
            }
            
            // 添加流动性
            console.log('💧 添加流动性: 10 WETH + 30000 USDC...');
            const addLiquidityTx = await dexPlatform.addLiquidity(
              wethUsdcPoolId,
              liquidityWETH,
              liquidityUSDC,
              ethers.parseEther('9'), // 最小WETH: 9
              ethers.parseEther('27000') // 最小USDC: 27000
            );
            const receipt = await addLiquidityTx.wait();
            console.log('✅ 流动性添加成功，交易哈希:', receipt.hash);
            
            // 重新检查池子状态
            const newPoolData = await dexPlatform.pools(wethUsdcPoolId);
            const [,, newReserveA, newReserveB, newTotalLiquidity] = newPoolData;
            console.log('新的Reserve A:', ethers.formatEther(newReserveA));
            console.log('新的Reserve B:', ethers.formatEther(newReserveB));
            console.log('新的Total Liquidity:', ethers.formatEther(newTotalLiquidity));
            
          } catch (liquidityError) {
            console.log('❌ 添加流动性失败:', liquidityError.reason || liquidityError.message);
          }
        }
      } else {
        console.log('❌ WETH-USDC池子不存在或未激活');
        
        // 尝试创建池子
        console.log('\n🔨 尝试创建WETH-USDC池子...');
        try {
          const tx = await dexPlatform.createPool(addresses.WETH, addresses.USDC);
          const receipt = await tx.wait();
          console.log('✅ 池子创建成功，交易哈希:', receipt.hash);
          
          // 重新检查池子
          const newPoolData = await dexPlatform.pools(wethUsdcPoolId);
          console.log('新池子激活状态:', newPoolData[6]);
          
        } catch (createError) {
          console.log('❌ 创建池子失败:', createError.reason || createError.message);
        }
      }
      
    } catch (poolError) {
      console.log('❌ 检查池子失败:', poolError.reason || poolError.message);
    }
    
    console.log('\n✅ 简单检查完成！');
    
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