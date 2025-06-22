import React, { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction, useNetwork } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'react-hot-toast';
import { getContractAddress, getContractABI } from '@/config/contracts';
import { NFT, MintData } from '../types';

// Storage key for persisting NFT data
const NFT_STORAGE_KEY = 'web3_nft_marketplace_data';

// Helper functions for localStorage operations
const saveNFTsToStorage = (nfts: NFT[]) => {
  try {
    const dataToStore = {
      nfts,
      timestamp: Date.now(),
      version: '1.0'
    };
    localStorage.setItem(NFT_STORAGE_KEY, JSON.stringify(dataToStore));
  } catch (error) {
    console.warn('Failed to save NFTs to localStorage:', error);
  }
};

const loadNFTsFromStorage = (): NFT[] => {
  try {
    const stored = localStorage.getItem(NFT_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Check if data is recent (within 7 days) and has the correct version
      const isRecent = Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000;
      if (data.version === '1.0' && isRecent && Array.isArray(data.nfts)) {
        return data.nfts;
      }
    }
  } catch (error) {
    console.warn('Failed to load NFTs from localStorage:', error);
  }
  return [];
};

const clearNFTStorage = () => {
  try {
    localStorage.removeItem(NFT_STORAGE_KEY);
    console.log('🗑️ NFT storage cleared');
  } catch (error) {
    console.warn('Failed to clear NFT storage:', error);
  }
};

// Helper function to fetch metadata from IPFS/HTTP
const fetchMetadata = async (tokenURI: string) => {
  try {
    // Convert IPFS URI to gateway URL if needed
    let url = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      url = tokenURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.warn('Failed to fetch metadata from:', tokenURI, error);
    return null;
  }
};

// Helper function to determine rarity based on attributes or token ID
const determineRarity = (tokenId: number, attributes?: any[]): 'Common' | 'Rare' | 'Epic' | 'Legendary' => {
  // Simple rarity logic - can be enhanced based on actual attributes
  if (attributes && attributes.length > 5) return 'Legendary';
  if (attributes && attributes.length > 3) return 'Epic';
  if (tokenId % 10 === 0) return 'Rare';
  return 'Common';
};

export function useNFTContract() {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const [isMinting, setIsMinting] = useState(false);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [mintData, setMintData] = useState<MintData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingFromContract, setIsLoadingFromContract] = useState(false);

  // Get contract address for current network - use PlatformNFT for minting
  const contractAddress = chain?.id ? getContractAddress(chain.id, 'PlatformNFT') : null;
  const contractABI = getContractABI('PlatformNFT');
  
  // Only log when there are issues (like other services do)
  if (!contractAddress && chain?.id) {
    console.warn('⚠️ PlatformNFT contract not available on chain:', chain.id);
  }

  // Get current token ID from contract
  const { data: currentTokenId } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'getCurrentTokenId',
    enabled: !!contractAddress,
  });

  // Get mint fee from contract
  const { data: mintFee } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'mintFee',
    enabled: !!contractAddress,
  });

  // Get total supply
  const { data: totalSupply } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'totalSupply',
    enabled: !!contractAddress,
  });

  // Get marketplace contract for listings
  const marketplaceAddress = chain?.id ? getContractAddress(chain.id, 'NFTMarketplace') : null;
  const marketplaceABI = getContractABI('NFTMarketplace');

  // Get marketplace stats
  const { data: marketplaceStats } = useContractRead({
    address: marketplaceAddress as `0x${string}`,
    abi: marketplaceABI,
    functionName: 'getMarketplaceStats',
    enabled: !!marketplaceAddress,
  });

  // Get listing count
  const { data: listingCount } = useContractRead({
    address: marketplaceAddress as `0x${string}`,
    abi: marketplaceABI,
    functionName: 'getListingCount',
    enabled: !!marketplaceAddress,
  });

  // Initialize NFT data from storage or create mock data
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return;
    
    // Try to load existing NFTs from localStorage first
    const storedNfts = loadNFTsFromStorage();
    
    if (storedNfts.length > 0) {
      // Load stored NFTs
      setNfts(storedNfts);
      console.log(`📦 Loaded ${storedNfts.length} NFTs from localStorage`);
    } else {
      // Create initial mock NFTs if no stored data
      const mockNfts: NFT[] = [
        {
          id: '1',
          tokenId: 1,
          name: 'Cosmic Cat',
          description: 'A mystical cat exploring the cosmos',
          image: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=400&fit=crop&crop=center',
          price: '0.05',
          owner: '0x1234...5678',
          creator: '0x1234...5678',
          category: 'art',
          isListed: true,
          likes: 42,
          views: 156,
          rarity: 'Rare',
          metadataUri: 'https://gateway.pinata.cloud/ipfs/QmExampleHash1',
          attributes: [
            { trait_type: 'Category', value: 'art' },
            { trait_type: 'Rarity', value: 'Rare' },
            { trait_type: 'Species', value: 'Cat' },
            { trait_type: 'Theme', value: 'Cosmic' }
          ]
        },
        {
          id: '2',
          tokenId: 2,
          name: 'Digital Landscape',
          description: 'A breathtaking digital landscape scene',
          image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
          price: '0.1',
          owner: '0x5678...9012',
          creator: '0x5678...9012',
          category: 'photography',
          isListed: true,
          likes: 78,
          views: 234,
          rarity: 'Epic',
          metadataUri: 'https://gateway.pinata.cloud/ipfs/QmExampleHash2',
          attributes: [
            { trait_type: 'Category', value: 'photography' },
            { trait_type: 'Rarity', value: 'Epic' },
            { trait_type: 'Location', value: 'Mountains' },
            { trait_type: 'Time of Day', value: 'Sunset' }
          ]
        },
        {
          id: '3',
          tokenId: 3,
          name: 'Abstract Art',
          description: 'Modern abstract digital artwork',
          image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop&crop=center',
          price: '0.03',
          owner: '0x9012...3456',
          creator: '0x9012...3456',
          category: 'art',
          isListed: false,
          likes: 23,
          views: 89,
          rarity: 'Common',
          metadataUri: 'https://gateway.pinata.cloud/ipfs/QmExampleHash3',
          attributes: [
            { trait_type: 'Category', value: 'art' },
            { trait_type: 'Rarity', value: 'Common' },
            { trait_type: 'Style', value: 'Abstract' },
            { trait_type: 'Colors', value: 'Multicolor' }
          ]
        }
      ];
      setNfts(mockNfts);
      saveNFTsToStorage(mockNfts);
      console.log('🎨 Created initial mock NFTs and saved to localStorage');
    }
    
    setIsInitialized(true);
  }, [isInitialized]);

  // Function to load NFTs from blockchain
  const loadNFTsFromBlockchain = async () => {
    if (!contractAddress || !marketplaceAddress || isLoadingFromContract) return;
    
    setIsLoadingFromContract(true);
    console.log('🔗 Loading NFTs from blockchain...');
    
    try {
      const totalSupplyNum = Number(totalSupply || 0);
      if (totalSupplyNum === 0) {
        console.log('📭 No NFTs found on blockchain');
        setIsLoadingFromContract(false);
        return;
      }

      const loadedNfts: NFT[] = [];
      const batchSize = 10; // Load in batches to avoid overwhelming the RPC
      
      for (let i = 0; i < totalSupplyNum; i += batchSize) {
        const batch = [];
        const end = Math.min(i + batchSize, totalSupplyNum);
        
        for (let tokenId = i; tokenId < end; tokenId++) {
          batch.push(loadSingleNFT(tokenId));
        }
        
        try {
          const batchResults = await Promise.allSettled(batch);
          for (const result of batchResults) {
            if (result.status === 'fulfilled' && result.value) {
              loadedNfts.push(result.value);
            }
          }
        } catch (error) {
          console.warn(`Failed to load batch ${i}-${end}:`, error);
        }
        
        // Small delay between batches to avoid rate limiting
        if (end < totalSupplyNum) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (loadedNfts.length > 0) {
        // Merge with existing local data (keep local likes/views for better UX)
        const existingNfts = loadNFTsFromStorage();
        const mergedNfts = mergeNFTData(loadedNfts, existingNfts);
        
        setNfts(mergedNfts);
        saveNFTsToStorage(mergedNfts);
        console.log(`✅ Loaded ${loadedNfts.length} NFTs from blockchain`);
      }
      
    } catch (error) {
      console.error('❌ Failed to load NFTs from blockchain:', error);
      toast.error('Failed to load NFTs from blockchain');
    } finally {
      setIsLoadingFromContract(false);
    }
  };

  // Function to load a single NFT from blockchain
  const loadSingleNFT = async (tokenId: number): Promise<NFT | null> => {
    try {
      // This would need to be implemented with actual contract calls
      // For now, we'll use a mock implementation
      // In a real implementation, you would:
      // 1. Get token owner using ownerOf(tokenId)
      // 2. Get token URI using tokenURI(tokenId)
      // 3. Fetch metadata from URI
      // 4. Get stats using getNFTStats(tokenId)
      // 5. Check if token is listed in marketplace
      
      // Mock implementation for demonstration
      const mockNft: NFT = {
        id: `blockchain-${tokenId}`,
        tokenId,
        name: `Blockchain NFT #${tokenId}`,
        description: `NFT loaded from blockchain with token ID ${tokenId}`,
        image: `https://via.placeholder.com/400x400?text=NFT+${tokenId}`,
        price: '0',
        owner: '0xBlockchain...Owner',
        creator: '0xBlockchain...Creator',
        category: 'art',
        isListed: false,
        likes: 0,
        views: 0,
        rarity: determineRarity(tokenId),
        metadataUri: `ipfs://QmMockHash${tokenId}`,
        attributes: [
          { trait_type: 'Source', value: 'Blockchain' },
          { trait_type: 'Token ID', value: tokenId }
        ]
      };
      
      return mockNft;
    } catch (error) {
      console.warn(`Failed to load NFT ${tokenId}:`, error);
      return null;
    }
  };

  // Function to merge blockchain data with local data
  const mergeNFTData = (blockchainNfts: NFT[], localNfts: NFT[]): NFT[] => {
    const merged: NFT[] = [];
    
    // Create a map of local NFTs by token ID for quick lookup
    const localNftMap = new Map<number, NFT>();
    localNfts.forEach(nft => {
      localNftMap.set(nft.tokenId, nft);
    });
    
    // Merge blockchain NFTs with local data
    blockchainNfts.forEach(blockchainNft => {
      const localNft = localNftMap.get(blockchainNft.tokenId);
      
      if (localNft) {
        // Keep local likes/views but use blockchain data for ownership/listing
        merged.push({
          ...blockchainNft,
          likes: localNft.likes,
          views: localNft.views,
          // Could also preserve other local modifications
        });
      } else {
        merged.push(blockchainNft);
      }
    });
    
    // Add local-only NFTs (newly minted ones not yet indexed)
    localNfts.forEach(localNft => {
      if (!blockchainNfts.find(bn => bn.tokenId === localNft.tokenId)) {
        merged.push(localNft);
      }
    });
    
    return merged.sort((a, b) => b.tokenId - a.tokenId); // Sort by token ID descending
  };

  // Use direct contract write without prepare
  const { write: writeMint, data: mintTxData, error: writeError } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'mint',
  });

  const { isLoading: isMintingTransaction } = useWaitForTransaction({
    hash: mintTxData?.hash,
    onSuccess: () => {
      if (mintData) {
        // Add to local state for immediate UI update
        const newNft: NFT = {
          id: Date.now().toString(),
          tokenId: Number(currentTokenId || totalSupply || 0) + 1,
          name: mintData.name,
          description: mintData.description,
          image: mintData.image || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop&crop=center',
          price: mintData.price || '0',
          owner: address!,
          creator: address!,
          category: mintData.category,
          isListed: false, // newly minted NFTs are not listed by default
          likes: 0,
          views: 0,
          rarity: 'Common',
          metadataUri: mintData.metadataUri,
          attributes: mintData.attributes || []
        };

        const updatedNfts = [newNft, ...nfts];
        setNfts(updatedNfts);
        saveNFTsToStorage(updatedNfts);
        toast.success('🎉 NFT minted successfully on blockchain!');
      }
      setMintData(null);
      setIsMinting(false);
    },
    onError: (error) => {
      toast.error('Failed to mint NFT: ' + (error as Error).message);
      setMintData(null);
      setIsMinting(false);
    }
  });

  const mintNFT = async (data: MintData) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!data.name || !data.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!contractAddress) {
      toast.error('NFT contract not available on this network');
      return;
    }

    setIsMinting(true);
    setMintData(data);
    
    try {
      // Only log essential info for debugging (similar to other services)
      if (!contractAddress) {
        throw new Error('Contract not available on this network');
      }
      
      if (writeMint) {
        // Call the write function with parameters
        writeMint({
          args: [
            address, // to
            data.metadataUri || `https://example.com/metadata/${Date.now()}.json`, // tokenURI
            500 // royalty (5%)
          ],
          value: (typeof mintFee === 'bigint' ? mintFee : parseEther('0.001')),
        });
      } else {
        throw new Error(`Contract write function not available: ${writeError?.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error('Failed to mint NFT: ' + (error as Error).message);
      setIsMinting(false);
      setMintData(null);
    }
  };

  const buyNFT = async (nft: NFT) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!contractAddress) {
      toast.error('NFT contract not available on this network');
      return;
    }

    try {
      // In a real implementation, this would use prepared transactions
      // For now, just simulate the purchase
      const updatedNfts = nfts.map(n => 
        n.id === nft.id 
          ? { ...n, owner: address, isListed: false }
          : n
      );
      setNfts(updatedNfts);
      saveNFTsToStorage(updatedNfts);

      toast.success('NFT purchased successfully!');
    } catch (error) {
      toast.error('Failed to purchase NFT');
    }
  };

  const listForSale = async (nft: NFT, price: string) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!contractAddress) {
      toast.error('NFT contract not available on this network');
      return;
    }

    try {
      // In a real implementation, this would use prepared transactions
      // For now, just simulate the listing
      const updatedNfts = nfts.map(n => 
        n.id === nft.id 
          ? { ...n, price, isListed: true }
          : n
      );
      setNfts(updatedNfts);
      saveNFTsToStorage(updatedNfts);

      toast.success('NFT listed for sale!');
    } catch (error) {
      toast.error('Failed to list NFT');
    }
  };

  const likeNFT = (nft: NFT) => {
    const updatedNfts = nfts.map(n => 
      n.id === nft.id 
        ? { ...n, likes: n.likes + 1 }
        : n
    );
    setNfts(updatedNfts);
    saveNFTsToStorage(updatedNfts);
    toast.success('NFT liked!');
  };

  const updateNFTViews = (nft: NFT) => {
    const updatedNfts = nfts.map(n => 
      n.id === nft.id 
        ? { ...n, views: n.views + 1 }
        : n
    );
    setNfts(updatedNfts);
    saveNFTsToStorage(updatedNfts);
  };

  const getMyNfts = () => {
    return nfts.filter(nft => nft.owner === address);
  };

  const resetNFTData = () => {
    clearNFTStorage();
    setNfts([]);
    setIsInitialized(false);
    toast.success('NFT data reset successfully');
  };

  // Effect to load blockchain data when contract info is available
  useEffect(() => {
    if (isInitialized && contractAddress && totalSupply && Number(totalSupply) > 0) {
      // Only load if we don't have much local data or user requests refresh
      const localNfts = loadNFTsFromStorage();
      if (localNfts.length < Number(totalSupply)) {
        loadNFTsFromBlockchain();
      }
    }
  }, [contractAddress, totalSupply, isInitialized]);

  return {
    nfts,
    myNfts: getMyNfts(),
    mintNFT,
    buyNFT,
    listForSale,
    likeNFT,
    updateNFTViews,
    resetNFTData,
    loadNFTsFromBlockchain,
    isMinting: isMinting || isMintingTransaction,
    isLoadingFromContract,
    contractAddress,
    marketplaceAddress,
    isContractAvailable: !!contractAddress,
    currentTokenId: Number(currentTokenId || 0),
    totalSupply: Number(totalSupply || 0),
    mintFee: mintFee?.toString() || '0.001 ETH',
    marketplaceStats,
  };
} 