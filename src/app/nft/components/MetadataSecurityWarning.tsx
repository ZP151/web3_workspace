import React from 'react';
import { AlertTriangle, Shield } from 'lucide-react';

interface MetadataSecurityWarningProps {
  warning: string;
  tokenUri?: string;
  className?: string;
}

const MetadataSecurityWarning: React.FC<MetadataSecurityWarningProps> = ({
  warning,
  tokenUri,
  className = ''
}) => {
  const isIPFS = tokenUri?.includes('ipfs://') || tokenUri?.includes('ipfs.io');
  const isArweave = tokenUri?.includes('ar://') || tokenUri?.includes('arweave.net');
  const isSecure = isIPFS || isArweave;

  if (isSecure) {
    return (
      <div className={`flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded ${className}`}>
        <Shield className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-800">
          ✅ Secure metadata storage ({isIPFS ? 'IPFS' : 'Arweave'})
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded ${className}`}>
      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-yellow-800 font-medium">Metadata Security Warning</p>
        <p className="text-xs text-yellow-700 mt-1">{warning}</p>
        <div className="mt-2 text-xs text-yellow-700">
          <p>🔗 Current: {tokenUri ? 'Centralized storage' : 'No URI'}</p>
          <p>✅ Recommended: IPFS or Arweave for immutable metadata</p>
        </div>
      </div>
    </div>
  );
};

export default MetadataSecurityWarning; 