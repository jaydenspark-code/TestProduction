/// <reference types="vite/client" />

// Add type definitions for environment variables
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_PAYSTACK_PUBLIC_KEY: string;
  readonly VITE_PAYSTACK_SECRET_KEY: string;
  readonly VITE_PAYSTACK_CALLBACK_URL: string;
  readonly VITE_PAYSTACK_WEBHOOK_URL: string;
  readonly VITE_SENDGRID_API_KEY: string;
  readonly VITE_SENDGRID_FROM_EMAIL: string;
  readonly VITE_SENDGRID_FROM_NAME: string;
  readonly VITE_APP_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_DESCRIPTION: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_API_BASE_URL: string;
  readonly NODE_ENV: string;
  
  // AI Features
  readonly VITE_ENABLE_AI_ANALYTICS: string;
  readonly VITE_ENABLE_SMART_MATCHING: string;
  readonly VITE_ENABLE_PERSONALIZATION: string;
  readonly VITE_ENABLE_PREDICTIVE_INSIGHTS: string;
  readonly VITE_ENABLE_ANOMALY_DETECTION: string;
  readonly VITE_AI_MODEL_UPDATE_INTERVAL: string;
  readonly VITE_AI_PREDICTION_CACHE_TIME: string;
  readonly VITE_AI_BATCH_SIZE: string;
  readonly VITE_AI_CONFIDENCE_THRESHOLD: string;
  
  // TensorFlow.js
  readonly VITE_TENSORFLOW_BACKEND: string;
  readonly VITE_TENSORFLOW_DEBUG: string;
  readonly VITE_TENSORFLOW_MEMORY_OPTIMIZATION: string;
  
  // Real-time features
  readonly VITE_ENABLE_REALTIME: string;
  readonly VITE_ENABLE_LIVE_NOTIFICATIONS: string;
  readonly VITE_ENABLE_LIVE_STATS: string;
  readonly VITE_ENABLE_LIVE_MATCHING: string;
  readonly VITE_REALTIME_MAX_RECONNECT_ATTEMPTS: string;
  readonly VITE_REALTIME_RECONNECT_DELAY: string;
  readonly VITE_REALTIME_HEARTBEAT_INTERVAL: string;
  readonly VITE_REALTIME_BATCH_UPDATES: string;
  
  // Personalization
  readonly VITE_ENABLE_USER_PROFILING: string;
  readonly VITE_ENABLE_BEHAVIOR_TRACKING: string;
  readonly VITE_ENABLE_CONTENT_RECOMMENDATIONS: string;
  readonly VITE_ENABLE_DASHBOARD_CUSTOMIZATION: string;
  readonly VITE_PERSONALIZATION_UPDATE_FREQUENCY: string;
  readonly VITE_BEHAVIOR_LOG_BATCH_SIZE: string;
  readonly VITE_RECOMMENDATION_CACHE_TIME: string;
  
  // Smart matching
  readonly VITE_ENABLE_COMPATIBILITY_SCORING: string;
  readonly VITE_ENABLE_MATCH_OPTIMIZATION: string;
  readonly VITE_ENABLE_CAMPAIGN_AI: string;
  readonly VITE_MATCHING_MIN_COMPATIBILITY: string;
  readonly VITE_MATCHING_MAX_RESULTS: string;
  readonly VITE_MATCHING_CACHE_DURATION: string;
  readonly VITE_MATCHING_RETRAIN_INTERVAL: string;
  
  // Analytics
  readonly VITE_ENABLE_REVENUE_PREDICTION: string;
  readonly VITE_ENABLE_CHURN_ANALYSIS: string;
  readonly VITE_ENABLE_USER_SEGMENTATION: string;
  readonly VITE_ENABLE_PERFORMANCE_TRACKING: string;
  readonly VITE_ANALYTICS_RETENTION_DAYS: string;
  readonly VITE_INSIGHTS_UPDATE_INTERVAL: string;
  readonly VITE_ANOMALY_DETECTION_SENSITIVITY: string;
  
  // Security
  readonly VITE_JWT_EXPIRY: string;
  readonly VITE_RATE_LIMIT_WINDOW: string;
  readonly VITE_RATE_LIMIT_MAX_REQUESTS: string;
  readonly VITE_ENABLE_REQUEST_LOGGING: string;
  
  // Performance
  readonly VITE_CACHE_API_RESPONSES: string;
  readonly VITE_CACHE_DURATION: string;
  readonly VITE_ENABLE_COMPRESSION: string;
  readonly VITE_OPTIMIZE_IMAGES: string;
  
  // Feature flags
  readonly VITE_FEATURE_DARK_MODE: string;
  readonly VITE_FEATURE_ADVANCED_ANALYTICS: string;
  readonly VITE_FEATURE_AI_RECOMMENDATIONS: string;
  readonly VITE_FEATURE_SMART_NOTIFICATIONS: string;
  readonly VITE_FEATURE_BETA_AI_FEATURES: string;
  
  // Development
  readonly VITE_DEBUG_MODE: string;
  readonly VITE_ENABLE_CONSOLE_LOGS: string;
  readonly VITE_DEBUG_AI_MODELS: string;
  readonly VITE_DEBUG_REALTIME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Add type definition for window.tf (TensorFlow)
interface Window {
  tf: any; // You can replace 'any' with a more specific type if you have TensorFlow typings
}