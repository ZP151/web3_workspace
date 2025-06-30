'use client';

import React, { useState, useMemo, Dispatch, SetStateAction, useEffect } from 'react';
import { Palette, Star, Plus, Grid3X3, List, Image, ArrowLeft, RefreshCw, Wallet, Gavel, Loader2, ShoppingCart } from 'lucide-react';
import { useAccount, useBalance, useNetwork } from 'wagmi';
import { formatEther } from 'viem';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

import { 
  NFTNavigation,
  CreateNFTForm,
  MarketplaceTab,
  MyCollectionTab,
  AnalyticsTab,
  SecurityStatusDisplay
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
import { UserAvatar } from '@/components/UserAvatar';

// Enhanced type for local state to handle auction data
interface EnhancedListingData extends ListingData {
  isAuction?: boolean;
  duration?: number;
}

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
  const [listingData, setListingData] = useState<EnhancedListingData>({
    nft: null,
    price: '',
    isOpen: false,
    isAuction: false,
    duration: 3600, // Default duration 1 hour
  });
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [bidData, setBidData] = useState<{
    isOpen: boolean;
    nft: NFT | null;
    amount: string;
  }>({
    isOpen: false,
    nft: null,
    amount: '',
  });


  const {
    nfts,
    mintNFT,
    buyNFT,
    listForSale,
    placeBid,
    endAuction,
    isLoading,
    isMinting,
    isListing,
    isListSuccess,
    isBuying,
    isBidding,
    isEndingAuction,
    isApproving,
    isApprovalSuccess,
    totalSupply,
    marketplaceStats,
    contractAddress,
    marketplaceAddress,
    isPaused,
    isMarketplacePaused,
    isMarketplaceApproved,
    securityFeatures,
    forceRefresh,
    approveMarketplace,
    likeNFT,
    updateNFTViews,
  } = useNFTContract();

  const { data: balance } = useBalance({
    address,
    enabled: !!address,
  });

  useEffect(() => {
    if (isListSuccess) {
      // After a successful listing, close the modal.
      setListingData({ nft: null, price: '', isOpen: false });
    }
  }, [isListSuccess]);



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

  const myNfts = useMemo(() => nfts.filter(nft => nft.owner?.toLowerCase() === address?.toLowerCase()), [nfts, address]);

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
                  onClick={() => {}}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  title="Refresh data"
                  disabled={true}
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
    if (!mintData.name || !mintData.description) {
      alert("Please fill out name and description.");
      return;
    }
    
    // 如果没有图片URL，提供默认图片
    const imageUrl = mintData.image || `https://via.placeholder.com/400x400/8B5CF6/FFFFFF?text=${encodeURIComponent(mintData.name)}`;
    
    // 1. Build the metadata object from the form state.
    const metadataObject = {
      name: mintData.name,
      description: mintData.description,
      image: imageUrl,
      attributes: [{ trait_type: "Category", value: mintData.category }],
    };
    
    // 2. Stringify the metadata to create the tokenURI.
    const tokenURIString = JSON.stringify(metadataObject);

    // 3. Call the hook with the correct data structure.
    await mintNFT({
      name: mintData.name,
      description: mintData.description,
      category: mintData.category,
      price: mintData.price,
      image: tokenURIString, // This is the crucial part.
    });
    
    // 4. Reset the form.
    setMintData({ name: '', description: '', image: '', category: 'art', price: '' });
  };

  const handlePlaceBid = (nft: NFT) => {
    setBidData({
      isOpen: true,
      nft: nft,
      amount: '',
    });
  };

  const handleConfirmBid = async () => {
    if (bidData.nft && bidData.amount) {
      // Ensure listingId exists before calling
      if (bidData.nft.listingId) {
        await placeBid(bidData.nft.listingId, bidData.amount);
        setBidData({ isOpen: false, nft: null, amount: '' });
      } else {
        console.error("Cannot place bid: NFT does not have a listing ID.");
        alert("Cannot place bid: This NFT is not properly listed for auction.");
      }
    }
  };

  const handleViewDetails = (nft: NFT) => {
    updateNFTViews(nft.tokenId);
    setSelectedNFT(nft);
  };

  const handleListForSale = async (nft: NFT) => {
    setListingData({
      nft,
      price: nft.price || '0.1',
      isOpen: true,
      isAuction: false,
      duration: 3600, // Default duration 1 hour
    });
    // 使用全局授权状态即可
    console.log('🔄 Current global approval status:', isMarketplaceApproved);
  };

  const handleConfirmListing = async () => {
    if (listingData.nft && listingData.price) {
      // This now ONLY starts the transaction.
      // The modal will be closed by the useEffect watching isListSuccess.
      await listForSale(
        listingData.nft.tokenId, 
        listingData.price, 
        listingData.isAuction || false,
        listingData.duration || 0
      );
    }
  };

  // 处理取消上架
  const handleCancelListing = async (nft: NFT) => {
    if (nft.listingId) {
      // TODO: 实现取消上架功能
      console.log('Cancel listing for NFT:', nft.tokenId, 'Listing ID:', nft.listingId);
      alert('Cancel listing feature will be implemented soon.');
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'marketplace':
        return (
          <MarketplaceTab
            nfts={nfts}
            filteredNfts={filteredNfts}
            onBuy={(nft: NFT) => buyNFT(nft.listingId!, nft.price)}
            onPlaceBid={handlePlaceBid}
            selectedCategory={selectedCategory}
            sortBy={sortBy}
            viewMode={viewMode}
            categories={categories}
            onCategoryChange={setSelectedCategory}
            onSortChange={setSortBy}
            onViewModeChange={setViewMode}
            onViewDetails={handleViewDetails}
            onLike={(nft: NFT) => likeNFT(nft.tokenId)}
          />
        );
      case 'mint':
        return (
          <CreateNFTForm
            mintData={mintData}
            onMintDataChange={setMintData}
            onMintNFT={handleMintNFT}
            isMinting={isMinting}
            categories={categories.filter(c => c.id !== 'all')}
            address={address}
          />
        );
      case 'my-nfts':
        return (
          <MyCollectionTab
            myNfts={myNfts}
            onListForSale={handleListForSale}
            onCancelListing={handleCancelListing}
            onViewDetails={handleViewDetails}
            onLike={(nft: NFT) => likeNFT(nft.tokenId)}
            onViewChange={setActiveView}
            onRefresh={forceRefresh}
            isLoading={isLoading}
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
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <UserAvatar />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* NFT Information Card */}
        {isConnected && (
          <div className={`bg-white border rounded-lg p-6 mb-8 shadow-sm ${
            marketplaceStats ? 'border-green-200' : 'border-yellow-200'
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
                    marketplaceStats ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className={`text-sm ${
                    marketplaceStats ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {marketplaceStats ? 'Contract Connected' : 'Contract Not Deployed'}
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

        {/* Security Status Display */}
        <SecurityStatusDisplay
          isPaused={isPaused}
          isMarketplacePaused={isMarketplacePaused}
          securityFeatures={securityFeatures}
        />

        {!marketplaceStats && (
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

        {/* Enhanced NFT Details Modal */}
        {selectedNFT && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedNFT(null)}>
            <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="flex flex-row justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    {selectedNFT.name}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedNFT.rarity === 'Legendary' ? 'bg-yellow-100 text-yellow-800' :
                      selectedNFT.rarity === 'Epic' ? 'bg-purple-100 text-purple-800' :
                      selectedNFT.rarity === 'Rare' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedNFT.rarity}
                    </span>
                  </CardTitle>
                  <div className="text-sm text-gray-500 mt-1">
                    Token ID: #{selectedNFT.tokenId} • Category: {selectedNFT.category}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedNFT(null)}>✕</Button>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Image & Asset Info */}
                <div className="space-y-4">
                  <div className="relative">
                    <img src={selectedNFT.image} alt={selectedNFT.name} className="w-full aspect-square object-cover rounded-lg border" />
                    {selectedNFT.isListed && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          {selectedNFT.listingType === 'AUCTION' ? 'Live Auction' : 'For Sale'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Card>
                    <CardHeader><CardTitle className="text-base">Asset Information</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Contract:</span> 
                        <a 
                          href={`https://etherscan.io/address/${contractAddress}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-purple-600 hover:text-purple-800 truncate max-w-[150px]"
                        >
                          {contractAddress?.slice(0,6)}...{contractAddress?.slice(-4)}
                        </a>
                      </div>
                      <div className="flex justify-between"><span>Token ID:</span> <span>#{selectedNFT.tokenId}</span></div>
                      <div className="flex justify-between"><span>Standard:</span> <span>ERC-721</span></div>
                      <div className="flex justify-between"><span>Blockchain:</span> <span>{chain?.name || 'Unknown'}</span></div>
                      {selectedNFT.metadataUri && (
                        <div className="flex justify-between">
                          <span>Metadata:</span> 
                          <a 
                            href={selectedNFT.metadataUri.startsWith('ipfs') ? 
                              selectedNFT.metadataUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/') : 
                              selectedNFT.metadataUri
                            } 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-purple-600 hover:text-purple-800"
                          >
                            View Metadata
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  
                </div>
                
                {/* Right Column: Details, Attributes, Pricing */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{selectedNFT.description}</p>
                  </div>
                  
                  <div className="border p-4 rounded-lg bg-gray-50">
                    <h3 className="font-semibold text-gray-800 mb-3">Statistics</h3>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="font-bold text-2xl text-blue-600">{selectedNFT.likes}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Likes</div>
                      </div>
                      <div>
                        <div className="font-bold text-2xl text-green-600">{selectedNFT.views}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Views</div>
                      </div>
                    </div>
                  </div>

                  {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Attributes</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedNFT.attributes.map((attr, i) => (
                          <div key={i} className="bg-gradient-to-br from-purple-50 to-blue-50 p-3 rounded-lg text-center border">
                            <div className="text-xs text-purple-600 uppercase font-medium">{attr.trait_type}</div>
                            <div className="font-semibold text-sm text-gray-900 mt-1">{attr.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Ownership</h3>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Owner:</span> 
                        <span className={`font-mono px-2 py-1 rounded text-xs ${
                          selectedNFT.owner?.toLowerCase() === address?.toLowerCase() 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedNFT.owner?.toLowerCase() === address?.toLowerCase() 
                            ? 'You' 
                            : `${selectedNFT.owner?.slice(0,6)}...${selectedNFT.owner?.slice(-4)}`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Creator:</span> 
                        <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {`${selectedNFT.creator?.slice(0,6)}...${selectedNFT.creator?.slice(-4)}`}
                        </span>
                      </div>
                    </div>
                  </div>

                                     {/* Action Buttons Section */}
                   <div className="space-y-3">
                     {/* Like Button */}
                     <Button
                       variant="outline"
                       className="w-full"
                       onClick={() => likeNFT(selectedNFT.tokenId)}
                     >
                       ❤️ Like ({selectedNFT.likes})
                     </Button>
                     
                     {/* Owner Actions */}
                     {selectedNFT.owner?.toLowerCase() === address?.toLowerCase() ? (
                       <div className="space-y-2">
                         {!selectedNFT.isListed ? (
                           <Button
                             className="w-full bg-green-600 hover:bg-green-700"
                             onClick={() => {
                               handleListForSale(selectedNFT);
                               setSelectedNFT(null);
                             }}
                           >
                             List for Sale
                           </Button>
                         ) : (
                           <div className="space-y-2">
                             <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                               <div className="text-sm text-blue-800">
                                 <div className="font-medium">
                                   {selectedNFT.listingType === 'AUCTION' ? 'Auction Active' : 'Listed for Sale'}
                                 </div>
                                 <div className="text-lg font-bold text-blue-900">
                                   {selectedNFT.price} ETH
                                 </div>
                               </div>
                             </div>
                             <Button
                               variant="outline"
                               className="w-full text-red-600 hover:text-red-700"
                               onClick={() => {
                                 handleCancelListing(selectedNFT);
                                 setSelectedNFT(null);
                               }}
                             >
                               Cancel Listing
                             </Button>
                           </div>
                         )}
                       </div>
                     ) : (
                       /* Buyer Actions */
                       selectedNFT.isListed && (
                         <div className="border-2 border-green-200 p-4 rounded-lg bg-green-50">
                           <div className="flex items-center justify-between mb-3">
                             <div>
                               <div className="text-lg font-bold text-green-800">
                                 {selectedNFT.listingType === 'AUCTION' ? 'Current Bid' : 'Price'}
                               </div>
                               <div className="text-2xl font-bold text-green-900">
                                 {selectedNFT.price} ETH
                               </div>
                             </div>
                             <div className="text-right text-sm text-green-700">
                               {selectedNFT.listingType === 'AUCTION' && (
                                 <div>Auction Active</div>
                               )}
                             </div>
                           </div>
                           
                           <Button 
                             className={`w-full text-white ${
                               selectedNFT.listingType === 'AUCTION' 
                                 ? 'bg-purple-600 hover:bg-purple-700' 
                                 : 'bg-green-600 hover:bg-green-700'
                             }`}
                             onClick={() => {
                               if(selectedNFT.listingType === 'AUCTION') {
                                 handlePlaceBid(selectedNFT);
                               } else {
                                 buyNFT(selectedNFT.listingId!, selectedNFT.price);
                               }
                               setSelectedNFT(null);
                             }}
                             disabled={isBuying || isBidding}
                           >
                             {selectedNFT.listingType === 'AUCTION' ? (
                               isBidding ? (
                                 <>
                                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                   Placing Bid...
                                 </>
                               ) : (
                                 <>
                                   <Gavel className="h-4 w-4 mr-2" />
                                   Place Bid
                                 </>
                               )
                             ) : (
                               isBuying ? (
                                 <>
                                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                   Purchasing...
                                 </>
                               ) : (
                                 <>
                                   <ShoppingCart className="h-4 w-4 mr-2" />
                                   Buy Now for {selectedNFT.price} ETH
                                 </>
                               )
                             )}
                           </Button>
                         </div>
                       )
                     )}
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Listing Modal */}
        {listingData.isOpen && listingData.nft && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>List "{listingData.nft.name}" for Sale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sale Type Toggle */}
                <div className="flex items-center space-x-2 rounded-lg bg-gray-100 p-1">
                  <Button
                    onClick={() => setListingData({ ...listingData, isAuction: false })}
                    variant={!listingData.isAuction ? 'default' : 'ghost'}
                    className="flex-1"
                  >
                    Fixed Price
                  </Button>
                  <Button
                    onClick={() => setListingData({ ...listingData, isAuction: true })}
                    variant={listingData.isAuction ? 'default' : 'ghost'}
                    className="flex-1"
                  >
                    Auction
                  </Button>
                </div>

                {/* Price Input */}
                <div>
                  <label className="text-sm font-medium">{listingData.isAuction ? 'Starting Bid' : 'Price'} (ETH)</label>
                  <input
                    type="number"
                    placeholder="e.g., 0.1"
                    value={listingData.price}
                    onChange={(e) => setListingData({ ...listingData, price: e.target.value })}
                    className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>

                {/* Duration Input for Auctions */}
                {listingData.isAuction && (
                  <div>
                    <label className="text-sm font-medium">Auction Duration (hours)</label>
                    <input
                      type="number"
                      placeholder="e.g., 24"
                      value={listingData.duration ? listingData.duration / 3600 : ''}
                      onChange={(e) => setListingData({ ...listingData, duration: Number(e.target.value) * 3600 })}
                      className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                )}



                {/* Process indicator */}
                {(!isMarketplaceApproved && !isApprovalSuccess) && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <div className="font-medium">First-time setup:</div>
                      <div className="text-xs mt-1">
                        You need to approve our marketplace to list your NFTs.<br/>
                        This is a one-time approval for all your NFTs.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setListingData({ nft: null, price: '', isOpen: false })}>
                  Cancel
                </Button>
                {(!isMarketplaceApproved && !isApprovalSuccess) ? (
                  <Button onClick={approveMarketplace} disabled={isApproving}>
                    {isApproving ? 'Approving Marketplace...' : 'Approve & List'}
                  </Button>
                ) : (
                  <Button onClick={handleConfirmListing} disabled={isListing || !listingData.price}>
                    {isListing ? 'Listing...' : `List for ${listingData.isAuction ? 'Auction' : 'Sale'}`}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Bid Modal */}
        {bidData.isOpen && bidData.nft && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Place a Bid on "{bidData.nft.name}"</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <img src={bidData.nft.image} alt={bidData.nft.name} className="w-full aspect-square object-cover rounded-lg mb-4" />
                  <p className="text-sm text-gray-600">Current highest bid: <span className="font-bold text-gray-900">{bidData.nft.price} ETH</span></p>
                  <p className="text-sm text-gray-600">Your bid must be higher than the current bid.</p>
                </div>
                <input
                  type="number"
                  step="0.001"
                  placeholder="Enter your bid amount in ETH"
                  value={bidData.amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBidData({ ...bidData, amount: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setBidData({ isOpen: false, nft: null, amount: '' })}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmBid} disabled={isBidding}>
                  {isBidding ? 'Placing Bid...' : 'Confirm Bid'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 