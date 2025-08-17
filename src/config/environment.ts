/**
 * Environment Configuration and Validation
 * Centralized configuration management for AI-powered EarnPro
 */

// Environment validation interface
interface EnvironmentConfig {
  // Core services
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };

  paypal: {
    clientId: string;
    clientSecret: string;
    mode: 'sandbox' | 'live';
    returnUrl: string;
    cancelUrl: string;
  };
  
  // Payment services
  paystack: {
    publicKey: string;
    secretKey: string;
    callbackUrl: string;
    webhookUrl: string;
  };
  
  // Email services
  sendgrid: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  
  // Application settings
  app: {
    name: string;
    description: string;
    version: string;
    url: string;
    apiBaseUrl: string;
    environment: 'development' | 'production' | 'test';
  };
  
  // AI Features
  ai: {
    analytics: boolean;
    smartMatching: boolean;
    personalization: boolean;
    predictiveInsights: boolean;
    anomalyDetection: boolean;
    modelUpdateInterval: number;
    predictionCacheTime: number;
    batchSize: number;
    confidenceThreshold: number;
  };
  
  // TensorFlow.js settings
  tensorflow: {
    backend: string;
    debug: boolean;
    memoryOptimization: boolean;
  };
  
  // Real-time features
  realtime: {
    enabled: boolean;
    liveNotifications: boolean;
    liveStats: boolean;
    liveMatching: boolean;
    maxReconnectAttempts: number;
    reconnectDelay: number;
    heartbeatInterval: number;
    batchUpdates: boolean;
  };
  
  // Personalization
  personalization: {
    userProfiling: boolean;
    behaviorTracking: boolean;
    contentRecommendations: boolean;
    dashboardCustomization: boolean;
    updateFrequency: number;
    behaviorLogBatchSize: number;
    recommendationCacheTime: number;
  };
  
  // Smart matching
  matching: {
    compatibilityScoring: boolean;
    matchOptimization: boolean;
    campaignAI: boolean;
    minCompatibility: number;
    maxResults: number;
    cacheDuration: number;
    retrainInterval: number;
  };
  
  // Analytics and insights
  analytics: {
    revenuePrediction: boolean;
    churnAnalysis: boolean;
    userSegmentation: boolean;
    performanceTracking: boolean;
    retentionDays: number;
    insightsUpdateInterval: number;
    anomalyDetectionSensitivity: number;
  };
  
  // Security settings
  security: {
    jwtExpiry: number;
    rateLimitWindow: number;
    rateLimitMaxRequests: number;
    requestLogging: boolean;
  };
  
  // Performance settings  
  performance: {
    cacheApiResponses: boolean;
    cacheDuration: number;
    enableCompression: boolean;
    optimizeImages: boolean;
  };
  
  // Feature flags
  features: {
    darkMode: boolean;
    advancedAnalytics: boolean;
    aiRecommendations: boolean;
    smartNotifications: boolean;
    betaAiFeatures: boolean;
  };
  
  // Development settings
  development: {
    isProduction: boolean;
    debugMode: boolean;
    enableConsoleLogs: boolean;
    debugAiModels: boolean;
    debugRealtime: boolean;
  };
}

/**
 * Get environment variable with optional default value
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key];
  if (!value && !defaultValue) {
    console.warn(`⚠️ Environment variable ${key} is not set`);
    return '';
  }
  return value || defaultValue || '';
}

/**
 * Get boolean environment variable
 */
function getBooleanEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key, defaultValue.toString());
  return value.toLowerCase() === 'true';
}

/**
 * Get numeric environment variable
 */
function getNumericEnvVar(key: string, defaultValue: number): number {
  const value = getEnvVar(key, defaultValue.toString());
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Create and validate environment configuration
 */
export function createEnvironmentConfig(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    // Core services
    supabase: {
      url: getEnvVar('VITE_SUPABASE_URL'),
      anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
      serviceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
    },
    
    // Payment services
    paystack: {
      publicKey: getEnvVar('VITE_PAYSTACK_PUBLIC_KEY'),
      secretKey: getEnvVar('VITE_PAYSTACK_SECRET_KEY'),
      callbackUrl: getEnvVar('VITE_PAYSTACK_CALLBACK_URL'),
      webhookUrl: getEnvVar('VITE_PAYSTACK_WEBHOOK_URL'),
    },
    paypal: {
      clientId: getEnvVar('VITE_PAYPAL_CLIENT_ID'),
      clientSecret: getEnvVar('VITE_PAYPAL_CLIENT_SECRET'),
      mode: (getEnvVar('VITE_PAYPAL_MODE', 'sandbox') as 'sandbox' | 'live'),
      returnUrl: getEnvVar('VITE_PAYPAL_RETURN_URL'),
      cancelUrl: getEnvVar('VITE_PAYPAL_CANCEL_URL'),
    },
    
    // Email services
    sendgrid: {
      apiKey: getEnvVar('VITE_SENDGRID_API_KEY'),
      fromEmail: getEnvVar('VITE_SENDGRID_FROM_EMAIL', 'noreply@earnpro.org'),
      fromName: getEnvVar('VITE_SENDGRID_FROM_NAME', 'EarnPro Team'),
    },
    
    // Application settings
    app: {
      name: getEnvVar('VITE_APP_NAME', 'EarnPro'),
      description: getEnvVar('VITE_APP_DESCRIPTION', 'The world\'s most trusted referral rewards platform'),
      version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
      url: getEnvVar('VITE_APP_URL'),
      apiBaseUrl: getEnvVar('VITE_API_BASE_URL'),
      environment: getEnvVar('VITE_APP_ENV', 'development') as 'development' | 'production' | 'test',
    },
    
    // AI Features
    ai: {
      analytics: getBooleanEnvVar('VITE_ENABLE_AI_ANALYTICS', true),
      smartMatching: getBooleanEnvVar('VITE_ENABLE_SMART_MATCHING', true),
      personalization: getBooleanEnvVar('VITE_ENABLE_PERSONALIZATION', true),
      predictiveInsights: getBooleanEnvVar('VITE_ENABLE_PREDICTIVE_INSIGHTS', true),
      anomalyDetection: getBooleanEnvVar('VITE_ENABLE_ANOMALY_DETECTION', true),
      modelUpdateInterval: getNumericEnvVar('VITE_AI_MODEL_UPDATE_INTERVAL', 3600000),
      predictionCacheTime: getNumericEnvVar('VITE_AI_PREDICTION_CACHE_TIME', 1800000),
      batchSize: getNumericEnvVar('VITE_AI_BATCH_SIZE', 100),
      confidenceThreshold: parseFloat(getEnvVar('VITE_AI_CONFIDENCE_THRESHOLD', '0.7')),
    },
    
    // TensorFlow.js settings
    tensorflow: {
      backend: getEnvVar('VITE_TENSORFLOW_BACKEND', 'webgl'),
      debug: getBooleanEnvVar('VITE_TENSORFLOW_DEBUG', false),
      memoryOptimization: getBooleanEnvVar('VITE_TENSORFLOW_MEMORY_OPTIMIZATION', true),
    },
    
    // Real-time features
    realtime: {
      enabled: getBooleanEnvVar('VITE_ENABLE_REALTIME', true),
      liveNotifications: getBooleanEnvVar('VITE_ENABLE_LIVE_NOTIFICATIONS', true),
      liveStats: getBooleanEnvVar('VITE_ENABLE_LIVE_STATS', true),
      liveMatching: getBooleanEnvVar('VITE_ENABLE_LIVE_MATCHING', true),
      maxReconnectAttempts: getNumericEnvVar('VITE_REALTIME_MAX_RECONNECT_ATTEMPTS', 5),
      reconnectDelay: getNumericEnvVar('VITE_REALTIME_RECONNECT_DELAY', 1000),
      heartbeatInterval: getNumericEnvVar('VITE_REALTIME_HEARTBEAT_INTERVAL', 30000),
      batchUpdates: getBooleanEnvVar('VITE_REALTIME_BATCH_UPDATES', true),
    },
    
    // Personalization
    personalization: {
      userProfiling: getBooleanEnvVar('VITE_ENABLE_USER_PROFILING', true),
      behaviorTracking: getBooleanEnvVar('VITE_ENABLE_BEHAVIOR_TRACKING', true),
      contentRecommendations: getBooleanEnvVar('VITE_ENABLE_CONTENT_RECOMMENDATIONS', true),
      dashboardCustomization: getBooleanEnvVar('VITE_ENABLE_DASHBOARD_CUSTOMIZATION', true),
      updateFrequency: getNumericEnvVar('VITE_PERSONALIZATION_UPDATE_FREQUENCY', 300000),
      behaviorLogBatchSize: getNumericEnvVar('VITE_BEHAVIOR_LOG_BATCH_SIZE', 50),
      recommendationCacheTime: getNumericEnvVar('VITE_RECOMMENDATION_CACHE_TIME', 600000),
    },
    
    // Smart matching
    matching: {
      compatibilityScoring: getBooleanEnvVar('VITE_ENABLE_COMPATIBILITY_SCORING', true),
      matchOptimization: getBooleanEnvVar('VITE_ENABLE_MATCH_OPTIMIZATION', true),
      campaignAI: getBooleanEnvVar('VITE_ENABLE_CAMPAIGN_AI', true),
      minCompatibility: parseFloat(getEnvVar('VITE_MATCHING_MIN_COMPATIBILITY', '0.6')),
      maxResults: getNumericEnvVar('VITE_MATCHING_MAX_RESULTS', 10),
      cacheDuration: getNumericEnvVar('VITE_MATCHING_CACHE_DURATION', 1800000),
      retrainInterval: getNumericEnvVar('VITE_MATCHING_RETRAIN_INTERVAL', 86400000),
    },
    
    // Analytics and insights
    analytics: {
      revenuePrediction: getBooleanEnvVar('VITE_ENABLE_REVENUE_PREDICTION', true),
      churnAnalysis: getBooleanEnvVar('VITE_ENABLE_CHURN_ANALYSIS', true),
      userSegmentation: getBooleanEnvVar('VITE_ENABLE_USER_SEGMENTATION', true),
      performanceTracking: getBooleanEnvVar('VITE_ENABLE_PERFORMANCE_TRACKING', true),
      retentionDays: getNumericEnvVar('VITE_ANALYTICS_RETENTION_DAYS', 90),
      insightsUpdateInterval: getNumericEnvVar('VITE_INSIGHTS_UPDATE_INTERVAL', 3600000),
      anomalyDetectionSensitivity: parseFloat(getEnvVar('VITE_ANOMALY_DETECTION_SENSITIVITY', '0.3')),
    },
    
    // Security settings
    security: {
      jwtExpiry: getNumericEnvVar('VITE_JWT_EXPIRY', 3600),
      rateLimitWindow: getNumericEnvVar('VITE_RATE_LIMIT_WINDOW', 900000),
      rateLimitMaxRequests: getNumericEnvVar('VITE_RATE_LIMIT_MAX_REQUESTS', 100),
      requestLogging: getBooleanEnvVar('VITE_ENABLE_REQUEST_LOGGING', true),
    },
    
    // Performance settings
    performance: {
      cacheApiResponses: getBooleanEnvVar('VITE_CACHE_API_RESPONSES', true),
      cacheDuration: getNumericEnvVar('VITE_CACHE_DURATION', 300000),
      enableCompression: getBooleanEnvVar('VITE_ENABLE_COMPRESSION', true),
      optimizeImages: getBooleanEnvVar('VITE_OPTIMIZE_IMAGES', true),
    },
    
    // Feature flags
    features: {
      darkMode: getBooleanEnvVar('VITE_FEATURE_DARK_MODE', true),
      advancedAnalytics: getBooleanEnvVar('VITE_FEATURE_ADVANCED_ANALYTICS', true),
      aiRecommendations: getBooleanEnvVar('VITE_FEATURE_AI_RECOMMENDATIONS', true),
      smartNotifications: getBooleanEnvVar('VITE_FEATURE_SMART_NOTIFICATIONS', true),
      betaAiFeatures: getBooleanEnvVar('VITE_FEATURE_BETA_AI_FEATURES', true),
    },
    
    // Development settings
    development: {
      isProduction: getEnvVar('NODE_ENV') === 'production',
      debugMode: getBooleanEnvVar('VITE_DEBUG_MODE', true),
      enableConsoleLogs: getBooleanEnvVar('VITE_ENABLE_CONSOLE_LOGS', true),
      debugAiModels: getBooleanEnvVar('VITE_DEBUG_AI_MODELS', false),
      debugRealtime: getBooleanEnvVar('VITE_DEBUG_REALTIME', false),
    },
  };

  return config;
}


/**
 * Comprehensive environment validation with better error messages
 */
export const validateEnvironment = (): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Critical validations - will prevent app from working
  if (!envConfig.supabase.url || envConfig.supabase.url === 'your_supabase_project_url_here') {
    errors.push('VITE_SUPABASE_URL is required for database connection');
  }
  
  if (!envConfig.supabase.anonKey || envConfig.supabase.anonKey === 'your_supabase_anon_key_here') {
    errors.push('VITE_SUPABASE_ANON_KEY is required for database authentication');
  }

  // Payment gateway validations - required for functionality
  if (!envConfig.paypal.clientId || envConfig.paypal.clientId === '') {
    errors.push('VITE_PAYPAL_CLIENT_ID is required for PayPal payments');
  }

  if (!envConfig.paypal.clientSecret || envConfig.paypal.clientSecret === '') {
    errors.push('VITE_PAYPAL_CLIENT_SECRET is required for PayPal payments');
  }

  // URL validations - important for proper redirects
  if (!envConfig.paypal.returnUrl) {
    warnings.push('VITE_PAYPAL_RETURN_URL should be set for proper payment flow');
  }

  if (!envConfig.paypal.cancelUrl) {
    warnings.push('VITE_PAYPAL_CANCEL_URL should be set for proper payment flow');
  }

  if (!envConfig.app.url) {
    warnings.push('VITE_APP_URL should be set for proper functionality');
  }
  
  // Production-specific validations
  if (envConfig.app.environment === 'production') {
    if (!envConfig.paystack.publicKey) {
      warnings.push('VITE_PAYSTACK_PUBLIC_KEY recommended for production payments');
    }
    
    if (!envConfig.sendgrid.apiKey || envConfig.sendgrid.apiKey === 'your_sendgrid_api_key_here') {
      warnings.push('VITE_SENDGRID_API_KEY recommended for production email sending');
    }

    if (envConfig.development.debugMode) {
      warnings.push('Debug mode should be disabled in production');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Log environment configuration status
 */
export function logEnvironmentStatus(config: EnvironmentConfig): void {
  if (!config.development.enableConsoleLogs) return;

  console.group('🔧 Environment Configuration Status');
  
  // Core services
  console.log('📊 Core Services:');
  console.log('  Supabase:', config.supabase.url ? '✅ Connected' : '❌ Not configured');
  console.log('  Paystack:', config.paystack.publicKey ? '✅ Configured' : '❌ Not configured');
  console.log('  SendGrid:', config.sendgrid.apiKey && config.sendgrid.apiKey !== 'your_sendgrid_api_key' ? '✅ Configured' : '⚠️ Not configured');
  
  // AI Features
  console.log('🤖 AI Features:');
  console.log('  Analytics:', config.ai.analytics ? '✅ Enabled' : '❌ Disabled');
  console.log('  Smart Matching:', config.ai.smartMatching ? '✅ Enabled' : '❌ Disabled');
  console.log('  Personalization:', config.ai.personalization ? '✅ Enabled' : '❌ Disabled');
  console.log('  Predictive Insights:', config.ai.predictiveInsights ? '✅ Enabled' : '❌ Disabled');
  console.log('  Anomaly Detection:', config.ai.anomalyDetection ? '✅ Enabled' : '❌ Disabled');
  
  // Real-time features
  console.log('⚡ Real-time Features:');
  console.log('  Real-time:', config.realtime.enabled ? '✅ Enabled' : '❌ Disabled');
  console.log('  Live Notifications:', config.realtime.liveNotifications ? '✅ Enabled' : '❌ Disabled');
  console.log('  Live Stats:', config.realtime.liveStats ? '✅ Enabled' : '❌ Disabled');
  console.log('  Live Matching:', config.realtime.liveMatching ? '✅ Enabled' : '❌ Disabled');
  
  // Environment mode
  console.log('🚀 Environment:');
  console.log('  Mode:', config.development.isProduction ? '🔴 Production' : '🟡 Development');
  console.log('  Debug Mode:', config.development.debugMode ? '✅ Enabled' : '❌ Disabled');
  
  console.groupEnd();
}

/**
 * Get a feature flag value
 */
export function isFeatureEnabled(featureName: keyof EnvironmentConfig['features'], config: EnvironmentConfig): boolean {
  return config.features[featureName] || false;
}

/**
 * Get AI feature status
 */
export function isAIFeatureEnabled(featureName: keyof EnvironmentConfig['ai'], config: EnvironmentConfig): boolean {
  return config.ai[featureName] as boolean || false;
}

// Create and export the global configuration
export const envConfig = createEnvironmentConfig();

// Debug: Log environment variables in development
if (envConfig.development.debugMode && envConfig.development.enableConsoleLogs) {
  console.group('🔧 Environment Variables Debug');
  console.log('Raw env vars:', {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SENDGRID_API_KEY: import.meta.env.VITE_SENDGRID_API_KEY ? 'SET' : 'NOT SET',
    VITE_PAYPAL_CLIENT_ID: import.meta.env.VITE_PAYPAL_CLIENT_ID ? 'SET' : 'NOT SET',
    VITE_PAYSTACK_PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ? 'SET' : 'NOT SET'
  });
  console.log('Processed config:', {
    supabase: {
      url: envConfig.supabase.url ? 'SET' : 'NOT SET',
      anonKey: envConfig.supabase.anonKey ? 'SET' : 'NOT SET'
    },
    sendgrid: {
      apiKey: envConfig.sendgrid.apiKey,
      fromEmail: envConfig.sendgrid.fromEmail
    },
    paypal: {
      clientId: envConfig.paypal.clientId
    }
  });
  console.groupEnd();
}

// Initialize and validate configuration on module load
if (envConfig.development.enableConsoleLogs && envConfig.development.debugMode) {
  logEnvironmentStatus(envConfig);
  
  const configValidation = validateEnvironment();
  
  if (!configValidation.isValid) {
    console.error('❌ Environment Configuration Errors:', configValidation.errors);
    console.error('🔧 Please check your .env file and ensure all required variables are set.');
  }
  
  if (configValidation.warnings.length > 0) {
    console.warn('⚠️ Environment Configuration Warnings:', configValidation.warnings);
  }
}

export default envConfig;
