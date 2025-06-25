# Development Scripts Guide

## Overview

This guide provides detailed information about all available development scripts in the project, including contract deployment, network management, frontend development, and testing-related commands.

## 📦 Contract-Related Scripts

### Contract Compilation
```bash
# Compile all contracts
npm run compile

# Or use Hardhat directly
npx hardhat compile

# Clean compilation cache
npx hardhat clean
```

### Contract Deployment

**Complete Deployment (Recommended)**
```bash
# Deploy all contracts and test data
npm run deploy:full

# Equivalent command
node scripts/deploy-with-sample-data.js
```

**Step-by-Step Deployment**
```bash
# Deploy contracts only (without test data)
npm run deploy:contracts

# Deploy NFT test data only
npm run deploy:nft-data

# Deploy to specific network
npm run deploy:full -- --network anvil
npm run deploy:full -- --network ganache
```

### Contract Verification
```bash
# Verify contract deployment status
npm run verify:contracts

# Check contract addresses
node scripts/check-contracts.js

# Verify contract functionality
node scripts/test-contracts.js
```

## 🌐 Network Management Scripts

### Start Local Networks

**Anvil Network**
```bash
# Start Anvil (recommended)
npm run start:anvil

# Start with persistence
node scripts/start-networks.js anvil --persistent

# Start with custom configuration
node scripts/start-networks.js anvil --port 8546 --accounts 20
```

**Ganache Network**
```bash
# Start Ganache GUI
npm run start:ganache

# Start Ganache CLI
node scripts/start-networks.js ganache

# Custom configuration
npx ganache --deterministic --accounts 10 --host 0.0.0.0
```

**Hardhat Network**
```bash
# Start Hardhat node
npm run start:hardhat

# Or use directly
npx hardhat node
```

### Network Status Check
```bash
# Check all network status
npm run check:networks

# Check specific network
node scripts/check-network.js --network anvil
node scripts/check-network.js --network ganache
node scripts/check-network.js --network hardhat

# Quick status check
npm run status
```

### Network Reset
```bash
# Reset Anvil network
npm run reset:anvil

# Reset Ganache network
npm run reset:ganache

# Clean all network data
npm run clean:networks
```

## 🎨 Frontend Development Scripts

### Development Server
```bash
# Start frontend development server
npm run dev

# Start on specific port
npm run dev -- --port 3001

# Start and automatically open browser
npm run dev:open
```

### Build and Deploy
```bash
# Build production version
npm run build

# Preview build results
npm run preview

# Build and analyze bundle size
npm run build:analyze
```

### Code Quality
```bash
# Run ESLint check
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# Run Prettier formatting
npm run format

# Type checking (if using TypeScript)
npm run type-check
```

## 🧪 Testing Scripts

### Contract Testing
```bash
# Run all contract tests
npm run test

# Run specific test files
npx hardhat test test/Banking.test.js
npx hardhat test test/DEX.test.js
npx hardhat test test/NFTMarketplace.test.js

# Run tests with coverage report
npm run test:coverage
```

### Frontend Testing
```bash
# Run frontend unit tests
npm run test:frontend

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

### Integration Testing
```bash
# Run complete integration tests
npm run test:integration

# Test specific function modules
npm run test:banking
npm run test:dex
npm run test:nft
npm run test:governance
```

## 🛠️ Utility Scripts

### Data Management
```bash
# Reset all data
npm run reset:data

# Clear NFT data
npm run clear:nft-data

# Clear user data
npm run clear:user-data

# Backup current state
npm run backup:state
```

### Development Tools
```bash
# Generate documentation
npm run docs:generate

# Start documentation server
npm run docs:serve

# Update contract addresses
npm run update:addresses

# Check project health
npm run health:check
```

### Debugging Scripts
```bash
# Debug network connection
npm run debug:network

# Debug contract interactions
npm run debug:contracts

# Debug frontend issues
npm run debug:frontend

# View logs
npm run logs:view
```

## 🔧 Configuration Scripts

### Environment Setup
```bash
# Setup development environment
npm run setup:dev

# Setup production environment
npm run setup:prod

# Setup testing environment
npm run setup:test

# Install all dependencies
npm run install:all
```

### Network Configuration
```bash
# Configure Anvil
npm run config:anvil

# Configure Ganache
npm run config:ganache

# Configure Hardhat
npm run config:hardhat

# Reset network configuration
npm run config:reset
```

## 📊 Monitoring and Analytics

### Performance Monitoring
```bash
# Monitor contract performance
npm run monitor:contracts

# Monitor frontend performance
npm run monitor:frontend

# Monitor network performance
npm run monitor:network

# Generate performance report
npm run report:performance
```

### Analytics Scripts
```bash
# Analyze contract usage
npm run analyze:contracts

# Analyze user behavior
npm run analyze:users

# Analyze transaction patterns
npm run analyze:transactions

# Generate analytics report
npm run report:analytics
```

## 🚀 Deployment Scripts

### Local Deployment
```bash
# Quick local deployment
npm run deploy:local

# Full local setup
npm run setup:local

# Local with sample data
npm run deploy:local:sample
```

### Testnet Deployment
```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Deploy to Mumbai
npm run deploy:mumbai

# Deploy to Goerli
npm run deploy:goerli
```

### Production Deployment
```bash
# Deploy to mainnet (use with caution)
npm run deploy:mainnet

# Deploy to Polygon
npm run deploy:polygon

# Deploy to Arbitrum
npm run deploy:arbitrum
```

## 📋 Script Categories

### Essential Scripts (Daily Use)
```bash
npm run dev              # Start development server
npm run compile          # Compile contracts
npm run deploy:full      # Complete deployment
npm run test             # Run tests
npm run lint            # Code quality check
```

### Network Scripts
```bash
npm run start:anvil      # Start Anvil
npm run start:ganache    # Start Ganache
npm run start:hardhat    # Start Hardhat
npm run check:networks   # Check all networks
npm run reset:anvil      # Reset Anvil
```

### Development Scripts
```bash
npm run build           # Build production
npm run preview         # Preview build
npm run format          # Format code
npm run type-check      # Check types
npm run docs:generate   # Generate docs
```

### Testing Scripts
```bash
npm run test:coverage   # Test with coverage
npm run test:frontend   # Frontend tests
npm run test:e2e        # End-to-end tests
npm run test:integration # Integration tests
```

### Utility Scripts
```bash
npm run setup:dev       # Setup development
npm run reset:data      # Reset data
npm run backup:state    # Backup state
npm run health:check    # Check health
npm run update:addresses # Update addresses
```

## 🎯 Best Practices

### Script Usage Guidelines
1. **Always start with network setup**
   ```bash
   npm run start:anvil
   ```

2. **Deploy contracts before frontend**
   ```bash
   npm run deploy:full
   npm run dev
   ```

3. **Run tests regularly**
   ```bash
   npm run test
   npm run lint
   ```

4. **Use appropriate network for testing**
   - Anvil: For persistent development
   - Hardhat: For quick testing
   - Ganache: For GUI debugging

### Common Workflows

**Daily Development**
```bash
# Terminal 1: Start network
npm run start:anvil

# Terminal 2: Deploy and start frontend
npm run deploy:full
npm run dev

# Terminal 3: Run tests (optional)
npm run test:watch
```

**Testing Workflow**
```bash
# Run all tests
npm run test
npm run test:frontend
npm run test:e2e

# Check code quality
npm run lint
npm run type-check
```

**Deployment Workflow**
```bash
# Clean previous deployment
npm run clean:networks

# Start fresh network
npm run start:anvil --fresh

# Deploy with sample data
npm run deploy:full

# Verify deployment
npm run verify:contracts
```

## 🔍 Troubleshooting

### Common Script Issues

**Script Not Found**
```bash
# Check if script exists in package.json
npm run

# Update npm and dependencies
npm install
```

**Permission Issues**
```bash
# On Unix systems, ensure scripts are executable
chmod +x scripts/*.js

# Run with appropriate permissions
sudo npm run [script-name]
```

**Network Issues**
```bash
# Check network status
npm run check:networks

# Reset network configuration
npm run config:reset

# Restart networks
npm run reset:anvil
```

### Script Debugging
```bash
# Run scripts with verbose output
npm run [script-name] -- --verbose

# Debug specific script
node --inspect scripts/[script-name].js

# Check script logs
npm run logs:view
```

This comprehensive guide covers all available development scripts in the project. For specific script issues, refer to the individual script documentation or check the troubleshooting section.