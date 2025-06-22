'use client';

import React, { useState } from 'react';
import { Palette, Star, Plus, Grid3X3, List, Image, ArrowLeft } from 'lucide-react';
import { useAccount, useBalance, useNetwork } from 'wagmi';
import { formatEther } from 'viem';
import Link from 'next/link';

import { 
  NFTNavigation,
  CreateNFTForm,
  MarketplaceTab,
  MyCollectionTab,
  AnalyticsTab
} from './components';
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
    likeNFT,
    updateNFTViews,
    loadNFTsFromBlockchain,
    isMinting,
    isLoadingFromContract,
    contractAddress,
    marketplaceAddress,
    isContractAvailable,
    totalSupply,
    marketplaceStats,
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
            onViewChange={setActiveView}
          />
        );
      case 'analytics':
        return (
          <AnalyticsTab
            nfts={nfts}
            categories={categories}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center mb-2">
              <Link 
                href="/" 
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back to Home
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Image className="h-8 w-8 mr-3 text-purple-600" />
              NFT Marketplace
            </h1>
            <p className="text-gray-600 mt-2">Create, collect, and trade unique digital assets</p>
          </div>
        </div>

        {/* NFT Information Card */}
        {isConnected && (
          <div className={`border rounded-lg p-6 mb-8 ${
            isContractAvailable 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your NFT Marketplace Information</h3>
                <p className="text-gray-600">Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                <p className="text-gray-600">Network: {chain?.name || 'Unknown'} (ID: {chain?.id})</p>
                <p className="text-gray-600">NFT Contract: {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4) || 'Not Available'}</p>
                <p className="text-gray-600">Marketplace: {marketplaceAddress?.slice(0, 6)}...{marketplaceAddress?.slice(-4) || 'Not Available'}</p>
                <p className="text-gray-600">Total Supply: {totalSupply || 0}</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      isContractAvailable ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className={`text-sm ${
                      isContractAvailable ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {isContractAvailable ? 'Network Connected' : 'Network Issue'}
                    </span>
                  </div>
                  {isContractAvailable && (
                    <button
                      onClick={loadNFTsFromBlockchain}
                      disabled={isLoadingFromContract}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      {isLoadingFromContract ? (
                        <>
                          <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full mr-1"></div>
                          Loading...
                        </>
                      ) : (
                        '🔄 Refresh from Blockchain'
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className="text-right">
                {balance && (
                  <>
                    <div className={`text-2xl font-bold ${
                      isContractAvailable ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {formatEther(balance.value)} ETH
                    </div>
                    <div className="text-gray-600">Wallet Balance</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Total NFTs: {nfts.length} • My NFTs: {myNfts.length}
                      <br />
                      {nfts.length > 0 && (
                        <span className="text-xs text-gray-400">
                          {nfts.filter(nft => nft.id.startsWith('blockchain-')).length} from blockchain • {' '}
                          {nfts.filter(nft => !nft.id.startsWith('blockchain-')).length} local/mock
                        </span>
                      )}
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

        {/* Data Source Information */}
        {isConnected && nfts.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                ℹ️
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800 mb-1">NFT Data Sources</h4>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">🔗 Blockchain NFTs</span>: Loaded directly from smart contracts with real ownership data. 
                  <span className="font-medium ml-4">💾 Local/Mock NFTs</span>: Sample data and newly minted NFTs (until indexed).
                  {isLoadingFromContract && <span className="ml-2 text-blue-600">Currently syncing with blockchain...</span>}
                </p>
              </div>
            </div>
          </div>
        )}

        <NFTNavigation activeView={activeView} onViewChange={setActiveView} />

        {renderContent()}

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