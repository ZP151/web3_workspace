#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Complete Anvil Persistence Lifecycle Test Suite
 * 
 * This script runs the complete persistence test that we validated:
 * 1. Phase 1: Fresh network deployment and testing
 * 2. Phase 2: Persistence mode operation and state saving
 * 3. Phase 3: Persistence state loading verification
 */

async function runCompletePersistenceTest() {
  console.log('🧪 Anvil Persistence Lifecycle Test Suite');
  console.log('==========================================');
  console.log('');
  console.log('This test validates the complete Anvil persistence lifecycle:');
  console.log('✅ Fresh network deployment');
  console.log('✅ Contract address consistency');
  console.log('✅ Transaction functionality');
  console.log('✅ State persistence');
  console.log('✅ State loading and verification');
  console.log('');

  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  if (args.includes('--quick')) {
    console.log('🏃‍♂️ Running quick test (address check + basic transactions)...');
    await runQuickTest();
  } else {
    console.log('🔬 Running complete persistence lifecycle test...');
    await runFullTest();
  }
}

async function runQuickTest() {
  try {
    console.log('\n📋 Phase 1: Address Verification');
    console.log('----------------------------------');
    
    // Run address check
    const { checkAnvilAddresses } = require('./check-contract-addresses.js');
    await checkAnvilAddresses();
    
    console.log('\n📋 Phase 2: Basic Transaction Test');
    console.log('-----------------------------------');
    
    // Run basic transaction test
    const { testBasicTransactions } = require('./test-basic-transactions.js');
    const results = await testBasicTransactions();
    
    console.log('\n🎉 Quick Test Complete!');
    console.log('========================');
    console.log('✅ Address verification: Completed');
    console.log('✅ Basic transactions: Completed');
    
    return results;
    
  } catch (error) {
    console.log(`❌ Quick test failed: ${error.message}`);
    throw error;
  }
}

async function runFullTest() {
  console.log('\n⚠️  Full Persistence Test Requirements:');
  console.log('--------------------------------------');
  console.log('This test requires manual intervention for network management.');
  console.log('Please follow the instructions carefully.');
  console.log('');
  console.log('📋 Test phases:');
  console.log('1. Fresh network deployment and initial testing');
  console.log('2. Persistence mode operation and state saving');
  console.log('3. Persistence state loading and verification');
  console.log('');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    console.log('Phase 1: Fresh Network Setup');
    console.log('=============================');
    
    await askUser(rl, 'Press Enter to start Phase 1 (Fresh Network Setup)...');
    
    // Phase 1: Fresh network setup
    console.log('🆕 Phase 1: Starting fresh network test...');
    console.log('');
    console.log('Manual steps required:');
    console.log('1. Open a new terminal window');
    console.log('2. Run: node scripts/start-networks.js anvil --fresh');
    console.log('3. Wait for network to start');
    console.log('');
    
    await askUser(rl, 'After starting the network, press Enter to continue...');
    
    // Deploy contracts
    console.log('📦 Deploying contracts...');
    await runCommand('npx', ['hardhat', 'run', 'scripts/deploy-master.js', '--network', 'anvil']);
    
    // Check addresses
    console.log('\n🔍 Checking contract addresses...');
    const { checkAnvilAddresses } = require('./check-contract-addresses.js');
    await checkAnvilAddresses();
    
    // Run basic transactions
    console.log('\n🧪 Running basic transaction tests...');
    const { testBasicTransactions } = require('./test-basic-transactions.js');
    const phase1Results = await testBasicTransactions();
    
    console.log('\n📊 Phase 1 Results:');
    console.log(`Deployer bank balance: ${phase1Results.deployer.bankBalance} ETH`);
    console.log(`NFT count: ${phase1Results.deployer.nftBalance}`);
    console.log(`User1 balance: ${phase1Results.user1.ethBalance} ETH`);
    
    // Phase 2: Persistence mode
    console.log('\n\nPhase 2: Persistence Mode Operation');
    console.log('====================================');
    
    await askUser(rl, 'Press Enter to start Phase 2 (Persistence Mode)...');
    
    console.log('Manual steps required:');
    console.log('1. Stop the current Anvil network (Ctrl+C)');
    console.log('2. Start persistence mode: node scripts/start-networks.js anvil --persistent');
    console.log('3. Wait for network to start');
    console.log('');
    
    await askUser(rl, 'After restarting in persistence mode, press Enter to continue...');
    
    // Re-deploy to ensure addresses match
    console.log('📦 Re-deploying contracts for persistence mode...');
    await runCommand('npx', ['hardhat', 'run', 'scripts/deploy-master.js', '--network', 'anvil']);
    
    // Check addresses again
    console.log('\n🔍 Verifying contract addresses in persistence mode...');
    await checkAnvilAddresses();
    
    // Run more transactions
    console.log('\n🧪 Running additional transaction tests...');
    const phase2Results = await testBasicTransactions();
    
    console.log('\n📊 Phase 2 Results:');
    console.log(`Deployer bank balance: ${phase2Results.deployer.bankBalance} ETH`);
    console.log(`NFT count: ${phase2Results.deployer.nftBalance}`);
    console.log(`User1 balance: ${phase2Results.user1.ethBalance} ETH`);
    
    // Phase 3: State persistence verification
    console.log('\n\nPhase 3: State Persistence Verification');
    console.log('========================================');
    
    await askUser(rl, 'Press Enter to start Phase 3 (State Persistence)...');
    
    console.log('Manual steps required:');
    console.log('1. Stop the Anvil network (Ctrl+C) to trigger state save');
    console.log('2. Wait for anvil-state.json to be created');
    console.log('3. Restart: node scripts/start-networks.js anvil --persistent');
    console.log('');
    
    await askUser(rl, 'After restarting with saved state, press Enter to continue...');
    
    // Check if state file exists
    const stateFile = path.join(process.cwd(), 'anvil-state.json');
    if (fs.existsSync(stateFile)) {
      const stats = fs.statSync(stateFile);
      console.log(`✅ State file found: ${(stats.size / 1024).toFixed(1)} KB`);
    } else {
      console.log('⚠️  State file not found, but continuing test...');
    }
    
    // Final verification
    console.log('\n🔍 Final address verification...');
    await checkAnvilAddresses();
    
    console.log('\n🧪 Final transaction test...');
    const phase3Results = await testBasicTransactions();
    
    console.log('\n📊 Phase 3 Results:');
    console.log(`Deployer bank balance: ${phase3Results.deployer.bankBalance} ETH`);
    console.log(`NFT count: ${phase3Results.deployer.nftBalance}`);
    console.log(`User1 balance: ${phase3Results.user1.ethBalance} ETH`);
    
    // Final analysis
    console.log('\n\n🎉 Complete Persistence Test Results');
    console.log('====================================');
    console.log('');
    console.log('Data Progression Analysis:');
    console.log(`Phase 1 → Phase 2 → Phase 3`);
    console.log(`Bank Balance: ${phase1Results.deployer.bankBalance} → ${phase2Results.deployer.bankBalance} → ${phase3Results.deployer.bankBalance}`);
    console.log(`NFT Count: ${phase1Results.deployer.nftBalance} → ${phase2Results.deployer.nftBalance} → ${phase3Results.deployer.nftBalance}`);
    console.log(`User1 Balance: ${phase1Results.user1.ethBalance} → ${phase2Results.user1.ethBalance} → ${phase3Results.user1.ethBalance}`);
    console.log('');
    
    const dataPreserved = 
      parseFloat(phase3Results.deployer.bankBalance) > parseFloat(phase1Results.deployer.bankBalance) &&
      parseInt(phase3Results.deployer.nftBalance) >= parseInt(phase1Results.deployer.nftBalance) &&
      parseFloat(phase3Results.user1.ethBalance) >= parseFloat(phase1Results.user1.ethBalance);
    
    if (dataPreserved) {
      console.log('✅ PERSISTENCE TEST PASSED!');
      console.log('Data was successfully preserved and new transactions work correctly.');
    } else {
      console.log('❌ PERSISTENCE TEST FAILED!');
      console.log('Data was not properly preserved across persistence cycles.');
    }
    
    rl.close();
    
  } catch (error) {
    console.log(`❌ Full test failed: ${error.message}`);
    rl.close();
    throw error;
  }
}

function askUser(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, () => {
      resolve();
    });
  });
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

function printHelp() {
  console.log('📖 Anvil Persistence Test Suite - Help');
  console.log('');
  console.log('Usage: node run-persistence-test.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --quick     Run quick test (address check + basic transactions)');
  console.log('  --help, -h  Show this help message');
  console.log('');
  console.log('Test Types:');
  console.log('  Default     Complete persistence lifecycle test (requires manual steps)');
  console.log('  --quick     Quick automated test for current network state');
  console.log('');
  console.log('Examples:');
  console.log('  node run-persistence-test.js           # Complete lifecycle test');
  console.log('  node run-persistence-test.js --quick   # Quick automated test');
  console.log('');
  console.log('Description:');
  console.log('  This test suite validates Anvil persistence functionality including');
  console.log('  state saving, loading, and contract address consistency across');
  console.log('  network restarts.');
}

// Execute if run directly
if (require.main === module) {
  runCompletePersistenceTest().catch(console.error);
}

module.exports = { runCompletePersistenceTest, runQuickTest }; 