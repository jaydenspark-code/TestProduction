/**
 * AI System Test Component
 * Quick integration test to verify AI functionality
 */

import React, { useEffect, useState } from 'react';
import { useAISystem, useAIFeatures } from '../hooks/useAISystem';
import { aiTestRunner, type TestSuite } from '../utils/aiTestRunner';

const AISystemTest: React.FC = () => {
  const {
    isInitialized,
    isInitializing,
    systemStatus,
    error,
    models,
    initialize,
    reinitialize,
  } = useAISystem();

  const aiFeatures = useAIFeatures();
  const [testResults, setTestResults] = useState<TestSuite[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Auto-initialize on mount
  useEffect(() => {
    if (!isInitialized && !isInitializing && !error) {
      console.log('🚀 Auto-initializing AI system for testing...');
      initialize();
    }
  }, [isInitialized, isInitializing, error, initialize]);

  const runTests = async () => {
    if (!isInitialized) {
      alert('Please wait for AI system to initialize first');
      return;
    }

    setIsTesting(true);
    setTestResults([]);
    
    try {
      console.log('🧪 Starting comprehensive AI tests...');
      const results = await aiTestRunner.runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      alert('Test execution failed. Check console for details.');
    } finally {
      setIsTesting(false);
    }
  };

  const runSpecificTest = async (suiteName: string) => {
    if (!isInitialized) {
      alert('Please wait for AI system to initialize first');
      return;
    }

    setIsTesting(true);
    
    try {
      console.log(`🧪 Running ${suiteName} tests...`);
      const result = await aiTestRunner.runTestSuite(suiteName);
      if (result) {
        setTestResults([result]);
      }
    } catch (error) {
      console.error(`❌ ${suiteName} test failed:`, error);
      alert(`${suiteName} test failed. Check console for details.`);
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return '✅';
      case 'training': return '🔄';
      case 'initializing': return '⚡';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getTestSuiteStatus = (suite: TestSuite) => {
    if (suite.failed > 0) return '❌';
    if (suite.passed === suite.tests.length) return '✅';
    return '⚠️';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🤖 AI System Test Console</h1>
        <p className="text-gray-600">Comprehensive testing interface for EarnPro AI features</p>
      </div>

      {/* System Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-1">
              {isInitialized ? '✅' : isInitializing ? '🔄' : error ? '❌' : '⏳'}
            </div>
            <div className="font-medium">
              {isInitialized ? 'Ready' : isInitializing ? 'Initializing...' : error ? 'Error' : 'Offline'}
            </div>
            {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
          </div>
          
          <div className="text-center">
            <div className="text-2xl mb-1">🧠</div>
            <div className="font-medium">Models: {models.filter(m => m.status === 'ready').length}/{models.length}</div>
            <div className="text-sm text-gray-600">Ready</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl mb-1">⚡</div>
            <div className="font-medium">
              Services: {Object.values(systemStatus?.services || {}).filter(Boolean).length}/4
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
        </div>
      </div>

      {/* AI Models Status */}
      {models.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">AI Models</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {models.map((model) => (
              <div key={model.name} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center">
                  <span className="mr-2">{getStatusIcon(model.status)}</span>
                  <span className="font-medium capitalize">{model.name.replace('_', ' ')}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{model.status}</div>
                  {model.accuracy && (
                    <div className="text-xs text-gray-600">{(model.accuracy * 100).toFixed(1)}%</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Features Status */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">AI Features Availability</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={`p-2 rounded text-center ${aiFeatures.canUseAnalytics ? 'bg-green-200' : 'bg-red-200'}`}>
            <div>{aiFeatures.canUseAnalytics ? '✅' : '❌'}</div>
            <div className="text-sm font-medium">Analytics</div>
          </div>
          <div className={`p-2 rounded text-center ${aiFeatures.canUseMatching ? 'bg-green-200' : 'bg-red-200'}`}>
            <div>{aiFeatures.canUseMatching ? '✅' : '❌'}</div>
            <div className="text-sm font-medium">Matching</div>
          </div>
          <div className={`p-2 rounded text-center ${aiFeatures.canUsePersonalization ? 'bg-green-200' : 'bg-red-200'}`}>
            <div>{aiFeatures.canUsePersonalization ? '✅' : '❌'}</div>
            <div className="text-sm font-medium">Personalization</div>
          </div>
          <div className={`p-2 rounded text-center ${aiFeatures.canUsePredictions ? 'bg-green-200' : 'bg-red-200'}`}>
            <div>{aiFeatures.canUsePredictions ? '✅' : '❌'}</div>
            <div className="text-sm font-medium">Predictions</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        {!isInitialized && !isInitializing && (
          <button
            onClick={initialize}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-medium transition-colors"
          >
            Initialize AI System
          </button>
        )}
        
        {isInitialized && (
          <>
            <button
              onClick={reinitialize}
              disabled={isInitializing}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded font-medium transition-colors"
            >
              {isInitializing ? 'Reinitializing...' : 'Reinitialize'}
            </button>
            
            <button
              onClick={runTests}
              disabled={isTesting}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded font-medium transition-colors"
            >
              {isTesting ? 'Running Tests...' : 'Run All Tests'}
            </button>
          </>
        )}
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium transition-colors"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Individual Test Buttons */}
      {isInitialized && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Individual Test Suites</h2>
          <div className="flex flex-wrap gap-2">
            {['initialization', 'database', 'analytics', 'matching', 'personalization', 'realtime', 'integration'].map((suite) => (
              <button
                key={suite}
                onClick={() => runSpecificTest(suite)}
                disabled={isTesting}
                className="px-3 py-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors capitalize"
              >
                {suite}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Test Results</h2>
          <div className="space-y-4">
            {testResults.map((suite, index) => (
              <div key={index} className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="mr-2">{getTestSuiteStatus(suite)}</span>
                    <span className="font-medium">{suite.name}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {suite.passed}/{suite.tests.length} passed ({((suite.passed / suite.tests.length) * 100).toFixed(1)}%)
                  </div>
                </div>
                
                {showDetails && (
                  <div className="mt-2 space-y-1">
                    {suite.tests.map((test, testIndex) => (
                      <div key={testIndex} className="flex items-center justify-between text-sm p-2 bg-white rounded">
                        <div className="flex items-center">
                          <span className="mr-2">
                            {test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⚠️'}
                          </span>
                          <span>{test.name}</span>
                        </div>
                        <div className="text-right">
                          <div>{test.duration}ms</div>
                          {test.error && (
                            <div className="text-red-600 text-xs">{test.error}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Details */}
      {showDetails && systemStatus && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">System Details</h2>
          <pre className="bg-white p-3 rounded border text-sm overflow-auto">
            {JSON.stringify(systemStatus, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AISystemTest;
