const { ethers } = require("hardhat");

async function debugLoanIssue() {
  console.log('🔍 调试贷款问题...');
  
  try {
    // 连接到v5合约 - 更新地址
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const userAddress = "0x8742Bf796efE417CF777d04866eD47654F913EB7";
    
    console.log(`📋 检查合约: ${contractAddress}`);
    console.log(`👤 检查用户: ${userAddress}`);
    
    const enhancedBank = await ethers.getContractAt("EnhancedBank", contractAddress);
    
    // 先检查合约是否存在
    const contractCode = await ethers.provider.getCode(contractAddress);
    console.log(`📄 合约代码长度: ${contractCode.length}`);
    
    if (contractCode === '0x') {
      console.log('❌ 合约地址没有部署代码!');
      return;
    }
    
    // 检查用户是否有账户
    try {
      const hasAccount = await enhancedBank.accounts(userAddress);
      console.log(`📊 用户账户状态:`, hasAccount);
    } catch (error) {
      console.log(`❌ 检查账户失败: ${error.message}`);
    }
    
    // 尝试获取贷款数量
    try {
      console.log('📋 尝试获取用户贷款...');
      
      // 先检查是否有贷款函数
      const loanCount = await enhancedBank.getUserLoanCount ? 
        await enhancedBank.getUserLoanCount(userAddress) : 
        "无法获取贷款数量";
      console.log(`📊 用户贷款数量: ${loanCount}`);
      
      // 如果有贷款数量函数，逐个获取贷款
      if (typeof loanCount === 'bigint' && loanCount > 0) {
        for (let i = 0; i < Number(loanCount); i++) {
          try {
            const loan = await enhancedBank.loans(userAddress, i);
            console.log(`\n📋 贷款 #${i}:`);
            console.log(`  借款人: ${loan.borrower}`);
            console.log(`  原始金额: ${ethers.formatEther(loan.amount)} ETH`);
            console.log(`  抵押品: ${ethers.formatEther(loan.collateral)} ETH`);
            console.log(`  是否活跃: ${loan.isActive}`);
          } catch (error) {
            console.log(`❌ 获取贷款 #${i} 失败: ${error.message}`);
          }
        }
      } else {
        // 尝试直接调用getUserLoans
        const userLoans = await enhancedBank.getUserLoans(userAddress);
        console.log(`📊 用户总贷款数 (直接调用): ${userLoans.length}`);
      }
      
    } catch (error) {
      console.log(`❌ 获取用户贷款失败: ${error.message}`);
      console.log('📋 这是新部署的合约，用户还没有贷款数据');
    }
    
    // 检查合约基本信息
    console.log('\n🏦 合约基本信息:');
    try {
      const contractBalance = await ethers.provider.getBalance(contractAddress);
      console.log(`  合约余额: ${ethers.formatEther(contractBalance)} ETH`);
      
      // 检查合约基本设置
      const minDeposit = await enhancedBank.minDeposit();
      console.log(`  最小存款: ${ethers.formatEther(minDeposit)} ETH`);
      
      const minLoan = await enhancedBank.minLoanAmount();
      console.log(`  最小贷款: ${ethers.formatEther(minLoan)} ETH`);
      
    } catch (error) {
      console.log(`❌ 获取合约信息失败: ${error.message}`);
    }
    
    console.log('\n✅ 调试完成!');
    console.log('💡 提示: 这是新部署的合约，需要重新申请贷款进行测试');
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

debugLoanIssue(); 