import { Metadata } from 'next';
import NetworkAccountsManager from '@/components/NetworkAccountsManager';
import { Network } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Network Manager - Web3 Platform',
  description: 'Manage blockchain networks and accounts',
};

export default function NetworksPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Network className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">network management center</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
          Manage and monitor local blockchain network, view available accounts and network status
          </p>
        </div>

        {/* 网络账户管理组件 */}
        <NetworkAccountsManager />
      </div>
    </div>
  );
} 