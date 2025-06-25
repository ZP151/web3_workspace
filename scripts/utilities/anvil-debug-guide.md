# Anvil 网络调试指南

## 🚀 快速开始

### 启动 Anvil 网络
```bash
# 启动持久化网络（推荐）
node scripts/start-networks.js anvil --persistent

# 启动全新网络
node scripts/start-networks.js anvil --fresh
```

## 🔧 调试命令

### 基本信息查看
```bash
# 查看网络基本信息
node scripts/utilities/anvil-debugger.js info

# 查看所有账户和余额
node scripts/utilities/anvil-debugger.js accounts

# 查看最近的区块
node scripts/utilities/anvil-debugger.js blocks

# 查看更多区块（如最近10个）
node scripts/utilities/anvil-debugger.js blocks 10
```

### 交易调试
```bash
# 查看特定交易详情
node scripts/utilities/anvil-debugger.js tx 0x1234567890abcdef...

# 实时监听新区块
node scripts/utilities/anvil-debugger.js watch
```

### 合约调试
```bash
# 检查合约信息
node scripts/utilities/anvil-debugger.js contract 0xContractAddress...
```

### 完整报告
```bash
# 生成完整的网络状态报告
node scripts/utilities/anvil-debugger.js report
```

## 📊 与 Ganache 对比

| 功能 | Anvil | Ganache |
|------|-------|---------|
| **持久化** | ✅ 自动保存状态 | ✅ 可选持久化 |
| **启动速度** | ⚡ ~1秒 | 🐌 ~5秒 |
| **内存占用** | 💾 ~50MB | 📈 ~150MB |
| **调试工具** | 🛠️ 命令行丰富 | 🖥️ 图形界面 |
| **账户管理** | 📝 固定助记词 | 🎲 随机或自定义 |

## 💡 调试技巧

### 1. 检查网络连接
```bash
# 快速检查Anvil是否运行
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://127.0.0.1:8546
```

### 2. 查看持久化状态
```bash
# 检查状态文件
ls -la anvil-state.json

# 查看文件大小（应该 > 1KB 表示有数据）
du -h anvil-state.json
```

### 3. 重置网络状态
```bash
# 删除状态文件，从头开始
rm anvil-state.json
node scripts/start-networks.js anvil --fresh
```

### 4. 前端集成调试

在前端应用中，使用以下配置连接Anvil：

```javascript
// 网络配置
const anvilNetwork = {
  name: 'Anvil Local',
  chainId: 31337,
  rpcUrl: 'http://127.0.0.1:8546'
}

// 检查连接
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8546');
const network = await provider.getNetwork();
console.log('Connected to Anvil:', network.chainId);
```

## 🚨 常见问题

### 端口冲突
```bash
# 如果8546端口被占用，查找进程
netstat -ano | findstr :8546

# 终止进程
taskkill /PID <进程ID> /F

# 或使用不同端口启动
anvil --port 8547
```

### 状态丢失
- 确保使用 `--persistent` 参数
- 检查 `anvil-state.json` 文件是否存在
- 确保正确使用 `--load-state` 和 `--dump-state` 参数

### 余额异常
- 使用调试器检查真实余额：`node scripts/utilities/anvil-debugger.js accounts`
- Anvil启动时显示的余额可能是模板信息，不是实际余额

## 🔄 开发工作流

1. **启动网络**：`node scripts/start-networks.js anvil --persistent`
2. **部署合约**：运行部署脚本
3. **调试状态**：`node scripts/utilities/anvil-debugger.js report`
4. **开发测试**：在前端进行交互
5. **查看变化**：`node scripts/utilities/anvil-debugger.js accounts`
6. **重启验证**：重启Anvil，确认数据持久化

---

💡 **提示**：Anvil相比Ganache的最大优势是更快的启动速度和更好的持久化支持，非常适合频繁重启的开发场景。 