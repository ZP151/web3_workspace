import React from 'react';
import { Image, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NFTCard } from './NFTCard';
import { NFT, ActiveView } from '../types';

interface MyCollectionTabProps {
  myNfts: NFT[];
  onViewDetails: (nft: NFT) => void;
  onLike: (nft: NFT) => void;
  onListForSale: (nft: NFT) => void;
  onCancelListing?: (nft: NFT) => void;
  onViewChange: (view: ActiveView) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function MyCollectionTab({
  myNfts,
  onViewDetails,
  onLike,
  onListForSale,
  onCancelListing,
  onViewChange,
  onRefresh,
  isLoading
}: MyCollectionTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">
          My Collection ({myNfts.length})
        </h3>
        {onRefresh && (
          <Button 
            onClick={onRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </div>

      {myNfts.length === 0 ? (
        <div className="text-center py-12">
          <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">You don't own any NFTs yet</p>
          <Button 
            onClick={() => onViewChange('mint')}
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First NFT
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {myNfts.map((nft) => (
            <NFTCard
              key={nft.id}
              nft={nft}
              onViewDetails={onViewDetails}
              onLike={onLike}
              onListForSale={onListForSale}
              onCancelListing={onCancelListing}
              isOwner={true}
            />
          ))}
        </div>
      )}
    </div>
  );
} 