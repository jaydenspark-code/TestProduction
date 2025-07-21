export interface User {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  country: string;
  currency: string;
  isVerified: boolean;
  isPaidUser: boolean;
  referralCode: string;
  referredBy?: string;
  role: 'user' | 'agent' | 'advertiser' | 'admin' | 'superadmin';
  adminLevel?: 'regular' | 'super';
  isAgent: boolean;
  agentStatus?: 'pending' | 'approved' | 'rejected' | 'probation';
  isAdvertiser?: boolean;
  probationEndDate?: Date;
  socialPlatform?: string;
  socialChannelLink?: string;
  followerCount?: number;
  theme?: 'classic' | 'professional';
  createdAt: Date;
  lastLogin?: Date;
  notificationSettings?: {
    email: boolean;
    inApp: boolean;
  };
  twoFactorEnabled?: boolean; // New field for 2FA status
}

export interface ReferralStats {
  directReferrals: number;
  indirectReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  level2Earnings: number;
  level3Earnings: number;
  weeklyReferrals: number;
  cumulativeReferrals: number;
  currentWeekEarnings: number;
  weeklyCommission: number;
  withdrawalFrequency: 'once' | 'twice' | 'thrice';
  taskEarnings: number;
  completedTasks: number;
}

export interface AgentStats {
  totalNetwork: number;
  activeUsers: number;
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  conversionRate: number;
  currentWeek: number;
  cumulativeReferrals: number;
  weeklyReferrals: number;
  commissionRate: number;
  agentLevel: 'Week 1' | 'Week 2' | 'Week 3' | 'Week 4' | 'Gold Agent';
  milestoneProgress: {
    week1: boolean;
    week2: boolean;
    week3: boolean;
    week4: boolean;
    goldAgent: boolean;
  };
  topPerformers: Array<{
    name: string;
    referrals: number;
    earnings: number;
  }>;
}

export interface AgentApplication {
  id: string;
  userId: string;
  socialPlatform: string;
  channelLink: string;
  followerCount: number;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'telegram' | 'social' | 'survey';
  reward: number;
  duration?: number; // for video tasks in seconds
  url?: string; // video URL or telegram channel
  requiredWatchPercentage?: number; // for video tasks
  isCompleted: boolean;
  isLocked: boolean;
  completedAt?: Date;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  order: number;
}

export interface TaskProgress {
  taskId: string;
  userId: string;
  progress: number; // 0-100 for video watch percentage
  startedAt: Date;
  completedAt?: Date;
  verified: boolean;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  budget: number;
  targetCountries: string[];
  status: 'active' | 'paused' | 'completed';
  impressions: number;
  clicks: number;
  conversions: number;
  createdAt: Date;
}

export interface AdvertiserCampaign {
  id: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  campaignTitle: string;
  campaignDescription: string;
  targetAudience: string;
  budgetRange: string;
  duration: string;
  objectives: string[];
  status: 'pending' | 'approved' | 'active' | 'completed' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
}

export interface CurrencyRates {
  [key: string]: number;
}

export interface PaymentInfo {
  amount: number;
  currency: string;
  localAmount: number;
  exchangeRate: number;
}

export interface SocialPlatform {
  id: string;
  name: string;
  minFollowers: number;
  icon: string;
}

export interface Country {
  code: string;
  name: string;
  currency: string;
  flag: string;
  phoneCode: string;
}