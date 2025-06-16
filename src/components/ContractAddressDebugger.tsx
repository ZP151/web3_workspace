'use client';

import { useNetwork } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getContractAddress } from '@/config/contracts';
import { useEffect, useState } from 'react';

export default function ContractAddressDebugger() {
  const { chain } = useNetwork();
  const [addresses, setAddresses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (chain?.id) {
      const votingAddr = getContractAddress(chain.id, 'VotingCore');
      const bankAddr = getContractAddress(chain.id, 'SimpleBank');
      const tokenAddr = getContractAddress(chain.id, 'TokenFactory');
      
      setAddresses({
        VotingCore: votingAddr || '',
        SimpleBank: bankAddr || '',
        TokenFactory: tokenAddr || ''
      });
      
      console.log('🔍 合约地址调试信息:', {
        chainId: chain.id,
        chainName: chain.name,
        addresses: {
          VotingCore: votingAddr,
          SimpleBank: bankAddr,
          TokenFactory: tokenAddr
        }
      });
    }
  }, [chain?.id]);

  if (!chain) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-sm text-yellow-800">🔍 合约地址调试器</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700">网络未连接</p>
        </CardContent>
      </Card>
    );
  }

  const isGanache = chain.id === 1337;
  const expectedAddresses = {
    VotingCore: '0x63720931a4Fd34b9179D856abA9E8098949e3Ff1',
    SimpleBank: '0x1060970f9F0C4231316D016fE5cF47d9aEa2f8ce',
    TokenFactory: '0xe1275d4Ac5a1c1AcE9a0410474ca15Ef32B06299'
  };

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="text-sm text-purple-800">🔍 实时合约地址监控</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">网络:</span>
          <span className="text-sm font-mono">
            {chain.name} (ID: {chain.id})
          </span>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">当前使用的合约地址:</h4>
          
          {Object.entries(addresses).map(([name, address]) => {
            const expected = expectedAddresses[name as keyof typeof expectedAddresses];
            const isCorrect = isGanache ? address === expected : true;
            
            return (
              <div key={name} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">{name}:</span>
                  <span className={`text-xs px-1 rounded ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {isCorrect ? '✅' : '❌'}
                  </span>
                </div>
                <div className="text-xs font-mono bg-white p-1 rounded border">
                  {address || '未部署'}
                </div>
                {isGanache && !isCorrect && (
                  <div className="text-xs text-red-600">
                    期望: {expected}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 p-2 bg-white rounded border">
          <p className="text-xs text-gray-600">
            {isGanache 
              ? (Object.values(addresses).every((addr, i) => addr === Object.values(expectedAddresses)[i])
                  ? "✅ 所有地址正确，使用Ganache合约"
                  : "❌ 地址不匹配，可能仍在使用Hardhat地址")
              : "ℹ️ 当前不在Ganache网络"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 