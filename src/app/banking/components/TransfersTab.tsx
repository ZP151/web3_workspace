'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, Heart, Wallet, ArrowRight, CreditCard, Users, Plus, Minus, AlertCircle } from 'lucide-react';
import { parseEther, isAddress } from 'viem';
import { useBalance, useSendTransaction, useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';
import { getNetworkAccounts } from '@/utils/web3';

interface TransfersTabProps {
  address?: string;
  bankBalance?: string;
  onTransferInternal: (to: string, amount: string) => Promise<void>;
  onTransferExternal: (to: string, amount: string) => Promise<void>;
  onBatchTransfer: (recipients: string[], amounts: string[], internal: boolean) => Promise<void>;
  onUserToUserTransfer: (to: string, amount: string) => Promise<void>;
  isTransferring: boolean;
}

interface Recipient {
  address: string;
  amount: string;
}

// 使用用户当前实际的Ganache测试地址
const GANACHE_DEFAULT_ADDRESSES = [
  '0x8742BF796efE417CF777d04866eD47654F913EB7',
  '0x2cE2Adb7cef953843a9594d94D7A22Fe49e4d151',
  '0x24baD0F00Ee583575A25CDED282C6527c823564C',
  '0xfA940a1b896f08114610731BbC7b0f3d96ceaea6',
  '0x64E8Af94d630CbAfB41cB6B17485EE0042c052c4',
  '0x8968C41bdCb3cf46018EdaD49cae7ba7f3515833',
  '0x127c52dF397D280afc94403F715746849ea2ABcF'
];

export default function TransfersTab({
  address: addrProp,
  bankBalance = '0',
  onTransferInternal,
  onTransferExternal,
  onBatchTransfer,
  onUserToUserTransfer,
  isTransferring
}: TransfersTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('quick');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([{ address: '', amount: '' }]);
  const [batchFromBank, setBatchFromBank] = useState(false);
  const [isWalletTransferring, setIsWalletTransferring] = useState(false);
  const [networkAddresses, setNetworkAddresses] = useState<string[]>([]);

  const { address } = useAccount();
  const userAddress = addrProp || address;
  const { data: ethBalance } = useBalance({ address: userAddress as `0x${string}` });
  const { sendTransaction } = useSendTransaction();

  // 动态获取网络中的其他账户
  useEffect(() => {
    const fetchNetworkAddresses = async () => {
      if (!userAddress) return;
      
      try {
        const addresses = await getNetworkAccounts(userAddress, 9);
        setNetworkAddresses(addresses);
      } catch (error) {
        console.error('获取网络地址失败:', error);
        // 使用备用地址
        const fallbackAddresses = GANACHE_DEFAULT_ADDRESSES
          .filter(addr => addr.toLowerCase() !== userAddress?.toLowerCase())
          .slice(0, 9);
        setNetworkAddresses(fallbackAddresses);
      }
    };

    fetchNetworkAddresses();
  }, [userAddress]);

  const subTabs = [
    { id: 'quick', name: 'Quick Transfer', icon: Wallet, desc: 'Direct wallet transfer' },
    { id: 'contract', name: 'Contract Transfer', icon: ArrowRight, desc: 'Recorded transfer' },
    { id: 'bank', name: 'Bank Transfer', icon: CreditCard, desc: 'From bank account' },
    { id: 'batch', name: 'Batch Transfer', icon: Users, desc: 'Multiple recipients' },
    { id: 'social', name: 'Social Transfer', icon: Heart, desc: 'With message' },
  ];

  const validateAddress = (addr: string) => isAddress(addr);

  const getTotalBatchAmount = () => {
    return recipients.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  };

  // Quick Transfer (Direct wallet transfer)
  const handleQuickTransfer = async () => {
    if (!validateAddress(recipient)) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid transfer amount');
      return;
    }

    if (!ethBalance || parseFloat(amount) > parseFloat(ethBalance.formatted)) {
      toast.error('Insufficient wallet balance');
      return;
    }

    try {
      setIsWalletTransferring(true);
      
      await sendTransaction({
        to: recipient as `0x${string}`,
        value: parseEther(amount),
      });

      toast.success(`Transfer successful! Sent ${amount} ETH to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`);
      resetForm();
    } catch (error: any) {
      console.error('Wallet transfer failed:', error);
      toast.error('Transfer failed: ' + (error.shortMessage || error.message || 'Unknown error'));
    } finally {
      setIsWalletTransferring(false);
    }
  };

  // Contract Transfer (Recorded transfer)
  const handleContractTransfer = async () => {
    if (!validateAddress(recipient) || !amount) return;
    await onUserToUserTransfer(recipient, amount);
    resetForm();
  };

  // Bank Transfer
  const handleBankTransfer = async () => {
    if (!validateAddress(recipient) || !amount) return;
    await onTransferExternal(recipient, amount);
    resetForm();
  };

  // Social Transfer (This feature might need to be adjusted as onSocialTransfer is removed)
  // For now, let's disable it or wire it to another transfer type
  const handleSocialTransfer = async () => {
    toast.error("社交转账功能正在调整中。");
    // Original: await onSocialTransfer(recipient, amount, message, isPublic);
    // resetForm();
  };

  // Batch Transfer
  const handleBatchTransfer = async () => {
    const validRecipients = recipients.filter(r => r.address && r.amount && parseFloat(r.amount) > 0);
    
    if (validRecipients.length === 0) {
      toast.error('Please add at least one valid recipient');
      return;
    }

    // Validate all addresses
    for (const r of validRecipients) {
      if (!validateAddress(r.address)) {
        toast.error(`Invalid address: ${r.address}`);
        return;
      }
    }

    const totalAmount = getTotalBatchAmount();
    
    if (batchFromBank) {
      // 注意: bankBalance 现在不可用，需要调整逻辑
      // 暂时移除检查
      const addresses = validRecipients.map(r => r.address);
      const amounts = validRecipients.map(r => r.amount);
      await onBatchTransfer(addresses, amounts, false); // Assuming 'false' means from bank
    } else {
      if (!ethBalance || totalAmount > parseFloat(ethBalance.formatted)) {
        toast.error('Total amount exceeds wallet balance');
        return;
      }
      
      try {
        setIsWalletTransferring(true);
        for (const r of validRecipients) {
          await sendTransaction({
            to: r.address as `0x${string}`,
            value: parseEther(r.amount),
          });
        }
        toast.success(`Batch transfer successful! Sent total ${totalAmount.toFixed(4)} ETH to ${validRecipients.length} addresses`);
      } catch (error: any) {
        console.error('Batch wallet transfer failed:', error);
        toast.error('Batch transfer failed: ' + (error.shortMessage || error.message || 'Unknown error'));
      } finally {
        setIsWalletTransferring(false);
      }
    }
    resetBatchForm();
  };

  const resetForm = () => {
    setRecipient('');
    setAmount('');
    setMessage('');
    setIsPublic(false);
  };

  const resetBatchForm = () => {
    setRecipients([{ address: '', amount: '' }]);
  };

  const addRecipient = () => {
    if (recipients.length < 50) {
      setRecipients([...recipients, { address: '', amount: '' }]);
    }
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (index: number, field: keyof Recipient, value: string) => {
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipients(updated);
  };

  const availableAddresses = networkAddresses.length > 0 ? networkAddresses : 
    GANACHE_DEFAULT_ADDRESSES.filter((addr: string) => 
      addr.toLowerCase() !== userAddress?.toLowerCase()
    ).slice(0, 9);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">💸 Transfer Hub</h3>
      
      {/* Important Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800 mb-1">💡 Transfer Methods Guide</p>
            <p className="text-yellow-700">
              • <strong>Quick</strong>: Direct wallet transfer (most common)<br/>
              • <strong>Contract</strong>: Recorded transfer with tracking<br/>
              • <strong>Bank</strong>: Transfer from your bank deposit<br/>
              • <strong>Batch</strong>: Multiple recipients at once<br/>
              • <strong>Social</strong>: Add messages to transfers
            </p>
          </div>
        </div>
      </div>

      {/* Balance Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-600">Wallet Balance:</span>
            <span className="text-lg font-bold text-blue-900">
              {ethBalance ? `${parseFloat(ethBalance.formatted).toFixed(6)} ETH` : '0 ETH'}
            </span>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-600">Bank Balance:</span>
            <span className="text-lg font-bold text-green-900">{bankBalance} ETH</span>
          </div>
        </div>
      </div>
      
      {/* Sub Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`${
              activeSubTab === tab.id
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            } flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all whitespace-nowrap`}
          >
            <tab.icon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{tab.name}</span>
            <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Transfer Forms */}
      {(activeSubTab === 'quick' || activeSubTab === 'contract' || activeSubTab === 'bank' || activeSubTab === 'social') && (
        <div className="space-y-4">
          {/* Quick Address Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Quick Select Address ({networkAddresses.length > 0 ? 'Network Accounts' : 'Test Accounts'})
            </label>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                {availableAddresses.slice(0, 9).map((addr: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setRecipient(addr)}
                    className="text-xs p-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                    title={addr}
                  >
                    {networkAddresses.length > 0 ? `Account ${idx + 2}` : `Test ${idx + 1}`}
                  </button>
                ))}
              </div>
              {availableAddresses.length > 0 && (
                <div className="text-xs text-gray-500 mb-2">
                  Found {availableAddresses.length} available addresses from {networkAddresses.length > 0 ? 'current network' : 'default test addresses'}
                </div>
              )}
          </div>

          {/* Recipient Address */}
          <div>
            <label className="block text-sm font-medium mb-2">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="w-full p-3 border rounded-lg"
            />
            {recipient && !validateAddress(recipient) && (
              <p className="text-sm text-red-600 mt-1">Invalid Ethereum address</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">Amount (ETH)</label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.1"
                className="w-full p-3 border rounded-lg pr-24"
              />
              <div className="absolute right-2 top-2 flex space-x-1">
                <button
                  onClick={() => setAmount('0.1')}
                  className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  0.1
                </button>
                <button
                  onClick={() => setAmount('1.0')}
                  className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  1.0
                </button>
              </div>
            </div>
          </div>

          {/* Social Transfer Features */}
          {activeSubTab === 'social' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Message (Optional, max 280 chars)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 280))}
                  placeholder="Add a message to your transfer..."
                  className="w-full p-3 border rounded-lg h-20 resize-none"
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
                  Make this transfer public (visible in community feed)
                </label>
              </div>
            </>
          )}

          <Button
            onClick={() => {
              if (activeSubTab === 'quick') handleQuickTransfer();
              else if (activeSubTab === 'contract') handleContractTransfer();
              else if (activeSubTab === 'bank') handleBankTransfer();
              else if (activeSubTab === 'social') handleSocialTransfer();
            }}
            disabled={!recipient || !amount || isTransferring || isWalletTransferring}
            className="w-full"
          >
            {isTransferring || isWalletTransferring ? 'Processing...' : `Send ${activeSubTab === 'social' ? 'Social' : activeSubTab === 'bank' ? 'Bank' : activeSubTab === 'contract' ? 'Contract' : 'Quick'} Transfer`}
          </Button>
        </div>
      )}

      {/* Batch Transfer Form */}
      {activeSubTab === 'batch' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-4 mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="batchSource"
                checked={!batchFromBank}
                onChange={() => setBatchFromBank(false)}
              />
              <span className="text-sm">From Wallet</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="batchSource"
                checked={batchFromBank}
                onChange={() => setBatchFromBank(true)}
              />
              <span className="text-sm">From Bank Account</span>
            </label>
          </div>

          {recipients.map((recipient, index) => (
            <div key={index} className="flex space-x-2 items-end">
              <div className="flex-1">
                {index === 0 && <label className="block text-sm font-medium mb-2">Recipient Address</label>}
                <input
                  type="text"
                  value={recipient.address}
                  onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                  placeholder="0x..."
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div className="w-32">
                {index === 0 && <label className="block text-sm font-medium mb-2">Amount (ETH)</label>}
                <input
                  type="number"
                  step="0.001"
                  value={recipient.amount}
                  onChange={(e) => updateRecipient(index, 'amount', e.target.value)}
                  placeholder="0.1"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div className="flex space-x-1">
                {index === recipients.length - 1 && recipients.length < 50 && (
                  <Button size="sm" onClick={addRecipient} className="p-3">
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
                {recipients.length > 1 && (
                  <Button size="sm" variant="outline" onClick={() => removeRecipient(index)} className="p-3">
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span>Total Recipients:</span>
              <span className="font-medium">{recipients.filter(r => r.address && r.amount).length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Amount:</span>
              <span className="font-medium">{getTotalBatchAmount().toFixed(4)} ETH</span>
            </div>
          </div>

          <Button
            onClick={handleBatchTransfer}
            disabled={recipients.filter(r => r.address && r.amount).length === 0 || isTransferring || isWalletTransferring}
            className="w-full"
          >
            {isTransferring || isWalletTransferring ? 'Processing...' : 'Send Batch Transfer'}
          </Button>
        </div>
      )}

      {/* Transfer Type Explanations */}
      <div className="mt-6 space-y-3">
        {activeSubTab === 'quick' && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-800 mb-2">💫 Quick Transfer</h5>
            <p className="text-sm text-blue-700">
              Most common transfer method. Direct wallet-to-wallet ETH transfer with immediate settlement.
            </p>
          </div>
        )}

        {activeSubTab === 'contract' && (
          <div className="p-4 bg-orange-50 rounded-lg">
            <h5 className="font-medium text-orange-800 mb-2">📝 Contract Transfer</h5>
            <p className="text-sm text-orange-700">
              Transfer recorded through smart contract for enhanced tracking and analytics. Uses wallet balance.
            </p>
          </div>
        )}

        {activeSubTab === 'bank' && (
          <div className="p-4 bg-green-50 rounded-lg">
            <h5 className="font-medium text-green-800 mb-2">🏦 Bank Transfer</h5>
            <p className="text-sm text-green-700">
              Transfer from your bank deposit account. Interest is calculated and added before transfer.
            </p>
          </div>
        )}

        {activeSubTab === 'batch' && (
          <div className="p-4 bg-purple-50 rounded-lg">
            <h5 className="font-medium text-purple-800 mb-2">👥 Batch Transfer</h5>
            <p className="text-sm text-purple-700">
              Send to multiple recipients simultaneously. Perfect for payroll, airdrops, or group payments.
            </p>
          </div>
        )}

        {activeSubTab === 'social' && (
          <div className="p-4 bg-pink-50 rounded-lg">
            <h5 className="font-medium text-pink-800 mb-2">💝 Social Transfer</h5>
            <p className="text-sm text-pink-700">
              Add personal messages to transfers. Public transfers appear in community feed for social interaction.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
} 