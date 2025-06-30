'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Shield, Settings, Trash2, Check, X, ExternalLink } from 'lucide-react';
import { useAccount, useNetwork, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNFTContract } from '@/app/nft/hooks/useNFTContract';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { data: balance } = useBalance({ address, enabled: !!address });
  
  const {
    isMarketplaceApproved,
    approveMarketplace,
    revokeMarketplaceApproval,
    contractAddress,
    marketplaceAddress,
    isApproving,
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
        setUserProfile(JSON.parse(saved));
      }
    }
  }, [address]);

  // 保存用户配置
  const saveProfile = () => {
    if (address) {
      localStorage.setItem(`user_profile_${address}`, JSON.stringify(userProfile));
      toast.success('Profile saved successfully!');
    }
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      // 清除用户配置
      if (address) {
        localStorage.removeItem(`user_profile_${address}`);
      }
      // 清除NFT缓存
      Object.keys(localStorage).forEach(key => {
        if (key.includes('nft_marketplace_data')) {
          localStorage.removeItem(key);
        }
      });
      setUserProfile({ displayName: '', bio: '', website: '', twitter: '' });
      toast.success('All local data cleared');
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/" className="flex items-center text-purple-600 hover:text-purple-800 transition-colors">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 mb-8">
              <User className="h-12 w-12 text-orange-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Wallet Not Connected</h2>
            <p className="text-gray-600 mb-8">Connect your wallet to access settings.</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center text-purple-600 hover:text-purple-800 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              User Settings
            </h1>
            <div className="text-sm text-gray-500">
              Also accessible via profile menu
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Account Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Account Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Wallet Address</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</code>
                    <a 
                      href={`https://etherscan.io/address/${address}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Network</label>
                  <div className="mt-1 text-sm text-gray-900">{chain?.name || 'Unknown'} (ID: {chain?.id})</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Balance</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {balance ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ETH` : 'Loading...'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">NFT Contract</label>
                  <div className="mt-1 text-sm text-gray-500">
                    {contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : 'Not Available'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={userProfile.displayName}
                    onChange={(e) => setUserProfile({ ...userProfile, displayName: e.target.value })}
                    placeholder="Your display name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={userProfile.website}
                    onChange={(e) => setUserProfile({ ...userProfile, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={userProfile.bio}
                  onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Twitter Handle</label>
                <input
                  type="text"
                  value={userProfile.twitter}
                  onChange={(e) => setUserProfile({ ...userProfile, twitter: e.target.value })}
                  placeholder="@yourusername"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <Button onClick={saveProfile} className="bg-green-600 hover:bg-green-700">
                Save Profile
              </Button>
            </CardContent>
          </Card>

          {/* Permissions & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Permissions & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Marketplace Approval */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">NFT Marketplace Approval</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Allow marketplace to list and transfer your NFTs
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    Marketplace: {marketplaceAddress?.slice(0, 6)}...{marketplaceAddress?.slice(-4)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isMarketplaceApproved ? (
                    <>
                      <div className="flex items-center text-green-600">
                        <Check className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">Approved</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to revoke marketplace approval? You will need to approve again to list NFTs.')) {
                            revokeMarketplaceApproval();
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                        disabled={isApproving}
                      >
                        {isApproving ? 'Revoking...' : 'Revoke'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center text-gray-500">
                        <X className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">Not Approved</span>
                      </div>
                      <Button 
                        size="sm"
                        onClick={approveMarketplace}
                        disabled={isApproving}
                      >
                        {isApproving ? 'Approving...' : 'Approve'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Security Notes */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Security Notes</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Marketplace approval allows listing NFTs but does not give access to your funds</li>
                  <li>• You can revoke approval at any time using your wallet</li>
                  <li>• Existing listings will remain active until cancelled or sold</li>
                  <li>• Profile data is stored locally in your browser</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trash2 className="h-5 w-5 mr-2" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div>
                  <h3 className="font-medium text-red-900">Clear All Local Data</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Remove all cached NFT data and profile information
                  </p>
                </div>
                <Button 
                  variant="outline"
                  onClick={clearAllData}
                  className="text-red-600 hover:text-red-700 border-red-300"
                >
                  Clear Data
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">What gets cleared:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Profile information (display name, bio, etc.)</li>
                  <li>• Cached NFT data and images</li>
                  <li>• Local preferences and settings</li>
                </ul>
                <p className="mt-2 text-xs">
                  Note: This only affects data stored in your browser. Your NFTs and blockchain data remain unchanged.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
} 