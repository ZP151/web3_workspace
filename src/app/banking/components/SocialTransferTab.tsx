'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

  const ganacheTestAddresses = [
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc'
  ];

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
              <span className="text-xs text-gray-500">Quick select Ganache test addresses:</span>
              {ganacheTestAddresses.map((addr, index) => (
                <button
                  key={addr}
                  onClick={() => setTo(addr)}
                  className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
                >
                  User{index + 2}
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