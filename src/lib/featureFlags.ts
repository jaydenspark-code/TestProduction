// src/lib/featureFlags.ts
export const features = {
  aiAnalytics: {
    enabled: Boolean(import.meta.env.VITE_ENABLE_AI_ANALYTICS === 'true'),
    fallback: () => ({ /* simplified non-AI analytics */ })
  },
  payments: {
    enabled: Boolean(import.meta.env.VITE_PAYSTACK_PUBLIC_KEY),
    fallback: () => ({ /* mock payment for testing */ })
  }
};

// Create a type for the feature names
type FeatureName = keyof typeof features;

export function useFeature(featureName: FeatureName) {
  const feature = features[featureName];
  if (!feature) return { enabled: false };
  
  return {
    enabled: feature.enabled,
    fallback: feature.fallback
  };
}