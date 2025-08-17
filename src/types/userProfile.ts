export interface UserPrivacySettings {
    id: string;
    userId: string;
    showPublicProfile: boolean;
    showNetworkOverview: boolean;
    showAchievements: boolean;
    showRankHistory: boolean;
    showActivity: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserAchievement {
    id: string;
    userId: string;
    achievementType: string;
    achievementName: string;
    achievementDescription?: string;
    achievementIcon?: string;
    achievementLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    pointsEarned: number;
    earnedAt: string;
}

export interface UserActivity {
    id: string;
    userId: string;
    activityType: string;
    activityDescription: string;
    pointsEarned: number;
    metadata: Record<string, any>;
    createdAt: string;
}

export interface UserRankHistory {
    id: string;
    userId: string;
    rankCategory: 'regular' | 'agent';
    rankPosition: number;
    points: number;
    recordedAt: string;
}

export interface NetworkStats {
    totalReferrals: number;
    activeReferrals: number;
    networkDepth: number;
    networkValue: number;
    totalEarningsFromNetwork: number;
    monthlyGrowth: number;
}

export interface UserProfileData {
    // Basic user info
    id: string;
    username?: string;
    fullName: string;
    profileImage?: string;
    country?: string;
    isVerified: boolean;
    isAgent: boolean;
    memberSince: string;
    
    // Ranking info
    currentRank: number;
    currentPoints: number;
    rankCategory: 'regular' | 'agent';
    
    // Privacy settings
    privacySettings: UserPrivacySettings;
    
    // Profile data (conditionally included based on privacy)
    achievements?: UserAchievement[];
    recentActivity?: UserActivity[];
    rankHistory?: UserRankHistory[];
    networkStats?: NetworkStats;
    
    // Stats
    totalEarnings: number;
    completedTasks: number;
    successRate: number;
}
