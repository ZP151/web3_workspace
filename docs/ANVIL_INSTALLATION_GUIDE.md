# Anvil (Foundry) Setup Guide

## What is Anvil?

**Anvil** is a fast, local Ethereum blockchain simulator with **persistent data storage**, included with the Foundry toolkit. Unlike Hardhat, Anvil maintains state between restarts.

## Quick Installation

### Prerequisites
- Git Bash (Windows) or Terminal (Mac/Linux)
- Node.js (for project integration)

### Install Foundry
```bash
# Install foundryup
curl -L https://foundry.paradigm.xyz | bash

# Install toolchain
source ~/.bashrc && foundryup
```

### Verify Installation
```bash
anvil --version
```

## Basic Usage

### Start Anvil (Recommended)
```bash
# Basic start with persistence
anvil --dump-state state.json

# With custom port
anvil --port 8547 --dump-state state.json

# Load previous state
anvil --load-state state.json --dump-state state.json
```

### Start with Fixed Accounts
```bash
# Consistent accounts across restarts
anvil --mnemonic "test test test test test test test test test test test junk" \
      --dump-state state.json
```

### Network Output
```
Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
...

Listening on 127.0.0.1:8545
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

## Troubleshooting

**"anvil: command not found"**
```bash
# Reinstall Foundry
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc && foundryup
```

**Port already in use**
```bash
# Use different port
anvil --port 8547 --dump-state state.json
```

**Fresh start (clear state)**
```bash
rm state.json
anvil --dump-state state.json
```

## Advanced Usage

```bash
# Fork mainnet
anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Custom gas settings
anvil --gas-limit 30000000 --gas-price 1000000000

# Multiple accounts
anvil --accounts 20 --balance 1000
```

## Integration

Connect your dApp to: `http://127.0.0.1:8545`

Chain ID: `31337` (default) 