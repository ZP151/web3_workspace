# Network Configuration Guide

## Overview

This guide provides detailed instructions on configuring MetaMask to connect to different local blockchain networks, including setup methods for Anvil, Ganache, and Hardhat networks.

## 🦊 MetaMask Installation and Setup

### 1. Install MetaMask

**Chrome Browser**
1. Visit [Chrome Web Store](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn)
2. Click "Add to Chrome"
3. Confirm installation

**Firefox Browser**
1. Visit [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/)
2. Click "Add to Firefox"
3. Confirm installation

**Edge Browser**
1. Visit [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/metamask/ejbalbakoplchlghecdalmeeeajnimhm)
2. Click "Get"
3. Confirm installation

### 2. Create or Import Wallet

**New Users - Create Wallet**
1. Click "Create New Wallet"
2. Set password (at least 8 characters)
3. Backup seed phrase (12 words)
4. Confirm seed phrase
5. Complete setup

**Existing Users - Import Wallet**
1. Click "Import Existing Wallet"
2. Enter 12-word seed phrase
3. Set new password
4. Complete import

## 🌐 Local Network Configuration

### Anvil Network Configuration

**Network Information**
- **Network Name**: `Anvil Local`
- **RPC URL**: `http://localhost:8546`
- **Chain ID**: `31338`
- **Currency Symbol**: `ETH`
- **Block Explorer URL**: Leave empty

**Adding Steps**
1. Open MetaMask extension
2. Click network dropdown in top right
3. Select "Add Network"
4. Click "Add Network Manually"
5. Fill in the above network information
6. Click "Save"

### Ganache Network Configuration

**Network Information**
- **Network Name**: `Ganache Local`
- **RPC URL**: `http://localhost:8545`
- **Chain ID**: `1337`
- **Currency Symbol**: `ETH`
- **Block Explorer URL**: Leave empty

**Adding Steps**
1. Open MetaMask extension
2. Click network dropdown in top right
3. Select "Add Network"
4. Click "Add Network Manually"
5. Fill in the above network information
6. Click "Save"

### Hardhat Network Configuration

**Network Information**
- **Network Name**: `Hardhat Local`
- **RPC URL**: `http://localhost:8545`
- **Chain ID**: `31337`
- **Currency Symbol**: `ETH`
- **Block Explorer URL**: Leave empty

**Adding Steps**
1. Open MetaMask extension
2. Click network dropdown in top right
3. Select "Add Network"
4. Click "Add Network Manually"
5. Fill in the above network information
6. Click "Save"

## 🔑 Import Test Accounts

### Get Private Keys

**Anvil Network**
```bash
# After starting Anvil, terminal will display accounts and private keys
node scripts/start-networks.js anvil --persistent

# Example output:
# (0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
# Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Ganache GUI**
1. Open Ganache application
2. Find the account you want to import in the account list
3. Click the 🔑 icon to the right of the account
4. Copy the displayed private key

**Ganache Command Line**
```bash
# After starting Ganache, terminal will display accounts and private keys
npx ganache --deterministic --accounts 10

# Example output:
# (0) 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 (1000 ETH)
# Private Key: 0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
```

## 💡 Web3 Account Behavior Explanation

### MetaMask Account Behavior
When you switch networks in MetaMask, **the same wallet address is used across all networks**. This is standard Web3 behavior.

### What Changes When Switching Networks:
1. **Balance**: Each network has its own native token balance
2. **Transaction History**: Network-specific transaction records
3. **Contract Addresses**: Smart contracts are deployed separately on each network
4. **Gas Fees**: Different networks have different fee structures

### What Remains Constant:
1. **Wallet Address**: Your address (like 0xf39F...) is the same across all networks
2. **Private Key**: The cryptographic key that controls your account
3. **Account Access**: You maintain control across all networks

### Import Account to MetaMask

**Steps**
1. Open MetaMask extension
2. Click account icon in top right
3. Select "Import Account"
4. Select "Private Key" as import type
5. Paste the copied private key
6. Click "Import"
7. Set an easily recognizable name for the account (like "Anvil Test 1")

**Recommended Test Accounts**

**Anvil Default Accounts (first 3):**
```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Balance: 10000 ETH

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
Balance: 10000 ETH

Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
Balance: 10000 ETH
```

**Ganache Default Accounts (first 3):**
```
Account #0: 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
Private Key: 0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
Balance: 1000 ETH

Account #1: 0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0
Private Key: 0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1
Balance: 1000 ETH

Account #2: 0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b
Private Key: 0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c
Balance: 1000 ETH
```

## 🔄 Network Switching

### Switch Networks Using MetaMask
1. Click network dropdown in MetaMask extension
2. Select the network to switch to
3. Wait for connection confirmation
4. Refresh application page (if needed)

### Use In-App Network Switcher
Our application provides convenient network switching functionality:
1. Find the network status indicator in the top right of the app
2. Click the network name or status icon
3. Select target network from dropdown menu
4. Application will automatically handle network switching

### Network Status Indicator
- 🟢 **Green**: Network connection normal
- 🟡 **Yellow**: Network connecting or syncing
- 🔴 **Red**: Network connection failed
- ⚪ **Gray**: Network not connected

## 🔧 Advanced Configuration

### Custom RPC Settings
For advanced users, you can configure custom RPC settings:

**Gas Price Configuration**
- **Anvil**: Uses default gas price (1 gwei)
- **Ganache**: Configurable in GUI settings
- **Hardhat**: Automatic gas price estimation

**Block Time Configuration**
- **Anvil**: Instant mining by default
- **Ganache**: 0-14 second block times
- **Hardhat**: Instant mining by default

### Network Switching Automation
Our application can automatically detect and switch networks:

```javascript
// Example: Automatic network detection
const detectNetwork = async () => {
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  switch (chainId) {
    case '0x7A69': // 31337 - Hardhat
      return 'hardhat';
    case '0x7A6A': // 31338 - Anvil
      return 'anvil';
    case '0x539': // 1337 - Ganache
      return 'ganache';
    default:
      return 'unknown';
  }
};
```

## 🛠️ Troubleshooting

### Common Issues

**MetaMask Connection Problems**
1. **Cannot connect to local network**
   - Ensure blockchain network is running
   - Verify RPC URL is correct
   - Check firewall settings

2. **Wrong network displayed**
   - Manually switch network in MetaMask
   - Refresh application page
   - Check Chain ID configuration

3. **Transaction failures**
   - Ensure sufficient ETH balance for gas
   - Verify connected to correct network
   - Reset account nonce if needed

**Account Import Issues**
1. **Private key not working**
   - Ensure private key format is correct (64 hex characters)
   - Remove '0x' prefix if present during import
   - Check for extra spaces or characters

2. **Account balance not showing**
   - Ensure connected to correct network
   - Wait for network synchronization
   - Refresh MetaMask

**Network Configuration Problems**
1. **RPC URL not responding**
   - Verify blockchain network is running
   - Check port number is correct
   - Ensure no firewall blocking connection

2. **Wrong Chain ID**
   - Verify Chain ID matches network configuration
   - Check hardhat.config.js settings
   - Restart network if needed

### Reset Network Configuration

If you need to reset network configuration:

1. **Reset MetaMask Network**
   - Remove custom network from MetaMask
   - Re-add with correct configuration
   - Import accounts again

2. **Reset Application State**
   ```bash
   # Clear browser local storage
   # Or refresh page with hard reload (Ctrl+F5)
   ```

3. **Restart Blockchain Network**
   ```bash
   # Stop current network (Ctrl+C)
   # Restart with fresh state
   node scripts/start-networks.js anvil --persistent --fresh
   ```

## 📚 Additional Resources

### Network Documentation
- [Anvil Documentation](https://book.getfoundry.sh/anvil/)
- [Hardhat Network Documentation](https://hardhat.org/hardhat-network/)
- [Ganache Documentation](https://trufflesuite.com/ganache/)

### MetaMask Help
- [MetaMask Documentation](https://docs.metamask.io/)
- [Adding Custom Networks](https://support.metamask.io/hc/en-us/articles/360043227612)
- [Importing Accounts](https://support.metamask.io/hc/en-us/articles/360015489331)

### Debugging Tools
- Browser Developer Tools (F12)
- MetaMask Activity Tab
- Network logs in terminal

## 🎯 Best Practices

### Development Workflow
1. Start with Anvil for persistence
2. Use Hardhat for quick testing
3. Test on Ganache for GUI debugging
4. Always verify network configuration
5. Keep private keys secure

### Security Considerations
- Never use development private keys on mainnet
- Keep test accounts separate from real funds
- Regularly backup important configurations
- Use hardware wallets for mainnet operations

### Performance Tips
- Use Anvil for best performance
- Enable persistence to avoid redeployment
- Monitor gas usage and optimization
- Use appropriate block confirmation times

This concludes the Network Configuration Guide. For additional help, refer to the troubleshooting section or check the project documentation.