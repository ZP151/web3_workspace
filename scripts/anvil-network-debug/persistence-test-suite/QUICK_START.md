# Anvil Persistence Test Suite - Quick Start

## 🚀 Quick Start Guide

### Step 1: Start Anvil Network
```bash
# Option 1: Fresh network (recommended for testing)
node scripts/start-networks.js anvil --fresh

# Option 2: Persistent network (if you have existing data)
node scripts/start-networks.js anvil --persistent
```

### Step 2: Deploy Contracts
```bash
# Deploy all contracts to the network
npx hardhat run scripts/deploy-master.js --network anvil
```

### Step 3: Verify Setup
```bash
# Check if all contract addresses are valid
node scripts/anvil-network-debug/persistence-test-suite/check-contract-addresses.js
```

### Step 4: Run Tests
```bash
# Quick test (recommended)
node scripts/anvil-network-debug/persistence-test-suite/run-persistence-test.js --quick

# Basic transaction test only
node scripts/anvil-network-debug/persistence-test-suite/test-basic-transactions.js
```

## 🔧 Troubleshooting

### Problem: Frontend Returns Empty Data
```bash
# Step 1: Check addresses
node scripts/anvil-network-debug/persistence-test-suite/check-contract-addresses.js

# Step 2: Fix if needed
node scripts/anvil-network-debug/persistence-test-suite/fix-address-mismatch.js --fresh
```

### Problem: Contract Address Mismatch
```bash
# Option 1: Start fresh (loses data but ensures consistency)
node scripts/anvil-network-debug/persistence-test-suite/fix-address-mismatch.js --fresh

# Option 2: Redeploy contracts (preserves blockchain data)
node scripts/anvil-network-debug/persistence-test-suite/fix-address-mismatch.js --redeploy
```

### Problem: Network Connection Issues
```bash
# Check if Anvil is running on the correct port
netstat -ano | findstr :8546

# If not running, start it:
node scripts/start-networks.js anvil --persistent
```

## 📋 Common Workflows

### Development Workflow (Fresh Start)
```bash
# 1. Start fresh network
node scripts/start-networks.js anvil --fresh

# 2. Deploy contracts
npx hardhat run scripts/deploy-master.js --network anvil

# 3. Verify everything works
node scripts/anvil-network-debug/persistence-test-suite/run-persistence-test.js --quick

# 4. Start your frontend
npm run dev
```

### Persistence Testing Workflow
```bash
# 1. Start persistent network
node scripts/start-networks.js anvil --persistent

# 2. Deploy if needed
npx hardhat run scripts/deploy-master.js --network anvil

# 3. Run transactions
node scripts/anvil-network-debug/persistence-test-suite/test-basic-transactions.js

# 4. Stop network (saves state)
# Press Ctrl+C in Anvil terminal

# 5. Restart and verify persistence
node scripts/start-networks.js anvil --persistent
node scripts/anvil-network-debug/persistence-test-suite/check-contract-addresses.js
```

## 💡 Pro Tips

1. **Always use `--quick` test first** - It's faster and catches most issues
2. **Use `--fresh` for development** - Ensures clean state and address consistency  
3. **Use `--persistent` for testing** - Only when you need to preserve data
4. **Check addresses regularly** - Run the address checker whenever issues occur
5. **Network consistency** - Make sure all tools connect to the same chain ID

## 🎯 What Each Tool Does

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `check-contract-addresses.js` | Verify all contract addresses are valid | When frontend returns empty data |
| `fix-address-mismatch.js` | Resolve address mismatch issues | When address check fails |
| `test-basic-transactions.js` | Test basic contract functionality | To verify contracts work properly |
| `run-persistence-test.js` | Complete persistence lifecycle test | For comprehensive testing |

## 📞 Getting Help

If you encounter issues:

1. **Check the main README**: [persistence-test-suite/README.md](./README.md)
2. **Run with `--help`**: All tools support help flags
3. **Check network status**: Ensure Anvil is running on port 8546
4. **Verify deployment**: Make sure contracts are deployed to the correct network

## ✅ Success Indicators

You know everything is working when:
- ✅ Address checker shows 9/9 contracts valid
- ✅ Basic transaction test completes successfully  
- ✅ Frontend displays data correctly
- ✅ Network persistence works as expected 