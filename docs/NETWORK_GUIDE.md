# Network Switching and Account Management Guide

## Understanding Web3 Account Behavior

### MetaMask Account Behavior
When you switch networks in MetaMask or using our NetworkSwitcher component, **the same wallet address is used across all networks**. This is the standard Web3 behavior and is expected.

### What Changes When Switching Networks:
1. **Balance**: Each network has its own native token balance
2. **Transaction History**: Network-specific transaction records
3. **Contract Addresses**: Smart contracts are deployed separately on each network
4. **Gas Fees**: Different networks have different fee structures

### What Stays the Same:
1. **Wallet Address**: Your address (e.g., 0xf39F...) remains identical
2. **Private Key**: The cryptographic key controlling your account
3. **Account Access**: You maintain control across all networks

## Local Development Networks

### Hardhat Network (Chain ID: 31337)
- **Default Test Accounts**: 20 pre-funded accounts with 10,000 ETH each
- **Primary Account**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **Usage**: Recommended for development and testing

### Ganache Network (Chain ID: 1337)
- **Custom Configuration**: User-defined accounts and balances
- **Manual Setup**: Requires separate contract deployment
- **Usage**: Alternative local testing environment

## How to Use Different Accounts

### Method 1: Switch Accounts in MetaMask
1. Open MetaMask
2. Click on the account icon at the top
3. Select "Add account" or choose from existing accounts
4. Each account has a different address and private key

### Method 2: Import Test Accounts
For development, you can import additional Hardhat test accounts:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

### Method 3: Create New Account
1. In MetaMask, click "Create Account"
2. Name your new account
3. This generates a new address with 0 balance (you'll need to fund it)

## Testing Multi-Account Scenarios

### For Voting System:
1. Import multiple test accounts
2. Switch between accounts in MetaMask
3. Vote from different accounts to test governance features

### For Banking System:
1. Use different accounts to test lending/borrowing
2. Simulate multi-user DeFi scenarios
3. Test different balance scenarios

### For Token Factory:
1. Create tokens from different creator accounts
2. Test token transfers between accounts
3. Verify ownership and permissions

## Common Issues and Solutions

### Issue: Same balance on different networks
**Explanation**: You're using the same account. Switch networks to see network-specific balances.

### Issue: Transactions not appearing
**Solution**: Ensure you're connected to the correct network where transactions were made.

### Issue: Contract not found
**Solution**: Contracts are network-specific. Redeploy or switch to the network where contracts are deployed.

## Best Practices

1. **Use dedicated accounts for testing**: Don't mix real funds with test accounts
2. **Label your accounts**: Use descriptive names in MetaMask
3. **Keep track of networks**: Know which network you're testing on
4. **Backup important accounts**: Save private keys securely for accounts with value

## Network Configuration

Our application supports automatic network detection and switching:
- **Auto-detection**: Checks if local networks are running
- **Status indicators**: Visual feedback for network availability
- **Easy switching**: One-click network changes
- **Error handling**: Clear messages for connection issues

The NetworkSwitcher component handles the technical aspects of network switching while maintaining a smooth user experience. 