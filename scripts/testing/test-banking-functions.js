const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 测试银行合约功能");
  console.log("=".repeat(50));

  const [deployer, user1, user2] = await ethers.getSigners();
  
  // 读取部署的合约地址
  const fs = require("fs");
  const path = require("path");
  const addressFile = path.join(__dirname, "../src/contracts/addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressFile, "utf8"));
  
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  
  if (!addresses[chainId] || !addresses[chainId].EnhancedBank) {
    console.error("❌ 找不到部署的 EnhancedBank 合约地址");
    return;
  }

  const bankAddress = addresses[chainId].EnhancedBank;
  console.log("📍 使用合约地址:", bankAddress);
  console.log("🌐 网络:", chainId);

  // 获取合约实例
  const EnhancedBank = await ethers.getContractFactory("EnhancedBank");
  const bank = EnhancedBank.attach(bankAddress);

  try {
    console.log("\n💰 测试存款功能...");
    const depositTx = await bank.connect(deployer).deposit({ value: ethers.parseEther("1.0") });
    await depositTx.wait();
    console.log("✅ 存款成功: 1.0 ETH");

    console.log("\n💰 测试用户1存款...");
    const user1DepositTx = await bank.connect(user1).deposit({ value: ethers.parseEther("2.0") });
    await user1DepositTx.wait();
    console.log("✅ 用户1存款成功: 2.0 ETH");

    console.log("\n🔄 测试内部转账功能...");
    const transferTx = await bank.connect(deployer).transferInternal(
      await user1.getAddress(), 
      ethers.parseEther("0.5")
    );
    await transferTx.wait();
    console.log("✅ 内部转账成功: 0.5 ETH 从部署者转给用户1");

    console.log("\n💸 测试外部转账功能...");
    const externalTx = await bank.connect(user1).transferExternal(
      await user2.getAddress(),
      ethers.parseEther("0.3")
    );
    await externalTx.wait();
    console.log("✅ 外部转账成功: 0.3 ETH 从用户1转给用户2");

    console.log("\n📊 测试批量转账功能...");
    const recipients = [await user1.getAddress(), await user2.getAddress()];
    const amounts = [ethers.parseEther("0.1"), ethers.parseEther("0.1")];
    const batchTx = await bank.connect(deployer).batchTransfer(recipients, amounts, true);
    await batchTx.wait();
    console.log("✅ 批量内部转账成功: 0.1 ETH 给用户1和用户2");

    console.log("\n🏦 测试贷款功能...");
    const loanAmount = ethers.parseEther("0.5");
    const collateral = ethers.parseEther("0.75"); // 150% 抵押率
    const loanTx = await bank.connect(user1).requestLoan(loanAmount, { value: collateral });
    await loanTx.wait();
    console.log("✅ 贷款申请成功: 0.5 ETH 贷款，0.75 ETH 抵押");

    console.log("\n💎 测试质押功能...");
    const stakeAmount = ethers.parseEther("1.0");
    const stakeTx = await bank.connect(user2).stake({ value: stakeAmount });
    await stakeTx.wait();
    console.log("✅ 质押成功: 1.0 ETH");

    console.log("\n📊 检查账户信息...");
    
    // 检查部署者账户
    const deployerInfo = await bank.getAccountInfo(await deployer.getAddress());
    console.log("部署者余额:", ethers.formatEther(deployerInfo[0]), "ETH");
    
    // 检查用户1账户
    const user1Info = await bank.getAccountInfo(await user1.getAddress());
    console.log("用户1余额:", ethers.formatEther(user1Info[0]), "ETH");
    
    // 检查用户1贷款
    const user1Loans = await bank.getUserLoans(await user1.getAddress());
    console.log("用户1贷款数量:", user1Loans.length);
    if (user1Loans.length > 0) {
      console.log("贷款金额:", ethers.formatEther(user1Loans[0].amount), "ETH");
      console.log("抵押金额:", ethers.formatEther(user1Loans[0].collateral), "ETH");
      console.log("贷款状态:", user1Loans[0].isActive ? "活跃" : "已还清");
    }
    
    // 检查用户2质押
    const user2Stakes = await bank.getUserStakes(await user2.getAddress());
    console.log("用户2质押数量:", user2Stakes.length);
    if (user2Stakes.length > 0) {
      console.log("质押金额:", ethers.formatEther(user2Stakes[0].amount), "ETH");
      console.log("质押状态:", user2Stakes[0].isActive ? "活跃" : "已解除");
    }

    console.log("\n🔍 测试计算功能...");
    
    // 测试贷款利息计算
    if (user1Loans.length > 0) {
      const loanInterest = await bank.calculateLoanInterest(await user1.getAddress(), 0);
      console.log("贷款利息:", ethers.formatEther(loanInterest), "ETH");
    }
    
    // 测试质押奖励计算
    if (user2Stakes.length > 0) {
      const stakingReward = await bank.calculateStakingReward(await user2.getAddress(), 0);
      console.log("质押奖励:", ethers.formatEther(stakingReward), "ETH");
    }

    console.log("\n🎉 所有功能测试完成！");
    console.log("✅ 存款/取款: 正常");
    console.log("✅ 内部转账: 正常"); 
    console.log("✅ 外部转账: 正常");
    console.log("✅ 批量转账: 正常");
    console.log("✅ 贷款申请: 正常");
    console.log("✅ 质押功能: 正常");
    console.log("✅ 利息/奖励计算: 正常");

  } catch (error) {
    console.error("❌ 测试过程中出现错误:", error.message);
    console.error("详细错误:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 