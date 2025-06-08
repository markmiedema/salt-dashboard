import React from 'react';
import { RefreshCw } from 'lucide-react';

interface RetryButtonProps {
  onRetry: () => void;
  loading?: boolean;
  text?: string;
  variant?: 'primary' | 'secondary';
}

const RetryButton: React.FC<RetryButtonProps> = ({ 
  onRetry, 
  loading = false, 
  text = 'Retry',
  variant = 'secondary'
}) => {
  const baseClasses = "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200"
  };

  return (
    <button
      onClick={onRetry}
      disabled={loading}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      <span>{loading ? 'Retrying...' : text}</span>
    </button>
  );
};

export default RetryButton;