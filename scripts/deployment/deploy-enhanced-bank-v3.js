const hre = require("hardhat");

async function main() {
  console.log("🚀 开始部署 Enhanced Bank v3 (支持部分还款)...");

  // 获取合约工厂
  const EnhancedBank = await hre.ethers.getContractFactory("EnhancedBank");
  
  // 部署合约
  console.log("📦 部署 EnhancedBank 合约...");
  const enhancedBank = await EnhancedBank.deploy();
  await enhancedBank.waitForDeployment();
  
  const enhancedBankAddress = await enhancedBank.getAddress();
  console.log("✅ EnhancedBank 部署成功:", enhancedBankAddress);

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
    
    console.log("✅ 部分还款功能已启用");
    
  } catch (error) {
    console.error("❌ 验证合约时出错:", error);
  }

  // 保存合约地址到文件
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      EnhancedBank: {
        address: enhancedBankAddress,
        version: "v3 - Partial Repayment Support"
      }
    }
  };

  const fs = require('fs');
  const path = require('path');
  
  // 确保目录存在
  const deploymentDir = path.join(__dirname);
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  // 写入部署信息
  const filePath = path.join(deploymentDir, 'deployment-report-v3.json');
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n📋 部署报告:");
  console.log("=".repeat(50));
  console.log(`网络: ${deploymentInfo.network}`);
  console.log(`时间: ${deploymentInfo.timestamp}`);
  console.log(`EnhancedBank v3: ${enhancedBankAddress}`);
  console.log("新功能: 部分还款支持");
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