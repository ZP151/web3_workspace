import React from 'react';
import { Shield, Pause, Play, AlertTriangle, CheckCircle } from 'lucide-react';

interface SecurityStatusProps {
  isPaused: boolean;
  isMarketplacePaused: boolean;
  canEmergencyStop: boolean;
  onPauseContract?: () => void;
  onUnpauseContract?: () => void;
  onPauseMarketplace?: () => void;
  onUnpauseMarketplace?: () => void;
}

const SecurityStatusCard: React.FC<SecurityStatusProps> = ({
  isPaused,
  isMarketplacePaused,
  canEmergencyStop,
  onPauseContract,
  onUnpauseContract,
  onPauseMarketplace,
  onUnpauseMarketplace,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-500">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-800">Security Status</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NFT Contract Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isPaused ? 'bg-red-100' : 'bg-green-100'}`}>
              {isPaused ? (
                <Pause className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-800">NFT Contract</p>
              <p className={`text-sm ${isPaused ? 'text-red-600' : 'text-green-600'}`}>
                {isPaused ? 'Paused' : 'Active'}
              </p>
            </div>
          </div>
          
          {canEmergencyStop && (
            <div className="flex gap-2">
              {isPaused ? (
                <button
                  onClick={onUnpauseContract}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                >
                  <Play className="h-3 w-3 inline mr-1" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={onPauseContract}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                >
                  <Pause className="h-3 w-3 inline mr-1" />
                  Pause
                </button>
              )}
            </div>
          )}
        </div>

        {/* Marketplace Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isMarketplacePaused ? 'bg-red-100' : 'bg-green-100'}`}>
              {isMarketplacePaused ? (
                <Pause className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-800">Marketplace</p>
              <p className={`text-sm ${isMarketplacePaused ? 'text-red-600' : 'text-green-600'}`}>
                {isMarketplacePaused ? 'Paused' : 'Active'}
              </p>
            </div>
          </div>
          
          {canEmergencyStop && (
            <div className="flex gap-2">
              {isMarketplacePaused ? (
                <button
                  onClick={onUnpauseMarketplace}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                >
                  <Play className="h-3 w-3 inline mr-1" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={onPauseMarketplace}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                >
                  <Pause className="h-3 w-3 inline mr-1" />
                  Pause
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Security Warnings */}
      {(isPaused || isMarketplacePaused) && (
        <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              {isPaused && isMarketplacePaused && "Both NFT minting and marketplace trading are paused."}
              {isPaused && !isMarketplacePaused && "NFT minting is paused. Marketplace trading is still active."}
              {!isPaused && isMarketplacePaused && "Marketplace trading is paused. NFT minting is still active."}
            </p>
          </div>
        </div>
      )}

      {/* Admin Notice */}
      {canEmergencyStop && (
        <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
          <p className="text-sm text-blue-800">
            🛡️ You have administrator privileges. Use emergency controls responsibly.
          </p>
        </div>
      )}
    </div>
  );
};

export default SecurityStatusCard; 