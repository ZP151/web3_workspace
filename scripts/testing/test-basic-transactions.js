#!/usr/bin/env node

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

const ADDRESSES_FILE = path.join(__dirname, '../../src/contracts/addresses.json');

async function testBasicTransactions() {
  console.log('🧪 基本交易测试开始');
  console.log('========================================');
  
  try {
    // 获取部署者账户
    const [deployer, user1, user2] = await ethers.getSigners();
    console.log(`👤 测试账户:`);
    console.log(`   部署者: ${deployer.address}`);
    console.log(`   用户1: ${user1.address}`);
    console.log(`   用户2: ${user2.address}`);
    
    // 读取合约地址
    const addresses = JSON.parse(fs.readFileSync(ADDRESSES_FILE, 'utf8'));
    const chainId = '31337'; // Hardhat default or adjust based on your network
    
    // 检查网络
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 当前网络: Chain ID ${network.chainId}`);
    
    const networkAddresses = addresses[network.chainId.toString()];
    if (!networkAddresses) {
      console.error(`❌ 找不到 Chain ID ${network.chainId} 的地址配置`);
      return;
    }
    
    console.log('\n📋 使用的合约地址:');
    console.log(`   EnhancedBank: ${networkAddresses.EnhancedBank}`);
    console.log(`   DEXPlatform: ${networkAddresses.DEXPlatform}`);
    console.log(`   PlatformNFT: ${networkAddresses.PlatformNFT}`);
    console.log(`   USDC: ${networkAddresses.USDC}`);
    
    // 获取合约实例
    const EnhancedBank = await ethers.getContractFactory('EnhancedBank');
    const bank = EnhancedBank.attach(networkAddresses.EnhancedBank);
    
    const PlatformNFT = await ethers.getContractFactory('PlatformNFT');
    const nft = PlatformNFT.attach(networkAddresses.PlatformNFT);
    
    console.log('\n🏦 测试1: 银行存款功能');
    console.log('----------------------------------------');
    
    // 检查初始余额
    const initialBalance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 初始余额: ${ethers.formatEther(initialBalance)} ETH`);
    
    // 执行存款
    const depositAmount = ethers.parseEther('1.0');
    console.log(`📥 存款 ${ethers.formatEther(depositAmount)} ETH...`);
    
    const depositTx = await bank.connect(deployer).deposit({ value: depositAmount });
    await depositTx.wait();
    console.log(`✅ 存款成功! 交易哈希: ${depositTx.hash}`);
    
    // 检查银行余额
    const bankAccount = await bank.accounts(deployer.address);
    console.log(`🏦 银行账户余额: ${ethers.formatEther(bankAccount.balance)} ETH`);
    
    console.log('\n🎨 测试2: NFT 铸造');
    console.log('----------------------------------------');
    
    // 检查铸造费用
    const mintFee = await nft.mintFee();
    console.log(`💰 铸造费用: ${ethers.formatEther(mintFee)} ETH`);
    
    // 铸造 NFT
    console.log(`🎨 铸造 NFT...`);
    const mintTx = await nft.connect(deployer).mint(
      deployer.address,
      "https://via.placeholder.com/300x300.png?text=TestNFT",
      250, // 2.5% royalty
      { value: mintFee }
    );
    await mintTx.wait();
    console.log(`✅ NFT 铸造成功! 交易哈希: ${mintTx.hash}`);
    
    // 检查 NFT 余额
    const nftBalance = await nft.balanceOf(deployer.address);
    console.log(`🎨 NFT 余额: ${nftBalance.toString()}`);
    
    console.log('\n🔄 测试3: 简单转账');
    console.log('----------------------------------------');
    
    // 从部署者转账给用户1
    const transferAmount = ethers.parseEther('0.5');
    console.log(`💸 转账 ${ethers.formatEther(transferAmount)} ETH 给用户1...`);
    
    const transferTx = await deployer.sendTransaction({
      to: user1.address,
      value: transferAmount
    });
    await transferTx.wait();
    console.log(`✅ 转账成功! 交易哈希: ${transferTx.hash}`);
    
    // 检查用户1余额
    const user1Balance = await ethers.provider.getBalance(user1.address);
    console.log(`💰 用户1余额: ${ethers.formatEther(user1Balance)} ETH`);
    
    console.log('\n📊 测试总结');
    console.log('========================================');
    
    // 最终余额检查
    const finalBalance = await ethers.provider.getBalance(deployer.address);
    const finalBankAccount = await bank.accounts(deployer.address);
    const finalNftBalance = await nft.balanceOf(deployer.address);
    
    console.log(`📋 最终状态:`);
    console.log(`   部署者 ETH 余额: ${ethers.formatEther(finalBalance)} ETH`);
    console.log(`   银行账户余额: ${ethers.formatEther(finalBankAccount.balance)} ETH`);
    console.log(`   NFT 数量: ${finalNftBalance.toString()}`);
    console.log(`   用户1 ETH 余额: ${ethers.formatEther(user1Balance)} ETH`);
    
    console.log('\n✅ 所有基本交易测试完成！');
    console.log('网络状态正常，合约功能正常工作');
    
    return {
      deployer: {
        address: deployer.address,
        ethBalance: ethers.formatEther(finalBalance),
        bankBalance: ethers.formatEther(finalBankAccount.balance),
        nftBalance: finalNftBalance.toString()
      },
      user1: {
        address: user1.address,
        ethBalance: ethers.formatEther(user1Balance)
      },
      transactions: {
        deposit: depositTx.hash,
        nftMint: mintTx.hash,
        transfer: transferTx.hash
      }
    };
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    throw error;
  }
}

if (require.main === module) {
  testBasicTransactions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { testBasicTransactions }; 