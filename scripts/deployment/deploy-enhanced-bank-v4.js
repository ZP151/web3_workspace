const hre = require("hardhat");

async function main() {
  console.log("🚀 开始部署 Enhanced Bank v4 (修复全额还款问题)...");

  // 获取合约工厂
  const EnhancedBank = await hre.ethers.getContractFactory("EnhancedBank");
  
  // 部署合约
  console.log("📦 部署 EnhancedBank 合约...");
  const enhancedBank = await EnhancedBank.deploy();
  await enhancedBank.waitForDeployment();
  
  const enhancedBankAddress = await enhancedBank.getAddress();
  console.log("✅ EnhancedBank v4 部署成功:", enhancedBankAddress);

  // 等待几个块确认
  console.log("⏳ 等待区块确认...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 验证部署
  try {
    const balance = await enhancedBank.getContractBalance();
    console.log("📊 合约初始余额:", hre.ethers.formatEther(balance), "ETH");
    
    const minimumDeposit = await enhancedBank.minimumDeposit();
    console.log("💰 最小存款金额:", hre.ethers.formatEther(minimumDeposit), "ETH");
    
    const minimumLoan = await enhancedBank.minimumLoan();
    console.log("🏦 最小贷款金额:", hre.ethers.formatEther(minimumLoan), "ETH");
    
    console.log("✅ 修复功能:");
    console.log("  - 部分还款支持");
    console.log("  - 修复全额还款问题（本金+利息都要还清）");
    console.log("  - 微量利息误差容忍（≤0.000001 ETH）");
    
  } catch (error) {
    console.error("❌ 验证合约时出错:", error);
  }

  // 更新合约地址文件
  const fs = require('fs');
  const path = require('path');
  
  const addressesPath = path.join(__dirname, '../../src/contracts/addresses.json');
  let addresses = {};
  
  if (fs.existsSync(addressesPath)) {
    addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  }
  
  const networkId = hre.network.config.chainId?.toString() || '1337';
  if (!addresses[networkId]) {
    addresses[networkId] = {};
  }
  
  addresses[networkId].EnhancedBank = enhancedBankAddress;
  
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log(`📄 地址已更新到: ${addressesPath}`);

  // 保存部署报告
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      EnhancedBank: {
        address: enhancedBankAddress,
        version: "v4 - Fixed Full Repayment Logic"
      }
    },
    fixes: [
      "修复全额还款逻辑：本金和利息都要还清才标记为已还清",
      "允许微量利息误差（≤0.000001 ETH）避免精度问题",
      "保持部分还款功能完整性"
    ]
  };

  const filePath = path.join(__dirname, 'deployment-report-v4.json');
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n📋 部署报告:");
  console.log("=".repeat(50));
  console.log(`网络: ${deploymentInfo.network}`);
  console.log(`时间: ${deploymentInfo.timestamp}`);
  console.log(`EnhancedBank v4: ${enhancedBankAddress}`);
  console.log("修复内容:");
  deploymentInfo.fixes.forEach((fix, index) => {
    console.log(`  ${index + 1}. ${fix}`);
  });
  console.log(`报告已保存到: ${filePath}`);
  console.log("=".repeat(50));
  
  return {
    enhancedBank: enhancedBankAddress
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  }); 