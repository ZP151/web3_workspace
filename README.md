# Web3 Workspace

A comprehensive decentralized application platform featuring banking system, DEX exchange, NFT marketplace, token factory, and governance voting.

> 📖 **Language**: [English](README.md) | [中文](README_CN.md)

## ✨ Key Features

- 🏦 **Banking System** - Deposits, loans, and staking functionality
- 🔄 **DEX Exchange** - Token swapping and liquidity mining
- 🎨 **NFT Marketplace** - Mint and trade NFTs
- 🏭 **Token Factory** - Create custom ERC20 tokens
- 🗳️ **Governance Voting** - Community proposals and voting

## 🚀 Quick Start

### 1. Environment Setup

**Prerequisites**
- Node.js 18+ (LTS version recommended)
- Git
- Modern browser (Chrome/Firefox/Edge)

```bash
# Clone the project
git clone https://github.com/ZP151/web3_workspace.git
cd web3_workspace

# Install dependencies
npm install
```

> 📖 **Detailed Setup**: See [Environment Setup Guide](docs/QUICK_SETUP_GUIDE.md) for troubleshooting

### 2. Install MetaMask

Download and install MetaMask browser extension, then create or import a wallet.

> 📖 **MetaMask Guide**: See [Network Configuration Guide](docs/NETWORK_GUIDE.md) for detailed setup

### 3. Start Local Blockchain

**Option 1: Anvil (Foundry) - Recommended**
```bash
# Start Anvil with persistence
node scripts/start-networks.js anvil --persistent
```

**Option 2: Ganache**
```bash
# Command line version
npx ganache --deterministic --accounts 10 --host 0.0.0.0 --port 8545
```

> 📖 **Installation Guides**: 
> - [Anvil Installation Guide](docs/ANVIL_INSTALLATION_GUIDE.md)
> - [Local Networks Guide](docs/LOCAL_NETWORKS_GUIDE.md)

### 4. Deploy Contracts
```bash
# Compile contracts
npm run compile

# Deploy to Anvil (recommended)
npx hardhat run scripts/deploy-master.js --network anvil

# Deploy to Ganache
node scripts/deployment/deploy-to-ganache.js
```

> 📖 **Deployment Guide**: See [Deployment with Sample Data Guide](docs/DEPLOYMENT_WITH_SAMPLE_DATA_GUIDE.md)

### 5. Start Frontend
```bash
npm run dev
```

Visit `http://localhost:3000` to start using the platform!

## 🔧 MetaMask Configuration

After starting your local blockchain, configure MetaMask to connect to it:

1. **Add Local Network** - Add your local blockchain network (Anvil/Ganache)
2. **Import Test Accounts** - Import private keys from your local blockchain

> 📖 **Detailed Guide**: See [Network Configuration Guide](docs/NETWORK_GUIDE.md) for step-by-step instructions

## 📱 Feature Modules

### 🏦 Banking System (`/banking`)
- Earn interest on deposits (5% annual rate)
- Request loans (8.5% annual rate, 150% collateral ratio)
- Staking rewards (12.5% annual rate, 7-day lock period)
- Real-time earnings and status tracking

### 🔄 DEX Exchange (`/dex`)
- Swap WETH/USDC/DAI tokens
- Add liquidity to earn fees
- View real-time prices and slippage
- Liquidity mining rewards

### 🎨 NFT Marketplace (`/nft`)
- Mint personal NFTs (0.001 ETH)
- Purchase NFTs from marketplace
- List your NFTs for sale
- View NFT collections and statistics

### 🏭 Token Factory (`/tokens`)
- Create custom ERC20 tokens
- Set token name, symbol, and supply
- View created tokens
- Token management features

### 🗳️ Governance Voting (`/voting`)
- Create governance proposals
- Participate in community voting
- View proposal status and results
- Transparent governance process

## 🛠️ Development Commands

```bash
# Basic commands
npm run compile              # Compile smart contracts
npm run dev                 # Start development server
npm run build              # Build for production

# Deployment
npx hardhat run scripts/deploy-master.js --network anvil     # Deploy to Anvil
node scripts/deployment/deploy-to-ganache.js # Deploy to Ganache
```

> 📖 **More Scripts**: See [Development Scripts Guide](docs/DEVELOPMENT_SCRIPTS_GUIDE.md) for all available commands

## 🔄 Network Reset

When your local blockchain resets, simply redeploy:
```bash
# For Anvil
npx hardhat run scripts/deploy-master.js --network anvil

# For Ganache
node scripts/deployment/deploy-to-ganache.js
```

## 📊 What You Get

After deployment, you'll have:
- **7 Smart Contracts** - Banking, DEX, NFT, Token Factory, Voting
- **Test Tokens** - USDC, DAI, WETH with liquidity pools
- **Sample NFTs** - 20 different NFTs across various categories
- **Governance Proposals** - 3 sample voting proposals

## 🎯 Project Structure

```
src/app/                   # Frontend pages (banking, dex, nft, etc.)
contracts/                 # Smart contracts (.sol files)
scripts/                   # Deployment and utility scripts
docs/                      # Detailed documentation
```

## 💡 Key Features

- **Security**: OpenZeppelin libraries, reentrancy protection
- **Modern Stack**: React 18, Next.js 14, TypeScript, Tailwind CSS
- **Web3 Integration**: Wagmi, RainbowKit, Ethers.js v6
- **Development Tools**: Anvil, Ganache, Hardhat support

## 🆘 Troubleshooting

**Common Issues:**
- Node.js version compatibility
- Network connection problems
- MetaMask configuration
- Contract deployment failures

> 📖 **Detailed Solutions**: See [Quick Setup Guide](docs/QUICK_SETUP_GUIDE.md) for troubleshooting

## 📄 Documentation

- 📋 [Quick Setup Guide](docs/QUICK_SETUP_GUIDE.md) - Detailed installation and troubleshooting
- 🔧 [Anvil Installation Guide](docs/ANVIL_INSTALLATION_GUIDE.md) - Install Foundry and Anvil
- 🌐 [Network Configuration Guide](docs/NETWORK_GUIDE.md) - MetaMask and network setup
- 🚀 [Deployment Guide](docs/DEPLOYMENT_WITH_SAMPLE_DATA_GUIDE.md) - Contract deployment and scripts
- 🏪 [Local Networks Guide](docs/LOCAL_NETWORKS_GUIDE.md) - Anvil vs Ganache comparison
- 🔄 [DEX Functionality Guide](docs/DEX_FUNCTIONALITY_GUIDE.md) - DEX features and usage

## 🌐 Multi-Chain Support

Supports deployment to testnets and mainnets including Ethereum, Polygon, BSC, Arbitrum, and more.

> 📖 **Production Setup**: See [Network Configuration Guide](docs/NETWORK_GUIDE.md)

---

**Start Your Web3 Development Journey!** 🚀