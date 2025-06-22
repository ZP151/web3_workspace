const { ethers } = require("hardhat");
const { parseEther, formatEther } = require("ethers/lib/utils");

async function main() {
  console.log("🎯 用户到用户转账功能测试...\n");
  
  try {
    const [deployer, alice, bob, charlie, david] = await ethers.getSigners();
    
    console.log("👥 参与用户:");
    console.log(`  Alice: ${alice.address}`);
    console.log(`  Bob: ${bob.address}`);  
    console.log(`  Charlie: ${charlie.address}`);
    console.log(`  David: ${david.address}\n`);

    // 加载银行合约
    let addresses;
    try {
      addresses = require("../../src/contracts/addresses.json");
    } catch (error) {
      console.error("❌ Contract addresses not found. Please deploy contracts first.");
      return;
    }

    const networkId = (await ethers.provider.getNetwork()).chainId;
    const bankAddress = addresses[networkId]?.EnhancedBank;
    
    if (!bankAddress) {
      console.error(`❌ EnhancedBank contract not deployed on network ${networkId}`);
      return;
    }

    console.log(`🏦 EnhancedBank Address: ${bankAddress}\n`);

    const EnhancedBank = await ethers.getContractFactory("EnhancedBank");
    const bank = EnhancedBank.attach(bankAddress);

    // 显示初始余额
    console.log("💰 初始钱包余额:");
    const balances = {};
    for (const [name, signer] of [['Alice', alice], ['Bob', bob], ['Charlie', charlie], ['David', david]]) {
      const balance = await ethers.provider.getBalance(signer.address);
      balances[name] = balance;
      console.log(`  ${name}: ${formatEther(balance)} ETH`);
    }
    console.log();

    // 测试1: 直接钱包转账（现有功能）
    console.log("🔄 测试1: 直接钱包转账 (无合约记录)");
    console.log("  Alice直接转账给Bob...");
    
    const directTransfer = await alice.sendTransaction({
      to: bob.address,
      value: parseEther("0.1")
    });
    await directTransfer.wait();
    
    console.log(`  ✅ 直接转账成功: 0.1 ETH`);
    console.log(`  📋 交易哈希: ${directTransfer.hash}`);
    console.log(`  ⚠️  这种转账没有合约记录\n`);

    // 测试2: 用户到用户合约转账（新功能）
    console.log("🔄 测试2: 用户到用户合约转账 (有合约记录)");
    console.log("  Alice通过合约转账给Charlie...");
    
    const contractTransfer = await bank.connect(alice).userToUserTransfer(
      charlie.address,
      { value: parseEther("0.2") }
    );
    await contractTransfer.wait();
    
    console.log(`  ✅ 合约转账成功: 0.2 ETH`);
    console.log(`  📋 交易哈希: ${contractTransfer.hash}`);
    console.log(`  ✅ 有合约事件记录可追踪\n`);

    // 测试3: 批量用户转账（新功能）
    console.log("🔄 测试3: 批量用户转账 (有合约记录)");
    console.log("  Alice批量转账给Bob和David...");
    
    const recipients = [bob.address, david.address];
    const amounts = [parseEther("0.15"), parseEther("0.25")];
    const totalValue = parseEther("0.4");
    
    const batchTransfer = await bank.connect(alice).batchUserTransfer(
      recipients,
      amounts,
      { value: totalValue }
    );
    await batchTransfer.wait();
    
    console.log(`  ✅ 批量转账成功: 总计 0.4 ETH`);
    console.log(`  📋 交易哈希: ${batchTransfer.hash}`);
    console.log(`  📊 分配: Bob 0.15 ETH, David 0.25 ETH\n`);

    // 测试4: 检查事件记录
    console.log("📋 测试4: 检查合约事件记录");
    
    // 获取UserToUserTransfer事件
    const filter = bank.filters.UserToUserTransfer();
    const events = await bank.queryFilter(filter);
    
    console.log(`  📝 找到 ${events.length} 个用户转账事件:`);
    events.forEach((event, index) => {
      const { from, to, amount } = event.args;
      console.log(`    ${index + 1}. ${from.slice(0, 8)}...${from.slice(-4)} → ${to.slice(0, 8)}...${to.slice(-4)}: ${formatEther(amount)} ETH`);
    });
    console.log();

    // 最终余额统计
    console.log("📊 最终余额统计:");
    for (const [name, signer] of [['Alice', alice], ['Bob', bob], ['Charlie', charlie], ['David', david]]) {
      const currentBalance = await ethers.provider.getBalance(signer.address);
      const change = currentBalance.sub(balances[name]);
      const changeStr = change.gte(0) ? `+${formatEther(change)}` : formatEther(change);
      console.log(`  ${name}: ${formatEther(currentBalance)} ETH (${changeStr})`);
    }

    console.log("\n🎯 功能对比总结:");
    console.log("┌─────────────────┬──────────────┬──────────────┬──────────────┐");
    console.log("│ 转账方式        │ 使用余额     │ 合约记录     │ 追踪统计     │");
    console.log("├─────────────────┼──────────────┼──────────────┼──────────────┤");
    console.log("│ 直接钱包转账    │ 钱包余额     │ ❌           │ ❌           │");
    console.log("│ 合约用户转账    │ 钱包余额     │ ✅           │ ✅           │");
    console.log("│ 银行账户转账    │ 银行余额     │ ✅           │ ✅           │");
    console.log("└─────────────────┴──────────────┴──────────────┴──────────────┘");

    console.log("\n💡 新功能优势:");
    console.log("✅ 用户到用户转账: 使用钱包余额 + 合约记录");
    console.log("✅ 批量用户转账: 一次性转给多人 + 所有记录可追踪");
    console.log("✅ 事件记录: 所有转账都有链上事件，便于统计分析");
    console.log("✅ 灵活选择: 用户可根据需要选择不同转账方式");

  } catch (error) {
    console.error("❌ 测试失败:", error.message);
    if (error.reason) {
      console.error("   原因:", error.reason);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 脚本失败:", error);
    process.exit(1);
  }); 