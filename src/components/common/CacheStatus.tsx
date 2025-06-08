import React from 'react';
import { RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';

interface CacheStatusProps {
  isStale?: boolean;
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  className?: string;
}

const CacheStatus: React.FC<CacheStatusProps> = ({
  isStale = false,
  loading = false,
  error = null,
  onRefresh,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`flex items-center space-x-2 text-blue-600 ${className}`}>
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Updating...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-red-600 ${className}`}>
        <WifiOff className="w-4 h-4" />
        <span className="text-sm">Connection error</span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-xs underline hover:no-underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (isStale) {
    return (
      <div className={`flex items-center space-x-2 text-yellow-600 ${className}`}>
        <Clock className="w-4 h-4" />
        <span className="text-sm">Data may be outdated</span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-xs underline hover:no-underline"
          >
            Refresh
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
      <Wifi className="w-4 h-4" />
      <span className="text-sm">Up to date</span>
    </div>
  );
};

export default CacheStatus;