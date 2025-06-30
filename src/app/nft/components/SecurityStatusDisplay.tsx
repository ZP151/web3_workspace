'use client';

import React from 'react';
import { Shield, Pause, Play, AlertTriangle, CheckCircle } from 'lucide-react';

interface SecurityStatusDisplayProps {
  isPaused?: boolean;
  isMarketplacePaused?: boolean;
  securityFeatures?: {
    pausableContract: boolean;
    pausableMarketplace: boolean;
    metadataSecurityCheck: boolean;
    erc2981Royalties: boolean;
    gasDoSPrevention: boolean;
  };
}

export const SecurityStatusDisplay: React.FC<SecurityStatusDisplayProps> = ({
  isPaused = false,
  isMarketplacePaused = false,
  securityFeatures
}) => {
  const hasSecurityFeatures = securityFeatures && Object.values(securityFeatures).some(Boolean);

  if (!hasSecurityFeatures && !isPaused && !isMarketplacePaused) {
    return null; // Don't show anything if no security features are enabled
  }

  return (
    <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Security Status</h3>
      </div>

      {/* Pause Status */}
      {(isPaused || isMarketplacePaused) && (
        <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Pause className="h-4 w-4 text-orange-600" />
            <span className="text-orange-800 font-medium">Service Status</span>
          </div>
          <div className="mt-2 space-y-1 text-sm">
            {isPaused && (
              <div className="flex items-center gap-2 text-orange-700">
                <AlertTriangle className="h-3 w-3" />
                <span>NFT minting is paused</span>
              </div>
            )}
            {isMarketplacePaused && (
              <div className="flex items-center gap-2 text-orange-700">
                <AlertTriangle className="h-3 w-3" />
                <span>NFT marketplace is paused</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Status when not paused */}
      {!isPaused && !isMarketplacePaused && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-green-600" />
            <span className="text-green-800 font-medium">All services operational</span>
          </div>
        </div>
      )}

      {/* Security Features */}
      {hasSecurityFeatures && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Enhanced Security Features</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {securityFeatures?.pausableContract && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>Emergency Pause Protection</span>
              </div>
            )}
            {securityFeatures?.metadataSecurityCheck && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>Metadata Security Check</span>
              </div>
            )}
            {securityFeatures?.erc2981Royalties && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>ERC-2981 Royalty Standard</span>
              </div>
            )}
            {securityFeatures?.gasDoSPrevention && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>Gas DoS Prevention</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 