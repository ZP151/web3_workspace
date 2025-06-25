# DEX (Decentralized Exchange) Functionality Guide

## What is a DEX?

DEX (Decentralized Exchange) is a decentralized exchange that is an automated market maker (AMM) system based on smart contracts. Unlike traditional centralized exchanges, DEX does not require intermediary institutions, and users can directly exchange tokens through smart contracts.

## Our DEX System Architecture

### 1. Core Components

#### DEXPlatform Smart Contract
- **Address**: `0x26626478fE2c71d0DFF0c82a47d3618E7F0F4fDB` (Ganache network)
- **Function**: Manage liquidity pools, process token swaps, calculate prices

#### Supported Tokens
- **WETH** (Wrapped Ethereum): `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
- **USDC** (USD Coin): `0xfB392E5667bEd8C8E3eBf15B062e1147841a4F6B`  
- **DAI** (Dai Stablecoin): `0xcbC9836ee256F1DFe9143b175dFe041191e89c07`

#### Trading Pools
1. **WETH/USDC Pool** (ID: 0)
2. **WETH/DAI Pool** (ID: 1) 
3. **USDC/DAI Pool** (ID: 2)

### 2. How DEX Works

#### Automated Market Maker (AMM) Model
Our DEX uses the constant product formula: `x * y = k`
- `x` = Amount of token A in the pool
- `y` = Amount of token B in the pool  
- `k` = Constant value

#### Price Discovery Mechanism
Token prices are automatically determined by supply and demand:
- When users buy token A, token A decreases in the pool, token B increases
- According to the constant product formula, token A price increases
- Vice versa

#### Slippage
- Large trades will cause price slippage
- Slippage = (Execution Price - Expected Price) / Expected Price * 100%
- Our system displays estimated slippage and allows users to set maximum acceptable slippage

## Main Functions

### 1. Token Swap

#### Workflow:
1. **Select Token Pair**: Choose tokens to swap from dropdown menus
2. **Input Amount**: Enter the amount of tokens to swap
3. **View Quote**: System automatically calculates exchange rate and estimated tokens to receive
4. **Confirm Transaction**: Click "Swap" button, MetaMask will pop up transaction confirmation
5. **Wait for Confirmation**: Transaction completes after blockchain confirmation

#### Key Parameters:
- **Exchange Rate**: Calculated based on current token ratio in pool
- **Minimum Output**: Minimum tokens to receive considering slippage
- **Gas Fee**: Network fee required to execute transaction

### 2. Liquidity Management

#### Add Liquidity:
- Users provide both tokens to the pool simultaneously
- Receive LP (Liquidity Provider) tokens as proof
- Earn trading fee distributions

#### Remove Liquidity:
- Burn LP tokens
- Withdraw both tokens proportionally
- Includes accumulated fee earnings

### 3. Price Charts and Statistics

#### Real-time Data Display:
- Current token prices
- 24-hour price changes
- Trading volume statistics
- Total Value Locked (TVL)

## Detailed Usage Steps

### Step 1: Connect Wallet
```
1. Ensure MetaMask is installed and connected to Ganache network (Chain ID: 1337)
2. Ensure account has sufficient ETH for gas fees
3. Ensure account has tokens to swap
```

### Step 2: Get Test Tokens
```bash
# Run script to get test tokens
npx hardhat run scripts/deploy-test-tokens.js --network ganache
```

### Step 3: Execute Swap
```
1. Visit DEX page
2. Select "From" token (e.g.: WETH)
3. Select "To" token (e.g.: USDC)  
4. Input swap amount
5. Check swap details:
   - Exchange rate
   - Expected received amount
   - Price impact
   - Minimum output
6. Click "Swap" button
7. Confirm transaction in MetaMask
8. Wait for transaction confirmation
```

## Technical Implementation Details

### Smart Contract Functions

#### Main Swap Function:
```solidity
function swapTokens(
    uint256 poolId,           // Trading pool ID
    address tokenIn,          // Input token address
    uint256 amountIn,         // Input token amount
    uint256 minAmountOut      // Minimum output amount
) external
```

#### Price Query Function:
```solidity
function getAmountOut(
    uint256 poolId,
    address tokenIn,
    uint256 amountIn
) external view returns (uint256 amountOut)
```

### Frontend Integration

#### Using Wagmi for Contract Interaction:
```typescript
const { config } = usePrepareContractWrite({
  address: dexContractAddress,
  abi: dexContractABI,
  functionName: 'swapTokens',
  args: [poolId, tokenInAddress, amountIn, minAmountOut],
});

const { write: executeSwap } = useContractWrite(config);
```

## Security Considerations

### 1. Slippage Protection
- Users can set maximum acceptable slippage
- If actual slippage exceeds the set value, transaction will fail

### 2. Front-running Protection
- Use minimum output parameter to prevent front-running attacks
- Check actual output meets minimum requirement during transaction confirmation

### 3. Reentrancy Attack Protection
- Smart contract uses ReentrancyGuard
- Ensure security of external calls

## Fee Structure

### Trading Fees
- **Swap Fee**: 0.3% fee charged per swap
- **Gas Fee**: Network-charged fee for executing transactions
- **Slippage Cost**: Hidden cost of large trades

### Revenue Distribution
- 0.25% goes to liquidity providers
- 0.05% as protocol fee

## Common Questions

### Q: Why did my transaction fail?
A: Possible reasons:
- Insufficient gas fee
- Slippage exceeded maximum setting
- Insufficient token balance
- Contract not authorized to use tokens

### Q: What is WETH?
A: WETH is Wrapped Ethereum, an ERC-20 token version of ETH that can be traded on DEX.

### Q: How to reduce slippage?
A: 
- Reduce trade amount
- Trade when liquidity is sufficient
- Increase slippage tolerance setting

### Q: How long do transactions take?
A: Usually a few seconds on Ganache local network, may take several minutes on mainnet.

## Development and Testing

### Local Test Environment
```bash
# Start Ganache
npx ganache --deterministic --accounts 10 --host 0.0.0.0 --port 8545 --networkId 1337 --chain.chainId 1337

# Deploy contracts
npx hardhat run scripts/deploy-master.js --network ganache

# Start frontend
npm run dev
```

### Testing Scenarios

#### Basic Swap Testing
1. Connect MetaMask to Ganache
2. Import test account with tokens
3. Execute small amount swap
4. Verify balance changes

#### Slippage Testing
1. Execute large amount swap
2. Observe price impact
3. Test with different slippage settings
4. Verify slippage protection works

#### Liquidity Testing
1. Add liquidity to pool
2. Execute swaps
3. Remove liquidity
4. Verify fee earnings

## Advanced Features

### Liquidity Pool Analytics
- Pool composition tracking
- Fee earning calculations
- Impermanent loss monitoring
- Historical performance data

### Price Impact Analysis
- Real-time price impact calculation
- Optimal trade size recommendations
- Multi-hop routing (future feature)
- Arbitrage opportunity detection

### Risk Management
- Slippage tolerance configuration
- Transaction deadline settings
- Gas price optimization
- Emergency pause functionality

## API Integration

### Price Feed API
```typescript
// Get current price for token pair
const price = await dexContract.getAmountOut(poolId, tokenIn, amountIn);

// Get pool reserves
const reserves = await dexContract.getReserves(poolId);

// Calculate price impact
const priceImpact = calculatePriceImpact(amountIn, reserves);
```

### Event Monitoring
```typescript
// Listen for swap events
dexContract.on('Swap', (user, tokenIn, tokenOut, amountIn, amountOut) => {
  console.log('Swap executed:', { user, tokenIn, tokenOut, amountIn, amountOut });
});

// Listen for liquidity events
dexContract.on('LiquidityAdded', (user, tokenA, tokenB, amountA, amountB) => {
  console.log('Liquidity added:', { user, tokenA, tokenB, amountA, amountB });
});
```

This comprehensive guide covers all aspects of the DEX functionality. For specific implementation details or troubleshooting, refer to the contract documentation or development team. 