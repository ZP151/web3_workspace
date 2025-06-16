# 🚀 Modern Web3 Smart Contract Platform

A modern decentralized application built with cutting-edge Web3 technologies including React, Next.js, Wagmi, RainbowKit, and Hardhat.

## 🛠️ Technology Stack

### Frontend
- **React.js 18** with TypeScript
- **Next.js 14** with App Router
- **Tailwind CSS** for styling
- **Responsive Design** for all devices

### Web3 Integration
- **Wagmi React Hooks** for blockchain interactions
- **RainbowKit** for wallet connections
- **Ethers.js v6** for contract interactions
- **Multi-chain Support** (Ethereum, Polygon, etc.)

### Smart Contract Development
- **Solidity 0.8.x** for contract development
- **Hardhat** development environment
- **OpenZeppelin** security libraries
- **Automated Testing** with comprehensive test suites

## 🏗️ Features

### Decentralized Voting System
- Create and manage proposals
- Weighted voting mechanisms
- Automatic proposal execution
- Transparent governance

### DeFi Banking System
- Deposit and earn interest
- Real-time yield calculation
- Secure fund management
- Transaction history tracking

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 18+ and npm
- MetaMask or compatible wallet
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd web3_workspace
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp env.example .env.local
# Edit .env.local with your configuration
```

## 🌐 Local Networks Configuration

This platform supports two local blockchain networks for development:

### Option 1: Hardhat Network (Recommended)
- **Chain ID**: 31337
- **Port**: 8545
- **Auto-deployment**: Yes

#### Quick Start with Hardhat:
```bash
# Terminal 1: Start Hardhat network with auto-deployed contracts
npm run node

# Terminal 2: Start the frontend
npm run dev
```

Access the application at `http://localhost:3001`

#### Hardhat Features:
- Contracts auto-deploy on network start
- Built-in test accounts with 10,000 ETH each
- Console logging and debugging
- Deterministic addresses

### Option 2: Ganache Network
- **Chain ID**: 1337
- **Port**: 7545
- **Manual deployment**: Required

#### Setup with Ganache:
```bash
# 1. Start Ganache on port 7545 (using Ganache GUI or CLI)
ganache-cli --port 7545 --networkId 1337

# 2. Deploy contracts to Ganache
npm run deploy:ganache

# 3. Start the frontend
npm run dev
```

#### Ganache Features:
- Visual interface (if using Ganache GUI)
- Custom account management
- Manual contract deployment
- Network state persistence

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start Next.js development server
npm run build        # Build for production
npm run start        # Start production server

# Smart Contracts
npm run compile      # Compile smart contracts
npm run test         # Run contract tests
npm run node         # Start Hardhat network

# Deployment
npm run deploy:local    # Deploy to Hardhat localhost
npm run deploy:ganache  # Deploy to Ganache network
npm run deploy:sepolia  # Deploy to Sepolia testnet
```

## 🔗 Wallet Connection

### Supported Wallets
- MetaMask
- WalletConnect
- Coinbase Wallet
- Rainbow Wallet

### Network Switching
The application provides easy network switching buttons:
- **Hardhat**: Quick switch to Hardhat local network
- **Ganache**: Quick switch to Ganache local network

### Test Accounts (Hardhat)
The following test accounts are available with Hardhat:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

## 📱 Application Features

### 🗳️ Voting System (`/voting`)
- Connect wallet to participate
- Create new proposals with custom parameters
- Vote on active proposals
- View proposal status and progress
- Automatic execution when thresholds are met

### 🏦 Banking System (`/banking`)
- Deposit ETH to earn interest
- Real-time yield calculations
- Withdraw funds anytime
- Track transaction history
- View yield forecasts

## 🔧 Configuration

### Environment Variables

Create `.env.local` file:
```env
# Contract Addresses (auto-filled for local development)
NEXT_PUBLIC_VOTING_CORE_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_SIMPLE_BANK_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

# Optional: Production API keys
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-project-id
NEXT_PUBLIC_ALCHEMY_API_KEY=your-alchemy-key
NEXT_PUBLIC_INFURA_PROJECT_ID=your-infura-key
```

### Smart Contract Addresses

#### Hardhat Network (Chain ID: 31337)
- **VotingCore**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **SimpleBank**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

#### Ganache Network (Chain ID: 1337)
- Addresses generated after manual deployment

## 🚀 Deployment to Testnets

### Sepolia Testnet
```bash
npm run deploy:sepolia
```

### Mumbai Testnet
```bash
npm run deploy:mumbai
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run with gas reporting
REPORT_GAS=true npm run test
```

## 🎯 Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── banking/        # Banking system page
│   ├── voting/         # Voting system page
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── ui/            # UI components
│   └── WalletConnection.tsx
├── lib/               # Utility libraries
│   └── wagmi.ts       # Wagmi configuration
contracts/             # Smart contracts
├── VotingCore.sol     # Voting governance contract
└── SimpleBank.sol     # Banking contract
scripts/               # Deployment scripts
└── deploy.js          # Contract deployment
```

## 🔒 Security Features

- OpenZeppelin security libraries
- Reentrancy protection
- Access control mechanisms
- Input validation
- Safe math operations

## 🌟 Modern UX Features

- Responsive design for mobile and desktop
- Real-time transaction feedback
- Loading states and error handling
- Toast notifications
- Network status indicators
- Automatic wallet reconnection

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Wagmi Documentation](https://wagmi.sh)
- [RainbowKit Documentation](https://www.rainbowkit.com)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with modern Web3 technologies for the decentralized future** 🚀 