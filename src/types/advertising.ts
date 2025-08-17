// Advertising Platform Types

export interface AdCampaign {
  id: string;
  title: string;
  description: string;
  advertiser: {
    id: string;
    name: string;
    logo?: string;
  };
  targeting: {
    countries: string[];
    ageRange: [number, number];
    interests: string[];
    languages: string[];
  };
  budget: {
    total: number;
    spent: number;
    dailyLimit: number;
  };
  reward: {
    type: 'per_view' | 'per_click' | 'per_completion';
    amount: number;
  };
  schedule: {
    startDate: Date;
    endDate: Date;
    timezone: string;
  };
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    engagement: number;
  };
  status: 'active' | 'paused' | 'completed' | 'draft';
  priority: number;
  category: string;
  imageUrl?: string;
  videoUrl?: string;
  callToAction: string;
  requirements?: string[];
  estimatedDuration?: number; // in minutes
}

export interface UserActivity {
  id: string;
  userId: string;
  campaignId: string;
  action: 'view' | 'click' | 'complete' | 'share' | 'like';
  timestamp: Date;
  reward: number;
  location?: string;
  device: 'mobile' | 'desktop' | 'tablet' | 'web';
  metadata?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  location?: string;
  age?: number;
  interests: string[];
  deviceType: 'mobile' | 'desktop' | 'tablet';
  language: string;
  timezone: string;
}

export interface AdPlacement {
  id: string;
  type: 'banner' | 'sidebar' | 'modal' | 'native' | 'interstitial';
  position: string;
  dimensions: {
    width: number;
    height: number;
  };
  active: boolean;
  zone?: string;
  priority?: number;
}

export interface CampaignMetrics {
  campaignId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  clickThroughRate: number;
  conversionRate: number;
  totalSpent: number;
  averageCostPerClick: number;
  averageCostPerConversion: number;
  revenueGenerated: number;
  uniqueUsers: number;
  engagementRate: number;
}

export interface AdvertiserDashboard {
  campaigns: AdCampaign[];
  totalSpent: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageROI: number;
  activeCampaigns: number;
  pendingCampaigns: number;
}

export interface UserEarnings {
  userId: string;
  totalEarned: number;
  pendingEarnings: number;
  withdrawnAmount: number;
  lastActivity: Date;
  activitiesCount: number;
  topCategory: string;
  monthlyEarnings: Record<string, number>; // month -> amount
}

export interface DetailedUserEarnings {
  total: number;
  byActivity: {
    view: number;
    click: number;
    complete: number;
    share: number;
    like: number;
  };
  activityCount: {
    view: number;
    click: number;
    complete: number;
    share: number;
    like: number;
  };
  timeframe: 'today' | 'week' | 'month' | 'all';
}

export interface CampaignFilter {
  category?: string;
  minReward?: number;
  maxReward?: number;
  estimatedTime?: number;
  status?: AdCampaign['status'];
  sortBy?: 'newest' | 'highest_reward' | 'popular' | 'ending_soon';
  search?: string;
}

export interface AdInteractionEvent {
  campaignId: string;
  userId: string;
  action: UserActivity['action'];
  timestamp: Date;
  placement?: string;
  metadata?: Record<string, any>;
}

export interface CampaignPerformance {
  campaignId: string;
  period: 'today' | 'week' | 'month' | 'all_time';
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    spent: number;
    earned: number;
    ctr: number;
    cvr: number;
    cpc: number;
    cpa: number;
  };
  topPerformingPlacements: string[];
  topPerformingCountries: string[];
  hourlyBreakdown: Array<{
    hour: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }>;
}

export interface AdvertisingConfig {
  maxCampaignsPerUser: number;
  minCampaignBudget: number;
  maxCampaignBudget: number;
  defaultRewardRates: {
    view: number;
    click: number;
    completion: number;
  };
  frequencyCaps: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  supportedCountries: string[];
  supportedLanguages: string[];
  categories: string[];
}
