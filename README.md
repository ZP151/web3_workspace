# 🚀 Web3 Smart Contract Platform

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

# Install all dependencies (includes all necessary libraries)
npm install

# If installation fails, try clearing cache and reinstalling
npm cache clean --force
npm install
```

> 💡 **Note**: First-time installation may take several minutes as it includes all Web3 development libraries

### 2. Install MetaMask Browser Extension

1. **Download and Install MetaMask**
   - Chrome: https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/
   - Edge: https://microsoftedge.microsoft.com/addons/detail/metamask/ejbalbakoplchlghecdalmeeeajnimhm

2. **Create or Import Wallet** (follow MetaMask setup guide)

### 3. Start Local Blockchain

**Option 1: Ganache GUI Application (Recommended)**
1. Download Ganache GUI: https://trufflesuite.com/ganache/
2. Install and launch Ganache, recommend "Quick Start" for easy setup
3. If creating custom workspace, configure:
   - **Port**: 8545
   - **Network ID**: 1337
   - **Account Count**: 10
   - **Mnemonic**: Use fixed mnemonic for consistent addresses

**Option 2: Command Line**
```bash
# If you don't have Ganache GUI, use command line
npx ganache --deterministic --accounts 10 --host 0.0.0.0 --port 8545 --networkId 1337 --chain.chainId 1337
```

### 4. Compile Smart Contracts
```bash
# Compile all smart contracts
npm run compile
```

### 5. Deploy All Contracts and Data
```bash
# Deploy contracts and create test data
npx hardhat run scripts/deploy-and-setup-all.js --network ganache
```

### 6. Start Frontend Application
```bash
# Start development server
npm run dev
```

Visit `http://localhost:3000` to start using the platform!

## 🔧 MetaMask Configuration Guide

### Step 1: Add Ganache Network
1. Open MetaMask extension
2. Click the network dropdown at the top left
3. Select "Add a custom network"
4. Fill in the following information:
   - **Network Name**: `Ganache Local`
   - **New RPC URL**: `http://localhost:8545`
   - **Chain ID**: `1337`
   - **Currency Symbol**: `ETH`
   - **Block Explorer URL**: Leave empty
5. Click "Save"

### Step 2: Import Test Accounts
Use the following private keys to import Ganache test accounts (each has 1000 ETH):

**How to get private keys:**
1. Open Ganache GUI application
2. View all accounts in the main interface
3. Click the 🔑 icon next to any account to view private key
4. Copy the private key for MetaMask import

![Ganache Account Interface](resources/image.png)


### MetaMask Import Steps:
1. **Open MetaMask extension**
2. **Click the account dropdown** (shows current account name)
3. **Select "Add account or hardware wallet"**
4. **Choose "Import account"**
5. **Select "Private Key" in "Select Type"**
6. **Paste private key into input field**
7. **Click "Import" button**
8. **Set a recognizable name** (e.g., "Ganache Account 1")
9. **Repeat for multiple test accounts**

> 📝 **Suggestion**: Give each account a meaningful name like "Deployer Account", "Test Account 1", etc., for easy identification

> ⚠️ **Security Warning**: These private keys are for local development testing only, never use on mainnet!

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

## 🛠️ Development Scripts

```bash
# Contract related
npm run compile              # Compile smart contracts
npm run test                # Run contract tests

# Deployment related
npx hardhat run scripts/deploy-and-setup-all.js --network ganache    # Full deployment
npx hardhat run scripts/setup-complete-nft-data.js --network ganache # NFT data only

# Network check
npx hardhat run scripts/test-network-stability.js --network ganache  # Check network status

# Frontend related
npm run dev                 # Start development server
npm run build              # Build for production
npm run start              # Start production server
```

### 🔍 Quick Status Check
Run these commands to verify environment setup:
```bash
# 1. Check Node.js version
node --version

# 2. Check dependency installation
npm list --depth=0

# 3. Compile contracts
npm run compile

# 4. Check Ganache connection
npx hardhat run scripts/test-network-stability.js --network ganache
```

## 🔄 Environment Reset

When Ganache network is reset, simply run:
```bash
npx hardhat run scripts/deploy-and-setup-all.js --network ganache
```

This will automatically:
- Redeploy all contracts
- Create test tokens (USDC, DAI, WETH)
- Initialize DEX pools
- Create NFT test data
- Create voting proposals
- Update configuration files

## 📊 Test Data

The deployment script automatically creates:
- **Smart Contracts**: 7 core contracts
- **Test Tokens**: USDC, DAI, WETH
- **DEX Pools**: 3 trading pairs with liquidity
- **NFT Data**: 20 different types of NFTs
- **Voting Proposals**: 3 governance proposals

## 🎯 Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── banking/           # Banking system
│   ├── dex/              # DEX exchange
│   ├── nft/              # NFT marketplace
│   ├── tokens/           # Token factory
│   └── voting/           # Governance voting
├── components/            # React components
├── lib/                  # Utility libraries
└── config/               # Configuration files

contracts/                 # Smart contracts
├── EnhancedBank.sol      # Banking contract
├── DEXPlatform.sol       # DEX contract
├── NFTMarketplace.sol    # NFT marketplace
├── TokenFactory.sol      # Token factory
└── VotingCore.sol        # Voting contract

scripts/                  # Deployment scripts
├── deploy-and-setup-all.js    # Complete deployment script
└── setup-complete-nft-data.js # NFT data script
```

## 🔒 Security Features

- OpenZeppelin security libraries
- Reentrancy attack protection
- Access control mechanisms
- Input validation and boundary checks
- Safe mathematical operations

## 💡 Usage Tips

- **Network Switching**: Use in-app network switching buttons
- **Account Management**: Switch between different test accounts in MetaMask
- **Transaction Confirmation**: Watch for MetaMask popups for transaction confirmation
- **Balance Refresh**: Pages automatically refresh balances after transactions
- **Error Handling**: Check browser console for detailed error information

## 📚 Technology Stack

- **Frontend**: React 18, Next.js 14, TypeScript, Tailwind CSS
- **Web3**: Wagmi, RainbowKit, Ethers.js v6
- **Smart Contracts**: Solidity 0.8.x, Hardhat, OpenZeppelin
- **Development Tools**: Ganache, MetaMask, Hardhat Network

## 🆘 Common Issues

**Setup Problems?**
- Ensure Node.js 18+ is installed
- Clear npm cache: `npm cache clean --force`
- Check Ganache is running on port 8545

**MetaMask Issues?**
- Verify network is set to Chain ID 1337
- Ensure accounts are imported correctly
- Check sufficient ETH balance for transactions

**Contract Deployment Fails?**
```bash
npm run compile
npx hardhat run scripts/deploy-and-setup-all.js --network ganache
```

> 📖 **Need Help?** See detailed troubleshooting in [`docs/QUICK_SETUP_GUIDE.md`](docs/QUICK_SETUP_GUIDE.md)

## 🌐 Multi-Chain Support

Deploy to testnets and mainnets:
- **Testnets**: Sepolia, Mumbai, Goerli
- **Mainnets**: Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche

```bash
# Deploy to testnet
npx hardhat run scripts/deploy-and-setup-all.js --network sepolia
```

> ⚙️ **Production Setup**: See environment configuration in [`docs/QUICK_SETUP_GUIDE.md`](docs/QUICK_SETUP_GUIDE.md)

## 📄 Detailed Documentation

See [`docs/QUICK_SETUP_GUIDE.md`](docs/QUICK_SETUP_GUIDE.md) for more detailed setup instructions.

---

**Start Your Web3 Development Journey!** 🚀 