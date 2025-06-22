const { ethers } = require("hardhat");
const { parseEther, formatEther } = require("ethers/lib/utils");

async function main() {
  console.log("🧪 Testing Transfer Functions...\n");
  
  try {
    // Get network and signers
    const [deployer, user1, user2, user3] = await ethers.getSigners();
    console.log("📋 Test Setup:");
    console.log(`  Deployer: ${deployer.address}`);
    console.log(`  User1: ${user1.address}`);
    console.log(`  User2: ${user2.address}`);
    console.log(`  User3: ${user3.address}\n`);

    // Load deployed contract
    const networkName = (await ethers.provider.getNetwork()).name;
    console.log(`🌐 Network: ${networkName}`);
    
    // Try to load contract addresses
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

    // Connect to deployed contract
    const EnhancedBank = await ethers.getContractFactory("EnhancedBank");
    const bank = EnhancedBank.attach(bankAddress);

    // Initial balances
    console.log("💰 Initial Balances:");
    const user1Balance = await ethers.provider.getBalance(user1.address);
    const user2Balance = await ethers.provider.getBalance(user2.address);
    const user3Balance = await ethers.provider.getBalance(user3.address);
    
    console.log(`  User1 ETH: ${formatEther(user1Balance)}`);
    console.log(`  User2 ETH: ${formatEther(user2Balance)}`);
    console.log(`  User3 ETH: ${formatEther(user3Balance)}\n`);

    // Test 1: Wallet-to-Wallet Transfer (Direct ETH transfer)
    console.log("🔄 Test 1: Direct Wallet Transfer");
    console.log("  Simulating frontend wallet transfer functionality...");
    
    const transferAmount = parseEther("0.1");
    
    // Direct transfer from user1 to user2 (simulating frontend wallet transfer)
    const tx1 = await user1.sendTransaction({
      to: user2.address,
      value: transferAmount
    });
    await tx1.wait();
    
    console.log(`  ✅ Transferred ${formatEther(transferAmount)} ETH from User1 to User2`);
    console.log(`  📋 Transaction Hash: ${tx1.hash}\n`);

    // Test 2: Bank Account Setup for Bank Transfers
    console.log("🏦 Test 2: Setting up Bank Accounts");
    
    // User1 deposits to bank
    const depositAmount = parseEther("1.0");
    const tx2 = await bank.connect(user1).deposit({ value: depositAmount });
    await tx2.wait();
    console.log(`  ✅ User1 deposited ${formatEther(depositAmount)} ETH to bank`);
    
    // User2 also deposits to bank for internal transfers
    const tx3 = await bank.connect(user2).deposit({ value: depositAmount });
    await tx3.wait();
    console.log(`  ✅ User2 deposited ${formatEther(depositAmount)} ETH to bank\n`);

    // Check bank balances
    const user1AccountInfo = await bank.getAccountInfo(user1.address);
    const user2AccountInfo = await bank.getAccountInfo(user2.address);
    
    console.log("🏦 Bank Account Balances:");
    console.log(`  User1 Bank Balance: ${formatEther(user1AccountInfo[0])}`);
    console.log(`  User2 Bank Balance: ${formatEther(user2AccountInfo[0])}\n`);

    // Test 3: Internal Bank Transfer (between bank accounts)
    console.log("🔄 Test 3: Internal Bank Transfer");
    console.log("  Transferring between bank accounts...");
    
    const internalTransferAmount = parseEther("0.2");
    const tx4 = await bank.connect(user1).transferInternal(user2.address, internalTransferAmount);
    await tx4.wait();
    
    console.log(`  ✅ Internal transfer: ${formatEther(internalTransferAmount)} ETH from User1 to User2 bank account`);
    console.log(`  📋 Transaction Hash: ${tx4.hash}\n`);

    // Test 4: External Bank Transfer (from bank to any address)
    console.log("🔄 Test 4: External Bank Transfer");
    console.log("  Transferring from bank account to external address...");
    
    const externalTransferAmount = parseEther("0.15");
    const tx5 = await bank.connect(user1).transferExternal(user3.address, externalTransferAmount);
    await tx5.wait();
    
    console.log(`  ✅ External transfer: ${formatEther(externalTransferAmount)} ETH from User1 bank to User3 wallet`);
    console.log(`  📋 Transaction Hash: ${tx5.hash}\n`);

    // Test 5: Batch Transfer (from bank)
    console.log("🔄 Test 5: Batch Bank Transfer");
    console.log("  Batch transferring from bank account to multiple addresses...");
    
    const recipients = [user2.address, user3.address];
    const amounts = [parseEther("0.1"), parseEther("0.05")];
    
    const tx6 = await bank.connect(user1).batchTransfer(recipients, amounts, false); // false = external
    await tx6.wait();
    
    console.log(`  ✅ Batch transfer: sent ${formatEther(amounts[0])} ETH to User2 and ${formatEther(amounts[1])} ETH to User3`);
    console.log(`  📋 Transaction Hash: ${tx6.hash}\n`);

    // Final balance check
    console.log("📊 Final Balance Summary:");
    
    // ETH balances
    const finalUser1Balance = await ethers.provider.getBalance(user1.address);
    const finalUser2Balance = await ethers.provider.getBalance(user2.address);
    const finalUser3Balance = await ethers.provider.getBalance(user3.address);
    
    console.log("💰 Wallet Balances:");
    console.log(`  User1: ${formatEther(finalUser1Balance)} ETH`);
    console.log(`  User2: ${formatEther(finalUser2Balance)} ETH`);
    console.log(`  User3: ${formatEther(finalUser3Balance)} ETH`);
    
    // Bank balances
    const finalUser1BankInfo = await bank.getAccountInfo(user1.address);
    const finalUser2BankInfo = await bank.getAccountInfo(user2.address);
    const finalUser3BankInfo = await bank.getAccountInfo(user3.address);
    
    console.log("\n🏦 Bank Balances:");
    console.log(`  User1: ${formatEther(finalUser1BankInfo[0])} ETH`);
    console.log(`  User2: ${formatEther(finalUser2BankInfo[0])} ETH`);
    console.log(`  User3: ${formatEther(finalUser3BankInfo[0])} ETH`);

    // Balance changes
    console.log("\n📈 Balance Changes:");
    console.log(`  User1 ETH change: ${formatEther(finalUser1Balance.sub(user1Balance))} ETH`);
    console.log(`  User2 ETH change: ${formatEther(finalUser2Balance.sub(user2Balance))} ETH`);
    console.log(`  User3 ETH change: ${formatEther(finalUser3Balance.sub(user3Balance))} ETH`);

    console.log("\n✅ All transfer function tests completed successfully!");
    console.log("\n📋 Transfer Function Summary:");
    console.log("  1. ✅ Direct Wallet Transfer - Works via frontend wallet functionality");
    console.log("  2. ✅ Internal Bank Transfer - Bank account to bank account");
    console.log("  3. ✅ External Bank Transfer - Bank account to any wallet address");
    console.log("  4. ✅ Batch Bank Transfer - Multiple recipients from bank account");
    console.log("\n🎯 New Design Benefits:");
    console.log("  • Users can choose between wallet and bank transfers");
    console.log("  • Wallet transfers are more intuitive for typical usage");
    console.log("  • Bank transfers maintain interest-earning potential");
    console.log("  • Batch transfers support both wallet and bank sources");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.reason) {
      console.error("   Reason:", error.reason);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 