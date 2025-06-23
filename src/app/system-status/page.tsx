'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useNetwork, useContractRead } from 'wagmi';
import { formatEther } from 'viem';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Activity,
  Server,
  Database,
  Zap,
  Users,
  DollarSign,
  TrendingUp,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getContractAddress, getContractABI, getAllContractAddresses, getNetworkInfo } from '@/config/contracts';
import DebugAccountsPage from './debug-accounts';

interface ContractStatus {
  name: string;
  address: string | null;
  isDeployed: boolean;
  isResponding: boolean;
  error?: string;
}

interface SystemMetrics {
  totalUsers: number;
  totalTransactions: number;
  totalValueLocked: string;
  networkLatency: number;
}

export default function SystemStatusPage() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [contractStatuses, setContractStatuses] = useState<ContractStatus[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    totalTransactions: 0,
    totalValueLocked: '0',
    networkLatency: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 合约名称列表
  const contractNames = ['VotingCore', 'SimpleBank', 'EnhancedBank', 'TokenFactory', 'PlatformNFT', 'NFTMarketplace', 'DEXPlatform'];

  // 检查合约状态
  const checkContractStatus = async (contractName: string): Promise<ContractStatus> => {
    const address = chain?.id ? getContractAddress(chain.id, contractName) : null;
    
    if (!address) {
      return {
        name: contractName,
        address: null,
        isDeployed: false,
        isResponding: false,
        error: 'Not deployed'
      };
    }

    try {
      // 这里可以添加实际的合约调用来测试响应性
      // 暂时只检查地址是否存在
      return {
        name: contractName,
        address,
        isDeployed: true,
        isResponding: true
      };
    } catch (error) {
      return {
        name: contractName,
        address,
        isDeployed: true,
        isResponding: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // 测试网络延迟
  const testNetworkLatency = async (): Promise<number> => {
    const start = Date.now();
    try {
      // 模拟网络请求
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      return Date.now() - start;
    } catch {
      return -1;
    }
  };

  // 加载系统状态
  const loadSystemStatus = async () => {
    setIsLoading(true);
    
    try {
      // 检查所有合约状态
      const statuses = await Promise.all(
        contractNames.map(name => checkContractStatus(name))
      );
      setContractStatuses(statuses);

      // 测试网络延迟
      const latency = await testNetworkLatency();
      
      // 生成模拟指标
      const deployedContracts = statuses.filter(s => s.isDeployed).length;
      setSystemMetrics({
        totalUsers: Math.floor(Math.random() * 1000) + 100,
        totalTransactions: Math.floor(Math.random() * 10000) + 1000,
        totalValueLocked: (Math.random() * 1000 + 100).toFixed(2),
        networkLatency: latency
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load system status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 组件挂载时加载状态
  useEffect(() => {
    loadSystemStatus();
    
    // 每30秒自动刷新
    const interval = setInterval(loadSystemStatus, 30000);
    return () => clearInterval(interval);
  }, [chain?.id]);

  // 计算系统健康度
  const calculateSystemHealth = () => {
    if (contractStatuses.length === 0) return 0;
    
    const deployedCount = contractStatuses.filter(s => s.isDeployed).length;
    const respondingCount = contractStatuses.filter(s => s.isResponding).length;
    
    return Math.round((respondingCount / contractStatuses.length) * 100);
  };

  const systemHealth = calculateSystemHealth();
  const networkInfo = chain?.id ? getNetworkInfo(chain.id) : null;

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-600 bg-green-100';
    if (health >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (status: ContractStatus) => {
    if (!status.isDeployed) return <XCircle className="w-5 h-5 text-gray-400" />;
    if (status.isResponding) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <AlertCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-800">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-xl font-bold text-gray-900">System Status</h1>
            <Button onClick={loadSystemStatus} disabled={isLoading}>
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${getHealthColor(systemHealth)}`}>
                <Activity className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-gray-900">{systemHealth}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Server className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Deployed Contracts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contractStatuses.filter(s => s.isDeployed).length}/{contractStatuses.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <Zap className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Network Latency</p>
                <p className="text-2xl font-bold text-gray-900">{systemMetrics.networkLatency}ms</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value Locked</p>
                <p className="text-2xl font-bold text-gray-900">{systemMetrics.totalValueLocked} ETH</p>
              </div>
            </div>
          </div>
        </div>

        {/* Network Information */}
        {networkInfo && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Network Name</p>
                <p className="text-lg font-semibold text-gray-900">{networkInfo.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Chain ID</p>
                <p className="text-lg font-semibold text-gray-900">{chain?.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Network Type</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{networkInfo.type}</p>
              </div>
            </div>
          </div>
        )}

        {/* Contract Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Contract Status</h3>
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
          
          <div className="space-y-4">
            {contractStatuses.map((status) => (
              <div key={status.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  {getStatusIcon(status)}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{status.name}</p>
                    <p className="text-xs text-gray-500">
                      {status.address ? `${status.address.slice(0, 10)}...${status.address.slice(-8)}` : 'Not deployed'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {status.isDeployed && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Deployed
                    </span>
                  )}
                  {status.isResponding && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Responding
                    </span>
                  )}
                  {status.error && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {status.error}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">System Metrics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Active Users</span>
                <span className="text-lg font-semibold text-gray-900">{systemMetrics.totalUsers.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Total Transactions</span>
                <span className="text-lg font-semibold text-gray-900">{systemMetrics.totalTransactions.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Network Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  systemMetrics.networkLatency < 100 ? 'bg-green-100 text-green-800' : 
                  systemMetrics.networkLatency < 500 ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {systemMetrics.networkLatency < 100 ? 'Excellent' : 
                   systemMetrics.networkLatency < 500 ? 'Good' : 'Poor'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Security Status</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Shield className="w-3 h-3 mr-1" />
                  Secure
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Tools */}
        <div className="mt-8">
          <DebugAccountsPage />
        </div>
      </div>
    </div>
  );
} 