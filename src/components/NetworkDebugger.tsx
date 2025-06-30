'use client';

import { useNetwork } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getContractAddress } from '@/config/contracts';

export default function NetworkDebugger() {
  const { chain } = useNetwork();

  if (!chain) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-sm text-red-800">🔍 网络调试器</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">网络未连接</p>
        </CardContent>
      </Card>
    );
  }

  const votingAddress = getContractAddress(chain.id, 'Voting');
  const bankAddress = getContractAddress(chain.id, 'Bank');
  const tokenAddress = getContractAddress(chain.id, 'TokenFactory');

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-sm text-blue-800">🔍 网络和合约调试器</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">当前网络:</span>
          <Badge variant="outline">
            {chain.name} (ID: {chain.id})
          </Badge>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">合约地址:</h4>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Voting:</span>
              <code className="bg-white px-1 rounded">
                {votingAddress || '未部署'}
              </code>
            </div>
            
            <div className="flex justify-between">
              <span>Bank:</span>
              <code className="bg-white px-1 rounded">
                {bankAddress || '未部署'}
              </code>
            </div>
            
            <div className="flex justify-between">
              <span>TokenFactory:</span>
              <code className="bg-white px-1 rounded">
                {tokenAddress || '未部署'}
              </code>
            </div>
          </div>
        </div>

        <div className="mt-3 p-2 bg-white rounded border">
          <p className="text-xs text-gray-600">
            {chain.id === 1337 
              ? "✅ 连接到Ganache网络，应该使用Ganache合约地址" 
              : chain.id === 31337
              ? "⚠️ 连接到Hardhat网络，合约地址与Ganache不同"
              : "❌ 连接到未知网络"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 