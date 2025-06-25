'use client';

import React, { useState } from 'react';
import { Palette, Star, Plus, Grid3X3, List, Image, ArrowLeft, RefreshCw, Wallet } from 'lucide-react';
import { useAccount, useBalance, useNetwork } from 'wagmi';
import { formatEther } from 'viem';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { 
  NFTNavigation,
  CreateNFTForm,
  MarketplaceTab,
  MyCollectionTab,
  AnalyticsTab
} from './components';
import { SystemFeedback } from '@/components/SystemFeedback';
import { 
  NFT, 
  MintData, 
  ListingData, 
  NFTCategory, 
  ViewMode, 
  ActiveView, 
  SortBy 
} from './types';
import { useNFTContract } from './hooks/useNFTContract';
import { getContractAddress } from '@/config/contracts';

export default function NFTPage() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [activeView, setActiveView] = useState<ActiveView>('marketplace');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [mintData, setMintData] = useState<MintData>({
    name: '',
    description: '',
    image: '',
    category: 'art',
    price: '',
  });
  const [listingData, setListingData] = useState<ListingData>({
    nft: null,
    price: '',
    isOpen: false,
  });
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);

  const {
    nfts,
    myNfts,
    mintNFT,
    buyNFT,
    listForSale,
    cancelListing,
    likeNFT,
    updateNFTViews,
    loadNFTsFromBlockchain,
    forceRefresh,
    isMinting,
    isLoadingFromContract,
    marketplaceAddress,
    isContractAvailable,
    totalSupply,
    marketplaceStats,
    contractAddress,
    listingCount,
  } = useNFTContract();

  const { data: balance } = useBalance({
    address,
    enabled: !!address,
  });

  const categories: NFTCategory[] = [
    { id: 'all', name: 'All', icon: Grid3X3 },
    { id: 'art', name: 'Art', icon: Palette },
    { id: 'photography', name: 'Photography', icon: Image },
    { id: 'gaming', name: 'Gaming', icon: Star },
    { id: 'collectibles', name: 'Collectibles', icon: Plus },
  ];

  const filteredNfts = React.useMemo(() => {
    let filtered = nfts;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(nft => nft.category === selectedCategory);
    }

    switch (sortBy) {
      case 'newest':
        filtered = filtered.sort((a, b) => b.tokenId - a.tokenId);
        break;
      case 'oldest':
        filtered = filtered.sort((a, b) => a.tokenId - b.tokenId);
        break;
      case 'price-low':
        filtered = filtered.filter(nft => nft.isListed).sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price-high':
        filtered = filtered.filter(nft => nft.isListed).sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'likes':
        filtered = filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'views':
        filtered = filtered.sort((a, b) => b.views - a.views);
        break;
      default:
        break;
    }

    return filtered;
  }, [nfts, selectedCategory, sortBy]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center text-purple-600 hover:text-purple-800 transition-colors">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
              <h1 className="text-xl font-bold text-gray-900">NFT Marketplace</h1>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-500">
                  Manual Refresh
                </div>
                <button
                  onClick={forceRefresh}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  title="Refresh data"
                  disabled={isLoadingFromContract}
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 mb-8">
              <Wallet className="h-12 w-12 text-orange-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Wallet Not Connected</h2>
            <p className="text-gray-600 mb-8">You need to connect your wallet to use this module.</p>
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg">
                Return to Home and Connect Wallet
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!marketplaceAddress || !contractAddress) {
    return (
      <div className="w-full h-full">
                      <SystemFeedback type="contract-not-deployed" moduleName="NFT Marketplace" />
      </div>
    );
  }

  const handleMintNFT = async () => {
    await mintNFT(mintData);
    setMintData({
      name: '',
      description: '',
      image: '',
      category: 'art',
      price: '',
    });
  };

  const handleViewDetails = (nft: NFT) => {
    setSelectedNFT(nft);
    updateNFTViews(nft);
  };

  const handleListForSale = (nft: NFT) => {
    setListingData({
      nft,
      price: nft.price || '0.1',
      isOpen: true,
    });
  };

  const handleConfirmListing = async () => {
    if (listingData.nft && listingData.price) {
      await listForSale(listingData.nft, listingData.price);
      setListingData({ nft: null, price: '', isOpen: false });
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'marketplace':
        return (
          <MarketplaceTab
            nfts={nfts}
            filteredNfts={filteredNfts}
            selectedCategory={selectedCategory}
            sortBy={sortBy}
            viewMode={viewMode}
            categories={categories}
            onCategoryChange={setSelectedCategory}
            onSortChange={setSortBy}
            onViewModeChange={setViewMode}
            onViewDetails={handleViewDetails}
            onLike={likeNFT}
            onBuy={buyNFT}
          />
        );
      case 'mint':
        return (
          <CreateNFTForm
            mintData={mintData}
            onMintDataChange={setMintData}
            onMintNFT={handleMintNFT}
            isMinting={isMinting}
            categories={categories}
            address={address}
          />
        );
      case 'my-nfts':
        return (
          <MyCollectionTab
            myNfts={myNfts}
            onViewDetails={handleViewDetails}
            onLike={likeNFT}
            onListForSale={handleListForSale}
            onCancelListing={cancelListing}
            onViewChange={setActiveView}
            onRefresh={forceRefresh}
            isLoading={isLoadingFromContract}
          />
        );
      case 'analytics':
        return (
          <AnalyticsTab
            nfts={nfts}
            categories={categories}
            marketplaceStats={marketplaceStats}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center text-purple-600 hover:text-purple-800 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-xl font-bold text-gray-900">NFT Marketplace</h1>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-500">
                Manual Refresh
              </div>
              <button
                onClick={forceRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors duration-200"
                title="Refresh data"
                disabled={isLoadingFromContract}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* NFT Information Card */}
        {isConnected && (
          <div className={`bg-white border rounded-lg p-6 mb-8 shadow-sm ${
            isContractAvailable 
              ? 'border-green-200' 
              : 'border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  <Palette className="inline-block h-5 w-5 mr-2 text-purple-600" />
                  NFT Marketplace Info
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                  <p>Network: {chain?.name || 'Unknown'} (ID: {chain?.id})</p>
                  <p>NFT Contract: {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4) || 'Not Deployed'}</p>
                  <p>Marketplace Contract: {marketplaceAddress?.slice(0, 6)}...{marketplaceAddress?.slice(-4) || 'Not Deployed'}</p>
                </div>
                <div className="mt-3 flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    isContractAvailable ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className={`text-sm ${
                    isContractAvailable ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {isContractAvailable ? 'Contract Connected' : 'Contract Not Deployed'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                {balance && (
                  <>
                    <div className="text-2xl font-bold text-blue-600">
                      {parseFloat(formatEther(balance.value)).toFixed(4)} ETH
                    </div>
                    <div className="text-gray-600 text-sm">Wallet Balance</div>
                    <div className="text-sm text-gray-500 mt-2">
                      <div>Total NFTs: {nfts.length}</div>
                      <div>My NFTs: {myNfts.length}</div>
                      <div>Total Supply: {totalSupply || 0}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {!isContractAvailable && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                ⚠️
              </div>
              <div className="ml-3">
                              <p className="text-sm text-yellow-800">
                NFT contract not available on this network. Please switch to a supported network.
              </p>
              </div>
            </div>
          </div>
        )}



        {/* NFT Navigation Tabs */}
        <NFTNavigation activeView={activeView} setActiveView={setActiveView} />

        {/* Main Content */}
        <div className="mt-6">
          {renderContent()}
        </div>

        {selectedNFT && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-gray-900">{selectedNFT.name}</h2>
                  <button
                    onClick={() => setSelectedNFT(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Image Section */}
                  <div className="space-y-4">
                    <img
                      src={selectedNFT.image}
                      alt={selectedNFT.name}
                      className="w-full aspect-square object-cover rounded-lg border"
                    />
                    
                    {/* Asset Links */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Asset Information</h4>
                      <div className="space-y-2">
                        {/* Image IPFS Link */}
                        {selectedNFT.image && selectedNFT.image.includes('ipfs') && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Image (IPFS):</span>
                            <a
                              href={selectedNFT.image}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm truncate max-w-48"
                              title={selectedNFT.image}
                            >
                              {selectedNFT.image.replace('https://gateway.pinata.cloud/ipfs/', 'ipfs://')}
                            </a>
                          </div>
                        )}
                        
                        {/* Metadata IPFS Link */}
                        {selectedNFT.metadataUri && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Metadata (IPFS):</span>
                            <a
                              href={selectedNFT.metadataUri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm truncate max-w-48"
                              title={selectedNFT.metadataUri}
                            >
                              {selectedNFT.metadataUri.replace('https://gateway.pinata.cloud/ipfs/', 'ipfs://')}
                            </a>
                          </div>
                        )}
                        
                        {/* Contract Address */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Contract:</span>
                          <a
                            href={`https://etherscan.io/address/${contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4)}
                          </a>
                        </div>
                        
                        {/* Token Standard */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Standard:</span>
                          <span className="text-sm font-medium">ERC-721</span>
                        </div>
                        
                        {/* Data Source */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Data Source:</span>
                          <span className={`text-sm font-medium ${
                            selectedNFT.id.startsWith('blockchain-') ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {selectedNFT.id.startsWith('blockchain-') ? '🔗 Blockchain' : '💾 Local/Mock'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Details Section */}
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-600">{selectedNFT.description}</p>
                    </div>
                    
                    {/* Properties */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Properties</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-sm text-gray-500">Token ID</span>
                          <div className="font-bold text-lg">{selectedNFT.tokenId}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-sm text-gray-500">Rarity</span>
                          <div className={`font-bold text-lg ${
                            selectedNFT.rarity === 'Legendary' ? 'text-yellow-600' :
                            selectedNFT.rarity === 'Epic' ? 'text-purple-600' :
                            selectedNFT.rarity === 'Rare' ? 'text-blue-600' : 'text-gray-600'
                          }`}>
                            {selectedNFT.rarity}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-sm text-gray-500">Category</span>
                          <div className="font-bold text-lg capitalize">{selectedNFT.category}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-sm text-gray-500">Views</span>
                          <div className="font-bold text-lg">{selectedNFT.views}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Attributes */}
                    {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Attributes</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedNFT.attributes.map((attr, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                              <span className="text-sm text-gray-600">{attr.trait_type}</span>
                              <span className="font-medium">{attr.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Owner & Creator */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Ownership</h3>
                      <div className="space-y-2">
                        {selectedNFT.owner && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Owner:</span>
                            <span className="font-medium text-sm">
                              {selectedNFT.owner === address ? 'You' : 
                               `${selectedNFT.owner.slice(0, 6)}...${selectedNFT.owner.slice(-4)}`}
                            </span>
                          </div>
                        )}
                        {selectedNFT.creator && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Creator:</span>
                            <span className="font-medium text-sm">
                              {selectedNFT.creator === address ? 'You' : 
                               `${selectedNFT.creator.slice(0, 6)}...${selectedNFT.creator.slice(-4)}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Price & Actions */}
                    {selectedNFT.isListed && (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                        <div className="text-sm text-green-600 mb-1">Listed for sale</div>
                        <div className="text-3xl font-bold text-green-800 mb-3">{selectedNFT.price} ETH</div>
                        {selectedNFT.owner !== address && (
                          <button
                            onClick={() => {
                              buyNFT(selectedNFT);
                              setSelectedNFT(null);
                            }}
                            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Buy Now
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Statistics */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Statistics</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{selectedNFT.likes}</div>
                          <div className="text-gray-600">Likes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{selectedNFT.views}</div>
                          <div className="text-gray-600">Views</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {listingData.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">List NFT for Sale</h2>
              
              {listingData.nft && (
                <div className="mb-4">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={listingData.nft.image}
                      alt={listingData.nft.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="font-semibold">{listingData.nft.name}</h3>
                      <p className="text-sm text-gray-600">Token #{listingData.nft.tokenId}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (ETH)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={listingData.price}
                      onChange={(e) => setListingData({ ...listingData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.1"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setListingData({ nft: null, price: '', isOpen: false })}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmListing}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      List for Sale
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 