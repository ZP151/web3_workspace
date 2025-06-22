import React from 'react';
import { Filter, Grid3X3, List, Palette, Star, Image, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NFTCard } from './NFTCard';
import { NFT, ViewMode, SortBy, NFTCategory } from '../types';

interface MarketplaceTabProps {
  nfts: NFT[];
  filteredNfts: NFT[];
  selectedCategory: string;
  sortBy: SortBy;
  viewMode: ViewMode;
  categories: NFTCategory[];
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: SortBy) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onViewDetails: (nft: NFT) => void;
  onLike: (nft: NFT) => void;
  onBuy: (nft: NFT) => void;
}

export function MarketplaceTab({
  nfts,
  filteredNfts,
  selectedCategory,
  sortBy,
  viewMode,
  categories,
  onCategoryChange,
  onSortChange,
  onViewModeChange,
  onViewDetails,
  onLike,
  onBuy
}: MarketplaceTabProps) {
  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'likes', label: 'Most Liked' },
    { value: 'views', label: 'Most Viewed' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Marketplace</h3>
          <p className="text-gray-600 mt-1">
            Showing {filteredNfts.length} of {nfts.length} NFTs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Category:</span>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onCategoryChange(category.id)}
                  className="text-xs"
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortBy)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* NFT Grid/List */}
      {filteredNfts.length === 0 ? (
        <div className="text-center py-12">
          <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">No NFTs found</p>
          <p className="text-sm text-gray-500">Try adjusting your filters or check back later</p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }>
          {filteredNfts.map((nft) => (
            <NFTCard
              key={nft.id}
              nft={nft}
              onViewDetails={onViewDetails}
              onLike={onLike}
              onBuy={onBuy}
              isOwner={false}
            />
          ))}
        </div>
      )}
    </div>
  );
} 