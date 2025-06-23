'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { getNetworkAccounts } from '@/utils/web3';

export default function DebugAccountsPage() {
  const { address } = useAccount();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testAccountFetching = async () => {
    if (!address) {
      alert('请先连接钱包');
      return;
    }

    setIsLoading(true);
    try {
      console.log('=== 开始测试账户获取 ===');
      const accounts = await getNetworkAccounts(address, 9);
      setTestResults(accounts);
      console.log('=== 测试完成 ===');
    } catch (error) {
      console.error('测试失败:', error);
      setTestResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectRPC = async () => {
    setIsLoading(true);
    try {
      console.log('=== 直接RPC测试 ===');
      
      const ports = ['8545', '7545', '8546'];
      for (const port of ports) {
        try {
          console.log(`测试端口 ${port}...`);
          const response = await fetch(`http://localhost:${port}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: 1,
              jsonrpc: '2.0',
              method: 'eth_accounts',
              params: []
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`端口 ${port} 响应:`, data);
            if (data.result && Array.isArray(data.result)) {
              console.log(`端口 ${port} 获取到 ${data.result.length} 个账户:`, data.result);
            }
          } else {
            console.log(`端口 ${port} HTTP错误:`, response.status);
          }
        } catch (error: any) {
          console.log(`端口 ${port} 连接失败:`, error?.message || error);
        }
      }
    } catch (error) {
      console.error('直接RPC测试失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testMetaMaskAccounts = async () => {
    setIsLoading(true);
    try {
      console.log('=== MetaMask账户测试 ===');
      
      if (typeof window !== 'undefined' && window.ethereum) {
        // 测试 eth_accounts
        try {
          const accounts1 = await window.ethereum.request({ method: 'eth_accounts' });
          console.log('eth_accounts 结果:', accounts1);
        } catch (error) {
          console.log('eth_accounts 失败:', error);
        }

        // 测试 eth_requestAccounts
        try {
          const accounts2 = await window.ethereum.request({ method: 'eth_requestAccounts' });
          console.log('eth_requestAccounts 结果:', accounts2);
        } catch (error) {
          console.log('eth_requestAccounts 失败:', error);
        }

        // 获取网络信息
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          console.log('当前链ID:', chainId);
        } catch (error) {
          console.log('获取链ID失败:', error);
        }
      }
    } catch (error) {
      console.error('MetaMask测试失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold mb-6">🔍 Ganache账户获取调试工具</h2>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>当前用户:</strong> {address || '未连接'}</p>
        </div>

        <div className="space-x-4">
          <button
            onClick={testAccountFetching}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? '测试中...' : '测试getNetworkAccounts函数'}
          </button>

          <button
            onClick={testDirectRPC}
            disabled={isLoading}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? '测试中...' : '测试直接RPC连接'}
          </button>

          <button
            onClick={testMetaMaskAccounts}
            disabled={isLoading}
            className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? '测试中...' : '测试MetaMask账户API'}
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="bg-green-50 p-4 rounded">
            <h3 className="font-semibold mb-2">获取到的账户列表 ({testResults.length}个):</h3>
            <ul className="space-y-1">
              {testResults.map((addr, index) => (
                <li key={addr} className="font-mono text-sm">
                  {index + 1}. {addr}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-yellow-50 p-4 rounded">
          <h3 className="font-semibold mb-2">调试说明:</h3>
          <ul className="text-sm space-y-1">
            <li>• 打开浏览器开发者工具查看控制台输出</li>
            <li>• 确保Ganache正在运行并且端口正确</li>
            <li>• 检查MetaMask是否连接到正确的网络</li>
            <li>• 如果RPC失败，可能需要在Ganache中启用CORS</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 