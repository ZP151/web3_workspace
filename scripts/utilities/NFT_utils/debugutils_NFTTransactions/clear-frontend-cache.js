const fs = require('fs');

console.log('🧹 Frontend Cache Cleaner');
console.log('===============================');

// 创建一个简单的HTML页面来清除localStorage
const clearCacheHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Clear NFT Cache</title>
</head>
<body>
    <h1>Clearing NFT Cache...</h1>
    <div id="status">Working...</div>
    
    <script>
        try {
            // 清除所有与NFT相关的localStorage数据
            const keys = Object.keys(localStorage);
            let cleared = 0;
            
            keys.forEach(key => {
                if (key.includes('web3_nft_marketplace_data') || 
                    key.includes('NFT') || 
                    key.includes('marketplace')) {
                    localStorage.removeItem(key);
                    cleared++;
                    console.log('Cleared:', key);
                }
            });
            
            document.getElementById('status').innerHTML = 
                '<p style="color: green;">✅ Cleared ' + cleared + ' cache entries</p>' +
                '<p>Please refresh your NFT page now</p>' +
                '<p><a href="http://localhost:3000/nft">Go to NFT Page</a></p>';
                
        } catch (error) {
            document.getElementById('status').innerHTML = 
                '<p style="color: red;">❌ Error: ' + error.message + '</p>';
        }
    </script>
</body>
</html>
`;

// 写入public目录
fs.writeFileSync('./public/clear-cache.html', clearCacheHtml);

console.log('✅ Created cache cleaner at: http://localhost:3000/clear-cache.html');
console.log('📋 Instructions:');
console.log('1. Visit http://localhost:3000/clear-cache.html');
console.log('2. Wait for cache to be cleared');
console.log('3. Go back to NFT page');
console.log('4. The page should now fetch fresh data from blockchain'); 