#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Quick fix tool for Anvil persistent network address mismatch issues
 */
async function fixAnvilAddresses() {
  console.log('🔧 Anvil Address Mismatch Fix Tool');
  console.log('');
  console.log('When using Anvil persistent network, contract address mismatches may occur.');
  console.log('This tool will help you quickly resolve these issues.');
  console.log('');

  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  // Check current network status
  console.log('🔍 Checking current network status...');
  
  if (args.includes('--fresh') || args.includes('-f')) {
    console.log('🆕 Starting fresh Anvil network...');
    await startFreshAnvil();
  } else if (args.includes('--redeploy') || args.includes('-r')) {
    console.log('🔄 Redeploying contracts to current network...');
    await redeployContracts();
  } else {
    console.log('📋 Running address check and providing recommendations...');
    await checkAndRecommend();
  }
}

async function startFreshAnvil() {
  try {
    // Delete existing state file
    const stateFile = path.join(process.cwd(), 'anvil-state.json');
    if (fs.existsSync(stateFile)) {
      fs.unlinkSync(stateFile);
      console.log('🗑️  Deleted existing state file: anvil-state.json');
    }
    
    console.log('');
    console.log('✅ Preparation complete!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Open a new terminal window');
    console.log('2. Run: node scripts/start-networks.js anvil --fresh');
    console.log('3. After network starts, deploy contracts:');
    console.log('   npx hardhat run scripts/deploy-master.js --network anvil');
    console.log('4. Start your frontend application');
    console.log('');
    console.log('💡 This ensures all addresses match perfectly!');
    
  } catch (error) {
    console.log(`❌ Error during fresh start preparation: ${error.message}`);
  }
}

async function redeployContracts() {
  try {
    console.log('🔍 Checking if Anvil network is running...');
    
    // Try to connect to Anvil network
    const { ethers } = require('hardhat');
    try {
      const provider = new ethers.JsonRpcProvider('http://localhost:8546');
      const network = await provider.getNetwork();
      console.log(`📡 Connected to network, Chain ID: ${network.chainId}`);
    } catch (error) {
      console.log('❌ Cannot connect to Anvil network');
      console.log('💡 Please start Anvil network first:');
      console.log('   node scripts/start-networks.js anvil --persistent');
      return;
    }
    
    console.log('🔄 Redeploying contracts...');
    console.log('📋 Running: npx hardhat run scripts/deploy-master.js --network anvil');
    console.log('');
    
    // Execute deployment
    const deployProcess = spawn('npx', ['hardhat', 'run', 'scripts/deploy-master.js', '--network', 'anvil'], {
      stdio: 'inherit',
      shell: true
    });
    
    deployProcess.on('close', (code) => {
      if (code === 0) {
        console.log('');
        console.log('✅ Contract redeployment complete!');
        console.log('💡 All addresses should now match the configuration file');
        console.log('🔍 Run address check to verify:');
        console.log('   node scripts/anvil-network-debug/persistence-test-suite/check-contract-addresses.js');
      } else {
        console.log(`❌ Deployment failed with exit code ${code}`);
      }
    });
    
  } catch (error) {
    console.log(`❌ Error during redeployment: ${error.message}`);
  }
}

async function checkAndRecommend() {
  try {
    // Run address check
    const { checkAnvilAddresses } = require('./check-contract-addresses.js');
    await checkAnvilAddresses();
    
    console.log('');
    console.log('🔧 Available fix options:');
    console.log('');
    console.log('Option 1 - Start fresh network (recommended for development):');
    console.log('  node scripts/anvil-network-debug/persistence-test-suite/fix-address-mismatch.js --fresh');
    console.log('');
    console.log('Option 2 - Redeploy to current network (preserves data):');
    console.log('  node scripts/anvil-network-debug/persistence-test-suite/fix-address-mismatch.js --redeploy');
    console.log('');
    console.log('💡 Choose based on whether you need to preserve current test data');
    
  } catch (error) {
    console.log(`❌ Check failed: ${error.message}`);
  }
}

function printHelp() {
  console.log('📖 Anvil Address Mismatch Fix Tool - Help');
  console.log('');
  console.log('Usage: node fix-address-mismatch.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --fresh, -f     Start fresh Anvil network (deletes state file)');
  console.log('  --redeploy, -r  Redeploy contracts to current network');
  console.log('  --help, -h      Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node fix-address-mismatch.js                    # Check and recommend');
  console.log('  node fix-address-mismatch.js --fresh            # Start fresh network');
  console.log('  node fix-address-mismatch.js --redeploy         # Redeploy contracts');
  console.log('');
  console.log('Description:');
  console.log('  This tool resolves address mismatches that occur when using Anvil');
  console.log('  persistent mode. Choose --fresh for clean start or --redeploy to');
  console.log('  preserve existing data.');
}

// Execute if run directly
if (require.main === module) {
  fixAnvilAddresses().catch(console.error);
}

module.exports = { fixAnvilAddresses }; 