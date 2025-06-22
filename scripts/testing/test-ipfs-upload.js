#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

async function testIPFSUpload() {
    console.log('🧪 Testing IPFS Upload Configuration...\n');
    
    // Check environment variables
    const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const secretKey = process.env.PINATA_SECRET_API_KEY;
    const jwt = process.env.PINATA_JWT;
    
    console.log('📋 Configuration Check:');
    console.log(`   API Key: ${apiKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Secret Key: ${secretKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   JWT Token: ${jwt ? '✅ Set' : '❌ Missing'}\n`);
    
    if (!jwt && (!apiKey || !secretKey)) {
        console.log('❌ Missing IPFS credentials. Please add to .env:');
        console.log('   PINATA_JWT=your_jwt_token');
        console.log('   OR');
        console.log('   NEXT_PUBLIC_PINATA_API_KEY=your_api_key');
        console.log('   PINATA_SECRET_API_KEY=your_secret_key');
        return;
    }
    
    try {
        console.log('🔗 Testing Pinata connection...');
        
        // Test authentication
        const headers = jwt ? 
            { 'Authorization': `Bearer ${jwt}` } :
            { 
                'pinata_api_key': apiKey,
                'pinata_secret_api_key': secretKey
            };
            
        const authResponse = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
            headers
        });
        
        if (authResponse.data.message === 'Congratulations! You are communicating with the Pinata API!') {
            console.log('✅ Pinata authentication successful!');
        } else {
            console.log('⚠️  Pinata authentication response:', authResponse.data);
        }
        
        // Test JSON upload (simpler than file upload)
        console.log('\n🔄 Testing JSON upload...');
        
        const testMetadata = {
            name: 'Test NFT Metadata',
            description: 'This is a test upload to verify IPFS functionality',
            image: 'https://example.com/test-image.png',
            attributes: [
                { trait_type: 'Test', value: 'Upload' }
            ],
            timestamp: new Date().toISOString()
        };
        
        const uploadResponse = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
            pinataContent: testMetadata,
            pinataMetadata: {
                name: `test-metadata-${Date.now()}`
            }
        }, { headers });
        
        if (uploadResponse.data.IpfsHash) {
            const ipfsHash = uploadResponse.data.IpfsHash;
            const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
            
            console.log('✅ Upload successful!');
            console.log(`   IPFS Hash: ${ipfsHash}`);
            console.log(`   Gateway URL: ${gatewayUrl}`);
            console.log(`   IPFS URL: ipfs://${ipfsHash}`);
            
            // Test if the content is accessible
            console.log('\n🔍 Testing content accessibility...');
            try {
                const contentResponse = await axios.get(gatewayUrl, { timeout: 10000 });
                console.log('✅ Content is accessible via gateway!');
                console.log('   Retrieved data:', JSON.stringify(contentResponse.data, null, 2));
            } catch (error) {
                console.log('⚠️  Content might not be immediately accessible (this is normal)');
                console.log('   Gateway URL should work in a few minutes:', gatewayUrl);
            }
            
        } else {
            console.log('❌ Upload failed - no IPFS hash returned');
            console.log('Response:', uploadResponse.data);
        }
        
    } catch (error) {
        console.error('❌ IPFS Test Failed:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${error.response.data?.error || error.response.statusText}`);
            console.error(`   Details:`, error.response.data);
        } else {
            console.error(`   Error: ${error.message}`);
        }
        
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Verify your Pinata credentials are correct');
        console.log('   2. Check if your Pinata account has sufficient storage');
        console.log('   3. Ensure your API keys have the required permissions');
        console.log('   4. Try regenerating your JWT token if using JWT authentication');
    }
}

testIPFSUpload().catch(console.error); 