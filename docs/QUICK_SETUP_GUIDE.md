# 🚀 Web3平台快速设置指南

## 概述
这个指南将帮助您快速部署和设置完整的Web3平台，包括所有智能合约和测试数据。

## 🛠️ 可用脚本

### 1. 完整部署脚本 (推荐)
```bash
npx hardhat run scripts/deploy-and-setup-all.js --network ganache
```

**功能：**
- ✅ 部署所有智能合约 (EnhancedBank, TokenFactory, DEXPlatform, PlatformNFT, NFTMarketplace, VotingCore)
- ✅ 部署测试代币 (USDC, DAI, WETH)
- ✅ 初始化DEX交易池并添加流动性
- ✅ 创建NFT测试数据 (8个NFT，部分上架销售)
- ✅ 创建投票提案 (3个提案)
- ✅ 自动保存合约地址配置

### 2. 仅NFT数据设置脚本
```bash
npx hardhat run scripts/setup-complete-nft-data.js --network ganache
```

**功能：**
- 🎨 创建20个不同类型的NFT (艺术、头像、游戏、音乐、体育、收藏品、摄影)
- 🏪 自动上架部分NFT到市场
- 📊 提供详细的分类和稀有度统计
- 👥 分配给不同的用户账户

## 📋 使用步骤

### 第一次设置

1. **启动Ganache网络**
   ```bash
   npx ganache --deterministic --accounts 10 --host 0.0.0.0 --port 8545 --networkId 1337 --chain.chainId 1337
   ```

2. **运行完整部署脚本**
   ```bash
   npx hardhat run scripts/deploy-and-setup-all.js --network ganache
   ```

3. **启动前端应用**
   ```bash
   npm run dev
   ```

4. **配置MetaMask**
   - 添加Ganache网络 (RPC: http://localhost:8545, Chain ID: 1337)
   - 导入Ganache账户私钥进行测试

### Ganache重置后快速恢复

当Ganache网络重置后，只需要运行一个命令：

```bash
npx hardhat run scripts/deploy-and-setup-all.js --network ganache
```

这个脚本会自动：
- 重新部署所有合约
- 重新创建所有测试数据
- 更新配置文件
- 准备好立即使用的完整平台

### 仅添加更多NFT数据

如果只想添加更多NFT测试数据：

```bash
npx hardhat run scripts/setup-complete-nft-data.js --network ganache
```

## 📊 部署后的数据

### 智能合约
- **EnhancedBank**: 银行系统 (存款、贷款、质押)
- **TokenFactory**: 代币工厂
- **DEXPlatform**: 去中心化交易所
- **PlatformNFT**: NFT合约
- **NFTMarketplace**: NFT市场
- **VotingCore**: 投票治理系统

### 测试代币
- **WETH**: 包装以太坊
- **USDC**: 美元稳定币 (6位小数)
- **DAI**: DAI稳定币 (18位小数)

### DEX交易池
- WETH/USDC 池 (1 WETH = 2000 USDC)
- WETH/DAI 池 (1 WETH = 2000 DAI)
- USDC/DAI 池

### NFT数据
- 20个不同类型的NFT
- 分布在8个用户账户中
- 包含艺术、头像、游戏、音乐、体育、收藏品、摄影等类别
- 4个稀有度等级：Common, Rare, Epic, Legendary

### 投票提案
- 平台手续费调整提案
- 新功能开发投票
- 社区治理规则修订

## 🔧 详细故障排除指南

### 安装问题

**Q: npm install 失败或依赖缺失？**
```bash
# 解决方案：清除缓存并重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Q: Node.js版本不兼容？**
A: 确保使用Node.js 18+版本，推荐使用最新LTS版本

### Ganache相关问题

**Q: Ganache GUI下载链接？**
A: 官方下载地址：https://trufflesuite.com/ganache/

**Q: Ganache GUI推荐设置？**
A: 
1. 启动Ganache后选择"Quick Start"
2. 如需自定义设置，确保端口为8545，网络ID为1337
3. 推荐设置账户数量为10+

**Q: 如何在Ganache GUI中查看私钥？**
A: 在账户列表中点击任意账户旁边的🔑（钥匙）图标

**Q: Ganache命令行启动失败？**
```bash
# 如果chainId参数错误，使用此命令
npx ganache --deterministic --accounts 10 --host 0.0.0.0 --port 8545 --networkId 1337 --chain.chainId 1337
```

**Q: 端口8545被占用？**
```bash
# Windows查看端口占用
netstat -ano | findstr :8545
# 结束占用进程或更换端口
```

**Q: Ganache GUI无法启动？**
A: 
1. 确保关闭其他使用8545端口的程序
2. 以管理员身份运行Ganache
3. 检查防火墙设置是否阻止了Ganache

### MetaMask问题

**Q: MetaMask无法连接到本地网络？**
A: 
1. 确保Ganache正在运行
2. 检查网络配置中的RPC URL
3. 尝试重置MetaMask连接

**Q: 交易失败或Gas费用错误？**
A: 
1. 检查账户是否有足够的ETH余额
2. 确保连接到正确的网络（Chain ID: 1337）
3. 尝试重置账户交易历史

**Q: 导入账户后看不到余额？**
A: 
1. 确保MetaMask已切换到Ganache网络
2. 检查导入的私钥是否正确
3. 刷新页面或重启MetaMask
4. 确认Ganache正在运行且端口正确

**Q: 找不到"添加账户或硬件钱包"选项？**
A: 
1. 确保点击的是顶部的账户名称下拉菜单
2. 对于旧版MetaMask，选项可能是"导入账户"
3. 更新MetaMask到最新版本

**Q: 私钥导入失败？**
A: 
1. 确保私钥格式正确（64位十六进制，以0x开头）
2. 检查是否有多余的空格或换行符
3. 确保该私钥之前没有被导入过

### 合约部署问题

**Q: 合约部署失败？**
```bash
# 解决方案：重新编译并部署
npm run compile
npx hardhat run scripts/deploy-and-setup-all.js --network ganache
```

**Q: 找不到合约地址？**
A: 检查 `src/contracts/addresses.json` 文件是否存在且包含正确的地址

### 前端应用问题

**Q: 页面显示"合约未部署"？**
A: 
1. 确保已运行部署脚本
2. 检查MetaMask连接到正确的网络
3. 刷新页面

**Q: 交易不触发MetaMask弹窗？**
A: 
1. 检查MetaMask是否已解锁
2. 确保网站已连接到MetaMask
3. 检查浏览器是否阻止了弹窗

**Q: NFT购买不成功？**
A: 
1. 确保使用正确的账户
2. 检查NFT是否仍在销售中
3. 确保账户有足够的ETH余额

### 环境重置

**Q: 如何完全重置开发环境？**
```bash
# 1. 停止所有服务
# 2. 重启Ganache
# 3. 重新部署
npx hardhat run scripts/deploy-and-setup-all.js --network ganache
# 4. 在MetaMask中重置账户交易历史
# 5. 刷新前端页面
```

### 快速状态检查

运行这些命令来验证环境设置：
```bash
# 1. 检查Node.js版本
node --version

# 2. 检查依赖安装
npm list --depth=0

# 3. 编译合约
npm run compile

# 4. 检查Ganache连接
npx hardhat run scripts/test-network-stability.js --network ganache
```

## 💡 提示

- **账户管理**: Ganache提供10个预配置账户，可以导入到MetaMask进行测试
- **数据持久性**: 只要不重启Ganache，数据会保持持久
- **开发调试**: 可以使用 `console.log` 在智能合约中进行调试
- **Gas费用**: Ganache网络的Gas费用很低，适合开发测试

## 🚀 开始使用

部署完成后，您可以：

1. **银行系统**: 存款、取款、申请贷款、质押
2. **代币工厂**: 创建自定义ERC20代币
3. **DEX交易**: 交换代币、添加流动性
4. **NFT市场**: 铸造、购买、出售NFT
5. **投票治理**: 创建提案、参与投票

享受您的Web3开发之旅！🎉

## 🌐 生产环境配置

### 支持的网络

**测试网络**
- **Sepolia** (Ethereum testnet)
- **Mumbai** (Polygon testnet)  
- **Goerli** (Ethereum testnet)

**主网络**
- **Ethereum** mainnet
- **Polygon** mainnet
- **BSC** (Binance Smart Chain)
- **Arbitrum** One
- **Optimism**
- **Avalanche**

### 环境变量配置

创建 `.env` 文件用于测试网/主网部署：

```env
# API密钥
INFURA_PROJECT_ID=your-infura-project-id
ALCHEMY_API_KEY=your-alchemy-api-key

# 私钥
PRIVATE_KEY=your-testnet-private-key
MAINNET_PRIVATE_KEY=your-mainnet-private-key

# 区块链浏览器
ETHERSCAN_API_KEY=your-etherscan-api-key
POLYGONSCAN_API_KEY=your-polygonscan-api-key
BSCSCAN_API_KEY=your-bscscan-api-key
ARBISCAN_API_KEY=your-arbiscan-api-key
OPTIMISM_API_KEY=your-optimism-api-key
SNOWTRACE_API_KEY=your-snowtrace-api-key

# 前端
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-walletconnect-project-id
```

### 部署命令

```bash
# 部署到Sepolia测试网
npx hardhat run scripts/deploy-and-setup-all.js --network sepolia

# 部署到Polygon Mumbai测试网
npx hardhat run scripts/deploy-and-setup-all.js --network mumbai

# 部署到以太坊主网（谨慎使用）
npx hardhat run scripts/deploy-and-setup-all.js --network mainnet
```

### 安全注意事项

⚠️ **重要提醒**：
- 测试私钥仅用于本地开发，切勿在主网使用
- 主网部署前请充分测试
- 妥善保管生产环境私钥
- 使用硬件钱包进行主网操作 