import React from 'react';
import { Eye, Heart, Tag, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NFT } from '../types';

interface NFTCardProps {
  nft: NFT;
  onViewDetails: (nft: NFT) => void;
  onLike: (nft: NFT) => void;
  onBuy?: (nft: NFT) => void;
  onListForSale?: (nft: NFT) => void;
  isOwner?: boolean;
}

export function NFTCard({ 
  nft, 
  onViewDetails, 
  onLike, 
  onBuy, 
  onListForSale, 
  isOwner = false 
}: NFTCardProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'bg-gray-100 text-gray-800';
      case 'Rare': return 'bg-blue-100 text-blue-800';
      case 'Epic': return 'bg-purple-100 text-purple-800';
      case 'Legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square relative">
        <img
          src={nft.image}
          alt={nft.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRarityColor(nft.rarity)}`}>
            {nft.rarity}
          </span>
        </div>
        {nft.isListed && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              Listed
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 mb-2">{nft.name}</h4>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{nft.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <div className="flex items-center">
              <Heart className="h-3 w-3 mr-1" />
              {nft.likes}
            </div>
            <div className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {nft.views}
            </div>
          </div>
          {nft.isListed && (
            <div className="text-right">
              <div className="text-sm font-bold text-gray-900">{nft.price} ETH</div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onViewDetails(nft)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-3"
              onClick={() => onLike(nft)}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
          
          {isOwner ? (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onListForSale?.(nft)}
            >
              <Tag className="h-4 w-4 mr-1" />
              {nft.isListed ? 'Update Price' : 'List for Sale'}
            </Button>
          ) : (
            nft.isListed && onBuy && (
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => onBuy(nft)}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Buy for {nft.price} ETH
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
} 