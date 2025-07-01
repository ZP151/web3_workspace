import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAccount, useNetwork, useContractRead, useContractWrite, useWaitForTransaction, usePublicClient } from 'wagmi';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';

// Corrected import paths for ABIs from the root of the project
import contractABI from '../../../../artifacts/contracts/PlatformNFT.sol/PlatformNFT.json';
import marketplaceABI from '../../../../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json';
import addresses from '../../../contracts/addresses.json';

import { NFT, MintData, ListingData, NFTCategory, ViewMode, ActiveView, SortBy, MarketplaceStats } from '../types';

// Define a type for the marketplace listing data we expect
interface MarketplaceListing {
  listingId: number;
  tokenId: number;
  price: string;
  isListed: boolean;
  listingType: 'FIXED_PRICE' | 'AUCTION';
  seller: string;
}

// Helper function to fetch metadata from IPFS/HTTP
const fetchMetadata = async (tokenURI: string) => {
  try {
    // Case 1: Handle base64 encoded JSON data URI
    if (tokenURI.startsWith('data:application/json;base64,')) {
        const base64Json = tokenURI.substring('data:application/json;base64,'.length);
        const jsonString = Buffer.from(base64Json, 'base64').toString('utf-8');
        const metadata = JSON.parse(jsonString);
        if (!Array.isArray(metadata.attributes)) {
          metadata.attributes = [];
        }
        return metadata;
    }
    
    // Case 2: Handle raw JSON string
    if (tokenURI.startsWith('{')) {
        const metadata = JSON.parse(tokenURI);
        if (!Array.isArray(metadata.attributes)) {
          metadata.attributes = [];
        }
        return metadata;
    }

    // Case 3: Handle IPFS or HTTP URLs
    let url = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      url = tokenURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const metadata = await response.json();
    // Ensure attributes is an array
    if (!Array.isArray(metadata.attributes)) {
      metadata.attributes = [];
    }
    return metadata;
  } catch (error) {
    console.warn('Failed to fetch metadata from:', tokenURI, error);
    return null;
  }
};

// Helper function to check metadata security
const checkMetadataSecurity = (uri: string): string | undefined => {
  if (!uri || uri.trim() === '') return undefined;
  const normalizedUri = uri.toLowerCase();
  const isIPFS = normalizedUri.includes('ipfs://') || normalizedUri.includes('gateway.pinata.cloud/ipfs/');
  const isArweave = normalizedUri.includes('ar://') || normalizedUri.includes('arweave.net');
  if (normalizedUri.startsWith('data:')) return undefined;
  if (!isIPFS && !isArweave) {
    return 'Consider using IPFS or Arweave for immutable metadata';
  }
  return undefined;
};

// Helper function to determine rarity
const determineRarity = (tokenId: number, attributes?: any[]): 'Common' | 'Rare' | 'Epic' | 'Legendary' => {
  if (attributes && attributes.length > 5) return 'Legendary';
  if (attributes && attributes.length > 3) return 'Epic';
  if (tokenId % 10 === 0) return 'Rare';
  return 'Common';
};

// Storage key for persisting NFT data
const NFT_STORAGE_KEY_V2 = 'web3_nft_marketplace_data_v2';

// Helper functions for localStorage operations
const saveNFTsToStorage = (nfts: NFT[], chainId: number) => {
  try {
    const key = `${NFT_STORAGE_KEY_V2}_${chainId}`;
    const dataToStore = {
      nfts,
      timestamp: Date.now(),
      version: '2.0'
    };
    if(typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(dataToStore));
  } catch (error) {
    console.warn('Failed to save V2 NFTs to localStorage:', error);
  }
};

const loadNFTsFromStorage = (chainId: number): NFT[] => {
  try {
    if(typeof window === 'undefined') return [];
    const key = `${NFT_STORAGE_KEY_V2}_${chainId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const data = JSON.parse(stored);
      const isRecent = Date.now() - data.timestamp < 24 * 60 * 60 * 1000; // 1 day cache
      if (data.version === '2.0' && isRecent && Array.isArray(data.nfts)) {
        return data.nfts;
      }
    }
  } catch (error) {
    console.warn('Failed to load V2 NFTs from localStorage:', error);
  }
  return [];
};

export function useNFTContract() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const publicClient = usePublicClient();

  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentChainId = chain?.id ?? 0;

  const contractAddress = useMemo(() => (addresses as any)[currentChainId]?.PlatformNFT, [currentChainId]);
  const marketplaceAddress = useMemo(() => (addresses as any)[currentChainId]?.NFTMarketplace, [currentChainId]);

  const { data: totalSupply, refetch: refetchTotalSupply } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI.abi,
    functionName: 'totalSupply',
    watch: true,
  });

  const { data: marketplaceStats, refetch: refetchMarketplaceStats } = useContractRead({
    address: marketplaceAddress as `0x${string}`,
    abi: marketplaceABI.abi,
    functionName: 'getMarketplaceStats',
    watch: true,
  });

  const { data: isPaused } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI.abi,
    functionName: 'paused',
    watch: true,
  });

  const { data: isMarketplacePaused } = useContractRead({
    address: marketplaceAddress as `0x${string}`,
    abi: marketplaceABI.abi,
    functionName: 'paused',
    watch: true,
  });

  const { data: isMarketplaceApproved, refetch: refetchApprovalStatus } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: contractABI.abi,
    functionName: 'isApprovedForAll',
    args: [address, marketplaceAddress],
    enabled: !!address && !!contractAddress && !!marketplaceAddress,
    watch: true,
  });

  // Function to check approval for specific token
  const checkTokenApproval = useCallback(async (tokenId: number): Promise<boolean> => {
    if (!publicClient || !contractAddress || !marketplaceAddress || !address) return false;
    
    try {
      // Check if marketplace is approved for all tokens
      const isApprovedForAll = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI.abi,
        functionName: 'isApprovedForAll',
        args: [address, marketplaceAddress],
      });

      if (isApprovedForAll) return true;

      // Check if marketplace is approved for this specific token
      const approvedAddress = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI.abi,
        functionName: 'getApproved',
        args: [BigInt(tokenId)],
      });

      return String(approvedAddress).toLowerCase() === marketplaceAddress.toLowerCase();
    } catch (error) {
      console.warn('Failed to check token approval:', error);
      return false;
    }
  }, [publicClient, contractAddress, marketplaceAddress, address]);

  const { data: approvalData, write: writeApprove, isLoading: isApproving } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI.abi,
    functionName: 'setApprovalForAll',
  });

  const { data: tokenApprovalData, write: writeTokenApprove, isLoading: isTokenApproving } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: contractABI.abi,
    functionName: 'approve',
  });
  const { isSuccess: isApprovalSuccess } = useWaitForTransaction({
    hash: approvalData?.hash,
    onSuccess(data) {
        toast.dismiss();
        toast.success('Marketplace Approved! You can now list your NFT.');
        refetchApprovalStatus();
    },
  });

  const { isSuccess: isTokenApprovalSuccess } = useWaitForTransaction({
    hash: tokenApprovalData?.hash,
    onSuccess(data) {
        toast.dismiss();
        toast.success('NFT Approved! You can now list this NFT.');
    },
  });

  const { data: mintData, write: writeMint } = useContractWrite({
    address: contractAddress as `0x${string}`, abi: contractABI.abi, functionName: 'publicMint' });
  const { isLoading: isMinting, isSuccess: isMintSuccess } = useWaitForTransaction({ hash: mintData?.hash });

  const { data: listItemData, write: writeListItem } = useContractWrite({
    address: marketplaceAddress as `0x${string}`, abi: marketplaceABI.abi, functionName: 'listItem' });
  const { isLoading: isListing, isSuccess: isListSuccess } = useWaitForTransaction({ hash: listItemData?.hash });

  const { data: buyItemData, write: writeBuyItem } = useContractWrite({
    address: marketplaceAddress as `0x${string}`, abi: marketplaceABI.abi, functionName: 'buyItem' });
  const { isLoading: isBuying, isSuccess: isBuySuccess } = useWaitForTransaction({ hash: buyItemData?.hash });

  const { data: placeBidData, write: writePlaceBid } = useContractWrite({
    address: marketplaceAddress as `0x${string}`, abi: marketplaceABI.abi, functionName: 'placeBid' });
  const { isLoading: isBidding, isSuccess: isBidSuccess } = useWaitForTransaction({ hash: placeBidData?.hash });
  
  const { data: endAuctionData, write: writeEndAuction } = useContractWrite({
    address: marketplaceAddress as `0x${string}`, abi: marketplaceABI.abi, functionName: 'endAuction' });
  const { isLoading: isEndingAuction, isSuccess: isEndAuctionSuccess } = useWaitForTransaction({ hash: endAuctionData?.hash });

  const loadMarketplaceData = useCallback(async (): Promise<Map<number, MarketplaceListing>> => {
    const listingsMap = new Map<number, MarketplaceListing>();
    if (!marketplaceAddress || !publicClient) return listingsMap;

    try {
      const listingCount = await publicClient.readContract({
        address: marketplaceAddress as `0x${string}`,
        abi: marketplaceABI.abi,
        functionName: 'getListingCount',
      });

      const listingPromises: Promise<any>[] = [];
      for (let i = 0; i < Number(listingCount); i++) {
        listingPromises.push(publicClient.readContract({
          address: marketplaceAddress as `0x${string}`,
          abi: marketplaceABI.abi,
          functionName: 'getListing',
          args: [BigInt(i)]
        }).then(listingResult => {
          // Handle Viem's object return format
          const result = listingResult as any;
          // Viem returns an object, not an array
          return { 
            tokenId: result.tokenId, 
            seller: result.seller, 
            price: result.price, 
            listingType: result.listingType, 
            status: result.status, 
            listingId: i 
          };
        })
        .catch(err => {
          console.warn(`Could not fetch listing #${i}, it might be invalid.`, err.shortMessage);
          return null; // Return null on failure
        }));
      }

      const settledListings = await Promise.all(listingPromises);
      const validListings = settledListings.filter(l => l !== null);

      validListings.forEach((listing) => {
        // ListingStatus enum: 0: Active, 1: Sold, 2: Cancelled, 3: Ended
        if (listing && Number(listing.status) === 0) {
          listingsMap.set(Number(listing.tokenId), {
            listingId: listing.listingId,
            tokenId: Number(listing.tokenId),
            price: ethers.formatEther(listing.price),
            isListed: true,
            listingType: Number(listing.listingType) === 0 ? 'FIXED_PRICE' : 'AUCTION',
            seller: listing.seller,
          });
        }
      });
    } catch (error) {
      console.error("Failed to load marketplace data:", error);
    }
    
    return listingsMap;
  }, [marketplaceAddress, publicClient]);

  const loadNFTs = useCallback(async (force = false) => {
    if (!contractAddress || !publicClient || !chain) return;

    setIsLoading(true);

    const cachedNfts = loadNFTsFromStorage(chain.id);
    if (cachedNfts.length > 0 && !force) {
      console.log(`📱 Loaded ${cachedNfts.length} V2 NFTs from localStorage`);
      setNfts(cachedNfts);
      setIsLoading(false);
      return;
    }
    
    console.log('Fetching V2 NFTs from blockchain...');

    try {
      const marketplaceListings = await loadMarketplaceData();
      console.log(`Found ${marketplaceListings.size} active listings.`);
      
      const supply = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI.abi,
        functionName: 'totalSupply',
      });

      const nftPromises: Promise<NFT | null>[] = [];
      for (let i = 1; i <= Number(supply); i++) {
        nftPromises.push((async () => {
          try {
            const tokenURI: string = await publicClient.readContract({
              address: contractAddress as `0x${string}`,
              abi: contractABI.abi,
              functionName: 'tokenURI',
              args: [BigInt(i)],
            }) as string;

            const owner: string = await publicClient.readContract({
              address: contractAddress as `0x${string}`,
              abi: contractABI.abi,
              functionName: 'ownerOf',
              args: [BigInt(i)],
            }) as string;

            const metadata = await fetchMetadata(tokenURI);
            if (!metadata) return null;
            
            const listingInfo = marketplaceListings.get(i);

            return {
              id: String(i),
              tokenId: i,
              owner: owner,
              creator: owner, // Assumption: initial owner is the creator
              metadataUri: tokenURI,
              isListed: listingInfo?.isListed || false,
              price: listingInfo?.price || '0',
              listingId: listingInfo?.listingId,
              listingType: listingInfo?.listingType,
              name: metadata.name || `NFT #${i}`,
              description: metadata.description || '',
              image: metadata.image || '',
              attributes: metadata.attributes || [],
              rarity: determineRarity(i, metadata.attributes),
              category: 'Digital Art', // Default category
              views: 0,
              likes: 0,
            };
          } catch (e: any) {
            // This is expected if tokens are burned, leaving gaps in IDs.
            if (e.shortMessage && e.shortMessage.includes("ERC721NonexistentToken")) {
              console.log(`Token #${i} not found, likely burned. Skipping.`);
            } else {
              console.warn(`Failed to fetch data for token ${i}`, e.shortMessage || e);
            }
            return null;
          }
        })());
      }
      
      const settledNfts = (await Promise.all(nftPromises)).filter(nft => nft !== null) as NFT[];
      console.log(`✅ Loaded ${settledNfts.length} NFTs from contract.`);
      setNfts(settledNfts);
      saveNFTsToStorage(settledNfts, chain.id);

    } catch (error) {
      console.error('Failed to load NFTs from contract:', error);
      toast.error('Could not load NFT data.');
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, publicClient, chain, loadMarketplaceData]);

  useEffect(() => {
    if (isConnected && contractAddress) {
      loadNFTs();
    } else {
      // Clear NFTs if wallet disconnects or chain changes
      setNfts([]);
      setIsLoading(false);
    }
  }, [isConnected, contractAddress, loadNFTs]);

  const approveMarketplace = useCallback(async () => {
    if (!writeApprove || !marketplaceAddress) { toast.error('Approval not available.'); return; }
    try {
      toast.loading('Approving marketplace...');
      writeApprove({ args: [marketplaceAddress, true] });
    } catch (e) { toast.dismiss(); toast.error((e as Error).message); }
  }, [writeApprove, marketplaceAddress]);

  const refreshApprovalStatus = useCallback(async () => {
    if (refetchApprovalStatus) {
      console.log('🔄 Manually refreshing approval status...');
      await refetchApprovalStatus();
    }
  }, [refetchApprovalStatus]);

  const approveTokenForMarketplace = useCallback(async (tokenId: number) => {
    if (!writeTokenApprove || !marketplaceAddress) { 
      toast.error('Token approval not available.'); 
      return; 
    }
    try {
      toast.loading('Approving this NFT for marketplace...');
      writeTokenApprove({ args: [marketplaceAddress, BigInt(tokenId)] });
    } catch (e) { 
      toast.dismiss(); 
      toast.error((e as Error).message); 
    }
  }, [writeTokenApprove, marketplaceAddress]);

  const revokeMarketplaceApproval = useCallback(async () => {
    if (!writeApprove || !marketplaceAddress) { 
      toast.error('Revoke approval not available.'); 
      return; 
    }
    try {
      toast.loading('Revoking marketplace approval...');
      writeApprove({ args: [marketplaceAddress, false] });
    } catch (e) { 
      toast.dismiss(); 
      toast.error((e as Error).message); 
    }
  }, [writeApprove, marketplaceAddress]);

  const mintNFT = useCallback(async (data: MintData) => {
    if (!address || !writeMint) { toast.error('Connect wallet first.'); return; }
    try {
      toast.loading('Minting NFT...');
      writeMint({ args: [address, data.image, 0], value: ethers.parseEther("0.001") });
    } catch (e) { toast.dismiss(); toast.error((e as Error).message); }
  }, [address, writeMint]);

  const listForSale = useCallback(async (tokenId: number, price: string, isAuction: boolean, duration: number) => {
    if (!writeListItem) return;
    try {
      toast.loading('Listing NFT...');
      writeListItem({ args: [BigInt(tokenId), ethers.parseEther(price), isAuction ? 1 : 0, duration] });
    } catch (e) { toast.dismiss(); toast.error((e as Error).message); }
  }, [writeListItem]);

  const buyNFT = useCallback(async (listingId: number, price: string) => {
    if (!writeBuyItem) return;
    try {
      toast.loading('Purchasing NFT...');
      writeBuyItem({ args: [BigInt(listingId)], value: ethers.parseEther(price) });
    } catch (e) { toast.dismiss(); toast.error((e as Error).message); }
  }, [writeBuyItem]);

  const placeBid = useCallback(async (listingId: number, amount: string) => {
    if (!writePlaceBid) return;
    try {
      toast.loading('Placing bid...');
      writePlaceBid({ args: [BigInt(listingId)], value: ethers.parseEther(amount) });
    } catch (e) { toast.dismiss(); toast.error((e as Error).message); }
  }, [writePlaceBid]);
  
  const endAuction = useCallback(async (listingId: number) => {
    if (!writeEndAuction) return;
    try {
      toast.loading('Ending auction...');
      writeEndAuction({ args: [BigInt(listingId)] });
    } catch (e) { toast.dismiss(); toast.error((e as Error).message); }
  }, [writeEndAuction]);

  const forceRefresh = useCallback(async () => {
    setIsRefreshing(true);
    toast.loading('Refreshing data...');
    
    // Invalidate cache and reload
    await loadNFTs(true);
    
    // Also refetch other stats
    refetchMarketplaceStats();
    
    setIsRefreshing(false);
    toast.dismiss();
    toast.success("Data refreshed!");
  }, [loadNFTs, refetchMarketplaceStats]);

  useEffect(() => {
    if (isMintSuccess || isListSuccess || isBuySuccess || isBidSuccess || isEndAuctionSuccess) {
      toast.dismiss();
      toast.success('Transaction Confirmed!');
      // After a successful transaction, refresh data
      forceRefresh();
    }
  }, [isMintSuccess, isListSuccess, isBuySuccess, isBidSuccess, isEndAuctionSuccess, forceRefresh]);

  const likeNFT = useCallback((tokenId: number) => {
    setNfts(currentNfts => 
      currentNfts.map(nft => 
        nft.tokenId === tokenId ? { ...nft, likes: (nft.likes || 0) + 1 } : nft
      )
    );
  }, []);

  const updateNFTViews = useCallback((tokenId: number) => {
    setNfts(currentNfts =>
      currentNfts.map(nft =>
        nft.tokenId === tokenId ? { ...nft, views: (nft.views || 0) + 1 } : nft
      )
    );
  }, []);

  return {
    nfts,
    isLoading: isLoading || isRefreshing,
    totalSupply: Number(totalSupply || 0),
    marketplaceStats: marketplaceStats as MarketplaceStats | undefined,
    contractAddress,
    marketplaceAddress,
    isPaused: Boolean(isPaused),
    isMarketplacePaused: Boolean(isMarketplacePaused),
    isMarketplaceApproved: Boolean(isMarketplaceApproved),
    securityFeatures: { // Mock data for now, should be derived from contract state
        pausableContract: true,
        pausableMarketplace: true,
        metadataSecurityCheck: true,
        erc2981Royalties: true,
        gasDoSPrevention: true,
    },
    forceRefresh,
    approveMarketplace,
    revokeMarketplaceApproval,
    approveTokenForMarketplace,
    checkTokenApproval,
    refreshApprovalStatus,
    mintNFT,
    listForSale,
    buyNFT,
    placeBid,
    endAuction,
    likeNFT,
    updateNFTViews,
    isApproving,
    isTokenApproving,
    isApprovalSuccess,
    isTokenApprovalSuccess,
    isMinting,
    isListing,
    isListSuccess,
    isBuying,
    isBidding,
    isEndingAuction,
  };
} 