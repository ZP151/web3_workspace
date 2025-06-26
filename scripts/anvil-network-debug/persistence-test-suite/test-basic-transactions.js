#!/usr/bin/env node

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

const ADDRESSES_FILE = path.join(__dirname, '../../../src/contracts/addresses.json');

async function testBasicTransactions() {
  console.log('🧪 Basic Transaction Test Suite');
  console.log('========================================');
  
  try {
    // Get test accounts
    const [deployer, user1, user2] = await ethers.getSigners();
    console.log(`👤 Test accounts:`);
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   User1: ${user1.address}`);
    console.log(`   User2: ${user2.address}`);
    
    // Read contract addresses
    const addresses = JSON.parse(fs.readFileSync(ADDRESSES_FILE, 'utf8'));
    
    // Check network and determine chain ID
    const network = await ethers.provider.getNetwork();
    const chainId = network.chainId.toString();
    console.log(`🌐 Current network: Chain ID ${network.chainId}`);
    
    if (!addresses[chainId]) {
      throw new Error(`No contract addresses found for chain ID ${chainId}. Available chain IDs: ${Object.keys(addresses).join(', ')}`);
    }
    
    const contractAddresses = addresses[chainId];
    console.log(`   PlatformNFT: ${contractAddresses.PlatformNFT}`);
    console.log(`   USDC: ${contractAddresses.USDC}`);
    
    // Get contract instances
    const bank = await ethers.getContractAt('EnhancedBank', contractAddresses.EnhancedBank);
    const nft = await ethers.getContractAt('PlatformNFT', contractAddresses.PlatformNFT);
    
    console.log('\n🏦 Test 1: Bank Deposit Function');
    console.log('----------------------------------------');
    
    // Check initial balance
    const initialBalance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Initial balance: ${ethers.formatEther(initialBalance)} ETH`);
    
    // Make deposit
    console.log(`📥 Depositing 1.0 ETH...`);
    const depositTx = await bank.connect(deployer).deposit({ value: ethers.parseEther('1.0') });
    await depositTx.wait();
    console.log(`✅ Deposit successful! Transaction hash: ${depositTx.hash}`);
    
    // Check bank balance
    const bankAccount = await bank.accounts(deployer.address);
    console.log(`🏦 Bank account balance: ${ethers.formatEther(bankAccount.balance)} ETH`);
    
    console.log('\n🎨 Test 2: NFT Minting');
    console.log('----------------------------------------');
    
    // Get mint fee
    const mintFee = await nft.mintFee();
    console.log(`💰 Mint fee: ${ethers.formatEther(mintFee)} ETH`);
    
    // Mint NFT
    console.log(`🎨 Minting NFT...`);
    const mintTx = await nft.connect(deployer).mint(
      deployer.address,
      "https://via.placeholder.com/300x300.png?text=TestNFT",
      250, // 2.5% royalty
      { value: mintFee }
    );
    await mintTx.wait();
    console.log(`✅ NFT mint successful! Transaction hash: ${mintTx.hash}`);
    
    // Check NFT balance
    const nftBalance = await nft.balanceOf(deployer.address);
    console.log(`🎨 NFT balance: ${nftBalance.toString()}`);
    
    console.log('\n🔄 Test 3: Simple Transfer');
    console.log('----------------------------------------');
    
    // Transfer ETH to user1
    console.log(`💸 Transferring 0.5 ETH to user1...`);
    const transferTx = await deployer.sendTransaction({
      to: user1.address,
      value: ethers.parseEther('0.5')
    });
    await transferTx.wait();
    console.log(`✅ Transfer successful! Transaction hash: ${transferTx.hash}`);
    
    // Check user1 balance
    const user1Balance = await ethers.provider.getBalance(user1.address);
    console.log(`💰 User1 balance: ${ethers.formatEther(user1Balance)} ETH`);
    
    // Final balance check
    const finalBalance = await ethers.provider.getBalance(deployer.address);
    const finalBankAccount = await bank.accounts(deployer.address);
    const finalNftBalance = await nft.balanceOf(deployer.address);
    
    console.log('\n📊 Test Summary');
    console.log('========================================');
    console.log(`📋 Final state:`);
    console.log(`   Deployer ETH balance: ${ethers.formatEther(finalBalance)} ETH`);
    console.log(`   Bank account balance: ${ethers.formatEther(finalBankAccount.balance)} ETH`);
    console.log(`   NFT count: ${finalNftBalance.toString()}`);
    console.log(`   User1 ETH balance: ${ethers.formatEther(user1Balance)} ETH`);
    
    console.log('\n✅ All basic transaction tests completed!');
    console.log('Network state is normal, contract functionality is working properly');
    
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
      transactionHashes: {
        deposit: depositTx.hash,
        mint: mintTx.hash,
        transfer: transferTx.hash
      }
    };
    
  } catch (error) {
    console.log(`❌ Error occurred during testing: ${error.message}`);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  testBasicTransactions().catch(console.error);
}

module.exports = { testBasicTransactions }; 