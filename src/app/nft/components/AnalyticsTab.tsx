import React from 'react';
import { Image, DollarSign, Tag, Users } from 'lucide-react';
import { NFT, NFTCategory } from '../types';

interface AnalyticsTabProps {
  nfts: NFT[];
  categories: NFTCategory[];
}

export function AnalyticsTab({ nfts, categories }: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Analytics</h3>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total NFTs</p>
              <p className="text-2xl font-bold text-gray-900">{nfts.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Image className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600">+{nfts.length} this month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold text-gray-900">{nfts.reduce((sum, nft) => sum + parseFloat(nft.price), 0).toFixed(1)} ETH</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600">+15.3% from last week</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Listings</p>
              <p className="text-2xl font-bold text-gray-900">{nfts.filter(nft => nft.isListed).length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Tag className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">{nfts.length > 0 ? ((nfts.filter(nft => nft.isListed).length / nfts.length) * 100).toFixed(1) : 0}% of total</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Owners</p>
              <p className="text-2xl font-bold text-gray-900">{new Set(nfts.map(nft => nft.owner)).size}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">Active collectors</span>
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h4>
          <div className="space-y-3">
            {categories.filter(c => c.id !== 'all').map((category) => {
              const count = nfts.filter(nft => nft.category === category.id).length;
              const percentage = nfts.length > 0 ? (count / nfts.length) * 100 : 0;
              return (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm font-medium text-gray-700">{category.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Rarity Distribution</h4>
          <div className="space-y-3">
            {['Common', 'Rare', 'Epic', 'Legendary'].map((rarity) => {
              const count = nfts.filter(nft => nft.rarity === rarity).length;
              const percentage = nfts.length > 0 ? (count / nfts.length) * 100 : 0;
              const color = rarity === 'Common' ? 'bg-gray-500' : 
                           rarity === 'Rare' ? 'bg-blue-500' :
                           rarity === 'Epic' ? 'bg-purple-500' : 'bg-yellow-500';
              return (
                <div key={rarity} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                    <span className="text-sm font-medium text-gray-700">{rarity}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${color} h-2 rounded-full`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Price Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Price Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {nfts.filter(nft => nft.isListed).length > 0 
                ? Math.min(...nfts.filter(nft => nft.isListed).map(nft => parseFloat(nft.price))).toFixed(3)
                : '0.000'
              } ETH
            </div>
            <div className="text-sm text-gray-600">Floor Price</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {nfts.filter(nft => nft.isListed).length > 0 
                ? (nfts.filter(nft => nft.isListed).reduce((sum, nft) => sum + parseFloat(nft.price), 0) / nfts.filter(nft => nft.isListed).length).toFixed(3)
                : '0.000'
              } ETH
            </div>
            <div className="text-sm text-gray-600">Average Price</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {nfts.filter(nft => nft.isListed).length > 0 
                ? Math.max(...nfts.filter(nft => nft.isListed).map(nft => parseFloat(nft.price))).toFixed(3)
                : '0.000'
              } ETH
            </div>
            <div className="text-sm text-gray-600">Highest Price</div>
          </div>
        </div>
      </div>
    </div>
  );
} 