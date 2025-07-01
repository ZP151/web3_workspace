# Web3 项目维护工具

这个目录包含了一系列用于维护和调试Web3项目的工具脚本。这些脚本可以帮助你解决常见的开发问题，如网络连接、合约部署、状态重置等。

## 可用脚本

### 环境重置工具

#### `reset-development.js`

全面重置开发环境，包括停止网络、清理状态、重启网络和重新部署合约。

```bash
node scripts/maintenance/reset-development.js
```

这个脚本会执行以下操作：
1. 停止所有正在运行的区块链网络（Anvil和Hardhat）
2. 删除Anvil状态文件（anvil-state.json）
3. 重启Anvil网络
4. 重新部署所有合约到Anvil网络

#### `clear-anvil-state.js`

仅清理Anvil状态文件，解决由于状态持久化导致的合约地址不匹配问题。

```bash
node scripts/maintenance/clear-anvil-state.js
```

### 数据清理工具

#### `clean-deployment.js`

清理部署数据，但保留网络状态。

```bash
node scripts/maintenance/clean-deployment.js
```

#### `clear-local-data.js`

清理本地存储的数据，如缓存、临时文件等。

```bash
node scripts/maintenance/clear-local-data.js
```

#### `clear-nft-data.js`

清理NFT相关数据，如元数据、图片等。

```bash
node scripts/maintenance/clear-nft-data.js
```

## 常见问题解决

### 合约地址不匹配

如果前端无法连接到合约，可能是因为合约地址不匹配。这通常发生在以下情况：

1. 在不同的网络上部署了合约（如Anvil vs Hardhat）
2. Anvil网络重启后加载了旧的状态
3. 前端配置的地址不正确

**解决方案:**
```bash
# 清理Anvil状态
node scripts/maintenance/clear-anvil-state.js

# 重启网络（使用--fresh参数）
node scripts/start-networks.js anvil --fresh

# 重新部署合约
npx hardhat run scripts/deploy-master.js --network anvil
```

### 网络连接问题

如果遇到网络连接问题，可以尝试以下步骤：

1. 检查网络是否正在运行
2. 检查网络端口是否正确（Anvil: 8546, Hardhat: 8545）
3. 重启网络

**解决方案:**
```bash
# 全面重置开发环境
node scripts/maintenance/reset-development.js
```

### 前端显示问题

如果前端无法正确显示数据，可能是由于以下原因：

1. 合约返回的数据类型与前端期望的不匹配（如BigInt vs Number）
2. 前端缓存了旧数据
3. 合约状态已更改但前端未更新

**解决方案:**
```bash
# 清理本地数据
node scripts/maintenance/clear-local-data.js

# 重启前端应用
```

## 注意事项

- 重置环境会导致所有已部署的合约地址失效
- 清理Anvil状态会重置所有账户余额和交易历史
- 这些脚本仅用于开发环境，不应在生产环境中使用 