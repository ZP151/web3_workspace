# Deployment and Sample Data Initialization Guide

This guide introduces how to use the updated deployment scripts to deploy contracts and initialize sample data, allowing users to immediately start testing and using platform features.

## 🚀 Feature Overview

The updated deployment system now includes 5 phases:

1. **Phase 1**: Deploy core contracts (banking, voting, etc.)
2. **Phase 2**: Deploy test tokens (WETH, USDC, DAI, etc.)  
3. **Phase 3**: Deploy DeFi contracts (DEX, NFT marketplace, etc.)
4. **Phase 4**: Basic contract initialization and configuration
5. **Phase 5**: Sample data initialization ⭐ **New**

## 📦 Sample Data Contents

### 🏦 Banking Module Sample Data

- **Community Pools**: 6 preset community pools
  - Community Development Fund
  - Education Scholarship Pool
  - Environmental Action Fund
  - Startup Incubator Pool
  - Medical Aid Fund
  - Arts & Culture Support

- **Initial Funding**: 
  - Deployer deposits: 2 ETH
  - Community pool funds: 0.1 ETH each (first 3 pools)

- **Savings Goals Examples**:
  - Emergency Fund (1.0 ETH, 90 days)
  - Travel Fund (0.5 ETH, 180 days)
  - New Device Purchase (0.3 ETH, 60 days)

- **Staking Example**: 0.5 ETH staked

### 💱 DEX Module Sample Data

- **Liquidity Pools**:
  - WETH/USDC Pool (Price: 1 WETH = 2000 USDC)
  - WETH/DAI Pool (Price: 1 WETH = 2000 DAI)  
  - USDC/DAI Pool (Price: 1 USDC = 1 DAI)

- **Initial Liquidity**:
  - WETH/USDC: 3 WETH + 6000 USDC
  - WETH/DAI: 3 WETH + 6000 DAI
  - USDC/DAI: 3000 USDC + 3000 DAI

- **Test Token Minting**:
  - 10 WETH (converted from ETH)
  - USDC and DAI (automatically minted during deployment)

## 🛠️ Usage Methods

### Method 1: One-Click Deployment (Recommended)

```bash
# Start local node
npm run node

# Run one-click deployment (including sample data) in new terminal
npm run deploy
```

Or manually deploy to different networks:
```bash
npx hardhat run scripts/deploy-master.js --network anvil     # Anvil (recommended)
npx hardhat run scripts/deploy-master.js --network ganache  # Ganache network
npx hardhat run scripts/deploy-master.js --network hardhat  # Hardhat network
```

### Method 2: Step-by-Step Deployment

```bash
# 1. Deploy contracts only (without sample data)
npm run deploy:old

# 2. Add sample data separately
npm run init-sample-data
```

### Method 3: Re-initialize Sample Data

If you already have deployed contracts but want to re-add sample data:

```bash
npm run init-sample-data         # Local network
npm run init-sample-data:ganache # Ganache network
```

## 📋 Deployment Output Example

```
🚀 Starting Complete Deployment
============================================================
🔧 Deployment Configuration:
  Deployer Account: 0x...
  Network ID: 31337
  Network Name: hardhat
  Account Balance: 10000.0 ETH

============================================================
📄 Stage 1: Deploy Core Contracts
============================================================
🏦 Deploying EnhancedBank...
✅ EnhancedBank deployed: 0x...

============================================================
📄 Stage 2: Deploy Test Tokens  
============================================================
🪙 Deploying WETH...
✅ WETH deployed: 0x...

============================================================
📄 Stage 3: Deploy DeFi Contracts
============================================================
💱 Deploying DEXPlatform...
✅ DEXPlatform deployed: 0x...

============================================================
🔧 Stage 4: Initialize Deployed Contracts
============================================================
🏦 Initializing basic bank settings...
✅ Bank basic configuration verification completed

============================================================
🎯 Stage 5: Initialize Sample Data
============================================================
🏦 Initializing banking sample data...
   📦 Creating 6 community pools...
   ✅ Community Development Fund created successfully
   ✅ Education Scholarship Pool created successfully
   ...
   💰 Deployer making initial deposit...
   ✅ Deposit 2.0 ETH successful

💱 Initializing DEX sample data...
   🪙 Minting test tokens...
   ✅ Minted 10.0 WETH
   🏊 Creating liquidity pools...
   ✅ WETH/USDC pool created successfully
   ...

🎉 Complete Deployment Finished!
============================================================
📊 Deployment Summary:
  Network: Hardhat Local (31337)
  Total Contracts: 8
  Deployment Time: 45.32s
  Sample Data: ✅ Initialized

📋 Deployed Contracts:
  ✅ EnhancedBank: 0x...
  ✅ DEXPlatform: 0x...
  ...

📁 Address file updated: src/contracts/addresses.json
🎯 Sample Data: Banking and DEX pre-loaded with sample data for testing and demonstration
📖 Contents include:
   • Banking: Community pools, savings goals, staking examples
   • DEX: Liquidity pools, token pairs, initial trading pair prices
```

## ⚙️ Configuration Requirements

### Account Balance Requirements

- **Minimum Balance**: 1 ETH (for gas fees)
- **Recommended Balance**: 5+ ETH (for sample data creation)
- **Banking Sample Data**: Requires ~3 ETH (2 ETH deposit + 0.3 ETH community pools + 0.5 ETH staking)
- **DEX Sample Data**: Requires ~10 ETH (converted to WETH)

### Network Configuration

Ensure hardhat.config.js has correct network configuration:

```javascript
networks: {
  localhost: {
    url: "http://127.0.0.1:8545"
  },
  ganache: {
    url: "http://127.0.0.1:7545", 
    accounts: [/* private keys */]
  }
}
```

## 🔍 Verify Deployment Results

### 1. Check Contract Address File

```bash
cat src/contracts/addresses.json
```

Should contain all contract addresses and initialization status.

### 2. Start Frontend Verification
```bash
npm run dev
```

Visit `http://localhost:3000` and verify:
- All contracts are properly connected
- Sample data is visible in each module
- Basic operations work correctly

### 3. Manual Testing
```bash
# Check account balances
npx hardhat run scripts/utilities/check-user-data.js --network localhost

# Verify community pools
npx hardhat run scripts/utilities/check-bank-balance.js --network localhost

# Check DEX liquidity
npx hardhat run scripts/utilities/check-pool-status.js --network localhost
```

## 🎯 Sample Data Details

### Banking Module Data
- **6 Community Pools** with descriptions and initial funding
- **3 Savings Goals** with different terms and amounts
- **Initial Bank Deposit** of 2 ETH from deployer
- **Staking Position** of 0.5 ETH

### DEX Module Data
- **3 Trading Pairs** with realistic exchange rates
- **Initial Liquidity** sufficient for testing swaps
- **Token Balances** distributed to deployer account

### NFT Module Data (if enabled)
- **Sample NFTs** across different categories
- **Marketplace Listings** with various price points
- **Metadata** properly formatted and accessible

## 🔧 Troubleshooting

### Common Issues

**Insufficient Balance Error**
```bash
Error: sender doesn't have enough funds to send tx
```
Solution: Ensure deployer account has sufficient ETH (minimum 5 ETH recommended)

**Contract Already Deployed**
```bash
Error: Contract already deployed at address
```
Solution: Either use existing deployment or reset network state

**Sample Data Creation Fails**
```bash
Error: execution reverted
```
Solution: Check if contracts are properly initialized before adding sample data

### Network Reset Procedure

If you need to reset and redeploy:

```bash
# 1. Stop current network (Ctrl+C)
# 2. Restart network
npm run node

# 3. Redeploy with fresh state
npm run deploy
```

## 📚 Additional Resources

- [Quick Setup Guide](QUICK_SETUP_GUIDE.md)
- [Network Configuration Guide](NETWORK_GUIDE.md)
- [Development Scripts Guide](DEVELOPMENT_SCRIPTS_GUIDE.md)
- [Local Networks Guide](LOCAL_NETWORKS_GUIDE.md)

## 🎉 Success Indicators

After successful deployment, you should see:
- ✅ All contracts deployed and addresses saved
- ✅ Sample data visible in frontend
- ✅ Basic operations functional
- ✅ Test tokens available for experimentation

Ready to start building and testing! 🚀 