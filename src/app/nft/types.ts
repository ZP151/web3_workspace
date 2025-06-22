export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface NFT {
  id: string;
  tokenId: number;
  listingId?: number;
  name: string;
  description: string;
  image: string;
  price: string;
  owner: string;
  creator: string;
  category: string;
  isListed: boolean;
  likes: number;
  views: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  metadataUri?: string;
  attributes?: NFTAttribute[];
}

export interface MintData {
  name: string;
  description: string;
  image: string;
  category: string;
  price: string;
  metadataUri?: string;
  attributes?: NFTAttribute[];
}

export interface ImageGenerationResponse {
  success: boolean;
  image_url: string;
  file_size_kb: number;
  algorithm: string;
}

export interface ListingData {
  nft: NFT | null;
  price: string;
  isOpen: boolean;
}

export interface NFTCategory {
  id: string;
  name: string;
  icon: any;
}

export type ViewMode = 'grid' | 'list';
export type ActiveView = 'marketplace' | 'mint' | 'my-nfts' | 'analytics';
export type SortBy = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'likes' | 'views'; 