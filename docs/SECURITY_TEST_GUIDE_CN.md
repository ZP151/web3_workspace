# NFT 安全功能测试指南

## 🔒 如何测试元数据安全警告

### 第一步：访问 NFT 页面
1. 访问 http://localhost:3000/nft
2. 确保钱包已连接
3. 查看页面顶部是否显示 "Security Status" 面板

### 第二步：测试安全警告（应该触发警告）
1. 点击 "Mint NFT" 标签页
2. 填写以下信息：
   - **Name**: Test Security NFT
   - **Description**: Testing security features
   - **Image URL**: `https://example.com/test.jpg` （这会触发安全警告）
   - **Category**: art
   - **Price**: 0.1

3. 点击 "Mint NFT" 按钮
4. **预期结果**: 应该弹出安全警告对话框：
   ```
   ⚠️ 安全警告: Consider using IPFS or Arweave for immutable metadata
   
   您当前使用的存储方式可能不是永久性的。建议使用 IPFS 或 Arweave 来确保 NFT 元数据的不可篡改性。
   
   您确定要继续吗？
   ```

### 第三步：测试安全通过（不应该触发警告）
1. 在新的 NFT 表单中填写：
   - **Name**: Secure NFT
   - **Description**: Using secure storage
   - **Image URL**: `https://gateway.pinata.cloud/ipfs/QmYourHashHere` （IPFS URL）
   - **Category**: art
   - **Price**: 0.1

2. 点击 "Mint NFT" 按钮
3. **预期结果**: 应该直接开始铸造，没有安全警告

### 第四步：检查控制台日志
1. 打开浏览器开发者工具 (F12)
2. 查看 Console 标签页
3. 铸造 NFT 时应该看到安全检查的日志：
   - 对于不安全的 URL：`🔒 Non-decentralized storage detected: https://example.com/test.jpg`
   - 对于安全的 URL：`✅ Decentralized storage detected: https://gateway.pinata.cloud/ipfs/...`

## 🛡️ 安全状态面板检查

在 NFT 页面顶部应该看到一个绿色的 "Security Status" 面板，显示：

- **All services operational** (绿色图标)
- **Enhanced Security Features**:
  - ✅ Emergency Pause Protection
  - ✅ Metadata Security Check  
  - ✅ ERC-2981 Royalty Standard
  - ✅ Gas DoS Prevention

## 🎯 测试用的 URL 示例

### 会触发安全警告的 URL：
- `https://example.com/image.jpg`
- `http://mywebsite.com/nft.png`
- `https://cdn.example.com/assets/image.gif`
- `https://imgur.com/a/123456`

### 不会触发安全警告的 URL：
- `https://gateway.pinata.cloud/ipfs/QmHash...`
- `ipfs://QmHash...`
- `https://ipfs.io/ipfs/QmHash...`
- `https://arweave.net/txHash`
- `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...` (Base64)

## 📋 故障排除

### 如果没有看到安全警告：
1. 检查浏览器控制台是否有错误信息
2. 确保使用了会触发警告的 URL（如 `https://example.com/test.jpg`）
3. 刷新页面重试
4. 检查开发服务器是否正常运行

### 如果没有看到安全状态面板：
1. 确保钱包已连接
2. 确保合约已部署到当前网络
3. 刷新页面

## 🔧 开发者信息

安全功能已集成到以下位置：
- **Hook**: `src/app/nft/hooks/useNFTContract.ts`
- **安全检查函数**: `checkMetadataSecurity()`
- **状态显示**: `SecurityStatusDisplay` 组件
- **集成位置**: `src/app/nft/page.tsx`

安全检查在以下情况触发：
- 用户点击 "Mint NFT" 按钮时
- 检查 `image` 和 `metadataUri` 字段
- 检测非去中心化存储协议时弹出警告 