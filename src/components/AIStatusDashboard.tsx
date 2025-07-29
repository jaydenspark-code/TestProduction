/**
 * AI System Status Dashboard
 * Displays real-time status of AI models and services
 */

import React, { useState } from 'react';
import { useAISystem, useAIFeatures, useAIPerformance } from '../hooks/useAISystem';

const AIStatusDashboard: React.FC = () => {
  const {
    isInitialized,
    isInitializing,
    systemStatus,
    error,
    models,
    services,
    initialize,
    reinitialize,
  } = useAISystem();

  const aiFeatures = useAIFeatures();
  const performance = useAIPerformance();

  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return '✅';
      case 'training':
        return '🔄';
      case 'initializing':
        return '⚡';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-green-600';
      case 'training':
        return 'text-blue-600';
      case 'initializing':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className={`px-4 py-2 rounded-lg shadow-lg transition-colors ${
            isInitialized
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : isInitializing
              ? 'bg-blue-500 hover:bg-blue-600 text-white animate-pulse'
              : error
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-500 hover:bg-gray-600 text-white'
          }`}
        >
          🤖 AI System {isInitialized ? 'Ready' : isInitializing ? 'Loading...' : error ? 'Error' : 'Offline'}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-96 max-h-[80vh] overflow-y-auto">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">🤖 AI System Status</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* System Overview */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-medium text-gray-800 mb-2">System Overview</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={getStatusColor(isInitialized ? 'ready' : isInitializing ? 'initializing' : 'error')}>
                {getStatusIcon(isInitialized ? 'ready' : isInitializing ? 'initializing' : 'error')}
                {isInitialized ? 'Ready' : isInitializing ? 'Initializing...' : error ? 'Error' : 'Offline'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Models Loaded:</span>
              <span>{performance.modelsLoaded}/4</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Accuracy:</span>
              <span>{(performance.averageAccuracy * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Memory Usage:</span>
              <span>{formatBytes(performance.memoryUsage)}</span>
            </div>
            <div className="flex justify-between">
              <span>Init Time:</span>
              <span>{formatTime(performance.initializationTime)}</span>
            </div>
          </div>

          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* AI Models Status */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-medium text-gray-800 mb-2">AI Models</h4>
          <div className="space-y-2">
            {models.length > 0 ? (
              models.map((model) => (
                <div key={model.name} className="flex justify-between items-center text-sm">
                  <span className="flex items-center">
                    {getStatusIcon(model.status)}
                    <span className="ml-2 capitalize">
                      {model.name.replace('_', ' ')}
                    </span>
                  </span>
                  <div className="text-right">
                    <div className={getStatusColor(model.status)}>
                      {model.status}
                    </div>
                    {model.accuracy && (
                      <div className="text-xs text-gray-500">
                        {(model.accuracy * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No models loaded</p>
            )}
          </div>
        </div>

        {/* Services Status */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-medium text-gray-800 mb-2">AI Services</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Analytics:</span>
              <span className={services.analytics ? 'text-green-600' : 'text-red-600'}>
                {services.analytics ? '✅ Active' : '❌ Inactive'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Smart Matching:</span>
              <span className={services.matching ? 'text-green-600' : 'text-red-600'}>
                {services.matching ? '✅ Active' : '❌ Inactive'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Personalization:</span>
              <span className={services.personalization ? 'text-green-600' : 'text-red-600'}>
                {services.personalization ? '✅ Active' : '❌ Inactive'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Real-time:</span>
              <span className={services.realtime ? 'text-green-600' : 'text-red-600'}>
                {services.realtime ? '✅ Active' : '❌ Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Feature Availability */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-medium text-gray-800 mb-2">Feature Availability</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Analytics:</span>
              <span className={aiFeatures.canUseAnalytics ? 'text-green-600' : 'text-red-600'}>
                {aiFeatures.canUseAnalytics ? '✅ Ready' : '❌ Not Ready'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Smart Matching:</span>
              <span className={aiFeatures.canUseMatching ? 'text-green-600' : 'text-red-600'}>
                {aiFeatures.canUseMatching ? '✅ Ready' : '❌ Not Ready'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Personalization:</span>
              <span className={aiFeatures.canUsePersonalization ? 'text-green-600' : 'text-red-600'}>
                {aiFeatures.canUsePersonalization ? '✅ Ready' : '❌ Not Ready'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Predictions:</span>
              <span className={aiFeatures.canUsePredictions ? 'text-green-600' : 'text-red-600'}>
                {aiFeatures.canUsePredictions ? '✅ Ready' : '❌ Not Ready'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {!isInitialized && !isInitializing && (
            <button
              onClick={initialize}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              Initialize AI
            </button>
          )}
          
          {isInitialized && (
            <button
              onClick={reinitialize}
              disabled={isInitializing}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              {isInitializing ? 'Reinitializing...' : 'Reinitialize'}
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
          >
            Reload
          </button>
        </div>

        {/* Development Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="font-medium text-yellow-800 mb-2">🚧 Development Mode</h4>
            <div className="text-xs text-yellow-700 space-y-1">
              <div>• AI models use synthetic training data</div>
              <div>• Real-time features are simulated</div>
              <div>• Performance metrics are approximate</div>
              <div>• Check browser console for detailed logs</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIStatusDashboard;
