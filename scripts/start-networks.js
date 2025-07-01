#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

//node scripts/start-networks.js anvil --persistent


// Network configuration options
const NETWORKS = {
  hardhat: {
    name: 'Hardhat Local',
    port: 8545,
    chainId: 31337,
    command: 'npx hardhat node',
    persistent: false
  },
  anvil: {
    name: 'Anvil Local (Foundry)',
    port: 8546,  // 使用不同端口避免冲突
    chainId: 31338,
    command: 'anvil',
    persistent: true,
    stateFile: './anvil-state.json'
  },
  ganache: {
    name: 'Ganache CLI',
    port: 7545,
    chainId: 1337,
    command: 'npx ganache-cli',
    persistent: false
  },
  fork: {
    name: 'Mainnet Fork',
    port: 8547,  // 使用不同端口避免冲突
    chainId: 31337,
    command: 'npx hardhat node --fork https://eth-mainnet.g.alchemy.com/v2/demo',
    persistent: false
  }
};

function printUsage() {
  console.log('\n🚀 Network Launcher Tool');
  console.log('\nUsage: node scripts/start-networks.js [network] [options]');
  console.log('\nSupported Networks:');
  console.log('  anvil       - Anvil Local Network (Port: 8546, Recommended, Persistent)');
  console.log('  hardhat     - Hardhat Local Network (Port: 8545, Default)');
  console.log('  ganache     - Ganache CLI Network (Port: 7545)');
  console.log('  fork        - Mainnet Fork Network (Port: 8547)');
  console.log('\nOptions:');
  console.log('  --persistent  - Enable persistence (Anvil only)');
  console.log('  --fresh      - Start fresh (clear state)');
  console.log('  --clean      - Same as --fresh (clear state)');
  console.log('  --port PORT  - Specify port (override default)');
  console.log('\nExamples:');
  console.log('  node scripts/start-networks.js anvil --persistent');
  console.log('  node scripts/start-networks.js hardhat --port 8548');
  console.log('  node scripts/start-networks.js anvil --fresh --port 8549');
  console.log('  node scripts/start-networks.js anvil --clean  # 清空状态重新开始');
  console.log('\nPort Allocation:');
  console.log('  8545 - Hardhat Network');
  console.log('  8546 - Anvil Network (Persistent)');
  console.log('  8547 - Fork Network');
  console.log('  7545 - Ganache Network');
  console.log('\n⚠️  Persistence Network Common Issues:');
  console.log('If using --persistent and the frontend returns empty data, it may be due to address mismatch.');
  console.log('Solutions:');
  console.log('  1. Check address matching: node scripts/utilities/check-anvil-addresses.js');
  console.log('  2. Start fresh: node scripts/start-networks.js anvil --fresh');
  console.log('  3. Or use clean: node scripts/start-networks.js anvil --clean');
  console.log('  4. Re-deploy: npx hardhat run scripts/deploy-master.js --network anvil');
}

function buildAnvilCommand(options = {}) {
  const stateFile = options.stateFile || './anvil-state.json';
  const port = options.port || 8546;  // Anvil defaults to port 8546
  
  // Use full path to anvil on Windows  
  const anvilPath = process.platform === 'win32' 
    ? '"C:/Users/Dell/.foundry/bin/anvil.exe"' 
    : 'anvil';
  
  let cmd = `${anvilPath} --port ${port} --chain-id 31338`;
  
  // Add fixed mnemonic for consistent accounts
  cmd += ' --mnemonic "test test test test test test test test test test test junk"';
  
  // Persistence support with address mismatch warning
  if (options.persistent && !options.fresh) {
    if (fs.existsSync(stateFile)) {
      console.log('📁 Loading saved state file:', stateFile);
      console.log('⚠️ Note: Persistence mode may result in mismatched contract addresses!');
      console.log('   If the frontend returns empty data, consider:');
      console.log('   1. Using the --fresh parameter to start fresh');
      console.log('   2. Manually updating the addresses in src/contracts/addresses.json');
      console.log('   3. Re-deploying contracts to match the current address configuration');
      cmd += ` --load-state ${stateFile}`;
    } else {
      console.log('📁 No existing state file found, starting fresh');
    }
    cmd += ` --dump-state ${stateFile}`;
  }
  
  // If fresh mode, delete existing state file
  if (options.fresh && fs.existsSync(stateFile)) {
    fs.unlinkSync(stateFile);
    console.log('🗑️ Deleted old state file:', stateFile);
  }
  
  return cmd;
}

function checkAnvilAvailable() {
  return new Promise((resolve) => {
    const anvilCommand = process.platform === 'win32' 
      ? 'C:/Users/Dell/.foundry/bin/anvil.exe' 
      : 'anvil';
    
    const child = spawn(anvilCommand, ['--version'], { stdio: 'pipe' });
    child.on('close', (code) => {
      resolve(code === 0);
    });
    child.on('error', () => {
      resolve(false);
    });
  });
}

async function startNetwork(networkType = 'hardhat', options = {}) {
  // Check Anvil availability
  if (networkType === 'anvil') {
    const anvilAvailable = await checkAnvilAvailable();
    if (!anvilAvailable) {
      console.log('❌ Anvil not installed or available');
      console.log('\nPlease install Foundry first:');
      console.log('1. Visit: https://getfoundry.sh/');
      console.log('2. Or run: curl -L https://foundry.paradigm.xyz | bash');
      console.log('3. Windows users can download precompiled binaries');
      console.log('\nFalling back to Hardhat network...\n');
      networkType = 'hardhat';
    }
  }
  
  const network = NETWORKS[networkType];
  if (!network) {
    console.log('❌ Unknown network type:', networkType);
    printUsage();
    return;
  }
  
  console.log(`🌐 Starting ${network.name}...`);
  console.log(`📡 Port: ${options.port || network.port}`);
  
  let command;
  if (networkType === 'anvil') {
    command = buildAnvilCommand({
      persistent: options.persistent,
      fresh: options.fresh,
      port: options.port || network.port,
      stateFile: network.stateFile
    });
  } else {
    command = network.command;
    if (options.port) {
      if (networkType === 'hardhat' || networkType === 'fork') {
        command += ` --port ${options.port}`;
      } else if (networkType === 'ganache') {
        command += ` --port ${options.port}`;
      }
    } else if (networkType === 'fork') {
      // Fork network uses port 8547 to avoid conflict with hardhat
      command += ` --port 8547`;
    }
  }
  
  console.log(`📋 Command: ${command}`);
  console.log('\n⏳ Starting...\n');
  
  // Parse command
  const [cmd, ...args] = command.split(' ');
  
  const child = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true
  });
  
  // Handle exit
  child.on('close', (code) => {
    if (code !== 0) {
      console.log(`\n🛑 Network stopped (exit code: ${code})`);
    } else {
      console.log('\n✅ Network stopped normally');
    }
  });
  
  child.on('error', (error) => {
    console.error('\n❌ Startup failed:', error.message);
  });
  
  // Graceful exit handling
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping network...');
    child.kill('SIGINT');
    
    // If Anvil with persistence enabled, state will be auto-saved
    if (networkType === 'anvil' && options.persistent) {
      console.log('💾 State auto-saved to:', network.stateFile);
    }
    
    setTimeout(() => process.exit(0), 1000);
  });
  
  process.on('SIGTERM', () => {
    child.kill('SIGTERM');
  });
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const networkType = args[0] || 'hardhat';
  
  const options = {
    persistent: args.includes('--persistent'),
    fresh: args.includes('--fresh') || args.includes('--clean'), // 支持 --clean 作为 --fresh 的别名
    port: null
  };
  
  // Parse port
  const portIndex = args.indexOf('--port');
  if (portIndex !== -1 && args[portIndex + 1]) {
    options.port = parseInt(args[portIndex + 1]);
  }
  
  return { networkType, options };
}

// Main function
async function main() {
  const { networkType, options } = parseArgs();
  
  if (networkType === 'help' || networkType === '--help' || networkType === '-h') {
    printUsage();
    return;
  }
  
  await startNetwork(networkType, options);
}

// Run
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { startNetwork, NETWORKS, printUsage }; 