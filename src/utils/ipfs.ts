/**
 * IPFS 上传工具函数
 * 为未来的IPFS集成做准备，目前返回本地URL
 */

export interface IPFSUploadResult {
  success: boolean;
  ipfsHash?: string;
  ipfsUrl?: string;
  gatewayUrl?: string;
  error?: string;
}

export interface PinataConfig {
  apiKey?: string;
  secretKey?: string;
  jwt?: string;
  gatewayUrl?: string;
}

/**
 * Upload image to IPFS using Pinata service
 * @param imageUrl Local image URL
 * @param filename File name
 * @param pinataConfig Pinata configuration
 * @returns IPFS upload result
 */
export async function uploadImageToIPFS(
  imageUrl: string, 
  filename: string, 
  pinataConfig?: PinataConfig
): Promise<IPFSUploadResult> {
  try {
    // If no Pinata configuration, return original URL
    if (!pinataConfig || (!pinataConfig.apiKey && !pinataConfig.jwt)) {
      console.log('🔄 IPFS configuration not provided, using local URL');
      return {
        success: true,
        ipfsUrl: imageUrl,
        gatewayUrl: imageUrl
      };
    }

    // Get image data from local URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    const formData = new FormData();
    formData.append('file', blob, filename);

    // Prepare request headers
    const headers: Record<string, string> = {};
    
    if (pinataConfig.jwt) {
      // Use JWT authentication
      headers['Authorization'] = `Bearer ${pinataConfig.jwt}`;
    } else if (pinataConfig.apiKey && pinataConfig.secretKey) {
      // Use API Key authentication
      headers['pinata_api_key'] = pinataConfig.apiKey;
      headers['pinata_secret_api_key'] = pinataConfig.secretKey;
    }

    // Upload to Pinata
    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!pinataResponse.ok) {
      throw new Error(`Pinata upload failed: ${pinataResponse.statusText}`);
    }

    const pinataData = await pinataResponse.json();
    const ipfsHash = pinataData.IpfsHash;
    const gatewayUrl = pinataConfig.gatewayUrl || 'https://gateway.pinata.cloud/ipfs';

    return {
      success: true,
      ipfsHash,
      ipfsUrl: `ipfs://${ipfsHash}`,
      gatewayUrl: `${gatewayUrl}/${ipfsHash}`
    };

  } catch (error) {
    console.error('IPFS upload error:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * Upload NFT metadata to IPFS
 * @param metadata NFT metadata
 * @param pinataConfig Pinata configuration
 * @returns IPFS upload result
 */
export async function uploadMetadataToIPFS(
  metadata: any, 
  pinataConfig?: PinataConfig
): Promise<IPFSUploadResult> {
  try {
    // If no Pinata configuration, return local data URL
    if (!pinataConfig || (!pinataConfig.apiKey && !pinataConfig.jwt)) {
      console.log('🔄 IPFS configuration not provided, using local metadata');
      const dataUrl = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
      return {
        success: true,
        ipfsUrl: dataUrl,
        gatewayUrl: dataUrl
      };
    }

    // Prepare request headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (pinataConfig.jwt) {
      // Use JWT authentication
      headers['Authorization'] = `Bearer ${pinataConfig.jwt}`;
    } else if (pinataConfig.apiKey && pinataConfig.secretKey) {
      // Use API Key authentication
      headers['pinata_api_key'] = pinataConfig.apiKey;
      headers['pinata_secret_api_key'] = pinataConfig.secretKey;
    }

    // Upload metadata to Pinata
    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `NFT-Metadata-${Date.now()}`
        }
      }),
    });

    if (!pinataResponse.ok) {
      throw new Error(`Pinata metadata upload failed: ${pinataResponse.statusText}`);
    }

    const pinataData = await pinataResponse.json();
    const ipfsHash = pinataData.IpfsHash;
    const gatewayUrl = pinataConfig.gatewayUrl || 'https://gateway.pinata.cloud/ipfs';

    return {
      success: true,
      ipfsHash,
      ipfsUrl: `ipfs://${ipfsHash}`,
      gatewayUrl: `${gatewayUrl}/${ipfsHash}`
    };

  } catch (error) {
    console.error('IPFS metadata upload error:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * Create NFT metadata object
 * @param name NFT name
 * @param description NFT description
 * @param imageUrl Image URL (can be IPFS URL)
 * @param attributes Attributes array
 * @returns NFT metadata object
 */
export function createNFTMetadata(
  name: string,
  description: string,
  imageUrl: string,
  attributes: Array<{ trait_type: string; value: string | number }> = []
) {
  return {
    name,
    description,
    image: imageUrl,
    attributes,
    external_url: "", // Can be set to project website
    background_color: "", // Optional background color
    animation_url: "", // Optional animation URL
  };
}

/**
 * Get IPFS configuration from environment variables
 * @returns Pinata configuration or undefined
 */
export function getPinataConfig(): PinataConfig | undefined {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    console.log('⚠️ Pinata config not available on server side, will use local URL');
    return undefined;
  }

  // Get configuration from environment variables (client-side)
  const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;
  const gatewayUrl = process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL;

  console.log('🔍 Environment variables check:', {
    hasApiKey: !!apiKey,
    hasSecretKey: !!secretKey,
    hasJWT: !!jwt,
    hasGatewayUrl: !!gatewayUrl
  });

  // Prefer JWT, fallback to API Key
  if (jwt) {
    console.log('✅ Using JWT authentication for Pinata');
    return {
      jwt,
      gatewayUrl
    };
  }

  if (apiKey && secretKey) {
    console.log('✅ Using API Key authentication for Pinata');
    return {
      apiKey,
      secretKey,
      gatewayUrl
    };
  }

  console.log('⚠️ Pinata configuration not found, will use local URL');
  return undefined;
} 