/**
 * React Hook for AI System Integration
 * Manages AI system initialization, status monitoring, and frontend integration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { aiInitializationService, type AISystemStatus, type ModelStatus } from '../services/aiInitializationService';
import { envConfig } from '../config/environment';

export interface UseAISystemReturn {
  // System status
  isInitialized: boolean;
  isInitializing: boolean;
  systemStatus: AISystemStatus | null;
  error: string | null;
  
  // Models status
  models: ModelStatus[];
  
  // Actions
  initialize: () => Promise<void>;
  reinitialize: () => Promise<void>;
  getModelStatus: (modelName: string) => ModelStatus | undefined;
  
  // Performance metrics
  initializationTime: number;
  memoryUsage: number;
  
  // Service availability
  services: {
    analytics: boolean;
    matching: boolean;
    personalization: boolean;
    realtime: boolean;
  };
}

export function useAISystem(): UseAISystemReturn {
  const [systemStatus, setSystemStatus] = useState<AISystemStatus | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializationAttempted = useRef(false);
  const statusUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize AI system
   */
  const initialize = useCallback(async () => {
    if (isInitializing || (systemStatus?.isInitialized && !error)) {
      return; // Already initializing or initialized
    }

    console.log('🚀 Starting AI system initialization from React hook...');
    setIsInitializing(true);
    setError(null);

    try {
      const status = await aiInitializationService.initialize();
      setSystemStatus(status);
      console.log('✅ AI system initialized successfully:', status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown initialization error';
      console.error('❌ AI system initialization failed:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, systemStatus?.isInitialized, error]);

  /**
   * Reinitialize AI system
   */
  const reinitialize = useCallback(async () => {
    console.log('🔄 Reinitializing AI system...');
    setIsInitializing(true);
    setError(null);

    try {
      const status = await aiInitializationService.reinitialize();
      setSystemStatus(status);
      console.log('✅ AI system reinitialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown reinitialization error';
      console.error('❌ AI system reinitialization failed:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  /**
   * Get status of a specific model
   */
  const getModelStatus = useCallback((modelName: string): ModelStatus | undefined => {
    return systemStatus?.models.find(m => m.name === modelName);
  }, [systemStatus]);

  /**
   * Update system status periodically
   */
  const updateSystemStatus = useCallback(() => {
    if (aiInitializationService.isReady()) {
      const currentStatus = aiInitializationService.getSystemStatus();
      setSystemStatus(currentStatus);
    }
  }, []);

  /**
   * Check if AI features are enabled and should be initialized
   */
  const shouldInitializeAI = useCallback((): boolean => {
    return (
      envConfig.ai.analytics ||
      envConfig.ai.smartMatching ||
      envConfig.ai.personalization ||
      envConfig.ai.predictiveInsights ||
      envConfig.ai.anomalyDetection
    );
  }, []);

  // Auto-initialize on mount if AI features are enabled
  useEffect(() => {
    if (!initializationAttempted.current && shouldInitializeAI()) {
      initializationAttempted.current = true;
      initialize();
    }
  }, [initialize, shouldInitializeAI]);

  // Set up periodic status updates
  useEffect(() => {
    if (systemStatus?.isInitialized && !statusUpdateInterval.current) {
      statusUpdateInterval.current = setInterval(updateSystemStatus, 30000); // Update every 30 seconds
    }

    return () => {
      if (statusUpdateInterval.current) {
        clearInterval(statusUpdateInterval.current);
        statusUpdateInterval.current = null;
      }
    };
  }, [systemStatus?.isInitialized, updateSystemStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusUpdateInterval.current) {
        clearInterval(statusUpdateInterval.current);
      }
    };
  }, []);

  return {
    // System status
    isInitialized: systemStatus?.isInitialized || false,
    isInitializing,
    systemStatus,
    error,
    
    // Models status
    models: systemStatus?.models || [],
    
    // Actions
    initialize,
    reinitialize,
    getModelStatus,
    
    // Performance metrics
    initializationTime: systemStatus?.performance.initializationTime || 0,
    memoryUsage: systemStatus?.performance.memoryUsage || 0,
    
    // Service availability
    services: systemStatus?.services || {
      analytics: false,
      matching: false,
      personalization: false,
      realtime: false,
    },
  };
}

/**
 * Hook for checking if specific AI features are available
 */
export function useAIFeatures() {
  const { isInitialized, services, models, getModelStatus } = useAISystem();

  return {
    // Feature availability
    canUseAnalytics: isInitialized && services.analytics && envConfig.ai.analytics,
    canUseMatching: isInitialized && services.matching && envConfig.ai.smartMatching,
    canUsePersonalization: isInitialized && services.personalization && envConfig.ai.personalization,
    canUsePredictions: isInitialized && services.analytics && envConfig.ai.predictiveInsights,
    canUseRealtime: isInitialized && services.realtime && envConfig.realtime.enabled,

    // Model-specific checks
    isRevenueModelReady: getModelStatus('revenue_prediction')?.status === 'ready',
    isChurnModelReady: getModelStatus('churn_prediction')?.status === 'ready',
    isMatchingModelReady: getModelStatus('user_matching')?.status === 'ready',
    isRecommendationModelReady: getModelStatus('recommendation_engine')?.status === 'ready',

    // Overall system status
    isSystemReady: isInitialized,
    models,
  };
}

/**
 * Hook for AI system performance monitoring
 */
export function useAIPerformance() {
  const { systemStatus, isInitialized } = useAISystem();
  const [performanceMetrics, setPerformanceMetrics] = useState({
    memoryUsage: 0,
    modelsLoaded: 0,
    initializationTime: 0,
    averageAccuracy: 0,
  });

  useEffect(() => {
    if (isInitialized && systemStatus) {
      const averageAccuracy = systemStatus.models.length > 0
        ? systemStatus.models
            .filter(m => m.accuracy !== undefined)
            .reduce((sum, m) => sum + (m.accuracy || 0), 0) / systemStatus.models.length
        : 0;

      setPerformanceMetrics({
        memoryUsage: systemStatus.performance.memoryUsage,
        modelsLoaded: systemStatus.performance.modelsLoaded,
        initializationTime: systemStatus.performance.initializationTime,
        averageAccuracy,
      });
    }
  }, [isInitialized, systemStatus]);

  return performanceMetrics;
}

export default useAISystem;
