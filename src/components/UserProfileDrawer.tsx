'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Settings, LogOut, ExternalLink, Copy, Check } from 'lucide-react';
import { useAccount, useNetwork, useBalance, useDisconnect } from 'wagmi';
import { formatEther } from 'viem';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useNFTContract } from '@/app/nft/hooks/useNFTContract';
import { toast } from 'react-hot-toast';

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileDrawer({ isOpen, onClose }: UserProfileDrawerProps) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { data: balance } = useBalance({ address, enabled: !!address });
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);
  
  const {
    isMarketplaceApproved,
    contractAddress,
    marketplaceAddress,
  } = useNFTContract();

  const [userProfile, setUserProfile] = useState({
    displayName: '',
    bio: '',
    website: '',
    twitter: '',
  });

  // 加载用户配置
  useEffect(() => {
    if (address) {
      const saved = localStorage.getItem(`user_profile_${address}`);
      if (saved) {
        try {
          setUserProfile(JSON.parse(saved));
        } catch (error) {
          console.warn('Failed to load user profile:', error);
        }
      }
    }
  }, [address]);

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Address copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy address');
      }
    }
  };

  const handleDisconnect = () => {
    disconnect();
    onClose();
    toast.success('Wallet disconnected');
  };

  // 生成头像
  const getAvatarUrl = () => {
    if (!address) return '';
    // 使用地址生成简单的头像 - 可以替换为其他头像服务
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${address}&backgroundColor=8B5CF6,06B6D4,10B981,F59E0B,EF4444`;
  };

  if (!isConnected) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* User Info */}
            <div className="text-center">
              <div className="mx-auto w-20 h-20 rounded-full overflow-hidden bg-gray-100 mb-3">
                <img 
                  src={getAvatarUrl()} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {userProfile.displayName ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{userProfile.displayName}</h3>
                  <p className="text-sm text-gray-500">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </h3>
                  <p className="text-sm text-gray-500">Anonymous User</p>
                </div>
              )}
              
              {userProfile.bio && (
                <p className="text-sm text-gray-600 mt-2">{userProfile.bio}</p>
              )}
            </div>

            {/* Address */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Wallet Address</label>
                  <div className="text-sm font-mono text-gray-900">{address}</div>
                </div>
                <button
                  onClick={copyAddress}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Account Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-600">
                  {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0.0000'}
                </div>
                <div className="text-xs text-blue-600">ETH Balance</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-600">{chain?.name || 'Unknown'}</div>
                <div className="text-xs text-purple-600">Network</div>
              </div>
            </div>

            {/* Quick Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Marketplace Approved</span>
                <div className={`w-2 h-2 rounded-full ${isMarketplaceApproved ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">NFT Contract</span>
                <div className={`w-2 h-2 rounded-full ${contractAddress ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              </div>
            </div>

            {/* External Links */}
            {(userProfile.website || userProfile.twitter) && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Links</label>
                {userProfile.website && (
                  <a 
                    href={userProfile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Website
                  </a>
                )}
                {userProfile.twitter && (
                  <a 
                    href={`https://twitter.com/${userProfile.twitter.replace('@', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Twitter
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 p-4 space-y-2">
            <Link href="/settings" onClick={onClose}>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings & Permissions
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              onClick={handleDisconnect}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              size="sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect Wallet
            </Button>
          </div>
        </div>
      </div>
    </>
  );
} 