'use client';

import React from 'react';
import { Button } from './ui/button';
import { WifiOff, Wallet, Users, ArrowLeft } from 'lucide-react';
import { useAccount, useConnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import Link from 'next/link';

interface SystemFeedbackProps {
  type: 'unsupported-network' | 'not-connected' | 'contract-not-deployed';
  title?: string;
  message?: string;
  moduleName: string;
}

const FEEDBACK_CONFIG = {
  'unsupported-network': {
    icon: WifiOff,
    defaultTitle: 'Unsupported Network',
    defaultMessage: 'Please switch to a supported development network (e.g., Anvil or Hardhat) to use this feature.',
  },
  'not-connected': {
    icon: Wallet,
    defaultTitle: 'Wallet Not Connected',
    defaultMessage: 'You need to connect your wallet to interact with this module.',
  },
  'contract-not-deployed': {
    icon: Users,
    defaultTitle: 'Contract Not Deployed',
    defaultMessage: 'The required smart contract is not deployed on this network. Please check your configuration.',
  },
};

export const SystemFeedback: React.FC<SystemFeedbackProps> = ({ type, title, message, moduleName }) => {
  const { isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });

  const config = FEEDBACK_CONFIG[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col w-full h-full bg-white">
      <header className="flex items-center justify-between p-4 border-b">
        <Link href="/" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        <h2 className="text-lg font-semibold">{moduleName}</h2>
        <div className="w-24"></div>
      </header>
      <main className="flex flex-col flex-grow items-center justify-center text-center p-8">
        <div className="flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
          <Icon className="w-10 h-10 text-orange-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          {title || config.defaultTitle}
        </h3>
        <p className="text-gray-600 max-w-md">
          {message || config.defaultMessage}
        </p>
        {type === 'not-connected' && !isConnected && (
          <Button onClick={() => connect()} className="mt-6 bg-orange-500 hover:bg-orange-600">
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        )}
      </main>
    </div>
  );
}; 