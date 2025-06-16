'use client';

import { useAccount, useNetwork } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AccountDebugger() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();

  if (!isConnected) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-sm text-yellow-800">🔍 账户调试器</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700">钱包未连接</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-sm text-blue-800">🔍 当前连接状态</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">连接状态:</span>
          <Badge variant="outline" className="bg-green-100 text-green-800">
            已连接
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">当前地址:</span>
          <code className="text-xs bg-white px-2 py-1 rounded border">
            {address}
          </code>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">网络:</span>
          <Badge variant="outline">
            {chain?.name || '未知'} (ID: {chain?.id})
          </Badge>
        </div>

        <div className="mt-3 p-2 bg-white rounded border">
          <p className="text-xs text-gray-600">
            ✅ 如果地址显示为 0xFaC01...b712D，说明连接正确
          </p>
          <p className="text-xs text-gray-600">
            ❌ 如果地址显示为 0xf39Fd...92266，说明仍在使用Hardhat账户
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 