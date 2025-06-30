'use client';

import React, { useState } from 'react';
import { User } from 'lucide-react';
import { useAccount } from 'wagmi';
import { UserProfileDrawer } from './UserProfileDrawer';

export function UserAvatar() {
  const { address, isConnected } = useAccount();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 生成头像URL
  const getAvatarUrl = () => {
    if (!address) return '';
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${address}&backgroundColor=8B5CF6,06B6D4,10B981,F59E0B,EF4444`;
  };

  if (!isConnected) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
        title="Open profile"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm">
          <img 
            src={getAvatarUrl()} 
            alt="User Avatar" 
            className="w-full h-full object-cover"
            onError={(e) => {
              // 如果头像加载失败，显示默认图标
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden w-full h-full flex items-center justify-center bg-purple-100">
            <User className="h-4 w-4 text-purple-600" />
          </div>
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
      </button>

      <UserProfileDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </>
  );
} 