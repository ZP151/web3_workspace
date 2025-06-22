# NFT图片生成功能设置脚本
# 运行方法: .\scripts\setup-nft-features.ps1

Write-Host "🎨 NFT图片生成功能设置向导" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# 检查Node.js版本
Write-Host "`n📋 检查环境..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Node.js版本: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ 未找到Node.js，请先安装Node.js" -ForegroundColor Red
    exit 1
}

# 检查npm依赖
Write-Host "`n📦 检查项目依赖..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ 依赖已安装" -ForegroundColor Green
} else {
    Write-Host "⚠️ 依赖未安装，正在安装..." -ForegroundColor Yellow
    npm install
}

# 检查环境变量文件
Write-Host "`n🔧 检查环境配置..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✅ 找到.env.local文件" -ForegroundColor Green
    
    # 检查图片生成API配置
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "NEXT_PUBLIC_IMAGE_GENERATION_API") {
        Write-Host "✅ 图片生成API已配置" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 未找到图片生成API配置" -ForegroundColor Yellow
        Write-Host "添加配置到.env.local文件..." -ForegroundColor Yellow
        Add-Content ".env.local" "`nNEXT_PUBLIC_IMAGE_GENERATION_API=http://localhost:5200"
        Write-Host "✅ 已添加默认配置" -ForegroundColor Green
    }
    
    # 检查IPFS配置
    if ($envContent -match "NEXT_PUBLIC_PINATA_API_KEY") {
        Write-Host "✅ IPFS配置已存在" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 未找到IPFS配置" -ForegroundColor Yellow
        Write-Host "添加IPFS配置模板..." -ForegroundColor Yellow
        Add-Content ".env.local" @"

# IPFS配置 (Pinata服务)
# 获取API密钥: https://app.pinata.cloud/keys
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key_here
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key_here
NEXT_PUBLIC_PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs
"@
        Write-Host "✅ 已添加IPFS配置模板" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️ 未找到.env.local文件，正在创建..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env.local"
    Write-Host "✅ 已创建.env.local文件" -ForegroundColor Green
}

# 测试图片生成API连接
Write-Host "`n🧪 测试图片生成API连接..." -ForegroundColor Yellow
if (Test-Path "scripts/test-image-generation.js") {
    Write-Host "正在测试API连接..." -ForegroundColor Gray
    
    # 运行测试脚本
    $testResult = node scripts/test-image-generation.js 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 图片生成API测试成功" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 图片生成API测试失败" -ForegroundColor Yellow
        Write-Host "请确保图片生成服务正在运行在 http://localhost:5200" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ 未找到测试脚本" -ForegroundColor Red
}

# 检查合约部署状态
Write-Host "`n🔗 检查合约部署状态..." -ForegroundColor Yellow
if (Test-Path "src/contracts/addresses.json") {
    $addresses = Get-Content "src/contracts/addresses.json" | ConvertFrom-Json
    if ($addresses.'1337'.PlatformNFT) {
        Write-Host "✅ NFT合约已部署: $($addresses.'1337'.PlatformNFT)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ NFT合约未部署" -ForegroundColor Yellow
        Write-Host "请运行: npx hardhat run scripts/deploy-and-setup-all.js --network ganache" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️ 合约地址文件不存在" -ForegroundColor Yellow
    Write-Host "请先部署合约" -ForegroundColor Gray
}

# 提供使用指南
Write-Host "`n📚 使用指南:" -ForegroundColor Cyan
Write-Host "1. 启动图片生成服务 (端口5200)" -ForegroundColor White
Write-Host "2. 启动Ganache GUI或命令行版本" -ForegroundColor White
Write-Host "3. 部署合约: npx hardhat run scripts/deploy-and-setup-all.js --network ganache" -ForegroundColor White
Write-Host "4. 启动前端: npm run dev" -ForegroundColor White
Write-Host "5. 访问 http://localhost:3000/nft 开始创建NFT" -ForegroundColor White

Write-Host "`n🔧 IPFS配置 (可选):" -ForegroundColor Cyan
Write-Host "1. 访问 https://app.pinata.cloud/ 注册账户" -ForegroundColor White
Write-Host "2. 创建API密钥" -ForegroundColor White
Write-Host "3. 在.env.local中更新PINATA配置" -ForegroundColor White

Write-Host "`n📖 详细文档:" -ForegroundColor Cyan
Write-Host "查看 docs/NFT_IMAGE_GENERATION_GUIDE.md 获取完整使用指南" -ForegroundColor White

Write-Host "`n🎉 设置完成！" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Gray 