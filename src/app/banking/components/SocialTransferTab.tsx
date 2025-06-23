'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getNetworkAccounts } from '@/utils/web3';

interface SocialTransferTabProps {
  address: string;
  balance: string;
  onSocialTransfer: (to: string, amount: string, message: string, isPublic: boolean) => Promise<void>;
  isLoading: boolean;
}

export default function SocialTransferTab({
  address,
  balance,
  onSocialTransfer,
  isLoading
}: SocialTransferTabProps) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [networkAddresses, setNetworkAddresses] = useState<string[]>([]);

  // 备用地址（如果无法动态获取）
  const fallbackAddresses = [
    '0x8742BF796efE417CF777d04866eD47654F913EB7',
    '0x2cE2Adb7cef953843a9594d94D7A22Fe49e4d151',
    '0x24baD0F00Ee583575A25CDED282C6527c823564C',
    '0xfA940a1b896f08114610731BbC7b0f3d96ceaea6',
    '0x64E8Af94d630CbAfB41cB6B17485EE0042c052c4',
    '0x8968C41bdCb3cf46018EdaD49cae7ba7f3515833',
    '0x127c52dF397D280afc94403F715746849ea2ABcF'
  ];

  // 动态获取网络地址
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!address) return;
      
      try {
        const addresses = await getNetworkAccounts(address, 7);
        setNetworkAddresses(addresses);
      } catch (error) {
        console.error('获取网络地址失败:', error);
        // 使用备用地址
        const filteredFallback = fallbackAddresses
          .filter(addr => addr.toLowerCase() !== address?.toLowerCase())
          .slice(0, 7);
        setNetworkAddresses(filteredFallback);
      }
    };

    fetchAddresses();
  }, [address]);

  // 使用动态获取的地址或备用地址
  const availableAddresses = networkAddresses.length > 0 
    ? networkAddresses 
    : fallbackAddresses.filter(addr => addr.toLowerCase() !== address?.toLowerCase()).slice(0, 7);

  const handleSocialTransfer = async () => {
    if (!to || !amount) return;
    await onSocialTransfer(to, amount, message, isPublic);
    setTo('');
    setAmount('');
    setMessage('');
    setIsPublic(false);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">🌐 Social Transfer</h3>
      <p className="text-sm text-gray-600 mb-4">
        Wallet transfers with messages and public options. All transfers are recorded in the contract for tracking and analytics.
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Recipient Address</label>
          <div className="space-y-2">
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Enter recipient address"
              className="w-full p-3 border rounded-lg"
            />
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500">
                Quick select {networkAddresses.length > 0 ? 'network' : 'test'} addresses:
              </span>
              {availableAddresses.map((addr: string, index: number) => (
                <button
                  key={addr}
                  onClick={() => setTo(addr)}
                  className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
                  title={addr}
                >
                  {networkAddresses.length > 0 ? `Account ${index + 2}` : `User${index + 2}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Transfer Amount (ETH)</label>
          <input
            type="number"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.01"
            className="w-full p-3 border rounded-lg"
          />
          <div className="text-xs text-gray-500 mt-1">
            Wallet Balance: {balance} ETH
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Transfer Message (Max 280 characters)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message..."
            maxLength={280}
            rows={3}
            className="w-full p-3 border rounded-lg resize-none"
          />
          <div className="text-xs text-gray-500 mt-1">
            {message.length}/280 characters
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="isPublic" className="text-sm">
            Public transfer record (visible to other users)
          </label>
        </div>

        <Button
          onClick={handleSocialTransfer}
          disabled={!to || !amount || isLoading}
          className="w-full"
        >
          {isLoading ? 'Processing...' : 'Send Social Transfer'}
        </Button>

        <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
          💡 Uses wallet balance for transfer, contract records transfer info for social features and analytics
        </div>
      </div>
    </Card>
  );
} 