# 🚀 Web3 Platform Quick Setup Guide

## Overview
This guide will help you quickly deploy and set up a complete Web3 platform, including all smart contracts and test data. This guide contains detailed installation steps, environment configuration, and troubleshooting solutions.

## 🛠️ Environment Requirements

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux
- **Memory**: At least 4GB RAM (8GB+ recommended)
- **Storage**: 2GB available space
- **Network**: Stable internet connection

### Required Software
1. **Node.js 18+** (LTS version)
   - Download: [nodejs.org](https://nodejs.org/)
   - Verify: `node --version`

2. **Git** 
   - Windows: [git-scm.com](https://git-scm.com/download/win)
   - macOS: `brew install git`
   - Linux: `sudo apt install git`

3. **MetaMask Browser Extension**
   - Chrome: [Chrome Web Store](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn)
   - Firefox: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/)

## 📦 Project Installation

### 1. Clone Project
```bash
git clone https://github.com/ZP151/web3_workspace.git
cd web3_workspace
```

### 2. Install Dependencies
```bash
# Install all dependencies
npm install

# If installation fails, try clearing cache
npm cache clean --force
npm install
```

### 3. Verify Installation
```bash
# Check Node.js version
node --version

# Check dependency installation
npm list --depth=0

# Test contract compilation
npm run compile
```

## 🌐 Blockchain Network Selection

### Option 1: Anvil (Foundry) - Recommended
**Advantages**: Data persistence, fast startup, low memory usage

```bash
# Install Foundry (if not installed)
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc && foundryup

# Start Anvil network
node scripts/start-networks.js anvil --persistent
```

> 📖 **Detailed Installation**: See [Anvil Installation Guide](ANVIL_INSTALLATION_GUIDE.md)

### Option 2: Ganache
**Advantages**: Graphical interface, easy to use

```bash
# Method 1: Command line startup
npx ganache --deterministic --accounts 10 --host 0.0.0.0 --port 8545 --networkId 1337 --chain.chainId 1337

# Method 2: Download Ganache GUI
# Visit: https://trufflesuite.com/ganache/
```

> 📖 **Detailed Configuration**: See [Local Networks Guide](LOCAL_NETWORKS_GUIDE.md)

### Option 3: Hardhat Network
**Advantages**: Integrated development environment

```bash
# Hardhat network will start automatically during deployment
npx hardhat run scripts/deploy-master.js --network hardhat
```

## 🔧 MetaMask Configuration

### Add Local Network
1. Open MetaMask extension
2. Click network dropdown menu
3. Select "Add Custom Network"
4. Fill in network information:
   - **Anvil**: RPC URL: `http://localhost:8546`, Chain ID: `31338`
   - **Ganache**: RPC URL: `http://localhost:8545`, Chain ID: `1337`
   - **Hardhat**: RPC URL: `http://localhost:8545`, Chain ID: `31337`

### Import Test Accounts
1. Copy private keys displayed by the blockchain network
2. In MetaMask, select "Import Account"
3. Paste private key and set account name

> 📖 **Detailed Steps**: See [Network Configuration Guide](NETWORK_GUIDE.md)

## 🛠️ Available Scripts

### 1. Complete Deployment Script (Recommended)
```bash
# Deploy to Anvil (recommended)
npx hardhat run scripts/deploy-master.js --network anvil

# Deploy to Ganache
npx hardhat run scripts/deploy-master.js --network ganache

# Deploy to Hardhat
npx hardhat run scripts/deploy-master.js --network hardhat
```

**Features:**
- ✅ Deploy all smart contracts (EnhancedBank, TokenFactory, DEXPlatform, PlatformNFT, NFTMarketplace, VotingCore)
- ✅ Deploy test tokens (USDC, DAI, WETH)
- ✅ Initialize DEX trading pools and add liquidity
- ✅ Create NFT test data (8 NFTs, some listed for sale)
- ✅ Create voting proposals (3 proposals)
- ✅ Automatically save contract address configuration

### 2. NFT Data Setup Script Only
```bash
npx hardhat run scripts/setup-complete-nft-data.js --network ganache
```

**Features:**
- 🎨 Create 20 different types of NFTs (art, avatars, games, music, sports, collectibles, photography)
- 🏪 Automatically list some NFTs on the marketplace
- 📊 Provide detailed category and rarity statistics
- 👥 Distribute to different user accounts

## 📋 Usage Steps

### First Time Setup

1. **Start Ganache Network**
   ```bash
   npx ganache --deterministic --accounts 10 --host 0.0.0.0 --port 8545 --networkId 1337 --chain.chainId 1337
   ```

2. **Run Complete Deployment Script**
   ```bash
   # Deploy to your chosen network (Anvil recommended)
   npx hardhat run scripts/deploy-master.js --network anvil
   
   # Or deploy to Ganache
   npx hardhat run scripts/deploy-master.js --network ganache
   ```

3. **Start Frontend Application**
   ```bash
   npm run dev
   ```

4. **Configure MetaMask**
   - Add Ganache network (RPC: http://localhost:8545, Chain ID: 1337)
   - Import Ganache account private keys for testing

### Quick Recovery After Ganache Reset

When your local network is reset, just run one command:

```bash
# For Anvil (recommended)
npx hardhat run scripts/deploy-master.js --network anvil

# For Ganache
npx hardhat run scripts/deploy-master.js --network ganache

# For Hardhat
npx hardhat run scripts/deploy-master.js --network hardhat
```

This script will automatically:
- Redeploy all contracts
- Recreate all test data
- Update configuration files
- Prepare a complete platform ready for immediate use

### Add More NFT Data Only

If you only want to add more NFT test data:

```bash
npx hardhat run scripts/setup-complete-nft-data.js --network ganache
```

## 📊 Post-Deployment Data

### Smart Contracts
- **EnhancedBank**: Banking system (deposits, loans, staking)
- **TokenFactory**: Token factory
- **DEXPlatform**: Decentralized exchange
- **PlatformNFT**: NFT contract
- **NFTMarketplace**: NFT marketplace
- **VotingCore**: Voting governance system

### Test Tokens
- **WETH**: Wrapped Ethereum
- **USDC**: USD Stablecoin (6 decimals)
- **DAI**: DAI Stablecoin (18 decimals)

### DEX Trading Pools
- WETH/USDC Pool (1 WETH = 2000 USDC)
- WETH/DAI Pool (1 WETH = 2000 DAI)
- USDC/DAI Pool (1 USDC = 1 DAI)

### NFT Test Data
- **Categories**: Art, Avatars, Games, Music, Sports, Collectibles, Photography
- **Quantities**: 20 NFTs total
- **Marketplace**: 50% listed for sale
- **Price Range**: 0.01 - 1.0 ETH

### Community Pools
- **Community Development Fund**: 0.1 ETH
- **Education Scholarship Pool**: 0.1 ETH
- **Environmental Action Fund**: 0.1 ETH
- **Startup Incubator Pool**: 0 ETH
- **Medical Aid Fund**: 0 ETH
- **Arts & Culture Support**: 0 ETH

### Voting Proposals
- **Proposal 1**: "Increase Community Development Fund"
- **Proposal 2**: "Launch New DeFi Products"
- **Proposal 3**: "Platform UI/UX Improvements"

## 🚀 Quick Start Commands

### Full Platform Setup (One Command)
```bash
# Terminal 1: Start network (choose one)
# Option 1: Anvil (recommended)
node scripts/start-networks.js anvil --persistent

# Option 2: Ganache
npx ganache --deterministic --accounts 10 --host 0.0.0.0 --port 8545 --networkId 1337 --chain.chainId 1337

# Terminal 2: Deploy everything (match your network choice)
# For Anvil
npx hardhat run scripts/deploy-master.js --network anvil

# For Ganache
npx hardhat run scripts/deploy-master.js --network ganache

# Terminal 3: Start frontend
npm run dev
```

### Alternative Networks
```bash
# Using Anvil (Recommended)
node scripts/start-networks.js anvil --persistent
npx hardhat run scripts/deploy-master.js --network anvil

# Using Hardhat
npx hardhat node
npx hardhat run scripts/deploy-master.js --network hardhat
```

## 🔍 Verification

### 1. Check Contract Addresses
```bash
cat src/contracts/addresses.json
```

### 2. Test Frontend Features
- Visit `http://localhost:3000`
- Connect MetaMask
- Test each module:
  - Banking: Deposits, loans, staking
  - DEX: Token swapping, liquidity
  - NFT: Minting, marketplace
  - Voting: Proposals, voting

### 3. Verify Test Data
- Check account balances
- Verify NFT collections
- Test community pools
- Review voting proposals

## 🐛 Troubleshooting

### Common Issues

1. **Contract Deployment Fails**
   ```bash
   # Clear cache and try again
   npx hardhat clean
   npx hardhat compile
   ```

2. **MetaMask Connection Issues**
   - Ensure correct network configuration
   - Check account has enough ETH for gas
   - Reset MetaMask account if needed

3. **Frontend Not Loading**
   ```bash
   # Restart development server
   npm run dev
   ```

4. **Transaction Failures**
   - Check gas settings
   - Verify account balances
   - Ensure contracts are deployed

### Get Help

- Check console logs for error messages
- Verify network connectivity
- Ensure all dependencies are installed
- Check contract addresses in `addresses.json`

## 📚 Additional Resources

- [Local Networks Guide](LOCAL_NETWORKS_GUIDE.md)
- [Network Configuration Guide](NETWORK_GUIDE.md)
- [Anvil Installation Guide](ANVIL_INSTALLATION_GUIDE.md)
- [Development Scripts Guide](DEVELOPMENT_SCRIPTS_GUIDE.md)
- [Deployment with Sample Data Guide](DEPLOYMENT_WITH_SAMPLE_DATA_GUIDE.md)
- [NFT Image Generation Guide](NFT_IMAGE_GENERATION_GUIDE.md)
- [DEX Functionality Guide](DEX_FUNCTIONALITY_GUIDE.md)

## 🎉 Success!

Once everything is set up, you'll have a fully functional Web3 platform with:
- Complete DeFi banking system
- Decentralized exchange with liquidity pools
- NFT minting and marketplace
- Governance voting system
- Rich test data for immediate testing

Happy building! 🚀