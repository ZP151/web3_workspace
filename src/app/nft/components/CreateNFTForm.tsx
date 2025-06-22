import React, { useState } from 'react';
import { Plus, Wand2, Loader2, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MintData, NFTCategory, ImageGenerationResponse } from '../types';
import { 
  uploadImageToIPFS, 
  uploadMetadataToIPFS, 
  createNFTMetadata, 
  getPinataConfig,
  IPFSUploadResult 
} from '@/utils/ipfs';
import { toast } from 'react-hot-toast';

interface CreateNFTFormProps {
  mintData: MintData;
  onMintDataChange: (data: MintData) => void;
  onMintNFT: () => void;
  isMinting: boolean;
  categories: NFTCategory[];
  address?: string;
}

export function CreateNFTForm({ 
  mintData, 
  onMintDataChange, 
  onMintNFT, 
  isMinting, 
  categories,
  address 
}: CreateNFTFormProps) {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [isUploadingToIPFS, setIsUploadingToIPFS] = useState(false);
  const [ipfsResult, setIpfsResult] = useState<IPFSUploadResult | null>(null);

  const generateImage = async () => {
    const promptText = imagePrompt || mintData.description;
    if (!promptText.trim()) {
      toast.error('Please enter description first');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const response = await fetch('http://localhost:5200/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptText,
          use_compression: true,
          size: "1024x1024",
          quality: "standard"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - Please make sure the image generation service is running on port 5200`);
      }

      const data: ImageGenerationResponse = await response.json();
      
      if (data.success) {
        setGeneratedImageUrl(data.image_url);
        onMintDataChange({ ...mintData, image: data.image_url });
        toast.success(`Image generated successfully! File size: ${data.file_size_kb.toFixed(2)} KB`);
      } else {
        throw new Error('Image generation failed');
      }
          } catch (error) {
        console.error('Image generation error:', error);
        if (error instanceof Error) {
          if (error.message.includes('fetch')) {
            toast.error('Cannot connect to image generation service. Please make sure it\'s running on port 5200.');
          } else {
            toast.error('Image generation failed: ' + error.message);
          }
        } else {
          toast.error('Image generation failed: Unknown error');
        }
      } finally {
      setIsGeneratingImage(false);
    }
  };

  const clearGeneratedImage = () => {
    setGeneratedImageUrl('');
    setImagePrompt('');
    onMintDataChange({ ...mintData, image: '' });
    setIpfsResult(null);
  };

  const uploadToIPFS = async () => {
    if (!generatedImageUrl) {
      toast.error('No generated image to upload');
      return;
    }

    setIsUploadingToIPFS(true);
    try {
      // Get Pinata configuration from environment variables
      const pinataConfig = getPinataConfig();
      
      const filename = `nft-${Date.now()}.png`;
      
      console.log('📤 Starting IPFS upload...');
      console.log('🖼️ Image URL:', generatedImageUrl);
      
      const imageResult = await uploadImageToIPFS(generatedImageUrl, filename, pinataConfig);
      
      console.log('📤 Image upload result:', imageResult);
      
      if (imageResult.success) {
        const metadata = createNFTMetadata(
          mintData.name || 'Untitled NFT',
          mintData.description || 'No description',
          imageResult.gatewayUrl || imageResult.ipfsUrl!,
          [
            { trait_type: "Category", value: mintData.category },
            { trait_type: "Generation", value: "Digital Generated" },
            { trait_type: "Creator", value: address || "Unknown" }
          ]
        );

        console.log('📋 Uploading metadata:', metadata);
        
        const metadataResult = await uploadMetadataToIPFS(metadata, pinataConfig);
        
        console.log('📋 Metadata upload result:', metadataResult);
        
        if (metadataResult.success) {
          const ipfsData = {
            success: true,
            ipfsHash: metadataResult.ipfsHash,
            ipfsUrl: metadataResult.ipfsUrl,
            gatewayUrl: metadataResult.gatewayUrl
          };
          
          setIpfsResult(ipfsData);
          
          // Update mintData with IPFS information
          onMintDataChange({
            ...mintData,
            image: imageResult.gatewayUrl || imageResult.ipfsUrl!,
            metadataUri: metadataResult.gatewayUrl || metadataResult.ipfsUrl,
            attributes: [
              { trait_type: "Category", value: mintData.category },
              { trait_type: "Generation", value: "Digital Generated" },
              { trait_type: "Creator", value: address || "Unknown" }
            ]
          });
          
          toast.success('🎉 Successfully uploaded to IPFS!');
        } else {
          throw new Error(metadataResult.error || 'Metadata upload failed');
        }
      } else {
        throw new Error(imageResult.error || 'Image upload failed');
      }
    } catch (error) {
      console.error('❌ IPFS upload error:', error);
      toast.error('IPFS upload failed: ' + (error as Error).message);
    } finally {
      setIsUploadingToIPFS(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
          <Plus className="h-6 w-6 mr-3 text-purple-600" />
          Create New NFT
        </h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter NFT name"
                value={mintData.name}
                onChange={(e) => onMintDataChange({ ...mintData, name: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={mintData.category}
                onChange={(e) => onMintDataChange({ ...mintData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {categories.filter(c => c.id !== 'all').map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <div className="space-y-3">
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Describe your NFT... This description will also be used for image generation if you choose to generate an image."
                value={mintData.description}
                onChange={(e) => onMintDataChange({ ...mintData, description: e.target.value })}
              />
              
              {/* Generate Image Button */}
              <div className="flex space-x-2">
                <Button
                  type="button"
                  onClick={() => {
                    setImagePrompt(mintData.description);
                    generateImage();
                  }}
                  disabled={isGeneratingImage || !mintData.description.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="sm"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Image from Description
                    </>
                  )}
                </Button>
                
                {generatedImageUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearGeneratedImage}
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">NFT Image</label>
            
            <div className="space-y-4">

              {generatedImageUrl && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Generated Image</h4>
                    <div className="flex items-center space-x-2">
                      {ipfsResult ? (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          Uploaded to IPFS
                        </span>
                      ) : (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          Generated
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="aspect-square w-32 mx-auto mb-3">
                    <img
                      src={generatedImageUrl}
                      alt="Generated NFT"
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    {!ipfsResult ? (
                      <Button
                        type="button"
                        onClick={uploadToIPFS}
                        disabled={isUploadingToIPFS || !mintData.name.trim() || !mintData.description.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        {isUploadingToIPFS ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading to IPFS...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Upload to IPFS
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">IPFS Hash:</span>
                          <br />
                          <code className="bg-gray-100 px-1 py-0.5 rounded text-xs break-all">
                            {ipfsResult.ipfsHash || 'Local Storage'}
                          </code>
                        </div>
                        {ipfsResult.gatewayUrl && ipfsResult.gatewayUrl !== 'about:blank' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              console.log('Opening IPFS URL:', ipfsResult.gatewayUrl);
                              if (ipfsResult.gatewayUrl && ipfsResult.gatewayUrl.startsWith('http')) {
                                window.open(ipfsResult.gatewayUrl, '_blank');
                              } else {
                                toast.error('Invalid IPFS URL');
                              }
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View on IPFS
                          </Button>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 text-center">
                      {ipfsResult 
                        ? 'Metadata ready for minting' 
                        : 'Recommend uploading to IPFS for permanent storage'
                      }
                    </p>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter image URL manually
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://example.com/image.png"
                  value={mintData.image}
                  onChange={(e) => onMintDataChange({ ...mintData, image: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to generate placeholder image
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price (ETH)</label>
            <input
              type="number"
              step="0.001"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="0.0"
              value={mintData.price}
              onChange={(e) => onMintDataChange({ ...mintData, price: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty if not for sale</p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center text-sm text-purple-700">
              <div className="flex-shrink-0 w-4 h-4 mr-2">🎨</div>
              <div>
                <strong>Minting Fee:</strong> 0.001 ETH
                <br />
                <span className="text-purple-600">This fee covers gas costs and platform maintenance</span>
              </div>
            </div>
          </div>

          <Button
            onClick={onMintNFT}
            disabled={!mintData.name.trim() || !mintData.description.trim() || isMinting}
            className="w-full"
          >
            {isMinting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Minting...
              </>
            ) : (
              'Mint NFT (0.001 ETH)'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 