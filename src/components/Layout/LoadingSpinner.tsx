import React, { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  message?: string;
  timeout?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  timeout = 10000
}) => {
  const [showTimeout, setShowTimeout] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowTimeout(true);
    }, timeout);

    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(dotsInterval);
    };
  }, [timeout]);

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="relative">
        <div className="animate-spin rounded-full h-32 w-32 border-4 border-purple-200 border-t-purple-500 dark:border-gray-700 dark:border-t-purple-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="h-24 w-24 rounded-full bg-purple-500 bg-opacity-10 dark:bg-purple-900 dark:bg-opacity-20"></div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
          {message}{dots}
        </p>
        {showTimeout && (
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
            This is taking longer than expected.
            <br />
            Please check your connection and try refreshing the page.
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
