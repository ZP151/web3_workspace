const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function checkFlashLoanStatus() {
  try {
    console.log('📊 检查闪电贷状态...\n');
    
    // 设置provider到Ganache端口
    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:7545');

    // 获取合约地址
    const addressesPath = path.join(__dirname, '../../src/contracts/addresses.json');
    if (!fs.existsSync(addressesPath)) {
      console.log('❌ 合约地址文件不存在:', addressesPath);
      return;
    }

    const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
    const enhancedBankAddress = addresses['1337']?.EnhancedBank;

    if (!enhancedBankAddress) {
      console.log('❌ 找不到 EnhancedBank 合约地址');
      console.log('📋 可用的地址:', addresses);
      return;
    }

    // 连接合约
    const EnhancedBank = await ethers.getContractFactory('EnhancedBank');
    const bank = EnhancedBank.attach(enhancedBankAddress).connect(provider);

    // 用户地址
    const userAddress = '0x8742Bf796efE417CF777d04866eD47654F913EB7';

    console.log(`🔍 检查用户 ${userAddress} 的闪电贷状态:`);

    // 检查活跃闪电贷
    const flashLoan = await bank.activeFlashLoans(userAddress);
    
    console.log('📋 闪电贷详情:');
    console.log(`   - 借款人: ${flashLoan.borrower}`);
    console.log(`   - 借款金额: ${ethers.utils.formatEther(flashLoan.amount)} ETH`);
    console.log(`   - 手续费: ${ethers.utils.formatEther(flashLoan.fee)} ETH`);
    console.log(`   - 借款时间: ${new Date(flashLoan.timestamp * 1000).toLocaleString()}`);
    console.log(`   - 是否活跃: ${flashLoan.isActive}`);

    if (flashLoan.isActive) {
      const totalRepayment = flashLoan.amount.add(flashLoan.fee);
      console.log(`\n💰 需要偿还总额: ${ethers.utils.formatEther(totalRepayment)} ETH`);
      
      const currentTime = Math.floor(Date.now() / 1000);
      const timeLeft = flashLoan.timestamp.toNumber() + 3600 - currentTime; // 1小时期限
      
      if (timeLeft > 0) {
        console.log(`⏰ 剩余时间: ${Math.floor(timeLeft / 60)} 分钟 ${timeLeft % 60} 秒`);
      } else {
        console.log(`❌ 闪电贷已过期 ${Math.floor(-timeLeft / 60)} 分钟`);
      }

      // 检查用户余额
      const userBalance = await provider.getBalance(userAddress);
      console.log(`💳 用户钱包余额: ${ethers.utils.formatEther(userBalance)} ETH`);
      
      if (userBalance.gte(totalRepayment)) {
        console.log(`✅ 余额充足，可以偿还闪电贷`);
      } else {
        console.log(`❌ 余额不足，需要 ${ethers.utils.formatEther(totalRepayment.sub(userBalance))} ETH`);
      }
    } else {
      console.log(`✅ 没有活跃的闪电贷`);
    }

    // 检查用户的普通贷款
    console.log('\n📊 检查普通贷款状态:');
    try {
      const userLoans = await bank.getUserLoans(userAddress);
      if (userLoans.length > 0) {
        console.log(`📋 发现 ${userLoans.length} 笔贷款:`);
        userLoans.forEach((loan, index) => {
          console.log(`   贷款 #${index}:`);
          console.log(`   - 借款金额: ${ethers.utils.formatEther(loan.amount)} ETH`);
          console.log(`   - 抵押金额: ${ethers.utils.formatEther(loan.collateral)} ETH`);
          console.log(`   - 开始时间: ${new Date(loan.startTime * 1000).toLocaleString()}`);
          console.log(`   - 利率: ${loan.interestRate / 100}%`);
          console.log(`   - 是否活跃: ${loan.isActive}`);
        });
      } else {
        console.log('✅ 没有普通贷款记录');
      }
    } catch (error) {
      console.log(`❌ 无法获取普通贷款信息: ${error.message}`);
    }

    console.log('\n✅ 闪电贷状态检查完成');

  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

if (require.main === module) {
  checkFlashLoanStatus()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { checkFlashLoanStatus }; 