# NFT Image Generation Feature Usage Guide

## Overview

This project has integrated AI image generation functionality into the NFT creation process, supporting the generation of NFT images through text descriptions, with optional uploading to IPFS for permanent storage.

## Feature Highlights

### 🎨 AI Image Generation
- **Smart Generation**: Generate unique NFT images through text descriptions
- **Pixel Art Style**: Default use of compression algorithms to generate pixel art style
- **Instant Preview**: Display preview images immediately after generation
- **Auto Integration**: Generated images are automatically set as NFT images

### 🌐 IPFS Storage Support
- **Permanent Storage**: Support uploading to IPFS to ensure images are permanently accessible
- **Metadata Management**: Automatically create and upload NFT standard metadata
- **Pinata Integration**: Use Pinata service for IPFS pinning
- **Local Backup**: Use local storage when IPFS is not configured

## Usage Steps

### 1. Basic NFT Creation

1. **Enter Minting Page**
   - Navigate to NFT page
   - Click "Mint NFT" tab

2. **Fill Basic Information**
   ```
   Name: Your NFT name
   Description: Detailed description of NFT
   Category: Select appropriate category (Art, Collectibles, Photography, Music)
   Price: Optional, if you want to list for sale
   ```

### 2. AI Image Generation

1. **Input Image Description**
   ```
   Example prompts:
   - "A cute digital cat, cyberpunk style, neon background"
   - "Mysterious crystal in space, emitting blue light"
   - "Future city skyline, night, sci-fi style"
   - "Abstract geometric patterns, rainbow colors, modern art"
   ```

2. **Generate Image**
   - Click "Generate Image" button
   - Wait for AI processing (usually takes a few seconds)
   - View generated image preview

3. **Image Management**
   - If unsatisfied, can clear and regenerate
   - Generated image will automatically be set as NFT image

### 3. IPFS Upload (Recommended)

1. **Configure IPFS Service**
   ```bash
   # Add Pinata configuration in .env.local file
   NEXT_PUBLIC_PINATA_API_KEY=your_api_key
   NEXT_PUBLIC_PINATA_SECRET_KEY=your_secret_key
   NEXT_PUBLIC_PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs
   ```

2. **Upload to IPFS**
   - Ensure NFT name and description are filled
   - Click "Upload to IPFS" button
   - Wait for upload completion
   - View IPFS hash and gateway link

3. **Verify Upload**
   - Click "View IPFS" to access uploaded content
   - Confirm image and metadata are correct

### 4. Mint NFT

1. **Final Confirmation**
   - Check all information is correct
   - Confirm minting fee (0.001 ETH)

2. **Execute Minting**
   - Click "Mint NFT" button
   - Confirm transaction in MetaMask
   - Wait for transaction confirmation

## API Interface Specification

### Image Generation API

**Interface Address**: `POST /api/generate-image`

**Request Parameters**:
```json
{
  "prompt": "Image description prompt",
  "use_compression": true,
  "size": "1024x1024",
  "quality": "standard"
}
```

**Response Format**:
```json
{
  "success": true,
  "image_url": "http://localhost:5200/images/uuid.png",
  "file_size_kb": 196.19,
  "algorithm": "Compressed Algorithm (Pixel Art)"
}
```

## IPFS Configuration Guide

### Get Pinata API Keys

1. Visit [Pinata Official Website](https://app.pinata.cloud/)
2. Register and login to account
3. Navigate to API Keys page
4. Create new API key
5. Copy API Key and Secret Key

### Environment Variable Configuration

Create `.env.local` file and add:
```bash
# IPFS Configuration
NEXT_PUBLIC_PINATA_API_KEY=4e6daa871b19dfe5ac33
NEXT_PUBLIC_PINATA_SECRET_KEY=840ce0b8dc018243203f7179fe6e01889e150cc95da7d43a337149ef1ecc374a
NEXT_PUBLIC_PINATA_JWT=840ce0b8dc018243203f7179fe6e01889e150cc95da7d43a337149ef1ecc374a  
NEXT_PUBLIC_PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs

# Image Generation API
NEXT_PUBLIC_IMAGE_GENERATION_API=http://localhost:5200
```

## Technical Implementation Details

### Image Generation Process
```typescript
// 1. Call image generation API
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

// 2. Process response
const data = await response.json();
if (data.success) {
  setGeneratedImageUrl(data.image_url);
}
```

### IPFS Upload Process
```typescript
// 1. Upload image to IPFS
const imageResult = await uploadImageToIPFS(imageUrl, filename, pinataConfig);

// 2. Create NFT metadata
const metadata = createNFTMetadata(name, description, imageUrl, attributes);

// 3. Upload metadata to IPFS
const metadataResult = await uploadMetadataToIPFS(metadata, pinataConfig);

// 4. Use metadata URL as tokenURI
const tokenURI = metadataResult.gatewayUrl || metadataResult.ipfsUrl;
```

### NFT Metadata Standard
```json
{
  "name": "NFT Name",
  "description": "NFT Description",
  "image": "ipfs://QmHash or https://gateway.url",
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

## Troubleshooting

### Common Issues

1. **Image Generation Fails**
   - Check if image generation API service is running
   - Confirm API address configuration is correct
   - Check network connection

2. **IPFS Upload Fails**
   - Verify Pinata API keys are correct
   - Check network connection
   - Ensure file size is within limits

3. **NFT Minting Fails**
   - Ensure sufficient ETH balance for gas
   - Check if contract is properly deployed
   - Verify MetaMask is connected to correct network

### Service Configuration

**Image Generation Service Setup**
```bash
# If running local image generation service
# Ensure service is running on http://localhost:5200
# Check service status and logs
```

**IPFS Service Alternatives**
- Pinata (recommended): Most reliable pinning service
- Infura IPFS: Alternative IPFS gateway
- Local IPFS node: For development testing

## Best Practices

### Image Generation Tips
1. **Clear Descriptions**: Use specific, descriptive prompts
2. **Style Specification**: Include artistic style preferences
3. **Appropriate Content**: Ensure generated content is appropriate
4. **Multiple Attempts**: Try different prompts if unsatisfied

### IPFS Usage Recommendations
1. **Always Upload**: Use IPFS for production NFTs
2. **Verify Links**: Test IPFS links before minting
3. **Backup Keys**: Securely store Pinata API keys
4. **Monitor Usage**: Track Pinata account usage limits

### Security Considerations
1. **API Key Security**: Never expose API keys in frontend code
2. **Content Validation**: Validate generated content appropriateness
3. **Gas Management**: Monitor transaction gas costs
4. **Network Selection**: Use appropriate network for testing vs production

This guide covers the complete workflow for NFT image generation and IPFS storage integration. For additional support, refer to the project documentation or community resources. 