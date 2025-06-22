/**
 * 测试图片生成API连接的脚本
 * 运行方法: node scripts/test-image-generation.js
 */

const fetch = require('node-fetch');

async function testImageGenerationAPI() {
  console.log('🧪 开始测试图片生成API...');
  console.log('=' * 50);

  const apiUrl = process.env.NEXT_PUBLIC_IMAGE_GENERATION_API || 'http://localhost:5200';
  const endpoint = `${apiUrl}/api/generate-image`;

  console.log(`📡 API地址: ${endpoint}`);

  const testPrompts = [
    "一只可爱的数字猫咪，赛博朋克风格，霓虹灯背景",
    "宇宙中的神秘水晶，发出蓝色光芒",
    "未来城市的天际线，夜晚，科幻风格"
  ];

  for (let i = 0; i < testPrompts.length; i++) {
    const prompt = testPrompts[i];
    console.log(`\n🎨 测试 ${i + 1}/${testPrompts.length}: ${prompt}`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          use_compression: true,
          size: "1024x1024",
          quality: "standard"
        }),
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ 生成成功!`);
        console.log(`   📸 图片URL: ${data.image_url}`);
        console.log(`   📏 文件大小: ${data.file_size_kb.toFixed(2)} KB`);
        console.log(`   🎯 算法: ${data.algorithm}`);
        console.log(`   ⏱️ 耗时: ${duration}ms`);
      } else {
        console.log(`❌ 生成失败: API返回success=false`);
      }

    } catch (error) {
      console.log(`❌ 测试失败: ${error.message}`);
      
      if (error.code === 'ECONNREFUSED') {
        console.log(`💡 提示: 请确保图片生成服务正在运行在 ${apiUrl}`);
      }
    }

    // 添加延迟避免过于频繁的请求
    if (i < testPrompts.length - 1) {
      console.log('⏳ 等待2秒...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n' + '=' * 50);
  console.log('🏁 测试完成!');
  
  // 提供使用建议
  console.log('\n📋 使用建议:');
  console.log('1. 确保图片生成服务在 http://localhost:5200 运行');
  console.log('2. 在.env.local中配置 NEXT_PUBLIC_IMAGE_GENERATION_API');
  console.log('3. 测试不同的提示词以获得最佳效果');
  console.log('4. 考虑配置IPFS以实现永久存储');
}

// 运行测试
testImageGenerationAPI().catch(console.error); 