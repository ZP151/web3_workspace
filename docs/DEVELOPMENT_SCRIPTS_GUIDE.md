# 开发脚本指南

## 概述

本指南详细介绍项目中所有可用的开发脚本，包括合约部署、网络管理、前端开发和测试相关的命令。

## 📦 合约相关脚本

### 合约编译
```bash
# 编译所有合约
npm run compile

# 或使用 Hardhat 直接编译
npx hardhat compile

# 清理编译缓存
npx hardhat clean
```

### 合约部署

**完整部署（推荐）**
```bash
# 部署所有合约和测试数据
npm run deploy:full

# 等效命令
node scripts/deploy-with-sample-data.js
```

**分步部署**
```bash
# 仅部署合约（不包含测试数据）
npm run deploy:contracts

# 仅部署NFT测试数据
npm run deploy:nft-data

# 部署到特定网络
npm run deploy:full -- --network anvil
npm run deploy:full -- --network ganache
```

### 合约验证
```bash
# 验证合约部署状态
npm run verify:contracts

# 检查合约地址
node scripts/check-contracts.js

# 验证合约功能
node scripts/test-contracts.js
```

## 🌐 网络管理脚本

### 启动本地网络

**Anvil网络**
```bash
# 启动Anvil（推荐）
npm run start:anvil

# 带持久化启动
node scripts/start-networks.js anvil --persistent

# 自定义配置启动
node scripts/start-networks.js anvil --port 8546 --accounts 20
```

**Ganache网络**
```bash
# 启动Ganache GUI
npm run start:ganache

# 启动Ganache CLI
node scripts/start-networks.js ganache

# 自定义配置
npx ganache --deterministic --accounts 10 --host 0.0.0.0
```

**Hardhat网络**
```bash
# 启动Hardhat节点
npm run start:hardhat

# 或直接使用
npx hardhat node
```

### 网络状态检查
```bash
# 检查所有网络状态
npm run check:networks

# 检查特定网络
node scripts/check-network.js --network anvil
node scripts/check-network.js --network ganache
node scripts/check-network.js --network hardhat

# 快速状态检查
npm run status
```

### 网络重置
```bash
# 重置Anvil网络
npm run reset:anvil

# 重置Ganache网络
npm run reset:ganache

# 清理所有网络数据
npm run clean:networks
```

## 🎨 前端开发脚本

### 开发服务器
```bash
# 启动前端开发服务器
npm run dev

# 指定端口启动
npm run dev -- --port 3001

# 启动并自动打开浏览器
npm run dev:open
```

### 构建和部署
```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 构建并分析包大小
npm run build:analyze
```

### 代码质量
```bash
# 运行ESLint检查
npm run lint

# 自动修复ESLint问题
npm run lint:fix

# 运行Prettier格式化
npm run format

# 类型检查（如果使用TypeScript）
npm run type-check
```

## 🧪 测试脚本

### 合约测试
```bash
# 运行所有合约测试
npm run test

# 运行特定测试文件
npx hardhat test test/Banking.test.js
npx hardhat test test/DEX.test.js
npx hardhat test test/NFTMarketplace.test.js

# 运行测试并生成覆盖率报告
npm run test:coverage
```

### 前端测试
```bash
# 运行前端单元测试
npm run test:frontend

# 运行E2E测试
npm run test:e2e

# 监听模式运行测试
npm run test:watch
```

### 集成测试
```bash
# 运行完整集成测试
npm run test:integration

# 测试特定功能模块
npm run test:banking
npm run test:dex
npm run test:nft
npm run test:governance
```

## 🔧 实用工具脚本

### 数据管理
```bash
# 生成测试数据
node scripts/generate-test-data.js

# 清理测试数据
node scripts/clean-test-data.js

# 备份合约状态
node scripts/backup-state.js

# 恢复合约状态
node scripts/restore-state.js
```

### 账户管理
```bash
# 生成新的测试账户
node scripts/generate-accounts.js

# 查看账户余额
node scripts/check-balances.js

# 转账测试ETH
node scripts/transfer-eth.js --to 0x... --amount 10
```

### 合约交互
```bash
# 与Banking合约交互
node scripts/interact-banking.js

# 与DEX合约交互
node scripts/interact-dex.js

# 与NFT市场交互
node scripts/interact-nft.js

# 与治理合约交互
node scripts/interact-governance.js
```

## 📊 监控和日志

### 日志查看
```bash
# 查看合约事件日志
node scripts/view-logs.js

# 监听实时事件
node scripts/monitor-events.js

# 查看交易历史
node scripts/view-transactions.js
```

### 性能监控
```bash
# 检查Gas使用情况
node scripts/gas-analysis.js

# 监控网络性能
node scripts/network-monitor.js

# 生成性能报告
node scripts/performance-report.js
```

## 🚀 一键操作脚本

### 快速启动
```bash
# 一键启动完整开发环境
npm run dev:full
# 等效于:
# 1. 启动Anvil网络
# 2. 部署所有合约
# 3. 生成测试数据
# 4. 启动前端服务器
```

### 快速重置
```bash
# 一键重置开发环境
npm run reset:all
# 等效于:
# 1. 停止所有网络
# 2. 清理缓存和数据
# 3. 重新启动网络
# 4. 重新部署合约
```

### 快速测试
```bash
# 一键运行所有测试
npm run test:all
# 等效于:
# 1. 合约测试
# 2. 前端测试
# 3. 集成测试
# 4. 生成报告
```

## 🔍 故障排除脚本

### 诊断工具
```bash
# 系统诊断
node scripts/diagnose.js

# 网络连接诊断
node scripts/diagnose-network.js

# 合约状态诊断
node scripts/diagnose-contracts.js

# 依赖检查
node scripts/check-dependencies.js
```

### 修复工具
```bash
# 自动修复常见问题
node scripts/auto-fix.js

# 重新安装依赖
npm run reinstall

# 清理并重建
npm run clean:all && npm run build
```

## 📝 自定义脚本

### 创建自定义脚本

在 `scripts/` 目录下创建新的脚本文件：

```javascript
// scripts/my-custom-script.js
const { ethers } = require('hardhat');

async function main() {
  // 你的自定义逻辑
  console.log('执行自定义脚本...');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 在package.json中添加脚本

```json
{
  "scripts": {
    "my-script": "node scripts/my-custom-script.js"
  }
}
```

## 🔧 脚本参数说明

### 常用参数
- `--network <name>`: 指定网络（anvil, ganache, hardhat）
- `--port <number>`: 指定端口号
- `--accounts <number>`: 指定账户数量
- `--persistent`: 启用数据持久化
- `--verbose`: 启用详细输出
- `--dry-run`: 模拟运行（不执行实际操作）

### 示例用法
```bash
# 在特定网络上部署
node scripts/deploy-with-sample-data.js --network anvil

# 启动网络并指定端口
node scripts/start-networks.js anvil --port 8547

# 详细模式运行测试
npm run test -- --verbose
```

## 📚 相关文档

- [快速设置指南](./QUICK_SETUP_GUIDE.md)
- [Anvil安装指南](./ANVIL_INSTALLATION_GUIDE.md)
- [网络配置指南](./NETWORK_GUIDE.md)
- [部署指南](./DEPLOYMENT_WITH_SAMPLE_DATA_GUIDE.md)

---

**提示**: 所有脚本都支持 `--help` 参数来查看详细的使用说明。例如：`node scripts/deploy-with-sample-data.js --help`