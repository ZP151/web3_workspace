# 部署和示例数据初始化指南

本指南介绍如何使用更新后的部署脚本来部署合约并初始化示例数据，让用户可以立即开始测试和使用平台功能。

## 🚀 功能概述

更新后的部署系统现在包含5个阶段：

1. **阶段1**: 部署核心合约 (银行、投票等)
2. **阶段2**: 部署测试代币 (WETH, USDC, DAI等)  
3. **阶段3**: 部署DeFi合约 (DEX、NFT市场等)
4. **阶段4**: 基础合约初始化和配置
5. **阶段5**: 示例数据初始化 ⭐ **新增**

## 📦 示例数据包含内容

### 🏦 银行模块示例数据

- **社区池**: 6个预设社区池
  - 社区发展基金
  - 教育奖学金池
  - 环保行动基金
  - 创业孵化池
  - 医疗援助基金
  - 艺术文化支持

- **初始资金**: 
  - 部署者存款: 2 ETH
  - 社区池资金: 每池0.1 ETH (前3个池)

- **储蓄目标示例**:
  - 紧急备用金 (1.0 ETH, 90天)
  - 旅行基金 (0.5 ETH, 180天)
  - 新设备购买 (0.3 ETH, 60天)

- **质押示例**: 0.5 ETH质押

### 💱 DEX模块示例数据

- **流动性池**:
  - WETH/USDC池 (价格: 1 WETH = 2000 USDC)
  - WETH/DAI池 (价格: 1 WETH = 2000 DAI)  
  - USDC/DAI池 (价格: 1 USDC = 1 DAI)

- **初始流动性**:
  - WETH/USDC: 3 WETH + 6000 USDC
  - WETH/DAI: 3 WETH + 6000 DAI
  - USDC/DAI: 3000 USDC + 3000 DAI

- **测试代币铸造**:
  - 10 WETH (从ETH转换)
  - USDC和DAI (部署时自动铸造)

## 🛠️ 使用方法

### 方法1: 一键部署 (推荐)

```bash
# 启动本地节点
npm run node

# 新终端中运行一键部署(包含示例数据)
npm run deploy
```

或者针对不同网络:
```bash
npm run deploy:hardhat    # Hardhat本地网络
npm run deploy:ganache    # Ganache网络
npm run deploy:local      # 本地网络
```

### 方法2: 分步部署

```bash
# 1. 仅部署合约(不含示例数据)
npm run deploy:old

# 2. 单独添加示例数据
npm run init-sample-data
```

### 方法3: 重新初始化示例数据

如果已有部署的合约，但想重新添加示例数据:

```bash
npm run init-sample-data         # 本地网络
npm run init-sample-data:ganache # Ganache网络
```

## 📋 部署输出示例

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
🏦 初始化银行基础设置...
✅ 银行基础配置验证完成

============================================================
🎯 Stage 5: Initialize Sample Data
============================================================
🏦 初始化银行示例数据...
   📦 创建 6 个社区池...
   ✅ 社区发展基金 创建成功
   ✅ 教育奖学金池 创建成功
   ...
   💰 部署者进行初始存款...
   ✅ 存款 2.0 ETH 成功

💱 初始化DEX示例数据...
   🪙 铸造测试代币...
   ✅ 铸造 10.0 WETH
   🏊 创建流动性池...
   ✅ WETH/USDC 池创建成功
   ...

🎉 Complete Deployment Finished!
============================================================
📊 Deployment Summary:
  Network: Hardhat Local (31337)
  Total Contracts: 8
  Deployment Time: 45.32s
  Sample Data: ✅ 已初始化

📋 Deployed Contracts:
  ✅ EnhancedBank: 0x...
  ✅ DEXPlatform: 0x...
  ...

📁 Address file updated: src/contracts/addresses.json
🎯 Sample Data: 银行和DEX已预载示例数据，便于测试和演示
📖 包含内容:
   • 银行: 社区池、储蓄目标、质押示例
   • DEX: 流动性池、代币对、初始交易对价格
```

## ⚙️ 配置要求

### 账户余额要求

- **最小余额**: 1 ETH (用于Gas费)
- **推荐余额**: 5+ ETH (用于示例数据创建)
- **银行示例数据**: 需要约3 ETH (2 ETH存款 + 0.3 ETH社区池 + 0.5 ETH质押)
- **DEX示例数据**: 需要约10 ETH (转换为WETH)

### 网络配置

确保hardhat.config.js中配置了正确的网络:

```javascript
networks: {
  localhost: {
    url: "http://127.0.0.1:8545"
  },
  ganache: {
    url: "http://127.0.0.1:7545", 
    accounts: [/* 私钥 */]
  }
}
```

## 🔍 验证部署结果

### 1. 检查合约地址文件

```bash
cat src/contracts/addresses.json
```

应该包含所有合约地址和初始化状态。

### 2. 启动前端验证

```bash
npm run dev
```

访问 http://localhost:3000，检查:
- 银行模块: 社区池中应该有数据
- DEX模块: 流动性池中应该有流动性
- 所有功能都可以正常使用

### 3. 手动验证 (可选)

使用Hardhat控制台连接到合约进行验证:

```bash
npx hardhat console --network localhost
```

```javascript
// 检查银行
const bank = await ethers.getContractAt("EnhancedBank", "0x...");
const activePools = await bank.getActivePools();
console.log("活跃池数量:", activePools.length);

// 检查DEX  
const dex = await ethers.getContractAt("DEXPlatform", "0x...");
const poolIds = await dex.poolIds();
console.log("DEX池数量:", poolIds.length);
```

## 🚨 故障排除

### 常见问题

1. **余额不足错误**
   ```
   ⚠️ 警告: 账户余额可能不足以完成示例数据初始化
   ```
   **解决**: 确保部署账户有足够的ETH余额

2. **合约地址文件未找到**
   ```
   ❌ 找不到合约地址文件: src/contracts/addresses.json
   ```
   **解决**: 先运行基础部署 `npm run deploy:old`

3. **池或目标已存在错误**
   ```
   ⚠️ 创建池失败 (可能已存在)
   ```
   **解决**: 这是正常的，表示示例数据已经存在

4. **网络连接问题**
   ```
   Error: network does not support ENS
   ```
   **解决**: 检查网络配置，确保节点正在运行

### 重置和重新部署

如果需要完全重新开始:

```bash
# 1. 清理编译文件
npm run clean

# 2. 重新编译
npm run compile  

# 3. 重启节点 (如果使用Hardhat)
npm run node

# 4. 重新部署
npm run deploy
```

## 📚 相关文档

- [快速设置指南](./QUICK_SETUP_GUIDE.md)
- [网络配置指南](./NETWORK_GUIDE.md)
- [DEX功能指南](./DEX_FUNCTIONALITY_GUIDE.md)
- [NFT图片生成指南](./NFT_IMAGE_GENERATION_GUIDE.md)

## 💡 使用提示

1. **开发测试**: 使用一键部署可以快速获得完整的测试环境
2. **演示展示**: 示例数据让平台功能立即可见和可用
3. **学习研究**: 通过查看示例数据了解各功能模块的使用方式
4. **自定义扩展**: 可以基于示例数据继续添加更多测试场景

---

**注意**: 示例数据仅用于开发和测试环境，生产环境请谨慎使用。 