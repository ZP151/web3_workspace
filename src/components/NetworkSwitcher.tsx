'use client';

import React, { useState, useEffect } from 'react';
import { useNetwork, useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import { 
  NETWORK_CONFIG, 
  switchToNetwork, 
  checkLocalNetworkConnection, 
  getRecommendedLocalNetwork,
  CHAIN_IDS 
} from '@/lib/wagmi';
import { 
  Wifi, 
  WifiOff, 
  ChevronDown, 
  Zap, 
  Globe, 
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface NetworkStatus {
  connected: boolean;
  checking: boolean;
  lastChecked: number;
}

const NetworkSwitcher = () => {
  const { chain } = useNetwork();
  const { isConnected } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<Record<number, NetworkStatus>>({});
  
  // 检查本地网络状态
  const checkNetworkStatus = async (chainId: number) => {
    setNetworkStatus(prev => ({
      ...prev,
      [chainId]: { ...prev[chainId], checking: true }
    }));

    const isConnected = await checkLocalNetworkConnection(chainId);
    
    setNetworkStatus(prev => ({
      ...prev,
      [chainId]: {
        connected: isConnected,
        checking: false,
        lastChecked: Date.now()
      }
    }));

    return isConnected;
  };

  // 初始化时检查本地网络状态
  useEffect(() => {
    const initNetworkStatus = async () => {
      await checkNetworkStatus(CHAIN_IDS.HARDHAT);
      await checkNetworkStatus(CHAIN_IDS.GANACHE);
    };

    initNetworkStatus();

    // 定期检查网络状态
    const interval = setInterval(() => {
      checkNetworkStatus(CHAIN_IDS.HARDHAT);
      checkNetworkStatus(CHAIN_IDS.GANACHE);
    }, 30000); // 每30秒检查一次

    return () => clearInterval(interval);
  }, []);

  // 推荐网络检查
  useEffect(() => {
    const checkRecommendedNetwork = async () => {
      if (isConnected && chain) {
        const recommendedChainId = await getRecommendedLocalNetwork();
        if (recommendedChainId && chain.id !== recommendedChainId) {
          const networkName = NETWORK_CONFIG[recommendedChainId as keyof typeof NETWORK_CONFIG]?.name;
          toast.success(
            `检测到运行中的本地网络：${networkName}。您可以切换到该网络以获得更好的体验。`,
            { duration: 5000 }
          );
        }
      }
    };

    checkRecommendedNetwork();
  }, [isConnected, chain]);

  const handleNetworkSwitch = async (targetChainId: number) => {
    if (!isConnected) {
      toast.error('Please connect wallet first');
      return;
    }

    if (chain?.id === targetChainId) {
      toast.success('Already connected to this network');
      setIsOpen(false);
      return;
    }

    setSwitching(true);
    try {
      // 对于本地网络，先检查连接状态
      if (targetChainId === CHAIN_IDS.HARDHAT || targetChainId === CHAIN_IDS.GANACHE) {
        const isNetworkRunning = await checkNetworkStatus(targetChainId);
        if (!isNetworkRunning) {
          const networkName = NETWORK_CONFIG[targetChainId as keyof typeof NETWORK_CONFIG]?.name;
          toast.error(`${networkName} is not running. Please start the network first.`);
          setSwitching(false);
          return;
        }
      }

      await switchToNetwork(targetChainId);
      const networkName = NETWORK_CONFIG[targetChainId as keyof typeof NETWORK_CONFIG]?.name;
      toast.success(`Successfully switched to ${networkName}`);
      setIsOpen(false);
    } catch (error: any) {
      console.error('Network switch failed:', error);
      toast.error(`Network switch failed: ${error.message}`);
    } finally {
      setSwitching(false);
    }
  };

  const handleRefreshStatus = async () => {
    await Promise.all([
      checkNetworkStatus(CHAIN_IDS.HARDHAT),
      checkNetworkStatus(CHAIN_IDS.GANACHE)
    ]);
    toast.success('Network status refreshed');
  };

  const currentNetwork = chain ? NETWORK_CONFIG[chain.id as keyof typeof NETWORK_CONFIG] : null;

  if (!isConnected) {
    return (
              <div className="flex items-center text-gray-500 text-sm">
        <WifiOff className="h-4 w-4 mr-2" />
        Not Connected
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        disabled={switching}
      >
        {currentNetwork ? (
          <>
            <span className="text-xl" role="img" aria-label={currentNetwork.name}>
              {currentNetwork.icon}
            </span>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-900">
                {currentNetwork.shortName}
              </span>
              <span className="text-xs text-gray-500">
                Chain ID: {chain?.id}
              </span>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-700">Unknown Network</span>
          </>
        )}
        {switching ? (
          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Network</h3>
              <button
                onClick={handleRefreshStatus}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                title="Refresh Network Status"
              >
                <RefreshCw className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* 本地开发网络 */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Zap className="h-4 w-4 mr-1" />
                Local Development Networks
              </h4>
              
              {[CHAIN_IDS.HARDHAT, CHAIN_IDS.GANACHE].map((chainId) => {
                const network = NETWORK_CONFIG[chainId];
                const status = networkStatus[chainId];
                const isCurrentNetwork = chain?.id === chainId;
                
                return (
                  <button
                    key={chainId}
                    onClick={() => handleNetworkSwitch(chainId)}
                    disabled={switching || !status?.connected}
                    className={`
                      w-full text-left p-3 rounded-lg mb-2 transition-colors
                      ${isCurrentNetwork 
                        ? 'bg-blue-50 border border-blue-200' 
                        : status?.connected 
                          ? 'hover:bg-gray-50 border border-gray-200' 
                          : 'bg-gray-50 border border-gray-200 opacity-60 cursor-not-allowed'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-lg mr-3">{network.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900">
                            {network.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {network.description}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {status?.checking ? (
                          <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                        ) : status?.connected ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">Running</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-500">
                            <WifiOff className="h-4 w-4 mr-1" />
                            <span className="text-xs">Not Running</span>
                          </div>
                        )}
                        
                        {isCurrentNetwork && (
                          <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            Current
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {status?.connected && (
                      <div className="mt-2 text-xs text-gray-500">
                        Port: {network.rpcUrl.split(':').pop()} | 
                        Features: {network.features.join(', ')}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Test Networks */}
            {process.env.NODE_ENV === 'development' && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Globe className="h-4 w-4 mr-1" />
                  Test Networks
                </h4>
                
                {[CHAIN_IDS.SEPOLIA, CHAIN_IDS.MUMBAI].map((chainId) => {
                  const network = NETWORK_CONFIG[chainId];
                  const isCurrentNetwork = chain?.id === chainId;
                  
                  return (
                    <button
                      key={chainId}
                      onClick={() => handleNetworkSwitch(chainId)}
                      disabled={switching}
                      className={`
                        w-full text-left p-3 rounded-lg mb-2 transition-colors
                        ${isCurrentNetwork 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:bg-gray-50 border border-gray-200'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-lg mr-3">{network.icon}</span>
                          <div>
                            <div className="font-medium text-gray-900">
                              {network.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {network.description}
                            </div>
                          </div>
                        </div>
                        
                        {isCurrentNetwork && (
                          <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            Current
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Network Startup Instructions */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h5 className="text-sm font-medium text-blue-900 mb-1">
                Start Local Networks
              </h5>
              <div className="text-xs text-blue-700 space-y-1">
                <div>• Hardhat: <code className="bg-blue-100 px-1 rounded">npm run node</code></div>
                <div>• Ganache: Start Ganache application</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 点击外部关闭下拉菜单 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NetworkSwitcher; 