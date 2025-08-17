export interface AdvertisingPackage {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: number; // in days
  features: PackageFeature[];
  limits: PackageLimits;
  popular?: boolean;
  description: string;
  created_at: Date;
  updated_at: Date;
}

export interface PackageFeature {
  id: string;
  name: string;
  description: string;
  included: boolean;
}

export interface PackageLimits {
  maxCampaigns: number;
  maxImpressions: number;
  maxClicks: number;
  maxBudget: number;
  targetingOptions: string[];
  analyticsLevel: 'basic' | 'advanced' | 'premium';
  supportLevel: 'basic' | 'priority' | 'dedicated';
  aiOptimization: boolean;
  abTesting: boolean;
  audienceInsights: boolean;
}

export interface UserPackage {
  id: string;
  userId: string;
  packageId: string;
  package: AdvertisingPackage;
  status: 'active' | 'expired' | 'cancelled';
  purchaseDate: Date;
  expiryDate: Date;
  remainingCampaigns: number;
  remainingImpressions: number;
  remainingClicks: number;
  remainingBudget: number;
  paymentReference: string;
  autoRenew: boolean;
}

export interface PackagePurchase {
  id: string;
  userId: string;
  packageId: string;
  amount: number;
  currency: string;
  paymentGateway: 'paystack' | 'stripe' | 'paypal';
  paymentReference: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export const DEFAULT_PACKAGES: AdvertisingPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 5000,
    currency: 'NGN',
    duration: 30,
    popular: false,
    description: 'Perfect for small businesses getting started with digital advertising',
    features: [
      { id: '1', name: 'Campaign Creation', description: 'Create and manage advertising campaigns', included: true },
      { id: '2', name: 'Basic Analytics', description: 'View basic performance metrics', included: true },
      { id: '3', name: 'Email Support', description: 'Get help via email support', included: true },
      { id: '4', name: 'AI Optimization', description: 'AI-powered campaign optimization', included: false },
      { id: '5', name: 'A/B Testing', description: 'Test multiple ad variations', included: false },
      { id: '6', name: 'Advanced Analytics', description: 'Detailed performance insights', included: false },
    ],
    limits: {
      maxCampaigns: 3,
      maxImpressions: 10000,
      maxClicks: 500,
      maxBudget: 50000,
      targetingOptions: ['location', 'age', 'gender'],
      analyticsLevel: 'basic',
      supportLevel: 'basic',
      aiOptimization: false,
      abTesting: false,
      audienceInsights: false,
    },
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 15000,
    currency: 'NGN',
    duration: 30,
    popular: true,
    description: 'Ideal for growing businesses that need advanced features',
    features: [
      { id: '1', name: 'Campaign Creation', description: 'Create and manage advertising campaigns', included: true },
      { id: '2', name: 'Advanced Analytics', description: 'Detailed performance insights and reporting', included: true },
      { id: '3', name: 'Priority Support', description: 'Get faster response times', included: true },
      { id: '4', name: 'AI Optimization', description: 'AI-powered campaign optimization', included: true },
      { id: '5', name: 'A/B Testing', description: 'Test multiple ad variations', included: true },
      { id: '6', name: 'Audience Insights', description: 'Deep audience analytics', included: true },
    ],
    limits: {
      maxCampaigns: 10,
      maxImpressions: 50000,
      maxClicks: 2500,
      maxBudget: 200000,
      targetingOptions: ['location', 'age', 'gender', 'interests', 'behavior'],
      analyticsLevel: 'advanced',
      supportLevel: 'priority',
      aiOptimization: true,
      abTesting: true,
      audienceInsights: true,
    },
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 50000,
    currency: 'NGN',
    duration: 30,
    popular: false,
    description: 'Comprehensive solution for large businesses and agencies',
    features: [
      { id: '1', name: 'Unlimited Campaigns', description: 'Create unlimited advertising campaigns', included: true },
      { id: '2', name: 'Premium Analytics', description: 'Enterprise-grade analytics and reporting', included: true },
      { id: '3', name: 'Dedicated Support', description: 'Personal account manager', included: true },
      { id: '4', name: 'AI Optimization', description: 'Advanced AI-powered optimization', included: true },
      { id: '5', name: 'A/B Testing', description: 'Advanced testing capabilities', included: true },
      { id: '6', name: 'Audience Insights', description: 'Deep audience analytics and segmentation', included: true },
      { id: '7', name: 'White Label', description: 'Brand the platform with your logo', included: true },
      { id: '8', name: 'API Access', description: 'Full API access for integrations', included: true },
    ],
    limits: {
      maxCampaigns: -1, // unlimited
      maxImpressions: 500000,
      maxClicks: 25000,
      maxBudget: 1000000,
      targetingOptions: ['location', 'age', 'gender', 'interests', 'behavior', 'custom_audiences', 'lookalike'],
      analyticsLevel: 'premium',
      supportLevel: 'dedicated',
      aiOptimization: true,
      abTesting: true,
      audienceInsights: true,
    },
    created_at: new Date(),
    updated_at: new Date(),
  },
];
