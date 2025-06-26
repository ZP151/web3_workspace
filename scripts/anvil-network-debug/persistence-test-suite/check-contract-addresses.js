#!/usr/bin/env node

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

const ADDRESSES_FILE = path.join(__dirname, '../../../src/contracts/addresses.json');
const ANVIL_CHAIN_ID = '31338';

/**
 * Check if contract addresses in Anvil persistent network match configuration file
 */
async function checkAnvilAddresses() {
  console.log('🔧 Anvil Contract Address Checker Tool');
  console.log('🔍 Checking Anvil persistent network contract addresses...');
  
  try {
    // Connect to Anvil network
    const provider = new ethers.JsonRpcProvider('http://localhost:8546');
    
    // Check network connection
    try {
      const network = await provider.getNetwork();
      console.log(`📡 Connected to network, Chain ID: ${network.chainId}`);
      
      if (network.chainId.toString() !== ANVIL_CHAIN_ID) {
        console.log(`⚠️  Warning: Current network Chain ID ${network.chainId} does not match expected Anvil Chain ID ${ANVIL_CHAIN_ID}`);
      }
    } catch (networkError) {
      console.log('❌ Unable to connect to Anvil network');
      console.log('💡 Please ensure Anvil is running on port 8546');
      console.log('🚀 Start command: node scripts/start-networks.js anvil --persistent');
      return;
    }

    // Read address configuration file
    if (!fs.existsSync(ADDRESSES_FILE)) {
      console.log(`❌ Address configuration file not found: ${ADDRESSES_FILE}`);
      console.log('💡 Please deploy contracts first: npx hardhat run scripts/deploy-master.js --network anvil');
      return;
    }

    const addresses = JSON.parse(fs.readFileSync(ADDRESSES_FILE, 'utf8'));
    
    if (!addresses[ANVIL_CHAIN_ID]) {
      console.log(`❌ No address configuration found for Chain ID ${ANVIL_CHAIN_ID}`);
      console.log('💡 Please deploy contracts to Anvil network first');
      return;
    }

    const anvilAddresses = addresses[ANVIL_CHAIN_ID];
    const contractNames = Object.keys(anvilAddresses).filter(key => 
      key !== 'initialized' && 
      key !== 'timestamp' && 
      key !== 'network' && 
      key !== 'deployedAt' && 
      key !== 'deployer' && 
      key !== 'totalContracts' &&
      key !== 'operator'
    );

    console.log('');
    let validCount = 0;
    let totalCount = contractNames.length;

    // Check each contract address
    for (const contractName of contractNames) {
      const address = anvilAddresses[contractName];
      
      try {
        const code = await provider.getCode(address);
        if (code && code !== '0x') {
          console.log(`✅ ${contractName}: ${address} (has contract code)`);
          validCount++;
        } else {
          console.log(`❌ ${contractName}: ${address} (no contract code found)`);
        }
      } catch (error) {
        console.log(`❌ ${contractName}: ${address} (error checking: ${error.message})`);
      }
    }

    console.log('');
    console.log(`📊 Check results: ${validCount}/${totalCount} contract addresses valid`);
    
    if (validCount === totalCount) {
      console.log('✅ All contract addresses are valid, network state is normal!');
    } else {
      console.log('⚠️  Some contract addresses are invalid, address mismatch may exist');
      console.log('');
      console.log('🔧 Suggested solutions:');
      console.log('1. Start fresh network (recommended):');
      console.log('   node scripts/anvil-network-debug/persistence-test-suite/fix-address-mismatch.js --fresh');
      console.log('');
      console.log('2. Redeploy contracts to current network:');
      console.log('   node scripts/anvil-network-debug/persistence-test-suite/fix-address-mismatch.js --redeploy');
    }

  } catch (error) {
    console.log(`❌ Check failed: ${error.message}`);
    console.log('💡 Please ensure Anvil network is running and accessible');
  }
}

// Execute if run directly
if (require.main === module) {
  checkAnvilAddresses().catch(console.error);
}

module.exports = { checkAnvilAddresses }; 