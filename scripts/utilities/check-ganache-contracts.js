const { ethers } = require("hardhat");

async function checkGanacheContracts() {
  console.log('🔍 检查Ganache网络上的合约状态...');
  
  try {
    // 修改网络配置指向Ganache
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
    
    // 检查网络信息
    const network = await provider.getNetwork();
    console.log(`📍 网络信息:`);
    console.log(`  Chain ID: ${network.chainId}`);
    console.log(`  Name: ${network.name}`);
    
    // 检查区块信息
    const blockNumber = await provider.getBlockNumber();
    console.log(`  当前区块: ${blockNumber}`);
    
    // 检查用户地址
    const userAddress = "0x8742Bf796efE417CF777d04866eD47654F913EB7";
    const balance = await provider.getBalance(userAddress);
    console.log(`👤 用户地址: ${userAddress}`);
    console.log(`💰 用户余额: ${ethers.formatEther(balance)} ETH`);
    
    // 检查原来的合约地址（v5之前）
    const oldContractAddress = "0xde901A1C8118f639415c305773ce78a56B1303B0";
    console.log(`\n🏦 检查原合约: ${oldContractAddress}`);
    
    const oldContractCode = await provider.getCode(oldContractAddress);
    console.log(`📄 原合约代码长度: ${oldContractCode.length}`);
    
    if (oldContractCode !== '0x') {
      console.log('✅ 原合约仍然存在，尝试连接...');
      try {
        const oldBank = new ethers.Contract(
          oldContractAddress,
          [
            "function getUserLoans(address) view returns (tuple(address borrower, uint256 amount, uint256 collateral, uint256 interestRate, uint256 startTime, bool isActive, uint256 paidAmount, uint256 paidInterest)[])",
            "function accounts(address) view returns (uint256 balance, uint256 depositTime, uint256 totalDeposited, uint256 totalWithdrawn, uint256 pendingInterest)"
          ],
          provider
        );
        
        // 检查用户账户
        const account = await oldBank.accounts(userAddress);
        console.log(`📊 用户银行账户:`);
        console.log(`  余额: ${ethers.formatEther(account.balance)} ETH`);
        console.log(`  总存款: ${ethers.formatEther(account.totalDeposited)} ETH`);
        
        // 检查用户贷款
        const loans = await oldBank.getUserLoans(userAddress);
        console.log(`📋 用户贷款数量: ${loans.length}`);
        
        for (let i = 0; i < loans.length; i++) {
          const loan = loans[i];
          console.log(`\n  贷款 #${i}:`);
          console.log(`    金额: ${ethers.formatEther(loan.amount)} ETH`);
          console.log(`    抵押品: ${ethers.formatEther(loan.collateral)} ETH`);
          console.log(`    是否活跃: ${loan.isActive}`);
          if (loan.paidAmount) {
            console.log(`    已还本金: ${ethers.formatEther(loan.paidAmount)} ETH`);
          }
          if (loan.paidInterest) {
            console.log(`    已还利息: ${ethers.formatEther(loan.paidInterest)} ETH`);
          }
        }
        
      } catch (contractError) {
        console.log(`❌ 连接原合约失败: ${contractError.message}`);
      }
    } else {
      console.log('❌ 原合约不存在，可能需要重新部署');
    }
    
    console.log('\n✅ 检查完成!');
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

checkGanacheContracts(); 