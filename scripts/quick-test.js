const hre = require("hardhat");
const { formatEther, parseEther } = require("viem");

async function main() {
  console.log("🧪 快速测试授权问题...");
  
  const [deployer] = await hre.ethers.getSigners();
  const chainId = hre.network.config.chainId;
  
  console.log(`网络: ${hre.network.name} (${chainId})`);
  console.log(`账户: ${deployer.address}`);
  
  // 读取合约地址
  const addresses = require('../src/contracts/addresses.json');
  const contractAddresses = addresses[chainId.toString()];
  
  if (!contractAddresses) {
    console.error(`❌ 未找到链 ${chainId} 的合约地址`);
    console.log("可用的链ID:", Object.keys(addresses));
    return;
  }
  
  console.log("📋 合约地址:");
  console.log(`WETH: ${contractAddresses.WETH}`);
  console.log(`USDC: ${contractAddresses.USDC}`);
  console.log(`DEXPlatform: ${contractAddresses.DEXPlatform}`);
  
  try {
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const weth = MockERC20.attach(contractAddresses.WETH);
    const usdc = MockERC20.attach(contractAddresses.USDC);
    
    // 检查代币基本信息
    console.log("\n💰 代币信息:");
    console.log(`WETH名称: ${await weth.name()}`);
    console.log(`WETH符号: ${await weth.symbol()}`);
    console.log(`USDC名称: ${await usdc.name()}`);
    console.log(`USDC符号: ${await usdc.symbol()}`);
    
    // 检查余额
    const wethBalance = await weth.balanceOf(deployer.address);
    const usdcBalance = await usdc.balanceOf(deployer.address);
    
    console.log("\n💳 账户余额:");
    console.log(`WETH: ${formatEther(wethBalance)}`);
    console.log(`USDC: ${hre.ethers.formatUnits(usdcBalance, 6)}`);
    
    // 检查当前授权
    const wethAllowance = await weth.allowance(deployer.address, contractAddresses.DEXPlatform);
    const usdcAllowance = await usdc.allowance(deployer.address, contractAddresses.DEXPlatform);
    
    console.log("\n🔒 当前授权:");
    console.log(`WETH授权: ${formatEther(wethAllowance)}`);
    console.log(`USDC授权: ${hre.ethers.formatUnits(usdcAllowance, 6)}`);
    
    // 模拟前端的授权检查逻辑
    const testAmount = "1.0";
    const requiredAmount = parseEther(testAmount);
    
    console.log("\n🧪 授权检查测试:");
    console.log(`测试金额: ${testAmount} WETH`);
    console.log(`需要授权数量: ${formatEther(requiredAmount)}`);
    console.log(`当前授权数量: ${formatEther(wethAllowance)}`);
    console.log(`是否需要授权: ${wethAllowance < requiredAmount}`);
    
    if (wethAllowance < requiredAmount) {
      console.log("\n🔑 执行授权测试...");
      const approveAmount = parseEther("1000");
      const approveTx = await weth.approve(contractAddresses.DEXPlatform, approveAmount);
      console.log(`授权交易: ${approveTx.hash}`);
      
      await approveTx.wait();
      
      const newAllowance = await weth.allowance(deployer.address, contractAddresses.DEXPlatform);
      console.log(`新授权数量: ${formatEther(newAllowance)}`);
      console.log(`授权是否成功: ${newAllowance >= requiredAmount}`);
    } else {
      console.log("✅ 当前授权充足，无需额外授权");
    }
    
    // 测试网络特性
    console.log("\n🌐 网络特性:");
    console.log(`区块高度: ${await deployer.provider.getBlockNumber()}`);
    console.log(`Gas价格: ${await deployer.provider.getFeeData()}`);
    
    // 对比Ganache和Hardhat
    if (hre.network.name === 'ganache') {
      console.log("\n📊 Ganache网络特点:");
      console.log("• 固定账户和私钥");
      console.log("• 快速区块确认");
      console.log("• 适合前端开发测试");
      console.log("• 可能有ERC20授权的缓存问题");
    } else if (hre.network.name === 'localhost') {
      console.log("\n📊 Hardhat本地网络特点:");
      console.log("• 完整的Hardhat集成");
      console.log("• 更好的调试支持");
      console.log("• 更准确的Gas估算");
      console.log("• 更好的错误信息");
      console.log("• 推荐用于开发和测试");
    }
    
    console.log("\n💡 建议:");
    if (wethAllowance < requiredAmount && hre.network.name === 'ganache') {
      console.log("1. Ganache可能存在状态同步问题");
      console.log("2. 尝试重启Ganache");
      console.log("3. 或者切换到Hardhat本地网络");
      console.log("4. 运行: npx hardhat node");
      console.log("5. 然后: npm run deploy:hardhat");
    }
    
  } catch (error) {
    console.error(`❌ 测试失败: ${error.message}`);
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 