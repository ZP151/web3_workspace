'use client';

import React from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import WalletConnection from '@/components/WalletConnection';
import { 
  Code, 
  Shield, 
  Zap, 
  Users, 
  Vote, 
  DollarSign,
  Coins,
  Globe,
  ArrowRight,
  Github,
  ExternalLink,
  Network
} from 'lucide-react';
import Link from 'next/link';
// import AccountDebugger from '@/components/AccountDebugger';
// import NetworkDebugger from '@/components/NetworkDebugger';
// import ContractAddressDebugger from '@/components/ContractAddressDebugger';

const TechCard = ({ icon: Icon, title, description, features }: {
  icon: React.ElementType;
  title: string;
  description: string;
  features: string[];
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center mb-4">
      <Icon className="h-8 w-8 text-blue-600 mr-3" />
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
    </div>
    <p className="text-gray-600 mb-4">{description}</p>
    <ul className="space-y-2">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center text-sm text-gray-500">
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
          {feature}
        </li>
      ))}
    </ul>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, href, bgColor }: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  bgColor: string;
}) => (
  <Link href={href}>
    <div className={`${bgColor} rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer`}>
      <Icon className="h-12 w-12 text-white mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white/90 mb-4">{description}</p>
      <div className="flex items-center text-white">
        <span className="mr-2">Explore</span>
        <ArrowRight className="h-4 w-4" />
      </div>
    </div>
  </Link>
);

export default function HomePage() {
  const { address, isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Coins className="h-8 w-8 text-blue-600 mr-3" />
              <span className="text-xl font-bold text-gray-900">Modern Web3 Platform</span>
            </div>
            <WalletConnection />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Modern <span className="text-blue-600">Web3</span> Smart Contract Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Experience the future of decentralized applications with our modern technology stack featuring React, Next.js, Wagmi, RainbowKit, and Hardhat.
          </p>
          
          {!isConnected ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 max-w-md mx-auto">
              <p className="text-yellow-800">Please connect your wallet to interact with smart contracts</p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 max-w-md mx-auto">
              <p className="text-green-800">
                Wallet Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          )}

          {/* Debug Tools - Temporarily disabled
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto mb-8">
            <AccountDebugger />
            <NetworkDebugger />
            <ContractAddressDebugger />
          </div>
          */}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={Vote}
            title="Decentralized Voting"
            description="Participate in governance through transparent, immutable voting mechanisms"
            href="/voting"
            bgColor="bg-gradient-to-br from-blue-600 to-blue-700"
          />
          <FeatureCard
            icon={DollarSign}
            title="DeFi Banking"
            description="Earn interest on your deposits with our decentralized banking system"
            href="/banking"
            bgColor="bg-gradient-to-br from-green-600 to-green-700"
          />
          <FeatureCard
            icon={Coins}
            title="Token Factory"
            description="Create custom ERC-20 tokens with personalized parameters in one click"
            href="/tokens"
            bgColor="bg-gradient-to-br from-purple-600 to-purple-700"
          />
        </div>

        {/* Secondary Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={Network}
            title="Network Manager"
            description="Monitor blockchain networks and manage multiple accounts"
            href="/networks"
            bgColor="bg-gradient-to-br from-orange-600 to-orange-700"
          />
          <FeatureCard
            icon={Zap}
            title="DEX Platform"
            description="Trade tokens and provide liquidity in our decentralized exchange"
            href="/dex"
            bgColor="bg-gradient-to-br from-indigo-600 to-indigo-700"
          />
          <FeatureCard
            icon={Shield}
            title="NFT Marketplace"
            description="Mint, buy, and sell unique digital assets on our NFT platform"
            href="/nft"
            bgColor="bg-gradient-to-br from-pink-600 to-pink-700"
          />
        </div>

        {/* Technology Stack */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Modern Technology Stack</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TechCard
              icon={Code}
              title="Frontend Technology"
              description="Modern React-based development stack"
              features={[
                'React.js 18 + TypeScript',
                'Next.js 14 App Router',
                'Tailwind CSS Styling',
                'Responsive Design'
              ]}
            />
            
            <TechCard
              icon={Shield}
              title="Web3 Integration"
              description="Advanced blockchain connectivity"
              features={[
                'Wagmi React Hooks',
                'RainbowKit Wallet Connection',
                'Ethers.js v6',
                'Multi-chain Support'
              ]}
            />
            
            <TechCard
              icon={Zap}
              title="Smart Contract Development"
              description="Secure and efficient contract deployment"
              features={[
                'Solidity 0.8.x',
                'Hardhat Development Environment',
                'OpenZeppelin Security Library',
                'Automated Testing'
              ]}
            />
          </div>
        </div>

        {/* Status and Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">6</div>
              <div className="text-gray-600">Smart Contracts Deployed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
              <div className="text-gray-600">Modern Tech Stack</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">6</div>
              <div className="text-gray-600">Platform Features</div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Local Development Networks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="font-medium text-gray-900">Hardhat Network</div>
                <div className="text-gray-600">Chain ID: 31337 - Port: 8545</div>
                <div className="text-gray-600 font-mono text-xs mt-1">VotingCore: 0x5FbDB...0aa3</div>
                <div className="text-gray-600 font-mono text-xs">SimpleBank: 0xe7f17...0512</div>
                <div className="text-gray-600 font-mono text-xs">TokenFactory: 0x9fE46...6e0</div>
                <div className="text-gray-600 font-mono text-xs">+3 more contracts</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="font-medium text-gray-900">Ganache Network</div>
                <div className="text-gray-600">Chain ID: 1337 - Port: 7545</div>
                <div className="text-gray-600 font-mono text-xs mt-1">VotingCore: 0xa8e0...7341</div>
                <div className="text-gray-600 font-mono text-xs">SimpleBank: 0xF9c8...F3CB</div>
                <div className="text-gray-600 font-mono text-xs">All 6 contracts deployed</div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Quick Setup:</h4>
              <div className="text-xs text-blue-800 space-y-1">
                <div>• <strong>Hardhat:</strong> Run `npm run node` to start network with auto-deployed contracts</div>
                <div>• <strong>Ganache:</strong> Start Ganache on port 7545 and deploy contracts manually</div>
                <div>• Connect wallet and switch to desired local network using the buttons above</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500">
          <p>Built with modern Web3 technologies for the decentralized future</p>
        </div>
      </div>
    </div>
  );
} 