# NFT Marketplace 诊断和解决方案指南

## 问题诊断

### 1. 合约地址不匹配问题

前端尝试连接到Anvil网络(31338)上的NFT合约，但合约可能部署在了Hardhat网络(31337)上，导致合约函数调用失败。

**症状:**
- 前端报错: `ContractFunctionExecutionError: The contract function "listItem" returned no data ("0x")`
- 合约地址存在，但调用函数失败

**解决方案:**
- 确保在正确的网络上部署合约
- 使用`npx hardhat run scripts/deploy-master.js --network anvil`确保部署到Anvil网络

### 2. BigInt类型比较问题

前端代码使用严格相等运算符(`===`)比较合约返回的`bigint`类型状态值，导致比较失败。

**症状:**
- 前端显示"Found 0 active listings"，即使合约中有活跃的listing
- 诊断脚本显示listing状态为`bigint`类型，值为0，但`status === 0`比较失败

**解决方案:**
- 在前端代码中使用`Number(listing.status) === 0`进行比较
- 或使用宽松比较运算符`==`

### 3. Anvil状态持久化问题

Anvil网络的状态持久化在`anvil-state.json`文件中，如果不清理该文件，重启Anvil后会加载旧的区块链状态。

**症状:**
- 合约地址与前端配置不匹配
- 重新部署后问题依然存在

**解决方案:**
- 使用`--clean`或`--fresh`参数启动Anvil网络
- 删除`anvil-state.json`文件后重启网络

## 诊断工具

### 1. check-nft-contracts.js

检查NFT和Marketplace合约是否正确部署，并测试基本函数调用。

```bash
node check-nft-contracts.js
```

### 2. check-listing-status.js

检查Marketplace中所有listing的详细状态，包括状态类型和值。

```bash
node check-listing-status.js
```

### 3. test-frontend-logic.js

模拟前端的Marketplace数据加载逻辑，帮助诊断前端问题。

```bash
node test-frontend-logic.js
```

### 4. diagnose-nft-issues.js

全面诊断NFT市场问题，包括合约状态、NFT状态和listing状态。

```bash
node scripts/utilities/diagnose-nft-issues.js
```

## 常见问题解决流程

1. **合约部署问题:**
   - 确认网络Chain ID (Anvil: 31338, Hardhat: 31337)
   - 使用正确的网络参数部署合约
   - 检查合约地址是否有代码

2. **前端连接问题:**
   - 确认前端配置的网络和合约地址
   - 检查合约ABI是否匹配
   - 验证前端使用的函数名和参数是否正确

3. **Listing不显示问题:**
   - 检查listing状态值和类型
   - 确保前端代码正确处理BigInt类型
   - 验证前端过滤逻辑是否正确

4. **交易失败问题:**
   - 检查账户是否有足够的ETH
   - 验证NFT授权状态
   - 检查交易参数是否正确 