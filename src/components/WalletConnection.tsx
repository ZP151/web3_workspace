'use client';

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import NetworkSwitcher from './NetworkSwitcher';

const WalletConnection: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-3">
        <NetworkSwitcher />
        
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm font-medium text-gray-700">
            {formatAddress(address)}
          </span>
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => disconnect()}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <ConnectButton.Custom>
        {({ account, chain, openConnectModal, mounted }) => {
          const ready = mounted;
          const connected = ready && account && chain;

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <Button onClick={openConnectModal}>
                      Connect Wallet
                    </Button>
                  );
                }

                return null;
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
};

export default WalletConnection; 