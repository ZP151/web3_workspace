  import React, { useState, useEffect } from 'react';
  import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction, useNetwork, usePublicClient, useContractWrite as useWriteContract } from 'wagmi';
  import { parseEther, formatEther } from 'viem';
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
  const publicClient = usePublicClient();
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
    const { data: marketplaceStats, error: marketplaceStatsError } = useContractRead({
      address: marketplaceAddress as `0x${string}`,
      abi: marketplaceABI,
      functionName: 'getMarketplaceStats',
      enabled: !!marketplaceAddress,
    });

    // Get listing count
    const { data: listingCount, error: listingCountError } = useContractRead({
      address: marketplaceAddress as `0x${string}`,
      abi: marketplaceABI,
      functionName: 'getListingCount',
      enabled: !!marketplaceAddress,
    });

    // Log marketplace errors for debugging
    if (marketplaceStatsError) {
      console.warn('Marketplace stats error:', marketplaceStatsError);
    }
    if (listingCountError) {
      console.warn('Listing count error:', listingCountError);
    }

      // Initialize NFT data
    useEffect(() => {
      if (typeof window === 'undefined' || isInitialized) return;
      
      console.log('🏁 Initializing NFT hook...');
      
      // Try to load from localStorage first, then from blockchain
      const storedNfts = loadNFTsFromStorage();
      if (storedNfts.length > 0) {
        console.log(`📱 Loaded ${storedNfts.length} NFTs from localStorage`);
        setNfts(storedNfts);
      }
      
      setIsInitialized(true);
    }, [isInitialized]);

    // Load user NFTs from blockchain when data is available
  useEffect(() => {
    console.log('🔧 NFT Loading Check:', {
      isInitialized,
      contractAddress: !!contractAddress,
      address: !!address,
      totalSupply: totalSupply?.toString(),
      isLoadingFromContract,
      nftsLength: nfts.length
    });
    
    if (isInitialized && contractAddress && address && totalSupply && !isLoadingFromContract) {
      console.log('✅ All conditions met, loading NFTs from blockchain...');
      // Add a delay to ensure all contract data is ready
      setTimeout(() => {
        loadNFTsFromBlockchain();
      }, 200);
    }
  }, [isInitialized, contractAddress, address, totalSupply]);
  
  // Handle page refresh scenario - reload NFTs if conditions are met but no NFTs loaded
  useEffect(() => {
    // Only trigger if we've been initialized but have no NFTs, and all contract data is available
    if (isInitialized && contractAddress && address && totalSupply && 
        nfts.length === 0 && !isLoadingFromContract) {
      
      console.log('🔄 Detected page refresh scenario, reloading NFTs...');
      
      // Check if we have stored data for this user
      const storedNfts = loadNFTsFromStorage();
      const userStoredNfts = storedNfts.filter(nft => 
        nft.owner?.toLowerCase() === address.toLowerCase()
      );
      
      if (userStoredNfts.length > 0) {
        console.log(`📱 Found ${userStoredNfts.length} stored NFTs for user, loading immediately`);
        setNfts(userStoredNfts);
      }
      
      // Always try to refresh from blockchain to get latest state
      setTimeout(() => {
        console.log('🔗 Triggering blockchain refresh after page reload...');
        loadNFTsFromBlockchain();
      }, 500);
    }
  }, [isInitialized, contractAddress, address, totalSupply, nfts.length, isLoadingFromContract]);

    // Force refresh function to manually reload data
    const forceRefresh = async () => {
      if (!contractAddress || !address) {
        toast.error('Wallet not connected or contract not available');
        return;
      }
      
      console.log('🔄 Force refreshing NFT data...');
      await loadNFTsFromBlockchain();
    };

    // Function to load NFTs from blockchain
  const loadNFTsFromBlockchain = async () => {
    if (!contractAddress || isLoadingFromContract) return;
    
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
      
      for (let i = 1; i <= totalSupplyNum; i += batchSize) {
        const batch = [];
        const end = Math.min(i + batchSize - 1, totalSupplyNum);
        
        for (let tokenId = i; tokenId <= end; tokenId++) {
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
        if (i + batchSize <= totalSupplyNum) {
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
      if (!contractAddress || !address) return null;

      // Get token owner
      const ownerResult = await publicClient?.readContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'ownerOf',
        args: [BigInt(tokenId)]
      });

      const owner = String(ownerResult || '');
      
      // Skip if current user doesn't own this NFT
      if (!owner || owner.toLowerCase() !== address.toLowerCase()) {
        return null;
      }

      // Get token URI
      const tokenURIResult = await publicClient?.readContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'tokenURI',
        args: [BigInt(tokenId)]
      });

      const tokenURI = String(tokenURIResult || '');
      let metadata = null;
      
      // Try to parse metadata
      try {
        if (tokenURI) {
          if (tokenURI.startsWith('data:application/json;base64,')) {
            const base64Data = tokenURI.split(',')[1];
            metadata = JSON.parse(atob(base64Data));
          } else if (tokenURI.startsWith('http') || tokenURI.startsWith('ipfs')) {
            const response = await fetch(tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/'));
            metadata = await response.json();
          } else {
            // Try to parse as direct JSON string
            metadata = JSON.parse(tokenURI);
          }
        }
      } catch (metadataError) {
        console.warn(`Failed to parse metadata for token ${tokenId}:`, metadataError);
                  console.warn('Raw tokenURI:', tokenURI);
        }

        // Check if this NFT is currently listed on marketplace
        let isListed = false;
        let listingPrice = '0';
        let listingId: number | undefined;
        try {
          if (marketplaceAddress && listingCount) {
            // Check all active listings to see if this token is listed
            for (let i = 0; i < Number(listingCount); i++) {
              try {
                const listingResult = await publicClient?.readContract({
                  address: marketplaceAddress as `0x${string}`,
                  abi: marketplaceABI,
                  functionName: 'getListing',
                  args: [BigInt(i)]
                });
                
                if (listingResult) {
                  const [listingTokenId, seller, price, , status] = listingResult as any[];
                  if (Number(listingTokenId) === tokenId && Number(status) === 0) { // 0 = ACTIVE
                    isListed = true;
                    listingPrice = formatEther(BigInt(price));
                    listingId = i; // Store the listing ID
                    break;
                  }
                }
              } catch (error) {
                // Ignore individual listing check errors
              }
            }
          }
        } catch (error) {
          console.warn('Failed to check listing status for token', tokenId);
        }

        const nft: NFT = {
          id: `blockchain-${tokenId}`,
          tokenId,
          name: metadata?.name || `NFT #${tokenId}`,
          description: metadata?.description || `NFT with token ID ${tokenId}`,
          image: metadata?.image || `https://via.placeholder.com/400x400?text=NFT+${tokenId}`,
          price: isListed ? listingPrice : '0',
          owner,
          creator: owner, // Assume owner is creator for now
          category: metadata?.category || 'art',
          isListed,
          likes: 0,
          views: 0,
          rarity: determineRarity(tokenId, metadata?.attributes),
          metadataUri: tokenURI,
          attributes: metadata?.attributes || [],
          listingId: listingId // Add listing ID for cancellation
        };
      
      console.log(`✅ Found user NFT: ${nft.name} (Token ID: ${tokenId})`);
      return nft;
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

  // Marketplace contract write
  const { write: writeListItem, data: listTxData, error: listError } = useContractWrite({
    address: marketplaceAddress as `0x${string}`,
    abi: marketplaceABI,
    functionName: 'listItem',
  });

  // Approval contract write
  const { write: writeApproval, data: approvalTxData, error: approvalError } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: 'setApprovalForAll',
  });

  // Purchase NFT contract write
  const { write: writeBuyItem, data: buyTxData, error: buyError } = useContractWrite({
    address: marketplaceAddress as `0x${string}`,
    abi: marketplaceABI,
    functionName: 'buyItem',
  });

  // Cancel listing contract write
  const { write: writeCancelListing, data: cancelTxData, error: cancelError } = useContractWrite({
    address: marketplaceAddress as `0x${string}`,
    abi: marketplaceABI,
    functionName: 'cancelListing',
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

  // Watch for listing transaction
  const { isLoading: isListingTransaction } = useWaitForTransaction({
    hash: listTxData?.hash,
    onSuccess: () => {
      toast.dismiss();
      toast.success('🎉 NFT successfully listed for sale!');
      // Force reload NFTs from blockchain after successful listing
      setTimeout(() => {
        loadNFTsFromBlockchain();
      }, 2000);
    },
    onError: (error) => {
      toast.dismiss();
      toast.error('Failed to list NFT: ' + (error as Error).message);
    }
  });

  // Watch for approval transaction
  const { isLoading: isApprovingTransaction } = useWaitForTransaction({
    hash: approvalTxData?.hash,
    onSuccess: () => {
      toast.dismiss();
      toast.success('✅ Marketplace approved! You can now list your NFTs for sale.');
      // Force refresh NFTs after approval
      setTimeout(() => {
        loadNFTsFromBlockchain();
      }, 2000);
    },
    onError: (error) => {
      toast.dismiss();
      toast.error('Failed to approve marketplace: ' + (error as Error).message);
    }
  });

  // Watch for purchase transaction
  const { isLoading: isBuyingTransaction } = useWaitForTransaction({
    hash: buyTxData?.hash,
    onSuccess: () => {
      toast.dismiss();
      toast.success('🎉 NFT purchased successfully!');
      // Force reload NFTs from blockchain after successful purchase
      setTimeout(() => {
        loadNFTsFromBlockchain();
      }, 2000); // Wait 2 seconds for blockchain to update
    },
    onError: (error) => {
      toast.dismiss();
      toast.error('Failed to purchase NFT: ' + (error as Error).message);
    }
  });

  // Watch for cancel listing transaction
  const { isLoading: isCancellingTransaction } = useWaitForTransaction({
    hash: cancelTxData?.hash,
    onSuccess: () => {
      toast.dismiss();
      toast.success('✅ Listing cancelled successfully!');
      // Force reload NFTs from blockchain after cancellation
      setTimeout(() => {
        loadNFTsFromBlockchain();
      }, 2000);
    },
    onError: (error) => {
      toast.dismiss();
      toast.error('Failed to cancel listing: ' + (error as Error).message);
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

    if (!marketplaceAddress || !writeBuyItem) {
      toast.error('Marketplace contract not available');
      return;
    }

    if (!nft.listingId && nft.listingId !== 0) {
      toast.error('NFT listing ID not found');
      return;
    }

    try {
      toast.loading('Purchasing NFT...');

      const priceInWei = parseEther(nft.price);

      // Buy the item from the marketplace
      writeBuyItem({
        args: [BigInt(nft.listingId)],
        value: priceInWei // Send ETH along with the transaction
      });

      // Note: Don't update local state immediately - wait for blockchain confirmation
    } catch (error: any) {
      toast.dismiss();
      console.error('Failed to purchase NFT:', error);
      
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction cancelled by user');
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Insufficient ETH balance');
      } else if (error.message?.includes('Item not for sale')) {
        toast.error('This NFT is no longer for sale');
      } else {
        toast.error('Failed to purchase NFT: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const listForSale = async (nft: NFT, price: string) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!contractAddress || !marketplaceAddress) {
      toast.error('Contracts not available on this network');
      return;
    }

    try {
      toast.loading('Listing NFT for sale...');

      // Convert price to wei
      const priceInWei = parseEther(price);

      // List the item on the marketplace using wagmi hook
      if (!writeListItem) {
        toast.error('Contract write function not available');
        return;
      }

      writeListItem({
        args: [
          BigInt(nft.tokenId),
          priceInWei,
          0, // ListingType.FIXED_PRICE
          0  // auctionDuration (not used for fixed price)
        ]
      });

      // Update local state immediately for better UX
      const updatedNfts = nfts.map(n => 
        n.id === nft.id 
          ? { ...n, price, isListed: true }
          : n
      );
      setNfts(updatedNfts);
      saveNFTsToStorage(updatedNfts);
    } catch (error: any) {
      toast.dismiss();
      console.error('Failed to list NFT:', error);
      
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction cancelled by user');
      } else if (error.message?.includes('Not token owner')) {
        toast.error('You are not the owner of this NFT');
      } else if (error.message?.includes('Contract not approved')) {
        toast.error('Please approve the marketplace contract first');
      } else {
        toast.error('Failed to list NFT: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const approveMarketplace = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!marketplaceAddress || !writeApproval) {
      toast.error('Marketplace contract not available');
      return;
    }

    try {
      toast.loading('Approving marketplace to manage your NFTs...');
      writeApproval({
        args: [marketplaceAddress as `0x${string}`, true]
      });
    } catch (error: any) {
      toast.dismiss();
      console.error('Failed to approve marketplace:', error);
      toast.error('Failed to approve marketplace: ' + (error.message || 'Unknown error'));
    }
  };

  const cancelListing = async (nft: NFT) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!marketplaceAddress || !writeCancelListing) {
      toast.error('Marketplace contract not available');
      return;
    }

    if (!nft.listingId && nft.listingId !== 0) {
      toast.error('NFT listing ID not found');
      return;
    }

    try {
      toast.loading('Cancelling NFT listing...');
      
      writeCancelListing({
        args: [BigInt(nft.listingId)]
      });

      // Note: Don't update local state immediately - wait for blockchain confirmation
    } catch (error: any) {
      toast.dismiss();
      console.error('Failed to cancel listing:', error);
      
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction cancelled by user');
      } else if (error.message?.includes('Not listing owner')) {
        toast.error('You are not the owner of this listing');
      } else {
        toast.error('Failed to cancel listing: ' + (error.message || 'Unknown error'));
      }
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

  // Function to load marketplace listings (NFTs for sale by all users)
  const loadMarketplaceListings = async (): Promise<NFT[]> => {
    if (!marketplaceAddress || !contractAddress) {
      console.warn('Marketplace or NFT contract not available');
      return [];
    }

    try {
      const marketplaceListings: NFT[] = [];
      const totalListings = Number(listingCount || 0);
      
      if (totalListings === 0) {
        console.log('📭 No marketplace listings found');
        return [];
      }

      console.log(`🛒 Loading ${totalListings} marketplace listings...`);

      // Load all active listings
      for (let listingId = 0; listingId < totalListings; listingId++) {
        try {
          // Get listing details
          const listingResult = await publicClient?.readContract({
            address: marketplaceAddress as `0x${string}`,
            abi: marketplaceABI,
            functionName: 'getListing',
            args: [BigInt(listingId)]
          });

          if (!listingResult) continue;

          const [tokenId, seller, price, listingType, status] = listingResult as any[];
          
          // Only include active listings
          if (Number(status) !== 0) continue; // 0 = ACTIVE
          
          // Get NFT details from the NFT contract
          const tokenURIResult = await publicClient?.readContract({
            address: contractAddress as `0x${string}`,
            abi: contractABI,
            functionName: 'tokenURI',
            args: [tokenId]
          });

          const tokenURI = String(tokenURIResult || '');
          let metadata = null;
          
          // Parse metadata
          try {
            if (tokenURI) {
              if (tokenURI.startsWith('data:application/json;base64,')) {
                const base64Data = tokenURI.split(',')[1];
                metadata = JSON.parse(atob(base64Data));
              } else if (tokenURI.startsWith('http') || tokenURI.startsWith('ipfs')) {
                const response = await fetch(tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/'));
                metadata = await response.json();
              } else {
                metadata = JSON.parse(tokenURI);
              }
            }
          } catch (metadataError) {
            console.warn(`Failed to parse metadata for listing ${listingId}:`, metadataError);
          }

          const nft: NFT = {
            id: `marketplace-${listingId}`,
            tokenId: Number(tokenId),
            name: metadata?.name || `NFT #${tokenId}`,
            description: metadata?.description || `NFT with token ID ${tokenId}`,
            image: metadata?.image || `https://via.placeholder.com/400x400?text=NFT+${tokenId}`,
            price: formatEther(BigInt(price)),
            owner: String(seller),
            creator: String(seller), // Assume seller is creator for marketplace listings
            category: metadata?.category || 'art',
            isListed: true,
            likes: 0,
            views: 0,
            rarity: determineRarity(Number(tokenId), metadata?.attributes),
            metadataUri: tokenURI,
            attributes: metadata?.attributes || [],
            listingId: listingId, // Add listing ID for purchasing
            listingType: Number(listingType) === 0 ? 'FIXED_PRICE' : 'AUCTION'
          };

          marketplaceListings.push(nft);
          console.log(`🛒 Found marketplace NFT: ${nft.name} - ${nft.price} ETH`);
        } catch (error) {
          console.warn(`Failed to load listing ${listingId}:`, error);
        }
      }

      console.log(`✅ Loaded ${marketplaceListings.length} marketplace listings`);
      return marketplaceListings;
    } catch (error) {
      console.error('❌ Failed to load marketplace listings:', error);
      return [];
    }
  };

  return {
    nfts,
    myNfts: getMyNfts(),
    mintNFT,
    buyNFT,
    listForSale,
    cancelListing,
    approveMarketplace,
    likeNFT,
    updateNFTViews,
    resetNFTData,
    loadNFTsFromBlockchain,
    loadMarketplaceListings,
    forceRefresh,
    isMinting: isMinting || isMintingTransaction,
    isListing: isListingTransaction,
    isBuying: isBuyingTransaction,
    isApproving: isApprovingTransaction,
    isCancelling: isCancellingTransaction,
    isLoadingFromContract,
    contractAddress,
    marketplaceAddress,
    isContractAvailable: !!contractAddress,
    currentTokenId: Number(currentTokenId || 0),
    totalSupply: Number(totalSupply || 0),
    mintFee: mintFee?.toString() || '0.001 ETH',
    marketplaceStats,
    listingCount: Number(listingCount || 0),
  };
} 