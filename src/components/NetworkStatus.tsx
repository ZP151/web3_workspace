'use client';

import { useAccount, useNetwork } from 'wagmi';
import { getContractAddress, isContractDeployed } from '@/config/contracts';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react';

export default function NetworkStatus() {
  const { isConnected, address } = useAccount();
  const { chain } = useNetwork();

  if (!isConnected || !chain) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <WifiOff className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800 font-medium">Wallet not connected</span>
        </div>
        <p className="text-yellow-700 text-sm mt-1">
          Please connect your wallet to view network status
        </p>
      </div>
    );
  }

  const networkName = chain.name || `Chain ${chain.id}`;
  const isHardhat = chain.id === 31337;
  const isGanache = chain.id === 1337;
  const isSupported = isHardhat || isGanache;

  // Check contract deployment status
  const bankDeployed = isContractDeployed(chain.id, 'Bank');
  const votingDeployed = isContractDeployed(chain.id, 'Voting');
  const tokenFactoryDeployed = isContractDeployed(chain.id, 'TokenFactory');

  const allContractsDeployed = votingDeployed && bankDeployed && tokenFactoryDeployed;

  const getStatusIcon = (deployed: boolean) => {
    return deployed ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusColor = (deployed: boolean) => {
    return deployed ? 'text-green-700' : 'text-red-700';
  };

  if (!isSupported) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800 font-medium">Unsupported Network</span>
        </div>
        <p className="text-red-700 text-sm mt-1">
          Current network: {networkName}. Please switch to Hardhat (localhost:8545) or Ganache (localhost:7545).
        </p>
      </div>
    );
  }

  if (!allContractsDeployed && isGanache) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            <span className="text-orange-800 font-medium">Contracts Need Deployment</span>
          </div>
          <Badge variant="outline" className="text-orange-700 border-orange-300">
            {networkName}
          </Badge>
        </div>
        <p className="text-orange-700 text-sm mt-2 mb-3">
          Some contracts are not deployed on Ganache network. Please deploy them first.
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Voting:</span>
            <div className={`flex items-center ${getStatusColor(votingDeployed)}`}>
              {getStatusIcon(votingDeployed)}
              <span className="ml-1">{votingDeployed ? 'Deployed' : 'Not Deployed'}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Bank:</span>
            <div className={`flex items-center ${getStatusColor(bankDeployed)}`}>
              {getStatusIcon(bankDeployed)}
              <span className="ml-1">{bankDeployed ? 'Deployed' : 'Not Deployed'}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>TokenFactory:</span>
            <div className={`flex items-center ${getStatusColor(tokenFactoryDeployed)}`}>
              {getStatusIcon(tokenFactoryDeployed)}
              <span className="ml-1">{tokenFactoryDeployed ? 'Deployed' : 'Not Deployed'}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 p-3 bg-orange-100 rounded border border-orange-200">
          <p className="text-orange-800 text-sm font-medium mb-1">To deploy contracts on Ganache:</p>
          <code className="text-orange-700 text-xs bg-orange-200 px-2 py-1 rounded">
            npx hardhat run scripts/deploy-ganache.js --network ganache
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800 font-medium">Network Ready</span>
        </div>
        <Badge variant="outline" className="text-green-700 border-green-300">
          {networkName}
        </Badge>
      </div>
      <div className="flex items-center mt-2">
        <Wifi className="h-4 w-4 text-green-600 mr-2" />
        <span className="text-green-700 text-sm">
          All contracts deployed and ready to use
        </span>
      </div>
      <div className="text-green-600 text-xs mt-1">
        Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
      </div>
    </div>
  );
} 