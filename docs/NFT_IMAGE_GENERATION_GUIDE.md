# NFT图片生成功能使用指南

## 概述

本项目已集成AI图片生成功能到NFT创建流程中，支持通过文字描述生成NFT图片，并可选择上传到IPFS进行永久存储。

## 功能特性

### 🎨 AI图片生成
- **智能生成**：通过文字描述生成独特的NFT图片
- **像素艺术风格**：默认使用压缩算法生成像素艺术风格
- **即时预览**：生成后立即显示预览图
- **自动集成**：生成的图片自动设置为NFT图片

### 🌐 IPFS存储支持
- **永久存储**：支持上传到IPFS确保图片永久可访问
- **元数据管理**：自动创建和上传NFT标准元数据
- **Pinata集成**：使用Pinata服务进行IPFS固定
- **本地备份**：未配置IPFS时使用本地存储

## 使用步骤

### 1. 基本NFT创建

1. **进入铸造页面**
   - 导航到NFT页面
   - 点击"Mint NFT"标签

2. **填写基本信息**
   ```
   名称: 您的NFT名称
   描述: NFT的详细描述
   类别: 选择适当的类别 (Art, Collectibles, Photography, Music)
   价格: 可选，如需上架销售
   ```

### 2. AI图片生成

1. **输入图片描述**
   ```
   示例提示词:
   - "一只可爱的数字猫咪，赛博朋克风格，霓虹灯背景"
   - "宇宙中的神秘水晶，发出蓝色光芒"
   - "未来城市的天际线，夜晚，科幻风格"
   - "抽象几何图案，彩虹色彩，现代艺术"
   ```

2. **生成图片**
   - 点击"生成图片"按钮
   - 等待AI处理（通常需要几秒钟）
   - 查看生成的图片预览

3. **图片管理**
   - 如不满意可清除重新生成
   - 生成的图片会自动设置为NFT图片

### 3. IPFS上传（推荐）

1. **配置IPFS服务**
   ```bash
   # 在.env.local文件中添加Pinata配置
   NEXT_PUBLIC_PINATA_API_KEY=your_api_key
   NEXT_PUBLIC_PINATA_SECRET_KEY=your_secret_key
   NEXT_PUBLIC_PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs
   ```

2. **上传到IPFS**
   - 确保已填写NFT名称和描述
   - 点击"上传到IPFS"按钮
   - 等待上传完成
   - 查看IPFS哈希和网关链接

3. **验证上传**
   - 点击"查看IPFS"访问上传的内容
   - 确认图片和元数据正确

### 4. 铸造NFT

1. **最终确认**
   - 检查所有信息是否正确
   - 确认铸造费用（0.001 ETH）

2. **执行铸造**
   - 点击"Mint NFT"按钮
   - 在MetaMask中确认交易
   - 等待交易确认

## API接口规范

### 图片生成API

**接口地址**: `POST /api/generate-image`

**请求参数**:
```json
{
  "prompt": "图片描述提示词",
  "use_compression": true,
  "size": "1024x1024",
  "quality": "standard"
}
```

**响应格式**:
```json
{
  "success": true,
  "image_url": "http://localhost:5200/images/uuid.png",
  "file_size_kb": 196.19,
  "algorithm": "Compressed Algorithm (Pixel Art)"
}
```

## IPFS配置指南

### 获取Pinata API密钥

1. 访问 [Pinata官网](https://app.pinata.cloud/)
2. 注册并登录账户
3. 导航到API Keys页面
4. 创建新的API密钥
5. 复制API Key和Secret Key

### 环境变量配置

创建`.env.local`文件并添加：
```bash
# IPFS配置
NEXT_PUBLIC_PINATA_API_KEY=4e6daa871b19dfe5ac33
NEXT_PUBLIC_PINATA_SECRET_KEY=840ce0b8dc018243203f7179fe6e01889e150cc95da7d43a337149ef1ecc374a
NEXT_PUBLIC_PINATA_JWT (secret access token)=840ce0b8dc018243203f7179fe6e01889e150cc95da7d43a337149ef1ecc374a  
NEXT_PUBLIC_PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs

# 图片生成API
NEXT_PUBLIC_IMAGE_GENERATION_API=http://localhost:5200
```

## 技术实现细节

### 图片生成流程
```typescript
// 1. 调用图片生成API
const response = await fetch('/api/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: imagePrompt,
    use_compression: true,
    size: "1024x1024",
    quality: "standard"
  })
});

// 2. 处理响应
const data = await response.json();
if (data.success) {
  setGeneratedImageUrl(data.image_url);
}
```

### IPFS上传流程
```typescript
// 1. 上传图片到IPFS
const imageResult = await uploadImageToIPFS(imageUrl, filename, pinataConfig);

// 2. 创建NFT元数据
const metadata = createNFTMetadata(name, description, imageUrl, attributes);

// 3. 上传元数据到IPFS
const metadataResult = await uploadMetadataToIPFS(metadata, pinataConfig);

// 4. 使用元数据URL作为tokenURI
const tokenURI = metadataResult.gatewayUrl || metadataResult.ipfsUrl;
```

### NFT元数据标准
```json
{
  "name": "NFT名称",
  "description": "NFT描述",
  "image": "ipfs://QmHash或https://gateway.url",
  "attributes": [
    {"trait_type": "Category", "value": "Art"},
    {"trait_type": "Generation", "value": "AI Generated"},
    {"trait_type": "Creator", "value": "0x..."}
  ],
  "external_url": "",
  "background_color": "",
  "animation_url": ""
}
```

## 故障排除

### 常见问题

1. **图片生成失败**
   - 检查图片生成API服务是否运行
   - 确认API地址配置正确
   - 检查网络连接

2. **IPFS上传失败**
   - 验证Pinata API密钥是否正确
   - 检查网络连接
   - 确认Pinata账户余额充足

3. **NFT铸造失败**
   - 确认钱包连接正常
   - 检查账户ETH余额是否足够
   - 验证合约地址是否正确

### 调试方法

1. **开启浏览器开发者工具**
   - 查看Console面板的错误信息
   - 检查Network面板的请求状态

2. **检查环境配置**
   ```bash
   # 验证环境变量
   echo $NEXT_PUBLIC_PINATA_API_KEY
   echo $NEXT_PUBLIC_IMAGE_GENERATION_API
   ```

## 最佳实践

### 图片生成提示词建议

1. **具体描述**：使用具体的形容词和名词
2. **风格指定**：明确指定艺术风格
3. **色彩描述**：描述主要色彩和氛围
4. **构图说明**：说明主体和背景元素

### IPFS使用建议

1. **生产环境必备**：主网部署时必须使用IPFS
2. **备份策略**：建议使用多个IPFS服务提供商
3. **元数据验证**：上传后验证元数据格式正确性
4. **成本控制**：监控Pinata使用量和费用

### 安全考虑

1. **API密钥保护**：不要在客户端代码中暴露密钥
2. **输入验证**：对用户输入进行适当验证
3. **错误处理**：提供友好的错误提示
4. **备用方案**：准备IPFS服务不可用时的备用方案

## 更新日志

### v1.0.0 (当前版本)
- ✅ 集成AI图片生成功能
- ✅ 支持IPFS上传和存储
- ✅ 自动化NFT元数据创建
- ✅ 用户友好的界面设计
- ✅ 完整的错误处理和状态反馈

### 未来计划
- 🔄 支持更多图片生成模型
- 🔄 批量NFT创建功能
- 🔄 图片编辑和滤镜功能
- 🔄 NFT系列管理
- 🔄 社交分享功能 