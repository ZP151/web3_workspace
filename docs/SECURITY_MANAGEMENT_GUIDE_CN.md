# 安全功能管理指南

## 概述
本指南介绍如何使用和测试平台的安全功能，包括元数据安全检查和合约暂停功能。

## 1. 元数据安全检查

### 设计理念
- **前端教育**: 通过弹窗提醒用户使用更安全的存储方案
- **链上记录**: 发出`MetadataSecurityWarning`事件，用于统计分析
- **用户选择**: 允许用户选择继续或取消，不强制阻止

### 测试步骤
1. 访问 http://localhost:3000/nft
2. 进入 "Mint NFT" 标签页
3. 使用会触发警告的URL：
   ```
   https://example.com/test.jpg
   http://mysite.com/image.png
   ```
4. 观察安全警告弹窗
5. 使用安全的URL测试：
   ```
   https://gateway.pinata.cloud/ipfs/QmHash...
   ipfs://QmHash...
   ```

### 实现位置
- **合约**: `contracts/PlatformNFT.sol` - `_checkMetadataSecurity()`
- **前端**: `src/app/nft/hooks/useNFTContract.ts` - `checkMetadataSecurity()`

## 2. 合约暂停功能

### 管理员权限
- **当前管理员**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (Anvil默认账户)
- **权限范围**: 可以暂停/恢复所有支持Pausable的合约

### 支持暂停的合约
- ✅ PlatformNFT - NFT铸造功能
- ✅ NFTMarketplace - 市场交易功能  
- ✅ EnhancedBank - 银行存取款功能
- ❌ TokenFactory - 不支持暂停
- ❌ DEXPlatform - 不支持暂停
- ❌ VotingCore - 不支持暂停

## 3. 管理工具脚本

### 检查管理员状态
```bash
npx hardhat run scripts/utilities/check-owner-status.js --network anvil
```
显示所有合约的管理员和暂停状态。

### 测试暂停功能
```bash
npx hardhat run scripts/utilities/test-pause-functions.js --network anvil
```
完整测试暂停和恢复功能，包括权限验证。

### 紧急暂停所有服务
```bash
npx hardhat run scripts/utilities/pause-emergency.js --network anvil
```
快速暂停所有关键合约，用于紧急情况。

### 恢复所有服务
```bash
npx hardhat run scripts/utilities/unpause-all.js --network anvil
```
恢复所有被暂停的合约。

## 4. 暂停功能的影响

### 暂停后无法执行的操作
- 🚫 铸造新的NFT
- 🚫 在市场上架/购买NFT
- 🚫 银行存款和取款
- 🚫 质押和解除质押

### 暂停后仍可执行的操作
- ✅ 查看现有NFT和余额
- ✅ 前端页面正常显示
- ✅ 链上数据查询
- ✅ 代币工厂功能（不受影响）

## 5. 安全最佳实践

### 管理员权限管理
1. **多重签名钱包**: 建议将管理员权限转移到多重签名钱包
2. **权限分离**: 考虑使用AccessControl进行细粒度权限管理
3. **定期审计**: 定期检查合约状态和管理员权限

### 紧急响应流程
1. **发现异常** → 立即运行紧急暂停脚本
2. **调查问题** → 分析日志和交易记录
3. **修复问题** → 部署修复或调整参数
4. **恢复服务** → 运行恢复脚本

### 监控建议
- 监控`MetadataSecurityWarning`事件频率
- 设置暂停状态变化的告警
- 跟踪管理员操作的链上记录

## 6. 故障排除

### 常见问题
**Q: 为什么非管理员无法暂停合约？**
A: 这是安全设计，只有合约所有者才能执行紧急操作。

**Q: 暂停后如何恢复？**
A: 使用管理员账户运行`unpause()`函数或使用恢复脚本。

**Q: 元数据警告会阻止铸造吗？**
A: 不会，这只是用户教育功能，用户可以选择继续。

### 错误代码
- `EnforcedPause`: 合约已暂停
- `OwnableUnauthorizedAccount`: 权限不足
- `MetadataSecurityWarning`: 元数据安全提醒（不阻止交易）

## 7. 开发者信息

### 合约接口
```solidity
// 暂停功能
function pause() external onlyOwner;
function unpause() external onlyOwner; 
function paused() external view returns (bool);

// 元数据安全
event MetadataSecurityWarning(uint256 indexed tokenId, string reason);
```

### 前端集成
```typescript
// 检查暂停状态
const isPaused = await contract.paused();

// 监听安全事件
contract.on("MetadataSecurityWarning", (tokenId, reason) => {
  console.log(`Token ${tokenId} security warning: ${reason}`);
});
```

---

**重要提醒**: 暂停功能是紧急安全措施，应谨慎使用。在生产环境中，建议使用多重签名钱包管理这些关键权限。 