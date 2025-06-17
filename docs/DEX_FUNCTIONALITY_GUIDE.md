# DEX (去中心化交易所) 功能指南

## 什么是DEX？

DEX (Decentralized Exchange) 是去中心化交易所，它是一个基于智能合约的自动化做市商 (AMM - Automated Market Maker) 系统。与传统的中心化交易所不同，DEX 不需要中介机构，用户可以直接通过智能合约进行代币交换。

## 我们的DEX系统架构

### 1. 核心组件

#### DEXPlatform 智能合约
- **地址**: `0x26626478fE2c71d0DFF0c82a47d3618E7F0F4fDB` (Ganache网络)
- **功能**: 管理流动性池、处理代币交换、计算价格

#### 支持的代币
- **WETH** (Wrapped Ethereum): `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
- **USDC** (USD Coin): `0xfB392E5667bEd8C8E3eBf15B062e1147841a4F6B`  
- **DAI** (Dai Stablecoin): `0xcbC9836ee256F1DFe9143b175dFe041191e89c07`

#### 交易池 (Trading Pools)
1. **WETH/USDC池** (ID: 0)
2. **WETH/DAI池** (ID: 1) 
3. **USDC/DAI池** (ID: 2)

### 2. DEX工作原理

#### 自动化做市商 (AMM) 模型
我们的DEX使用恒定乘积公式：`x * y = k`
- `x` = 池中代币A的数量
- `y` = 池中代币B的数量  
- `k` = 恒定值

#### 价格发现机制
代币价格由供需关系自动确定：
- 当用户购买代币A时，池中代币A减少，代币B增加
- 根据恒定乘积公式，代币A的价格上涨
- 反之亦然

#### 滑点 (Slippage)
- 大额交易会导致价格滑点
- 滑点 = (执行价格 - 预期价格) / 预期价格 * 100%
- 我们的系统会显示预计滑点并允许用户设置最大可接受滑点

## 主要功能

### 1. 代币交换 (Token Swap)

#### 工作流程：
1. **选择代币对**: 从下拉菜单选择要交换的代币
2. **输入数量**: 输入要交换的代币数量
3. **查看报价**: 系统自动计算交换比率和预计收到的代币数量
4. **确认交易**: 点击"Swap"按钮，MetaMask会弹出确认交易
5. **等待确认**: 交易在区块链上确认后完成

#### 关键参数：
- **交换比率**: 基于当前池中代币比例计算
- **最小输出**: 考虑滑点后的最少收到代币数量
- **Gas费用**: 执行交易所需的网络费用

### 2. 流动性管理

#### 添加流动性：
- 用户向池中同时提供两种代币
- 获得LP (Liquidity Provider) 代币作为凭证
- 赚取交易手续费分成

#### 移除流动性：
- 燃烧LP代币
- 按比例取回两种代币
- 包含累积的手续费收益

### 3. 价格图表和统计

#### 实时数据显示：
- 当前代币价格
- 24小时价格变化
- 交易量统计
- 流动性总值 (TVL)

## 使用步骤详解

### 步骤1: 连接钱包
```
1. 确保MetaMask已安装并连接到Ganache网络 (Chain ID: 1337)
2. 确保账户中有足够的ETH用于Gas费用
3. 确保账户中有要交换的代币
```

### 步骤2: 获取测试代币
```bash
# 运行脚本获取测试代币
npx hardhat run scripts/deploy-test-tokens.js --network ganache
```

### 步骤3: 执行交换
```
1. 访问DEX页面
2. 选择"From"代币 (例如: WETH)
3. 选择"To"代币 (例如: USDC)  
4. 输入交换数量
5. 检查交换详情：
   - 交换比率
   - 预计收到数量
   - 价格影响
   - 最小输出
6. 点击"Swap"按钮
7. 在MetaMask中确认交易
8. 等待交易确认
```

## 技术实现细节

### 智能合约函数

#### 主要交换函数：
```solidity
function swapTokens(
    uint256 poolId,           // 交易池ID
    address tokenIn,          // 输入代币地址
    uint256 amountIn,         // 输入代币数量
    uint256 minAmountOut      // 最小输出数量
) external
```

#### 价格查询函数：
```solidity
function getAmountOut(
    uint256 poolId,
    address tokenIn,
    uint256 amountIn
) external view returns (uint256 amountOut)
```

### 前端集成

#### 使用Wagmi进行合约交互：
```typescript
const { config } = usePrepareContractWrite({
  address: dexContractAddress,
  abi: dexContractABI,
  functionName: 'swapTokens',
  args: [poolId, tokenInAddress, amountIn, minAmountOut],
});

const { write: executeSwap } = useContractWrite(config);
```

## 安全考虑

### 1. 滑点保护
- 用户可设置最大可接受滑点
- 如果实际滑点超过设置值，交易会失败

### 2. 前置运行保护
- 使用最小输出参数防止前置运行攻击
- 交易确认时检查实际输出是否满足最小要求

### 3. 重入攻击防护
- 智能合约使用ReentrancyGuard
- 确保外部调用的安全性

## 费用结构

### 交易手续费
- **交换费用**: 每笔交换收取0.3%手续费
- **Gas费用**: 由网络收取，用于执行交易
- **滑点成本**: 大额交易的隐性成本

### 收益分配
- 0.25% 分给流动性提供者
- 0.05% 作为协议费用

## 常见问题

### Q: 为什么我的交易失败了？
A: 可能原因：
- Gas费用不足
- 滑点超过设置的最大值
- 代币余额不足
- 未授权合约使用代币

### Q: 什么是WETH？
A: WETH是Wrapped Ethereum，是ETH的ERC-20代币版本，可以在DEX中交易。

### Q: 如何减少滑点？
A: 
- 减少交易数量
- 在流动性充足时交易
- 增加滑点容忍度设置

### Q: 交易需要多长时间？
A: 在Ganache本地网络上通常几秒钟，主网可能需要几分钟。

## 开发和测试

### 本地测试环境
```bash
# 启动Ganache
npx ganache --deterministic --accounts 10 --host 0.0.0.0 --port 8545 --networkId 1337 --chain.chainId 1337

# 部署合约
npx hardhat run scripts/deploy-ganache.js --network ganache

# 部署测试代币
npx hardhat run scripts/deploy-test-tokens.js --network ganache

# 初始化DEX池
npx hardhat run scripts/init-dex-pools.js --network ganache
```

### 调试工具
- 浏览器开发者工具查看交易日志
- MetaMask查看交易状态
- Ganache查看区块链状态

## 总结

我们的DEX系统提供了完整的去中心化交易功能，包括：
- 自动化价格发现
- 流动性管理
- 多代币支持
- 安全保护机制
- 用户友好界面

通过智能合约自动化执行，用户可以安全、透明地进行代币交换，无需信任中介机构。 