'use client';

import { useState, useEffect } from 'react';
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';
import { formatEther } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Network, 
  Wallet, 
  Users, 
  Copy, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface NetworkAccount {
  address: string;
  balance: string;
  index: number;
}

interface NetworkConfig {
  name: string;
  chainId: number;
  url: string;
  description?: string;
  features?: string[];
}

interface NetworkInfo {
  name: string;
  chainId: number;
  url: string;
  status: 'connected' | 'disconnected' | 'error';
  accounts: NetworkAccount[];
  blockNumber?: number;
  description?: string;
  features?: string[];
}

export default function NetworkAccountsManager() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const networks = [
    {
      name: 'Anvil Local (Foundry)',
      chainId: 31337,
      url: 'http://127.0.0.1:8546',
      description: 'Fast persistent blockchain simulator',
      features: ['Persistence', 'Fast', 'Latest']
    },
    {
      name: 'Hardhat Local',
      chainId: 31337,
      url: 'http://127.0.0.1:8545',
      description: 'Local development network with auto-deployment and debugging support',
      features: ['Auto Deploy', 'Gas Simulation', 'Debug Tools', 'Fast Confirmation']
    },
    {
      name: 'Ganache Local',
      chainId: 1337,
      url: 'http://127.0.0.1:7545',
      description: 'Graphical local blockchain network for easy account management',
      features: ['GUI', 'Easy Management']
    }
  ];

  // 检查网络状态和获取账户
  const checkNetworkAccounts = async () => {
    setLoading(true);
    const results: NetworkInfo[] = [];

    for (const network of networks) {
      try {
        // 使用fetch检查网络连接
        const response = await fetch(network.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_accounts',
            params: [],
            id: 1,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const accounts = data.result || [];
          
          // 获取区块号
          const blockResponse = await fetch(network.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_blockNumber',
              params: [],
              id: 2,
            }),
          });
          
          const blockData = await blockResponse.json();
          const blockNumber = parseInt(blockData.result, 16);

          // 获取每个账户的余额
          const accountsWithBalance = await Promise.all(
            accounts.map(async (account: string, index: number) => {
              try {
                const balanceResponse = await fetch(network.url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getBalance',
                    params: [account, 'latest'],
                    id: 3 + index,
                  }),
                });
                
                const balanceData = await balanceResponse.json();
                const balanceWei = balanceData.result;
                const balanceEth = formatEther(BigInt(balanceWei));
                
                return {
                  address: account,
                  balance: balanceEth,
                  index,
                };
              } catch (error) {
                return {
                  address: account,
                  balance: '0',
                  index,
                };
              }
            })
          );

          results.push({
            name: network.name,
            chainId: network.chainId,
            url: network.url,
            status: 'connected',
            accounts: accountsWithBalance,
            blockNumber,
            description: network.description,
            features: network.features,
          });
        } else {
          results.push({
            name: network.name,
            chainId: network.chainId,
            url: network.url,
            status: 'disconnected',
            accounts: [],
            description: network.description,
            features: network.features,
          });
        }
      } catch (error) {
        results.push({
          name: network.name,
          chainId: network.chainId,
          url: network.url,
          status: 'error',
          accounts: [],
          description: network.description,
          features: network.features,
        });
      }
    }

    setNetworkInfo(results);
    setLoading(false);
  };

  useEffect(() => {
    checkNetworkAccounts();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      case 'error':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* 当前钱包状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Current wallet status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection status:</span>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            
            {isConnected && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current address:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(address || '')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">current network:</span>
                  <Badge variant="outline">
                    {chain?.name || 'Unknown network'} (ID: {chain?.id})
                  </Badge>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 网络账户管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Network account management
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkNetworkAccounts}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {networkInfo.map((network, index) => (
              <div key={network.chainId} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(network.status)}
                    <div>
                      <h3 className="font-medium">{network.name}</h3>
                      <p className="text-sm text-gray-500">
                        Chain ID: {network.chainId} | {network.url}
                      </p>
                      {network.description && (
                        <p className="text-xs text-gray-600 mt-1">
                          {network.description}
                        </p>
                      )}
                      {network.features && (
                        <div className="flex gap-1 mt-1">
                          {network.features.map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs px-2 py-0">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {network.blockNumber && (
                        <p className="text-xs text-gray-400 mt-1">
                          Latest block: #{network.blockNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(network.status)}>
                      {network.status === 'connected' ? 'Connected' : 
                       network.status === 'disconnected' ? 'Disconnected' : 'Error'}
                    </Badge>
                    
                    {switchNetwork && network.status === 'connected' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => switchNetwork?.(network.chainId)}
                        disabled={chain?.id === network.chainId}
                      >
                        {chain?.id === network.chainId ? 'Current network' : 'Switch'}
                      </Button>
                    )}
                  </div>
                </div>

                {network.status === 'connected' && network.accounts.length > 0 && (
                  <div className="ml-7 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Users className="h-4 w-4" />
                      Available accounts ({network.accounts.length})
                    </div>
                    
                    <div className="space-y-2">
                      {network.accounts.slice(0, 5).map((account) => (
                        <div 
                          key={account.address}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-xs">
                              #{account.index}
                            </Badge>
                            <div>
                              <p className="font-mono text-sm">
                                {account.address.slice(0, 10)}...{account.address.slice(-8)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Balance: {parseFloat(account.balance).toFixed(4)} ETH
                              </p>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(account.address)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      
                      {network.accounts.length > 5 && (
                        <p className="text-xs text-gray-500 text-center">
                          There are {network.accounts.length - 5} more accounts...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {network.status === 'disconnected' && (
                  <div className="ml-7 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600">
                      Network is not connected. Please ensure the corresponding blockchain network is started on port {network.url.split(':')[2]}.
                    </p>
                  </div>
                )}

                {index < networkInfo.length - 1 && <Separator />}
              </div>
            ))}
          </div>

          {/* 快速启动指令 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Quick start instructions:</h4>
            <div className="space-y-1 text-sm text-blue-700">
              <p>• <strong>Anvil (推荐)</strong>: <code className="bg-blue-100 px-1 rounded">node scripts/start-networks.js anvil --persistent</code></p>
              <p>• Hardhat: <code className="bg-blue-100 px-1 rounded">npm run node</code></p>
              <p>• Ganache: <code className="bg-blue-100 px-1 rounded">ganache-cli --port 7545 --networkId 1337</code></p>
            </div>
            <div className="mt-3 pt-2 border-t border-blue-200">
              <p className="text-xs text-blue-600">
                💡 使用 <code className="bg-blue-100 px-1 rounded">node scripts/utilities/anvil-debugger.js</code> 调试Anvil网络
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 