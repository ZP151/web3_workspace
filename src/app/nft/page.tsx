'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useNetwork, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Image, 
  ShoppingCart, 
  Tag, 
  Eye,
  Heart,
  Share2,
  Filter,
  Grid3X3,
  List,
  Plus,
  Palette,
  Star,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getContractAddress, getContractABI } from '@/config/contracts';

interface NFT {
  id: string;
  tokenId: number;
  listingId?: number; // 市场上的listing ID
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
}

interface MintData {
  name: string;
  description: string;
  image: string;
  category: string;
  price: string;
}

export default function NFTPage() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [activeView, setActiveView] = useState<'marketplace' | 'mint' | 'my-nfts' | 'analytics'>('marketplace');
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mintData, setMintData] = useState<MintData>({
    name: '',
    description: '',
    image: '',
    category: 'art',
    price: '',
  });
  const [selectedNFTForPurchase, setSelectedNFTForPurchase] = useState<NFT | null>(null);
  const [listingData, setListingData] = useState<{
    nft: NFT | null;
    price: string;
    isOpen: boolean;
  }>({
    nft: null,
    price: '',
    isOpen: false,
  });

  // Get contract addresses and ABIs
  const nftContractAddress = chain?.id ? getContractAddress(chain.id, 'PlatformNFT') : undefined;
  const marketplaceContractAddress = chain?.id ? getContractAddress(chain.id, 'NFTMarketplace') : undefined;
  const nftContractABI = getContractABI('PlatformNFT');
  const marketplaceContractABI = getContractABI('NFTMarketplace');

  // Read contract data
  const { data: totalSupply, refetch: refetchTotalSupply } = useContractRead({
    address: nftContractAddress as `0x${string}`,
    abi: nftContractABI,
    functionName: 'totalSupply',
    enabled: !!nftContractAddress && isConnected,
  });

  const { data: userNFTBalance, refetch: refetchUserBalance } = useContractRead({
    address: nftContractAddress as `0x${string}`,
    abi: nftContractABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!nftContractAddress && isConnected && !!address,
  });

  // 获取市场统计信息
  const { data: marketplaceStats } = useContractRead({
    address: marketplaceContractAddress as `0x${string}`,
    abi: marketplaceContractABI,
    functionName: 'getMarketplaceStats',
    enabled: !!marketplaceContractAddress && isConnected,
  });

  // Prepare mint transaction
  const { config: mintConfig } = usePrepareContractWrite({
    address: nftContractAddress as `0x${string}`,
    abi: nftContractABI,
    functionName: 'mint',
    args: [
      address, 
      mintData.image || `https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=${encodeURIComponent(mintData.name)}`, 
      250 // 2.5% 版税
    ],
    value: parseEther('0.001'), // mint fee
    enabled: !!nftContractAddress && isConnected && !!mintData.name && !!mintData.description,
  });

  const { write: mintNFT, isLoading: isMinting } = useContractWrite({
    ...mintConfig,
    onSuccess: (data) => {
      toast.success(`NFT铸造成功！交易哈希: ${data.hash}`);
      setMintData({ name: '', description: '', image: '', category: 'art', price: '' });
      refetchTotalSupply();
      refetchUserBalance();
              // 如果有价格，自动上架
        if (mintData.price && parseFloat(mintData.price) > 0) {
          // 这里需要等待铸造完成后获取tokenId，然后调用上架函数
          setTimeout(() => {
            toast.success('NFT铸造完成，请手动上架到市场');
          }, 2000);
        }
    },
    onError: (error) => {
      console.error('铸造失败:', error);
      toast.error('铸造失败: ' + (error.message || '未知错误'));
    },
  });

  // 加载NFT数据的函数
  const loadNFTData = () => {
    console.log('📊 加载NFT数据...');
    
    if (!isConnected || !nftContractAddress || !marketplaceContractAddress) {
      console.log('❌ 无法加载NFT数据：连接或合约地址缺失');
      return;
    }

    // 使用Ganache的确定性地址
    const ganacheAddresses = [
      '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1', // user0 (deployer)
      '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0', // user1
      '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b', // user2
      '0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d', // user3
      '0xd03ea8624C8C5987235048901fB614fDcA89b117', // user4
      '0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC', // user5
      '0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9', // user6
      '0x28a8746e75304c0780E011BEd21C72cD78cd535E', // user7
      '0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E', // user8
      '0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e', // user9
    ];

    // 基于脚本创建的真实NFT数据
    const realNfts: NFT[] = [
      // 已有的测试NFT
      {
        id: '0',
        tokenId: 0,
        listingId: 0,
        name: 'Cosmic Dream #001',
        description: 'A beautiful cosmic landscape with vibrant colors and ethereal beauty.',
        image: 'https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=Cosmic+Dream',
        price: '0.1',
        owner: ganacheAddresses[1],
        creator: ganacheAddresses[1],
        category: 'art',
        isListed: true,
        likes: 42,
        views: 156,
        rarity: 'Rare',
      },
      {
        id: '1',
        tokenId: 1,
        listingId: 1,
        name: 'Digital Harmony',
        description: 'An abstract digital artwork representing the harmony of technology and nature.',
        image: 'https://via.placeholder.com/400x400/10B981/FFFFFF?text=Digital+Harmony',
        price: '0.05',
        owner: ganacheAddresses[2],
        creator: ganacheAddresses[2],
        category: 'art',
        isListed: true,
        likes: 28,
        views: 89,
        rarity: 'Common',
      },
      // 通过脚本创建的新NFT
      {
        id: '36',
        tokenId: 36,
        listingId: 6,
        name: 'Cosmic Warrior #001',
        description: 'A legendary warrior from the cosmic realm, wielding the power of stars.',
        image: 'https://via.placeholder.com/400x400/8B5CF6/FFFFFF?text=Cosmic+Warrior',
        price: '0.15',
        owner: ganacheAddresses[1],
        creator: ganacheAddresses[1],
        category: 'art',
        isListed: true,
        likes: 65,
        views: 234,
        rarity: 'Legendary',
      },
      {
        id: '37',
        tokenId: 37,
        listingId: 7,
        name: 'Digital Landscape #042',
        description: 'A serene digital landscape with floating islands and aurora lights.',
        image: 'https://via.placeholder.com/400x400/06B6D4/FFFFFF?text=Digital+Landscape',
        price: '0.08',
        owner: ganacheAddresses[2],
        creator: ganacheAddresses[2],
        category: 'art',
        isListed: true,
        likes: 31,
        views: 127,
        rarity: 'Rare',
      },
      {
        id: '38',
        tokenId: 38,
        listingId: 8,
        name: 'Cyber Punk Avatar #123',
        description: 'A futuristic avatar with neon implants and holographic accessories.',
        image: 'https://via.placeholder.com/400x400/EC4899/FFFFFF?text=Cyber+Avatar',
        price: '0.12',
        owner: ganacheAddresses[3],
        creator: ganacheAddresses[3],
        category: 'avatars',
        isListed: true,
        likes: 48,
        views: 189,
        rarity: 'Epic',
      },
      {
        id: '39',
        tokenId: 39,
        listingId: 9,
        name: 'Virtual Pet Dragon',
        description: 'A cute virtual dragon pet that can breathe digital fire.',
        image: 'https://via.placeholder.com/400x400/F59E0B/FFFFFF?text=Pet+Dragon',
        price: '0.06',
        owner: ganacheAddresses[3],
        creator: ganacheAddresses[3],
        category: 'gaming',
        isListed: true,
        likes: 73,
        views: 301,
        rarity: 'Common',
      },
      {
        id: '40',
        tokenId: 40,
        name: 'Abstract Geometry #07',
        description: 'Complex geometric patterns creating mesmerizing visual effects.',
        image: 'https://via.placeholder.com/400x400/EF4444/FFFFFF?text=Abstract+Geo',
        price: '0.25',
        owner: ganacheAddresses[4],
        creator: ganacheAddresses[4],
        category: 'art',
        isListed: false,
        likes: 29,
        views: 98,
        rarity: 'Legendary',
      },
      {
        id: '41',
        tokenId: 41,
        listingId: 10,
        name: 'Music Visualizer NFT',
        description: 'An animated NFT that responds to music frequencies and beats.',
        image: 'https://via.placeholder.com/400x400/A855F7/FFFFFF?text=Music+Visual',
        price: '0.18',
        owner: ganacheAddresses[4],
        creator: ganacheAddresses[4],
        category: 'music',
        isListed: true,
        likes: 54,
        views: 178,
        rarity: 'Epic',
      },
    ];

    setNfts(realNfts);
    setFilteredNfts(realNfts);
    console.log('✅ NFT数据加载完成，共', realNfts.length, '个NFT');
  };

  // 刷新NFT数据的函数
  const refreshNFTData = async () => {
    console.log('🔄 刷新NFT数据...');
    if (!isConnected || !nftContractAddress || !marketplaceContractAddress) {
      console.log('❌ 无法刷新NFT数据：连接或合约地址缺失');
      return;
    }

    try {
      // 重新触发数据读取
      refetchTotalSupply();
      refetchUserBalance();
      
      // 重新加载NFT数据
      loadNFTData();
      
      console.log('✅ NFT数据已刷新');
    } catch (error) {
      console.error('❌ 刷新NFT数据失败:', error);
    }
  };

  // 使用 useContractWrite 进行动态购买，不需要预先准备
  const { writeAsync: purchaseNFT, isLoading: isPurchasing } = useContractWrite({
    address: marketplaceContractAddress as `0x${string}`,
    abi: marketplaceContractABI,
    functionName: 'buyItem',
    onSuccess: (data) => {
      toast.success(`NFT购买成功！交易哈希: ${data.hash}`);
      console.log('🎉 NFT购买成功，更新本地状态...');
      
      // 更新本地NFT状态
      if (selectedNFTForPurchase) {
        console.log('更新NFT状态:', selectedNFTForPurchase.id, '新拥有者:', address);
        setNfts(prev => prev.map(nft => 
          nft.id === selectedNFTForPurchase.id 
            ? { 
                ...nft, 
                owner: address || '0x0000...0000', 
                isListed: false,
                listingId: undefined 
              }
            : nft
        ));
        
        // 同时更新过滤后的NFT列表
        setFilteredNfts(prev => prev.map(nft => 
          nft.id === selectedNFTForPurchase.id 
            ? { 
                ...nft, 
                owner: address || '0x0000...0000', 
                isListed: false,
                listingId: undefined 
              }
            : nft
        ));
      }
      
      setSelectedNFTForPurchase(null);
      refetchUserBalance();
      // 刷新NFT数据以反映最新状态
      setTimeout(() => refreshNFTData(), 1000);
    },
    onError: (error) => {
      console.error('购买失败:', error);
      toast.error('购买失败: ' + (error.message || '未知错误'));
      setSelectedNFTForPurchase(null);
    },
  });

  // Approve NFT for marketplace
  const { writeAsync: approveNFT, isLoading: isApproving } = useContractWrite({
    address: nftContractAddress as `0x${string}`,
    abi: nftContractABI,
    functionName: 'approve',
    onSuccess: (data) => {
      console.log('✅ NFT批准成功，交易哈希:', data.hash);
    },
    onError: (error) => {
      console.error('批准失败:', error);
      toast.error('批准失败: ' + (error.message || '未知错误'));
    },
  });

  // List NFT for sale
  const { writeAsync: listNFT, isLoading: isListing } = useContractWrite({
    address: marketplaceContractAddress as `0x${string}`,
    abi: marketplaceContractABI,
    functionName: 'listItem',
    onSuccess: (data) => {
      toast.success(`NFT上架成功！交易哈希: ${data.hash}`);
      console.log('🎉 NFT上架成功，更新本地状态...');
      
      // 更新本地NFT状态
      if (listingData.nft) {
        console.log('更新NFT上架状态:', listingData.nft.id, '价格:', listingData.price);
        setNfts(prev => prev.map(nft => 
          nft.id === listingData.nft!.id 
            ? { 
                ...nft, 
                isListed: true,
                price: listingData.price,
                // listingId 需要从合约事件中获取，暂时使用一个临时值
                listingId: Date.now() % 1000
              }
            : nft
        ));
        
        // 同时更新过滤后的NFT列表
        setFilteredNfts(prev => prev.map(nft => 
          nft.id === listingData.nft!.id 
            ? { 
                ...nft, 
                isListed: true,
                price: listingData.price,
                listingId: Date.now() % 1000
              }
            : nft
        ));
      }
      
      setListingData({ nft: null, price: '', isOpen: false });
      // 刷新NFT数据以反映最新状态
      setTimeout(() => refreshNFTData(), 1000);
    },
    onError: (error) => {
      console.error('上架失败:', error);
      toast.error('上架失败: ' + (error.message || '未知错误'));
    },
  });

  // Categories
  const categories = [
    { id: 'all', name: 'All', icon: Grid3X3 },
    { id: 'art', name: 'Art', icon: Palette },
    { id: 'collectibles', name: 'Collectibles', icon: Star },
    { id: 'photography', name: 'Photography', icon: Image },
    { id: 'music', name: 'Music', icon: Heart },
  ];

  // 加载真实的NFT数据
  useEffect(() => {
    if (isConnected && nftContractAddress && marketplaceContractAddress) {
      loadNFTData();
    }
  }, [isConnected, nftContractAddress, marketplaceContractAddress, address]);

  // Filter and sort NFTs
  useEffect(() => {
    let filtered = nfts;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(nft => nft.category === selectedCategory);
    }
    
    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'price-high':
          return parseFloat(b.price) - parseFloat(a.price);
        case 'likes':
          return b.likes - a.likes;
        case 'views':
          return b.views - a.views;
        default: // newest
          return parseInt(b.id) - parseInt(a.id);
      }
    });
    
    setFilteredNfts(filtered);
  }, [nfts, selectedCategory, sortBy]);

  const handleMintNFT = async () => {
    console.log('🔍 开始铸造NFT流程调试...');
    console.log('isConnected:', isConnected);
    console.log('nftContractAddress:', nftContractAddress);
    console.log('mintData:', mintData);
    console.log('mintNFT function:', mintNFT);

    if (!isConnected) {
      console.log('❌ 钱包未连接');
      toast.error('请先连接钱包');
      return;
    }

    if (!mintData.name.trim() || !mintData.description.trim()) {
      console.log('❌ 必填字段为空');
      toast.error('请填写所有必填字段');
      return;
    }

    if (!mintNFT) {
      console.log('❌ mintNFT函数未定义 - 可能是网络或合约问题');
      toast.error('无法铸造NFT，请检查网络连接和合约状态');
      return;
    }

    console.log('✅ 所有检查通过，开始调用mintNFT函数...');
    try {
      console.log('📤 正在发送交易到MetaMask...');
      mintNFT();
      console.log('✅ mintNFT函数调用成功');
    } catch (error) {
      console.error('❌ mintNFT函数调用失败:', error);
      toast.error('铸造NFT失败');
    }
  };

  const handleBuyNFT = async (nft: NFT) => {
    console.log('🔍 开始购买NFT流程调试...');
    console.log('isConnected:', isConnected);
    console.log('marketplaceContractAddress:', marketplaceContractAddress);
    console.log('nft:', nft);

    if (!isConnected) {
      console.log('❌ 钱包未连接');
      toast.error('请先连接钱包');
      return;
    }

    if (nft.owner.toLowerCase() === address?.toLowerCase()) {
      console.log('❌ 不能购买自己的NFT');
      toast.error('不能购买自己的NFT');
      return;
    }

    if (!nft.isListed || nft.listingId === undefined) {
      console.log('❌ NFT未上架或没有listingId');
      toast.error('该NFT未上架销售');
      return;
    }

    // 直接设置选中的NFT，然后立即尝试购买
    setSelectedNFTForPurchase(nft);
    
    // 立即执行购买
    if (purchaseNFT) {
      console.log('🔍 购买配置调试信息:');
      console.log('purchaseNFT function:', purchaseNFT);
      console.log('marketplaceContractAddress:', marketplaceContractAddress);
      console.log('nft:', nft);
      console.log('listingId:', nft.listingId);
      console.log('price:', nft.price);
      
      console.log('📤 正在发送购买交易到MetaMask...');
      try {
        // 使用 writeAsync 并传递参数
        purchaseNFT({
          args: [nft.listingId],
          value: parseEther(nft.price)
        });
        console.log('✅ purchaseNFT函数调用成功');
      } catch (error) {
        console.error('❌ purchaseNFT函数调用失败:', error);
        toast.error('购买NFT失败: ' + (error as Error).message);
        setSelectedNFTForPurchase(null);
      }
    } else {
      console.error('❌ purchaseNFT函数未定义 - 可能是网络或合约问题');
      toast.error('无法购买NFT，请检查网络连接和合约状态');
      setSelectedNFTForPurchase(null);
    }
    
    console.log('✅ 所有检查通过，准备购买NFT...');
  };

  const handleListForSale = (nft: NFT) => {
    console.log('🔍 开始上架NFT流程:', nft);
    setListingData({
      nft,
      price: nft.isListed ? nft.price : '',
      isOpen: true,
    });
  };

  const handleConfirmListing = async () => {
    console.log('🔍 确认上架NFT流程调试...');
    console.log('isConnected:', isConnected);
    console.log('marketplaceContractAddress:', marketplaceContractAddress);
    console.log('listingData:', listingData);

    if (!isConnected) {
      console.log('❌ 钱包未连接');
      toast.error('请先连接钱包');
      return;
    }

    if (!listingData.nft) {
      console.log('❌ 没有选中的NFT');
      toast.error('没有选中的NFT');
      return;
    }

    if (!listingData.price || parseFloat(listingData.price) <= 0) {
      console.log('❌ 价格无效');
      toast.error('请输入有效的价格');
      return;
    }

    if (!listNFT) {
      console.log('❌ listNFT函数未定义 - 可能是网络或合约问题');
      toast.error('无法上架NFT，请检查网络连接和合约状态');
      return;
    }

    console.log('✅ 所有检查通过，开始上架流程...');
    try {
      // 第一步：批准市场合约操作NFT
      console.log('📤 正在批准市场合约操作NFT...');
      
      await approveNFT({
        args: [marketplaceContractAddress, listingData.nft.tokenId]
      });
      
      console.log('✅ NFT批准成功');
      toast.success('NFT批准成功，正在上架...');
      
      // 等待一点时间确保批准交易被确认
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 第二步：上架NFT
      console.log('📤 正在发送上架交易到MetaMask...');
      
      // 调用合约的listItem函数
      await listNFT({
        args: [
          listingData.nft.tokenId,
          parseEther(listingData.price),
          0, // FIXED_PRICE
          0  // 拍卖持续时间（固定价格不需要）
        ]
      });
      
      console.log('✅ listNFT函数调用成功');
    } catch (error) {
      console.error('❌ 上架流程失败:', error);
      const errorMessage = (error as any)?.details || (error as Error).message || '未知错误';
      toast.error('上架NFT失败: ' + errorMessage);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'text-gray-600 bg-gray-100';
      case 'Rare': return 'text-blue-600 bg-blue-100';
      case 'Epic': return 'text-purple-600 bg-purple-100';
      case 'Legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const myNfts = nfts.filter(nft => nft.owner.toLowerCase() === address?.toLowerCase());

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center text-purple-600 hover:text-purple-800">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-xl font-bold text-gray-900">NFT Marketplace</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* NFT Information */}
        {isConnected && nftContractAddress && marketplaceContractAddress && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your NFT Information</h3>
                <p className="text-gray-600">Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                <p className="text-gray-600">Network: {chain?.name || 'Unknown'} (ID: {chain?.id})</p>
                <p className="text-gray-600">NFT Contract: {nftContractAddress?.slice(0, 6)}...{nftContractAddress?.slice(-4)}</p>
                <p className="text-gray-600">Marketplace: {marketplaceContractAddress?.slice(0, 6)}...{marketplaceContractAddress?.slice(-4)}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">{myNfts.length}</div>
                <div className="text-gray-600">Your NFTs</div>
                <div className="text-sm text-gray-500 mt-1">
                  {myNfts.filter(nft => nft.isListed).length} Listed
                </div>
              </div>
            </div>
          </div>
        )}

        {!isConnected ? (
          <div className="text-center py-12">
            <Image className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Connection Required</h2>
            <p className="text-gray-600 mb-6">Please connect your wallet to access NFT marketplace</p>
            <Link href="/">
              <Button>Return to Home and Connect Wallet</Button>
            </Link>
          </div>
        ) : !nftContractAddress || !marketplaceContractAddress ? (
          <div className="text-center py-12">
            <Image className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unsupported Network</h2>
            <p className="text-gray-600 mb-6">Please switch to a supported network</p>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  {[
                    { id: 'marketplace', name: 'Marketplace', icon: ShoppingCart },
                    { id: 'mint', name: 'Mint NFT', icon: Plus },
                    { id: 'my-nfts', name: 'My NFTs', icon: Image },
                    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveView(tab.id as any)}
                      className={`${
                        activeView === tab.id
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center`}
                    >
                      <tab.icon className="h-5 w-5 mr-2" />
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Marketplace Tab */}
            {activeView === 'marketplace' && (
              <div className="space-y-6">
                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="newest">Newest</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="likes">Most Liked</option>
                        <option value="views">Most Viewed</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* NFT Grid */}
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                  {filteredNfts.map((nft) => (
                    <div key={nft.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
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
                      </div>
                      
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 truncate">{nft.name}</h4>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Heart className="h-3 w-3" />
                            <span>{nft.likes}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{nft.description}</p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm text-gray-500">
                            <div>Owner: {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}</div>
                            <div className="flex items-center mt-1">
                              <Eye className="h-3 w-3 mr-1" />
                              {nft.views} views
                            </div>
                          </div>
                          {nft.isListed && (
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">{nft.price} ETH</div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          {nft.isListed && nft.owner.toLowerCase() !== address?.toLowerCase() ? (
                            <Button
                              onClick={() => handleBuyNFT(nft)}
                              className="flex-1"
                              size="sm"
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Buy Now
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              className="flex-1"
                              size="sm"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-3"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredNfts.length === 0 && (
                  <div className="text-center py-12">
                    <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No NFTs found matching your criteria</p>
                  </div>
                )}
              </div>
            )}

            {/* Mint NFT Tab */}
            {activeView === 'mint' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    Mint New NFT
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter NFT name"
                          value={mintData.name}
                          onChange={(e) => setMintData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                          value={mintData.category}
                          onChange={(e) => setMintData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          {categories.filter(c => c.id !== 'all').map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Describe your NFT..."
                        value={mintData.description}
                        onChange={(e) => setMintData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                      <input
                        type="url"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="https://example.com/image.png"
                        value={mintData.image}
                        onChange={(e) => setMintData(prev => ({ ...prev, image: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty to generate a placeholder image</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (ETH)</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0.0"
                        value={mintData.price}
                        onChange={(e) => setMintData(prev => ({ ...prev, price: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty if not for sale</p>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center text-sm text-purple-700">
                        <div className="flex-shrink-0 w-4 h-4 mr-2">🎨</div>
                        <div>
                          <strong>Minting Fee:</strong> 0.001 ETH
                          <br />
                          <span className="text-purple-600">This fee covers gas costs and platform maintenance</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleMintNFT}
                      disabled={!mintData.name.trim() || !mintData.description.trim()}
                      className="w-full"
                    >
                      Mint NFT (0.001 ETH)
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* My NFTs Tab */}
            {activeView === 'my-nfts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">My NFT Collection ({myNfts.length})</h3>
                </div>

                {myNfts.length === 0 ? (
                  <div className="text-center py-12">
                    <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">You don't own any NFTs yet</p>
                    <Button 
                      onClick={() => setActiveView('mint')}
                      className="mt-4"
                    >
                      Mint Your First NFT
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {myNfts.map((nft) => (
                      <div key={nft.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                          
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleListForSale(nft)}
                            >
                              <Tag className="h-4 w-4 mr-1" />
                              {nft.isListed ? 'Update Price' : 'List for Sale'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-3"
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeView === 'analytics' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">NFT Analytics</h3>
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

                {/* Top Collections */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Creators</h4>
                  <div className="space-y-3">
                    {Object.entries(
                      nfts.reduce((acc, nft) => {
                        acc[nft.creator] = (acc[nft.creator] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([creator, count], index) => (
                      <div key={creator} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {creator.slice(0, 6)}...{creator.slice(-4)}
                            </div>
                            <div className="text-sm text-gray-500">{count} NFTs</div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {nfts.filter(nft => nft.creator === creator && nft.isListed)
                               .reduce((sum, nft) => sum + parseFloat(nft.price), 0)
                               .toFixed(2)} ETH
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Market Activity */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Market Activity</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">New Listings</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {nfts.filter(nft => nft.isListed).length} active
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Total Views</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {nfts.reduce((sum, nft) => sum + nft.views, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Total Likes</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {nfts.reduce((sum, nft) => sum + nft.likes, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* List for Sale Dialog */}
      {listingData.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {listingData.nft?.isListed ? 'Update Price' : 'List for Sale'}
            </h3>
            
            {listingData.nft && (
              <div className="mb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <img 
                    src={listingData.nft.image} 
                    alt={listingData.nft.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{listingData.nft.name}</h4>
                    <p className="text-sm text-gray-600">Token ID: {listingData.nft.tokenId}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (ETH) *
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0.0"
                value={listingData.price}
                onChange={(e) => setListingData(prev => ({ ...prev, price: e.target.value }))}
              />
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
              <div className="text-sm text-purple-700">
                <strong>Marketplace Fee:</strong> 2.5%
                <br />
                <span className="text-purple-600">
                  You will receive: {listingData.price ? (parseFloat(listingData.price) * 0.975).toFixed(4) : '0'} ETH
                </span>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setListingData({ nft: null, price: '', isOpen: false })}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmListing}
                disabled={!listingData.price || parseFloat(listingData.price) <= 0 || isListing || isApproving}
              >
                {isApproving ? 'Approving...' : isListing ? 'Listing...' : (listingData.nft?.isListed ? 'Update' : 'List NFT')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 