const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("在Ganache网络上部署合约，使用账户:", await deployer.getAddress());
  console.log("账户余额:", ethers.formatEther(await ethers.provider.getBalance(await deployer.getAddress())));

  // 获取网络信息
  const network = await ethers.provider.getNetwork();
  console.log("网络ID:", network.chainId.toString());
  console.log("网络名称:", network.name);

  // 合约地址存储
  const deployedContracts = {};

  try {
    // 1. 部署 VotingCore 合约
    console.log("\n=== 部署 VotingCore 合约 ===");
    const VotingCore = await ethers.getContractFactory("VotingCore");
    const votingCore = await VotingCore.deploy();
    await votingCore.waitForDeployment();
    const votingCoreAddress = await votingCore.getAddress();
    deployedContracts.VotingCore = votingCoreAddress;
    console.log("VotingCore 合约地址:", votingCoreAddress);

    // 2. 部署 EnhancedBank 合约
    console.log("\n=== 部署 EnhancedBank 合约 ===");
    const EnhancedBank = await ethers.getContractFactory("EnhancedBank");
    const enhancedBank = await EnhancedBank.deploy();
    await enhancedBank.waitForDeployment();
    const enhancedBankAddress = await enhancedBank.getAddress();
    deployedContracts.EnhancedBank = enhancedBankAddress;
    console.log("EnhancedBank 合约地址:", enhancedBankAddress);

    // 3. 部署 TokenFactory 合约
    console.log("\n=== 部署 TokenFactory 合约 ===");
    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    const tokenFactory = await TokenFactory.deploy(await deployer.getAddress()); // 使用部署者作为费用接收地址
    await tokenFactory.waitForDeployment();
    const tokenFactoryAddress = await tokenFactory.getAddress();
    deployedContracts.TokenFactory = tokenFactoryAddress;
    console.log("TokenFactory 合约地址:", tokenFactoryAddress);

    // 验证部署
    console.log("\n=== 验证部署 ===");
    
    // 验证VotingCore
    try {
      const proposalCount = await votingCore.getProposalCount();
      console.log("✅ VotingCore 验证成功，当前提案数量:", proposalCount.toString());
    } catch (error) {
      console.log("❌ VotingCore 验证失败:", error.message);
    }

    // 验证EnhancedBank
    try {
      const minDeposit = await enhancedBank.minimumDeposit();
      const interestRate = await enhancedBank.interestRate();
      console.log("✅ EnhancedBank 验证成功，最小存款:", ethers.formatEther(minDeposit), "ETH");
      console.log("✅ EnhancedBank 年利率:", interestRate.toString(), "%");
    } catch (error) {
      console.log("❌ EnhancedBank 验证失败:", error.message);
    }

    // 验证TokenFactory
    try {
      const creationFee = await tokenFactory.creationFee();
      const tokenCount = await tokenFactory.getTokenCount();
      console.log("✅ TokenFactory 验证成功，创建费用:", ethers.formatEther(creationFee), "ETH");
      console.log("✅ TokenFactory 当前代币数量:", tokenCount.toString());
    } catch (error) {
      console.log("❌ TokenFactory 验证失败:", error.message);
    }

    // 输出部署摘要
    console.log("\n=== 部署摘要 ===");
    console.log("网络:", network.chainId.toString() === "1337" ? "Ganache" : `Chain ID ${network.chainId}`);
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name}: ${address}`);
    });

    // 输出前端配置代码
    console.log("\n=== 前端配置更新 ===");
    console.log("请在 src/config/contracts.ts 中更新以下地址:");
    console.log("1337: {");
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`  ${name}: '${address}',`);
    });
    console.log("},");

    // 测试合约交互
    console.log("\n=== 测试合约交互 ===");
    
    // 测试银行存款
    try {
      console.log("测试银行存款 0.01 ETH...");
      const depositTx = await enhancedBank.deposit({ value: ethers.parseEther("0.01") });
      await depositTx.wait();
      const balance = await enhancedBank.getAccountInfo(await deployer.getAddress());
      console.log("✅ 存款成功，余额:", ethers.formatEther(balance[0]), "ETH");
      console.log("✅ 最后交易时间:", new Date(Number(balance[1]) * 1000).toLocaleString());
    } catch (error) {
      console.log("❌ 存款测试失败:", error.message);
    }

    // 测试投票提案创建
    try {
      console.log("测试创建投票提案...");
      const createProposalTx = await votingCore.createProposal("测试提案", 24, 1);
      await createProposalTx.wait();
      const proposalCount = await votingCore.getProposalCount();
      console.log("✅ 提案创建成功，当前提案数量:", proposalCount.toString());
    } catch (error) {
      console.log("❌ 提案创建测试失败:", error.message);
    }

    console.log("\n🎉 所有合约部署完成！可以开始使用Ganache网络了。");

  } catch (error) {
    console.error("❌ 部署过程中出现错误:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 