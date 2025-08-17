export interface UserRanking {
    id: string;
    userId: string;
    points: number;
    rank: number;
    rankCategory: 'regular' | 'agent';
    optIn: boolean;
    lastUpdated: Date;
    createdAt: Date;
}

export interface LeaderboardEntry extends UserRanking {
    user: {
        username: string;
        fullName: string;
        profileImage?: string;
        country: string;
        isVerified: boolean;
    };
    stats: {
        totalEarnings: number;
        referralCount: number;
        completedTasks: number;
    };
}

export interface LeaderboardFilters {
    category: 'regular' | 'agent';
    timeframe?: 'all-time' | 'monthly' | 'weekly';
    country?: string;
}

export interface LeaderboardStats {
    totalParticipants: number;
    averagePoints: number;
    topCountries: Array<{
        country: string;
        participantCount: number;
    }>;
    lastUpdated: Date;
}