const { ethers } = require('hardhat');

async function main() {
  console.log('🔍 手动解析池子原始数据...');
  
  // 原始数据
  const rawData = "0x00000000000000000000000007203c354938e1316f0b99c0810771d4f64f53e1000000000000000000000000e799bb3a9a4a3246918c9bb6c611823b5d51dbed0000000000000000000000000000000000000000000000004563918244f4000000000000000000000000000000000000000000000000000000000002540be4000000000000000000000000000000000000000000000000000cb5e83bfceda000000000000000000000000000000000000000000000000000000000068515c4e0000000000000000000000000000000000000000000000000000000000000001";
  
  console.log('原始数据长度:', rawData.length);
  console.log('预期32字节段数:', (rawData.length - 2) / 64); // 减去0x前缀，每段64字符
  
  // 移除0x前缀
  const data = rawData.slice(2);
  
  // 每32字节分割
  const segments = [];
  for (let i = 0; i < data.length; i += 64) {
    segments.push('0x' + data.slice(i, i + 64));
  }
  
  console.log('分割的数据段:', segments.length);
  
  // 解析每个段
  segments.forEach((segment, index) => {
    console.log(`\n段 ${index}:`, segment);
    
    try {
      if (index < 2) {
        // 地址
        const address = ethers.getAddress('0x' + segment.slice(-40));
        console.log(`  -> 地址: ${address}`);
      } else if (index < 8) {
        // uint256
        const value = BigInt(segment);
        console.log(`  -> 数值: ${value.toString()}`);
        console.log(`  -> 格式化: ${ethers.formatEther(value.toString())}`);
      } else if (index === 6) {
        // boolean (可能在第7位)
        const boolValue = BigInt(segment) === 1n;
        console.log(`  -> 布尔值: ${boolValue}`);
      }
    } catch (error) {
      console.log(`  -> 解析错误: ${error.message}`);
    }
  });
  
  // 尝试按字段解析
  console.log('\n🔧 按结构体字段解析:');
  if (segments.length >= 9) {
    try {
      const tokenA = ethers.getAddress('0x' + segments[0].slice(-40));
      const tokenB = ethers.getAddress('0x' + segments[1].slice(-40));
      const reserveA = BigInt(segments[2]);
      const reserveB = BigInt(segments[3]);
      const totalLiquidity = BigInt(segments[4]);
      const lastUpdate = BigInt(segments[5]);
      const active = BigInt(segments[6]) === 1n;
      const totalFees = BigInt(segments[7]);
      const apy = BigInt(segments[8]);
      
      console.log('Token A:', tokenA);
      console.log('Token B:', tokenB);
      console.log('Reserve A:', ethers.formatEther(reserveA.toString()));
      console.log('Reserve B:', ethers.formatEther(reserveB.toString()));
      console.log('Total Liquidity:', ethers.formatEther(totalLiquidity.toString()));
      console.log('Last Update:', new Date(Number(lastUpdate) * 1000).toLocaleString());
      console.log('Active:', active);
      console.log('Total Fees:', ethers.formatEther(totalFees.toString()));
      console.log('APY:', Number(apy) / 100, '%');
      
      // 判断代币名称
      const contractAddresses = require('../src/contracts/addresses.json');
      const addresses = contractAddresses['1337'];
      
      let tokenAName = 'Unknown';
      let tokenBName = 'Unknown';
      
      if (tokenA === addresses.WETH) tokenAName = 'WETH';
      else if (tokenA === addresses.USDC) tokenAName = 'USDC';
      else if (tokenA === addresses.DAI) tokenAName = 'DAI';
      
      if (tokenB === addresses.WETH) tokenBName = 'WETH';
      else if (tokenB === addresses.USDC) tokenBName = 'USDC';
      else if (tokenB === addresses.DAI) tokenBName = 'DAI';
      
      console.log(`\n🏷️ 池子类型: ${tokenAName}-${tokenBName}`);
      
      if (reserveA > 0n && reserveB > 0n) {
        const wethReserve = Number(ethers.formatEther(reserveA.toString()));
        const usdcReserve = Number(ethers.formatEther(reserveB.toString()));
        const price = usdcReserve / wethReserve;
        console.log(`💱 当前价格: ${price.toFixed(2)} ${tokenBName}/${tokenAName}`);
        
        console.log('✅ 池子有流动性，可以进行交换！');
      } else {
        console.log('⚠️ 池子没有流动性');
      }
      
    } catch (parseError) {
      console.log('❌ 解析失败:', parseError.message);
    }
  }
  
  console.log('\n✅ 解析完成！');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 