const hre = require("hardhat");
const { formatEther, parseEther } = require("viem");

async function main() {
  console.log("🔑 测试代币授权功能...");
  
  const [deployer, user1] = await hre.ethers.getSigners();
  const chainId = hre.network.config.chainId;
  
  console.log(`📋 网络: ${hre.network.name} (${chainId})`);
  console.log(`👤 部署者: ${deployer.address}`);
  console.log(`👤 用户1: ${user1.address}`);
  
  // 读取合约地址
  const addresses = require('../src/contracts/addresses.json');
  const contractAddresses = addresses[chainId.toString()];
  
  if (!contractAddresses) {
    console.error(`❌ 未找到链 ${chainId} 的合约地址`);
    return;
  }
  
  try {
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const DEXPlatform = await hre.ethers.getContractFactory("DEXPlatform");
    
    const weth = MockERC20.attach(contractAddresses.WETH);
    const usdc = MockERC20.attach(contractAddresses.USDC);
    const dexPlatform = DEXPlatform.attach(contractAddresses.DEXPlatform);
    
    console.log("\n💰 检查初始余额...");
    const wethBalance = await weth.balanceOf(deployer.address);
    const usdcBalance = await usdc.balanceOf(deployer.address);
    
    console.log(`WETH余额: ${formatEther(wethBalance)}`);
    console.log(`USDC余额: ${formatEther(usdcBalance)}`);
    
    console.log("\n🔍 检查初始授权状态...");
    const wethAllowance = await weth.allowance(deployer.address, contractAddresses.DEXPlatform);
    const usdcAllowance = await usdc.allowance(deployer.address, contractAddresses.DEXPlatform);
    
    console.log(`WETH授权: ${formatEther(wethAllowance)}`);
    console.log(`USDC授权: ${formatEther(usdcAllowance)}`);
    
    console.log("\n🔑 执行WETH授权...");
    const approveAmount = parseEther("1000"); // 授权1000 WETH
    
    const approveTx = await weth.approve(contractAddresses.DEXPlatform, approveAmount);
    console.log(`📤 授权交易哈希: ${approveTx.hash}`);
    
    const receipt = await approveTx.wait();
    console.log(`✅ 授权交易确认，Gas使用: ${receipt.gasUsed.toString()}`);
    
    console.log("\n🔍 检查授权后状态...");
    const newWethAllowance = await weth.allowance(deployer.address, contractAddresses.DEXPlatform);
    console.log(`WETH新授权: ${formatEther(newWethAllowance)}`);
    
    console.log("\n🔑 执行USDC授权...");
    const usdcApproveTx = await usdc.approve(contractAddresses.DEXPlatform, approveAmount);
    console.log(`📤 USDC授权交易哈希: ${usdcApproveTx.hash}`);
    
    const usdcReceipt = await usdcApproveTx.wait();
    console.log(`✅ USDC授权交易确认，Gas使用: ${usdcReceipt.gasUsed.toString()}`);
    
    const newUsdcAllowance = await usdc.allowance(deployer.address, contractAddresses.DEXPlatform);
    console.log(`USDC新授权: ${formatEther(newUsdcAllowance)}`);
    
    console.log("\n🔄 测试DEX交换...");
    
    // 获取所有池子
    const allPools = await dexPlatform.getAllPools();
    console.log(`找到 ${allPools.length} 个流动性池`);
    
    if (allPools.length > 0) {
      const poolId = allPools[0];
      console.log(`使用池子: ${poolId}`);
      
      // 尝试执行交换
      const swapAmount = parseEther("0.1"); // 交换0.1 WETH
      const minOutput = parseEther("180"); // 最少180 USDC
      
      console.log(`交换参数:`);
      console.log(`  池子ID: ${poolId}`);
      console.log(`  输入代币: ${contractAddresses.WETH}`);
      console.log(`  输入数量: ${formatEther(swapAmount)} WETH`);
      console.log(`  最小输出: ${formatEther(minOutput)} USDC`);
      
      try {
        const swapTx = await dexPlatform.executeSwap(
          poolId,
          contractAddresses.WETH,
          swapAmount,
          minOutput
        );
        
        console.log(`📤 交换交易哈希: ${swapTx.hash}`);
        const swapReceipt = await swapTx.wait();
        console.log(`✅ 交换成功，Gas使用: ${swapReceipt.gasUsed.toString()}`);
        
        // 检查余额变化
        const newWethBalance = await weth.balanceOf(deployer.address);
        const newUsdcBalance = await usdc.balanceOf(deployer.address);
        
        console.log(`\n💰 交换后余额:`);
        console.log(`WETH: ${formatEther(newWethBalance)} (变化: ${formatEther(newWethBalance - wethBalance)})`);
        console.log(`USDC: ${formatEther(newUsdcBalance)} (变化: ${formatEther(newUsdcBalance - usdcBalance)})`);
        
      } catch (error) {
        console.error(`❌ 交换失败: ${error.message}`);
        
        // 尝试诊断问题
        console.log("\n🔍 问题诊断:");
        const currentWethAllowance = await weth.allowance(deployer.address, contractAddresses.DEXPlatform);
        const currentWethBalance = await weth.balanceOf(deployer.address);
        
        console.log(`当前WETH授权: ${formatEther(currentWethAllowance)}`);
        console.log(`当前WETH余额: ${formatEther(currentWethBalance)}`);
        console.log(`所需WETH数量: ${formatEther(swapAmount)}`);
        
        if (currentWethAllowance < swapAmount) {
          console.log("❌ 授权不足");
        }
        if (currentWethBalance < swapAmount) {
          console.log("❌ 余额不足");
        }
      }
    }
    
    console.log("\n🎯 测试结论:");
    console.log("✅ 代币合约正常工作");
    console.log("✅ 授权功能正常");
    
    if (allPools.length > 0) {
      console.log("✅ DEX平台已部署并有流动性池");
    } else {
      console.log("⚠️ DEX平台没有流动性池");
    }
    
    console.log("\n📋 网络信息:");
    console.log(`网络名称: ${hre.network.name}`);
    console.log(`链ID: ${chainId}`);
    console.log(`RPC URL: ${hre.network.config.url || '默认'}`);
    
    if (hre.network.name === 'ganache') {
      console.log("\n💡 Ganache网络使用建议:");
      console.log("1. 确保Ganache运行在 http://127.0.0.1:7545");
      console.log("2. 网络ID设置为 5777");
      console.log("3. 在MetaMask中添加Ganache网络");
      console.log("4. 导入Ganache账户到MetaMask");
    }
    
    if (hre.network.name === 'localhost') {
      console.log("\n💡 Hardhat本地网络使用建议:");
      console.log("1. 运行 'npx hardhat node' 启动本地节点");
      console.log("2. 网络运行在 http://127.0.0.1:8545");
      console.log("3. 链ID通常是 31337");
      console.log("4. 支持更好的调试和日志功能");
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