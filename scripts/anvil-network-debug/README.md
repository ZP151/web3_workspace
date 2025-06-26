# Anvil Network Debug Tools

A collection of debugging and diagnostic tools specifically designed for Anvil local networks.

## 🛠️ Available Tools

### Core Debugging Tools
- **`quick-info.js`** - Quick network status and contract information
- **`explorer.js`** - Comprehensive blockchain explorer for Anvil networks  
- **`check-balance.js`** - Check account balances and basic network connectivity

### 🆕 Persistence Test Suite
- **`persistence-test-suite/`** - Complete testing suite for Anvil persistence functionality
  - Address mismatch diagnosis and resolution
  - Complete persistence lifecycle testing
  - Transaction verification tools

## 📋 Quick Start

### Basic Network Diagnostics
```bash
# Quick network overview
node scripts/anvil-network-debug/quick-info.js

# Detailed blockchain exploration
node scripts/anvil-network-debug/explorer.js

# Check specific account balance
node scripts/anvil-network-debug/check-balance.js [address]
```

### Persistence Testing and Troubleshooting
```bash
# Check contract address consistency
node scripts/anvil-network-debug/persistence-test-suite/check-contract-addresses.js

# Fix address mismatch issues
node scripts/anvil-network-debug/persistence-test-suite/fix-address-mismatch.js --fresh

# Run basic transaction tests
node scripts/anvil-network-debug/persistence-test-suite/test-basic-transactions.js

# Complete persistence lifecycle test
node scripts/anvil-network-debug/persistence-test-suite/run-persistence-test.js
```

## 🔍 Common Use Cases

### Troubleshooting Empty Frontend Data
If your frontend returns empty data when using persistent Anvil networks:

1. **Check contract addresses:**
   ```bash
   node scripts/anvil-network-debug/persistence-test-suite/check-contract-addresses.js
   ```

2. **Fix address mismatches:**
   ```bash
   # Option 1: Start fresh (recommended for development)
   node scripts/anvil-network-debug/persistence-test-suite/fix-address-mismatch.js --fresh
   
   # Option 2: Redeploy to preserve data
   node scripts/anvil-network-debug/persistence-test-suite/fix-address-mismatch.js --redeploy
   ```

3. **Verify fix:**
   ```bash
   node scripts/anvil-network-debug/persistence-test-suite/test-basic-transactions.js
   ```

### Network Health Monitoring
```bash
# Quick status check
node scripts/anvil-network-debug/quick-info.js

# Detailed analysis
node scripts/anvil-network-debug/explorer.js

# Persistence quick test
node scripts/anvil-network-debug/persistence-test-suite/run-persistence-test.js --quick
```

## 📊 Tool Details

### quick-info.js
Provides essential network information including:
- Network status and chain ID
- Account balances
- Contract deployment status
- Recent block information

### explorer.js  
Comprehensive blockchain explorer featuring:
- Block-by-block analysis
- Transaction history
- Contract interaction logs
- Gas usage statistics

### check-balance.js
Simple balance checker with:
- Account balance verification
- Network connectivity testing
- Multiple address support

### persistence-test-suite/
Complete testing suite for Anvil persistence issues:
- **Address consistency verification**
- **Automated fix tools**
- **Transaction functionality testing**
- **Complete persistence lifecycle validation**

## 🚀 Prerequisites

- Node.js installed
- Anvil (Foundry) installed and accessible
- Hardhat project properly configured
- Anvil network running on port 8546

## 💡 Tips

- Use `quick-info.js` for rapid status checks
- Run `explorer.js` for detailed debugging sessions
- Use the persistence test suite when experiencing address mismatch issues
- All tools support `--help` flag for detailed usage information

## 📚 Related Documentation

- [Anvil Persistence Test Suite](./persistence-test-suite/README.md) - Complete guide for persistence testing
- [Local Networks Guide](../../docs/LOCAL_NETWORKS_GUIDE.md) - General network setup
- [Network Troubleshooting Guide](../../README_ANVIL_TROUBLESHOOTING.md) - Common issues and solutions

## 🔧 Troubleshooting

If tools fail to connect:
1. Ensure Anvil is running: `node scripts/start-networks.js anvil`
2. Verify port 8546 is accessible
3. Check that contracts are deployed: `npx hardhat run scripts/deploy-master.js --network anvil`

For persistence-specific issues, see the [Persistence Test Suite README](./persistence-test-suite/README.md) for detailed troubleshooting steps.