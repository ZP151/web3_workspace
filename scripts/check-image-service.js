const fetch = require('node-fetch');

async function checkImageService() {
  console.log('🔍 Checking image generation service...');
  
  try {
    // Check health endpoint
    const healthResponse = await fetch('http://localhost:5200/health');
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Image generation service is running');
      console.log('📋 Service info:', healthData);
      
      // Test image generation
      console.log('\n🎨 Testing image generation...');
      const testResponse = await fetch('http://localhost:5200/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'A test image of a simple blue circle',
          use_compression: true,
          size: "512x512",
          quality: "standard"
        }),
      });
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        if (testData.success) {
          console.log('✅ Image generation test successful');
          console.log('🖼️  Generated image URL:', testData.image_url);
          console.log('📏 File size:', testData.file_size_kb, 'KB');
          console.log('🔧 Algorithm:', testData.algorithm);
        } else {
          console.log('❌ Image generation test failed');
        }
      } else {
        console.log('❌ Image generation endpoint error:', testResponse.status);
      }
      
    } else {
      console.log('❌ Image generation service health check failed');
      console.log('📍 Service should be running on: http://localhost:5200');
    }
    
  } catch (error) {
    console.log('❌ Image generation service is not running');
    console.log('📍 Please start the Python service on port 5200');
    console.log('🔧 Error:', error.message);
    
    console.log('\n💡 To start the image generation service:');
    console.log('   1. Make sure you have the Python image generation service');
    console.log('   2. Run: python app.py');
    console.log('   3. The service should be available on http://localhost:5200');
  }
}

checkImageService(); 