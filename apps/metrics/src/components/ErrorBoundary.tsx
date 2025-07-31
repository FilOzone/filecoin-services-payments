import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  error?: Error;
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  error,
  onRetry,
  title = 'Something went wrong',
  description = 'Failed to load data. Please try again.'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="p-4 rounded-full bg-red-500/20 mb-4">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md">{description}</p>
      
      {error && (
        <details className="mb-6 text-left">
          <summary className="text-gray-500 text-sm cursor-pointer hover:text-gray-400">
            Error details
          </summary>
          <pre className="mt-2 p-3 bg-gray-800 rounded text-xs text-red-300 overflow-auto max-w-md">
            {error.message}
          </pre>
        </details>
      )}
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </motion.div>
  );
};