const { ethers } = require("hardhat");
const { parseEther, formatEther } = require("ethers/lib/utils");

async function main() {
  console.log("🎯 真实转账场景测试...\n");
  
  try {
    const [deployer, alice, bob, charlie, david] = await ethers.getSigners();
    
    console.log("👥 参与用户:");
    console.log(`  Alice (主要用户): ${alice.address}`);
    console.log(`  Bob (朋友): ${bob.address}`);  
    console.log(`  Charlie (同事): ${charlie.address}`);
    console.log(`  David (商户): ${david.address}\n`);

    // 显示初始余额
    console.log("💰 初始钱包余额:");
    const balances = {};
    for (const [name, signer] of [['Alice', alice], ['Bob', bob], ['Charlie', charlie], ['David', david]]) {
      const balance = await ethers.provider.getBalance(signer.address);
      balances[name] = balance;
      console.log(`  ${name}: ${formatEther(balance)} ETH`);
    }
    console.log();

    // 场景1: Alice直接转账给Bob (最常用场景)
    console.log("🔄 场景1: 朋友之间转账");
    console.log("  Alice想转0.5 ETH给Bob还钱...");
    
    const friendTransfer = await alice.sendTransaction({
      to: bob.address,
      value: parseEther("0.5")
    });
    await friendTransfer.wait();
    
    console.log(`  ✅ 转账成功！Alice -> Bob: 0.5 ETH`);
    console.log(`  📋 交易哈希: ${friendTransfer.hash}\n`);

    // 场景2: Alice批量发红包
    console.log("🧧 场景2: 批量发红包");
    console.log("  Alice想给Bob和Charlie各发0.2 ETH红包...");
    
    // 模拟前端批量转账功能
    const redPackets = [
      { to: bob.address, amount: parseEther("0.2") },
      { to: charlie.address, amount: parseEther("0.2") }
    ];
    
    for (const packet of redPackets) {
      const tx = await alice.sendTransaction({
        to: packet.to,
        value: packet.amount
      });
      await tx.wait();
    }
    
    console.log(`  ✅ 红包发送成功！共发出 ${redPackets.length} 个红包`);
    console.log(`  💰 总金额: ${formatEther(parseEther("0.4"))} ETH\n`);

    // 场景3: Bob向商户付款
    console.log("🛒 场景3: 商户付款");
    console.log("  Bob在David的店里购物，需要支付0.3 ETH...");
    
    const payment = await bob.sendTransaction({
      to: david.address,
      value: parseEther("0.3")
    });
    await payment.wait();
    
    console.log(`  ✅ 付款成功！Bob -> David: 0.3 ETH`);
    console.log(`  📋 交易哈希: ${payment.hash}\n`);

    // 场景4: 使用银行系统 (可选功能)
    console.log("🏦 场景4: 银行系统使用");
    console.log("  Charlie想使用银行系统存钱赚利息...");
    
    // 加载银行合约
    let addresses;
    try {
      addresses = require("../../src/contracts/addresses.json");
    } catch (error) {
      console.log("  ⚠️ 银行合约未部署，跳过银行功能测试\n");
      console.log("📊 最终余额统计:");
      await showFinalBalances();
      return;
    }

    const networkId = (await ethers.provider.getNetwork()).chainId;
    const bankAddress = addresses[networkId]?.EnhancedBank;
    
    if (!bankAddress) {
      console.log("  ⚠️ 银行合约未部署，跳过银行功能测试\n");
      console.log("📊 最终余额统计:");
      await showFinalBalances();
      return;
    }

    const EnhancedBank = await ethers.getContractFactory("EnhancedBank");
    const bank = EnhancedBank.attach(bankAddress);

    // Charlie存款
    const depositTx = await bank.connect(charlie).deposit({ value: parseEther("1.0") });
    await depositTx.wait();
    console.log(`  ✅ Charlie存款: 1.0 ETH到银行`);

    // Charlie从银行转账给Alice
    const bankTransferTx = await bank.connect(charlie).transferExternal(alice.address, parseEther("0.1"));
    await bankTransferTx.wait();
    console.log(`  ✅ Charlie从银行转账: 0.1 ETH -> Alice`);
    console.log(`  💡 转账时自动计算了利息\n`);

    // 最终余额统计
    console.log("📊 最终余额统计:");
    await showFinalBalances();
    
    console.log("\n🎯 测试总结:");
    console.log("✅ 场景1: 朋友转账 - 直接钱包转账，最简单常用");
    console.log("✅ 场景2: 批量红包 - 多个钱包转账，适合群发");
    console.log("✅ 场景3: 商户付款 - 标准支付场景");
    console.log("✅ 场景4: 银行转账 - 可选的高级功能");
    
    console.log("\n💡 设计优势:");
    console.log("• 优先钱包转账：符合用户习惯，无需预存款");
    console.log("• 银行功能可选：需要时才使用，不强制");
    console.log("• 批量转账：提高效率，适合商业用途");
    console.log("• 地址快选：Ganache测试更方便");

    async function showFinalBalances() {
      for (const [name, signer] of [['Alice', alice], ['Bob', bob], ['Charlie', charlie], ['David', david]]) {
        const currentBalance = await ethers.provider.getBalance(signer.address);
        const change = currentBalance.sub(balances[name]);
        const changeStr = change.gte(0) ? `+${formatEther(change)}` : formatEther(change);
        console.log(`  ${name}: ${formatEther(currentBalance)} ETH (${changeStr})`);
      }
    }

  } catch (error) {
    console.error("❌ 测试失败:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 脚本失败:", error);
    process.exit(1);
  }); 