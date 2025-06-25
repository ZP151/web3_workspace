# Anvil Scripts

This folder contains utility scripts for interacting with the Anvil local blockchain network.

## Scripts Overview

### 1. explorer.js - Interactive Blockchain Explorer
An interactive command-line tool that provides a comprehensive interface for exploring the Anvil blockchain.

**Features:**
- Network information display
- Block information queries
- Transaction details lookup
- Account balance and information
- List deployed contracts
- Recent transactions view
- Test account balances

**Usage:**
```bash
node scripts/anvil/explorer.js
```

Once started, you can navigate through different options by entering numbers (0-7):
- `1` - Network Information
- `2` - Block Information
- `3` - Transaction Information
- `4` - Account Information
- `5` - List Deployed Contracts
- `6` - Recent Transactions
- `7` - Test Account Balances
- `0` - Exit

### 2. check-balance.js - Account Balance Checker
A simple script to check the balance and transaction count of a specific account.

**Usage:**
```bash
node scripts/anvil/check-balance.js
```

**Features:**
- Displays account balance in both Wei and ETH
- Shows transaction count (nonce)
- Provides blockchain information
- Warns if account is in initial state

### 3. quick-info.js - Quick Network Overview
Provides a quick overview of the Anvil network status and key information.

**Usage:**
```bash
node scripts/anvil/quick-info.js
```

**Features:**
- Network status (Chain ID, latest block, gas price)
- Test account balances
- Deployed contracts status
- Recent block activity
- Recent transactions summary

## Prerequisites

Before using these scripts, ensure that:

1. **Anvil is running**: Start the Anvil network using:
   ```bash
   node scripts/start-networks.js anvil --persistent
   ```

2. **Dependencies are installed**: Make sure you have the required dependencies:
   ```bash
   npm install
   ```

## Default Configuration

All scripts are configured to connect to:
- **RPC URL**: `http://127.0.0.1:8546`
- **Default Test Account**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

## Troubleshooting

If you encounter connection errors:

1. **Check if Anvil is running**:
   ```bash
   # Start Anvil with persistence
   node scripts/start-networks.js anvil --persistent
   ```

2. **Verify the RPC URL**: Ensure Anvil is listening on `http://127.0.0.1:8546`

3. **Check network connectivity**: The scripts will display connection status when started

## Example Workflow

1. **Start Anvil network**:
   ```bash
   node scripts/start-networks.js anvil --persistent
   ```

2. **Get quick overview**:
   ```bash
   node scripts/anvil/quick-info.js
   ```

3. **Check specific account**:
   ```bash
   node scripts/anvil/check-balance.js
   ```

4. **Explore interactively**:
   ```bash
   node scripts/anvil/explorer.js
   ```

These scripts provide a comprehensive alternative to Ganache's GUI interface, allowing you to monitor and explore your local Anvil blockchain through the command line.