import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Plus, Minus, Users, Wallet, ArrowRight, Info, CreditCard, AlertCircle } from 'lucide-react';
import { parseEther, isAddress } from 'viem';
import { useAccount, useBalance, useSendTransaction } from 'wagmi';
import { toast } from 'react-hot-toast';

interface TransferTabProps {
  bankBalance: string;
  onTransferInternal: (to: string, amount: string) => Promise<void>;
  onTransferExternal: (to: string, amount: string) => Promise<void>;
  onBatchTransfer: (recipients: string[], amounts: string[], internal: boolean) => Promise<void>;
  onUserToUserTransfer: (to: string, amount: string) => Promise<void>;
  onBatchUserTransfer: (recipients: string[], amounts: string[]) => Promise<void>;
  isTransferring: boolean;
}

interface Recipient {
  address: string;
  amount: string;
}

// 常用的Ganache测试地址 (前10个账户)
const COMMON_TEST_ADDRESSES = [
  '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
  '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
  '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
  '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
  '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
  '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
  '0xBcd4042DE499D14e55001CcbB24a551F3b954096',
  '0x71bE63f3384f5fb98995898A86B02Fb2426c5788',
  '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a'
];

export const TransferTab: React.FC<TransferTabProps> = ({
  bankBalance,
  onTransferInternal,
  onTransferExternal,
  onBatchTransfer,
  onUserToUserTransfer,
  onBatchUserTransfer,
  isTransferring,
}) => {
  const { address } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const [transferType, setTransferType] = useState<'quick' | 'contract' | 'bank' | 'batch'>('quick');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([{ address: '', amount: '' }]);
  const [batchFromBank, setBatchFromBank] = useState(false);
  const [isWalletTransferring, setIsWalletTransferring] = useState(false);

  const { sendTransaction } = useSendTransaction();

  const validateAddress = (address: string) => {
    return isAddress(address);
  };

  // Quick Wallet Transfer (Main Feature)
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
      
      // Clear form on success
      setRecipient('');
      setAmount('');
    } catch (error: any) {
      console.error('Wallet transfer failed:', error);
      toast.error('Transfer failed: ' + (error.shortMessage || error.message || 'Unknown error'));
    } finally {
      setIsWalletTransferring(false);
    }
  };

  // Contract Transfer (Wallet transfer recorded through contract)
  const handleContractTransfer = async () => {
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

    // 使用合约用户到用户转账功能
    await onUserToUserTransfer(recipient, amount);

    // Clear form on success
    setRecipient('');
    setAmount('');
  };

  // Bank Transfer (Special Feature)
  const handleBankTransfer = async () => {
    if (!validateAddress(recipient)) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid transfer amount');
      return;
    }

    if (parseFloat(amount) > parseFloat(bankBalance)) {
      toast.error('Insufficient bank account balance');
      return;
    }

    // 使用外部转账功能从银行账户转出
    await onTransferExternal(recipient, amount);

    // Clear form on success
    setRecipient('');
    setAmount('');
  };

  // Batch Transfer
  const handleBatchTransferSubmit = async () => {
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

    const totalAmount = validRecipients.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    
    if (batchFromBank) {
      if (totalAmount > parseFloat(bankBalance)) {
        toast.error('Total amount exceeds bank account balance');
        return;
      }
      
      const addresses = validRecipients.map(r => r.address);
      const amounts = validRecipients.map(r => r.amount);
      await onBatchTransfer(addresses, amounts, false); // Use external transfer
    } else {
      if (!ethBalance || totalAmount > parseFloat(ethBalance.formatted)) {
        toast.error('Total amount exceeds wallet balance');
        return;
      }
      
      // Execute multiple wallet transfers
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

    // Clear form on success
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

  const getTotalBatchAmount = () => {
    return recipients.reduce((sum, r) => {
      const amount = parseFloat(r.amount) || 0;
      return sum + amount;
    }, 0);
  };

  const setQuickAddress = (addr: string) => {
    setRecipient(addr);
  };

  return (
    <div className="space-y-6">
      {/* Transfer Type Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fund Transfer</h3>
        
        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
            <div className="text-sm">
                             <p className="font-medium text-yellow-800 mb-1">💡 Real-world Usage Guide</p>
               <p className="text-yellow-700">
                 • <strong>Quick Transfer</strong>: Most common feature, direct wallet transfer to anyone<br/>
                 • <strong>Contract Transfer</strong>: User-to-user transfer with on-chain records for tracking<br/>
                 • <strong>Bank Transfer</strong>: Transfer from bank account, suitable for users with deposits<br/>
                 • <strong>Batch Transfer</strong>: Send to multiple addresses at once, perfect for payroll scenarios
               </p>
            </div>
          </div>
        </div>

                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              transferType === 'quick'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setTransferType('quick')}
          >
            <div className="flex items-center mb-2">
              <Wallet className="h-5 w-5 mr-2 text-blue-600" />
              <span className="font-medium">Quick Transfer</span>
            </div>
            <p className="text-sm text-gray-600">
              Direct wallet transfer, most common method, no bank account needed
            </p>
                      </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                transferType === 'contract'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setTransferType('contract')}
            >
              <div className="flex items-center mb-2">
                <ArrowRight className="h-5 w-5 mr-2 text-orange-600" />
                <span className="font-medium">Contract Transfer</span>
              </div>
              <p className="text-sm text-gray-600">
                Transfer recorded through contract, trackable, uses wallet balance
              </p>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                transferType === 'bank'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setTransferType('bank')}
            >
              <div className="flex items-center mb-2">
                <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                <span className="font-medium">Bank Transfer</span>
              </div>
              <p className="text-sm text-gray-600">
                Transfer from bank account, calculates interest first, for bank users
              </p>
            </div>

          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              transferType === 'batch'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setTransferType('batch')}
          >
            <div className="flex items-center mb-2">
              <Send className="h-5 w-5 mr-2 text-purple-600" />
              <span className="font-medium">Batch Transfer</span>
            </div>
            <p className="text-sm text-gray-600">
              Send to multiple recipients, choose wallet or bank account as source
            </p>
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

        {/* Quick Transfer Form */}
        {transferType === 'quick' && (
          <div className="space-y-4">
            {/* Quick Address Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Select Test Address (Ganache Network)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                {COMMON_TEST_ADDRESSES.slice(0, 10).map((addr, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuickAddress(addr)}
                    className="text-xs p-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                    disabled={addr.toLowerCase() === address?.toLowerCase()}
                  >
                    {addr.toLowerCase() === address?.toLowerCase() ? 'Current Account' : `Account ${idx + 1}`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0x... or select from above"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              {recipient && !validateAddress(recipient) && (
                <p className="text-sm text-red-600 mt-1">Invalid Ethereum address</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Amount (ETH)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div className="absolute right-2 top-2 flex space-x-1">
                  <button
                    type="button"
                    onClick={() => setAmount('0.1')}
                    className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    0.1
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount('1.0')}
                    className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    1.0
                  </button>
                </div>
              </div>
            </div>

            <Button
              onClick={handleQuickTransfer}
              disabled={
                isWalletTransferring ||
                !recipient ||
                !amount ||
                !validateAddress(recipient) ||
                parseFloat(amount) <= 0
              }
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isWalletTransferring ? (
                'Transferring...'
              ) : (
                <span className="flex items-center">
                  <Send className="h-4 w-4 mr-2" />
                  Quick Transfer
                </span>
              )}
            </Button>

            {/* Quick Transfer Description */}
            <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
              <div className="flex items-start">
                <Info className="h-4 w-4 mr-2 mt-0.5 text-blue-600" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Quick Transfer Info:</p>
                  <p className="text-blue-700">
                    • Direct wallet transfer, no prior deposit needed<br/>
                    • Perfect for daily transfer use<br/>
                    • Standard ETH transfer, any wallet can receive
                  </p>
                </div>
              </div>
            </div>
          </div>
                 )}

         {/* 合约转账表单 */}
         {transferType === 'contract' && (
           <div className="space-y-4">
             {/* 快速地址选择 */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Quick Select Test Address (Ganache Network)
               </label>
               <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                 {COMMON_TEST_ADDRESSES.slice(0, 10).map((addr, idx) => (
                   <button
                     key={idx}
                     onClick={() => setQuickAddress(addr)}
                     className="text-xs p-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                     disabled={addr.toLowerCase() === address?.toLowerCase()}
                   >
                     {addr.toLowerCase() === address?.toLowerCase() ? 'Current Account' : `Account ${idx + 1}`}
                   </button>
                 ))}
               </div>
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Receiving Address
               </label>
               <input
                 type="text"
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                 placeholder="0x... or select from above"
                 value={recipient}
                 onChange={(e) => setRecipient(e.target.value)}
               />
               {recipient && !validateAddress(recipient) && (
                 <p className="text-sm text-red-600 mt-1">Invalid Ethereum address</p>
               )}
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Transfer Amount (ETH)
               </label>
               <div className="relative">
                 <input
                   type="number"
                   step="0.001"
                   min="0"
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                   placeholder="0.0"
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                 />
                 <div className="absolute right-2 top-2 flex space-x-1">
                   <button
                     type="button"
                     onClick={() => setAmount('0.1')}
                     className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                   >
                     0.1
                   </button>
                   <button
                     type="button"
                     onClick={() => setAmount('1.0')}
                     className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                   >
                     1.0
                   </button>
                 </div>
               </div>
             </div>

             <Button
               onClick={handleContractTransfer}
               disabled={
                 isTransferring ||
                 !recipient ||
                 !amount ||
                 !validateAddress(recipient) ||
                 parseFloat(amount) <= 0
               }
               className="w-full bg-orange-600 hover:bg-orange-700"
             >
               {isTransferring ? (
                 'Transferring...'
               ) : (
                 <span className="flex items-center">
                   <Send className="h-4 w-4 mr-2" />
                   contract transfer
                 </span>
               )}
             </Button>

             {/* 合约转账说明 */}
             <div className="p-3 rounded-lg border bg-orange-50 border-orange-200">
               <div className="flex items-start">
                 <Info className="h-4 w-4 mr-2 mt-0.5 text-orange-600" />
                 <div className="text-sm">
                   <p className="font-medium text-orange-800">Contract Transfer Instructions:</p>
                   <p className="text-orange-700">
                     • Using wallet balance, executed by contract<br/>
                     • All transfers are traceable with on-chain records<br/>
                     • Facilitates statistics and management of transfer history
                   </p>
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* 银行转账表单 */}
         {transferType === 'bank' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receiving address
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              {recipient && !validateAddress(recipient) && (
                <p className="text-sm text-red-600 mt-1">Invalid Ethereum address</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Amount (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <Button
              onClick={handleBankTransfer}
              disabled={
                isTransferring ||
                !recipient ||
                !amount ||
                !validateAddress(recipient) ||
                parseFloat(amount) <= 0 ||
                parseFloat(bankBalance) === 0
              }
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isTransferring ? (
                'Transferring...'
              ) : (
                <span className="flex items-center">
                  <Send className="h-4 w-4 mr-2" />
                  bank transfer
                </span>
              )}
            </Button>

            {parseFloat(bankBalance) === 0 && (
              <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
                <p className="text-sm text-yellow-700">
                  ⚠️ Your bank account balance is 0, please deposit first before using the bank transfer function
                </p>
              </div>
            )}

            {/* 银行转账说明 */}
            <div className="p-3 rounded-lg border bg-green-50 border-green-200">
              <div className="flex items-start">
                <Info className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                <div className="text-sm">
                  <p className="font-medium text-green-800">Bank Transfer Instructions:</p>
                  <p className="text-green-700">
                    • Transfer from bank account balance<br/>
                    • Interest will be calculated and added before transfer<br/>
                    • Receivers do not need to have a bank account
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 批量转账表单 */}
        {transferType === 'batch' && (
          <div className="space-y-4">
            {/* 批量来源选择 */}
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-sm font-medium text-gray-700">Transfer Source:</span>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!batchFromBank}
                  onChange={() => setBatchFromBank(false)}
                  className="mr-2"
                />
                <span className="text-sm">Wallet</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={batchFromBank}
                  onChange={() => setBatchFromBank(true)}
                  className="mr-2"
                />
                <span className="text-sm">Bank Account</span>
              </label>
            </div>

            {/* 接收者列表 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Recipient List</label>
                <span className="text-xs text-gray-500">Max 50 recipients</span>
              </div>
              
              {recipients.map((recipient, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="Recipient Address (0x...)"
                      value={recipient.address}
                      onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="Amount"
                      value={recipient.amount}
                      onChange={(e) => updateRecipient(index, 'amount', e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRecipient(index)}
                    disabled={recipients.length === 1}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addRecipient}
                disabled={recipients.length >= 50}
                className="w-full border-dashed border-gray-300 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Recipient ({recipients.length}/50)
              </Button>
            </div>

            {/* 批量转账汇总 */}
            {recipients.some(r => r.amount && parseFloat(r.amount) > 0) && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-800">Batch Transfer Summary</span>
                  <span className="text-lg font-bold text-purple-900">
                    {getTotalBatchAmount().toFixed(4)} ETH
                  </span>
                </div>
                <div className="text-sm text-purple-700">
                  <p>Receivers: {recipients.filter(r => r.address && r.amount).length}</p>
                  <p>Source: {batchFromBank ? 'Bank Account' : 'Wallet'}</p>
                  <p>Available Balance: {batchFromBank ? `${bankBalance} ETH` : `${ethBalance ? ethBalance.formatted : '0'} ETH`}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleBatchTransferSubmit}
              disabled={
                (batchFromBank ? isTransferring : isWalletTransferring) ||
                recipients.filter(r => r.address && r.amount && parseFloat(r.amount) > 0).length === 0
              }
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {(batchFromBank ? isTransferring : isWalletTransferring) ? (
                'Transferring...'
              ) : (
                <span className="flex items-center">
                  <Send className="h-4 w-4 mr-2" />
                  Execute Batch Transfer ({getTotalBatchAmount().toFixed(4)} ETH)
                </span>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}; 