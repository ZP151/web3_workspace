# Anvil Installation Guide

## Overview

Anvil is part of the Foundry toolchain, a fast and feature-rich Ethereum node implementation designed for local development and testing. This guide provides detailed instructions on how to install and configure Anvil.

## 🔧 Environment Requirements

### System Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 18.04+)
- **Memory**: At least 4GB RAM (8GB+ recommended)
- **Storage**: At least 2GB available space
- **Network**: Stable internet connection (for downloads and updates)

### Required Software

**Git**
- Windows: Download from [git-scm.com](https://git-scm.com/download/win)
- macOS: `brew install git` or from Xcode Command Line Tools
- Linux: `sudo apt-get install git` (Ubuntu/Debian)

**Node.js (Optional but Recommended)**
- Version: 18.0+ (LTS version)
- Download: [nodejs.org](https://nodejs.org/)
- Verify installation: `node --version` and `npm --version`

## 📦 Foundry Installation

### Method 1: One-Click Install Script (Recommended)

**Linux and macOS**
```bash
# Download and run installation script
curl -L https://foundry.paradigm.xyz | bash

# Reload environment variables
source ~/.bashrc
# or
source ~/.zshrc

# Install latest version
foundryup
```

**Windows (using Git Bash or WSL)**
```bash
# Run in Git Bash
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc
foundryup
```

### Method 2: Manual Installation

**Compile from Source**
```bash
# Clone repository
git clone https://github.com/foundry-rs/foundry
cd foundry

# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Compile and install
cargo install --path ./crates/forge --bins --locked
cargo install --path ./crates/cast --bins --locked
cargo install --path ./crates/anvil --bins --locked
```

### Method 3: Pre-compiled Binaries

1. Visit [Foundry Releases](https://github.com/foundry-rs/foundry/releases)
2. Download pre-compiled binaries for your system
3. Extract and add executables to PATH

## ✅ Verify Installation

```bash
# Check if Foundry tools are correctly installed
forge --version
cast --version
anvil --version

# Expected output example:
# forge 0.2.0 (f625d0f 2024-01-15T00:00:00.000000000Z)
# cast 0.2.0 (f625d0f 2024-01-15T00:00:00.000000000Z)
# anvil 0.2.0 (f625d0f 2024-01-15T00:00:00.000000000Z)
```

## 🚀 Basic Usage

### Starting Anvil

**Basic Startup**
```bash
# Start Anvil with default configuration
anvil

# Expected output:
#                              _   _
#                             (_) | |
#   __ _   _ __   __   __  _   _  | |
#  / _` | | '_ \  \ \ / / | | | | | |
# | (_| | | | | |  \ V /  | |_| | | |
#  \__,_| |_| |_|   \_/    \__, | |_|
#                          __/ |
#                         |___/
#
# Listening on 127.0.0.1:8545
```

**Start with Persistence**
```bash
# Enable state persistence
anvil --state anvil-state.json

# Custom port
anvil --port 8546 --state anvil-state.json

# Custom account balance
anvil --balance 10000 --accounts 20
```

### Recommended Project Integration

**Using Project Script (Recommended)**
```bash
# Use project-provided startup script
node scripts/start-networks.js anvil --persistent

# This script automatically:
# 1. Checks if Anvil is installed
# 2. Starts Anvil with project configuration
# 3. Handles state persistence automatically
# 4. Sets correct port and account configuration
```

### Expected Output

When Anvil starts successfully, you should see output similar to:

```
                             _   _
                            (_) | |
  __ _   _ __   __   __  _   _  | |
 / _` | | '_ \  \ \ / / | | | | | |
| (_| | | | | |  \ V /  | |_| | | |
 \__,_| |_| |_|   \_/    \__, | |_|
                         __/ |
                        |___/

🎉 Anvil Started!
📍 Listening on: http://127.0.0.1:8546
⛓️  Chain ID: 31338
🔑 Account count: 10
💰 Balance per account: 10000 ETH
📁 State file: anvil-state.json

Available Accounts:
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
(2) 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000 ETH)
...

Private Keys:
==================
(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
(1) 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
(2) 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
...
```

## Why Choose Anvil?

| Feature | Anvil | Hardhat | Ganache |
|---------|-------|---------|---------|
| **Data Persistence** | ✅ | ❌ | ✅ |
| **Startup Speed** | ~1s | ~10s | ~5s |
| **Memory Usage** | 50MB | 200MB+ | 150MB+ |
| **Active Development** | ✅ | ✅ | ❌ |

## Test Connection

```javascript
// test-connection.js
const { ethers } = require('ethers');

async function test() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const network = await provider.getNetwork();
  console.log('Connected to chainId:', network.chainId.toString());
}

test();
```

## 🛠️ Troubleshooting

### Installation Issues

**Issue**: "command not found: anvil"
**Solution**:
1. Confirm Foundry is correctly installed: `foundryup`
2. Reload environment variables: `source ~/.bashrc` or restart terminal
3. Check if PATH includes `~/.foundry/bin`
4. Manually add to PATH: `export PATH="$HOME/.foundry/bin:$PATH"`

**Issue**: "Permission denied"
**Solution**:
1. Linux/macOS: Use `chmod +x ~/.foundry/bin/anvil`
2. Windows: Run terminal as administrator
3. Check if antivirus software is blocking execution

**Issue**: Windows-specific problems
**Solution**:
1. Use Git Bash instead of Command Prompt
2. Ensure Visual Studio Build Tools are installed
3. Try using WSL (Windows Subsystem for Linux)
4. Check Windows Defender settings

### Runtime Issues

**Issue**: "Port already in use"
**Solution**:
1. Check process using port: `netstat -tulpn | grep 8545`
2. Kill the process: `kill -9 <PID>`
3. Use different port: `anvil --port 8546`
4. Windows: Use `netstat -ano | findstr 8545` and `taskkill /PID <PID> /F`

**Issue**: Corrupted state file
**Solution**:
1. Backup current state file: `cp anvil-state.json anvil-state.json.backup`
2. Delete corrupted state file: `rm anvil-state.json`
3. Restart Anvil to create new state
4. If needed, try restoring from backup

**Issue**: Memory issues or performance problems
**Solution**:
1. Reduce account count: `anvil --accounts 5`
2. Lower account balance: `anvil --balance 1000`
3. Regularly clean state files
4. Increase system memory or use more powerful machine

**Issue**: Network connection problems
**Solution**:
1. Check firewall settings
2. Confirm port is not blocked
3. Try binding to all interfaces: `anvil --host 0.0.0.0`
4. Check proxy settings

## Advanced Usage

### Forking Mainnet
```bash
# Fork Ethereum mainnet at latest block
anvil --fork-url https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY

# Fork at specific block
anvil --fork-url https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY \
      --fork-block-number 18500000
```

### Custom Gas Settings
```bash
# Set custom gas price and limit
anvil --gas-price 1000000000 --gas-limit 30000000

# Disable gas limit
anvil --disable-block-gas-limit
```

### Multiple Accounts
```bash
# Generate 50 accounts with 1000 ETH each
anvil --accounts 50 --balance 1000

# Use specific mnemonic
anvil --mnemonic "your twelve word mnemonic phrase here for testing only"
```

## Integration with Project

### Default Configuration
- **Port**: 8546 (Custom for this project)
- **Chain ID**: 31338
- **Accounts**: 10 with 10,000 ETH each
- **Block time**: Instant (mines on transaction)
- **State persistence**: Enabled via anvil-state.json

### Testing Connection
```javascript
// Test connection with ethers.js
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('http://localhost:8546');

async function testConnection() {
  const network = await provider.getNetwork();
  console.log('Connected to chain ID:', network.chainId);
  
  const accounts = await provider.listAccounts();
  console.log('Available accounts:', accounts.length);
  
  const balance = await provider.getBalance(accounts[0]);
  console.log('Account 0 balance:', ethers.formatEther(balance), 'ETH');
}

testConnection();
```

## Why Choose Anvil?

### Advantages over Hardhat and Ganache

**Data Persistence**
- Anvil maintains state between restarts
- No need to redeploy contracts after restart
- Preserves transaction history and account balances

**Performance**
- Faster startup time compared to Hardhat
- Lower memory usage than Ganache GUI
- Optimized for development workflows

**Active Development**
- Part of the modern Foundry toolchain
- Regular updates and improvements
- Strong community support

**Developer Experience**
- Clean, readable output
- Comprehensive logging
- Easy integration with modern tools

## Next Steps

After installing Anvil:

1. **Configure MetaMask**: Add the local network to MetaMask
2. **Import Test Accounts**: Use the provided private keys
3. **Deploy Contracts**: Run the project deployment scripts
4. **Start Development**: Begin building your dApp

## Related Documentation

- [Network Configuration Guide](./NETWORK_GUIDE.md) - MetaMask setup and network configuration
- [Quick Setup Guide](./QUICK_SETUP_GUIDE.md) - Complete project setup
- [Local Networks Guide](./LOCAL_NETWORKS_GUIDE.md) - Comparison of local networks
- [Development Scripts Guide](./DEVELOPMENT_SCRIPTS_GUIDE.md) - Available development commands

---

**Need Help?** Check the [troubleshooting section](#troubleshooting) above or create an issue in the project repository.