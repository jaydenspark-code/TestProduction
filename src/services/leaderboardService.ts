import { supabase, isSupabaseConnected } from '../lib/supabase';
import { UserRanking, LeaderboardEntry, LeaderboardFilters, LeaderboardStats } from '../types/leaderboard';

export class LeaderboardService {
    private static instance: LeaderboardService;

    private constructor() {}

    public static getInstance(): LeaderboardService {
        if (!LeaderboardService.instance) {
            LeaderboardService.instance = new LeaderboardService();
        }
        return LeaderboardService.instance;
    }

    async getLeaderboard(filters: LeaderboardFilters): Promise<LeaderboardEntry[]> {
        console.log('Fetching leaderboard data with filters:', filters);
        let entries: LeaderboardEntry[] = [];
        
        // Generate mock data for testing (since database may not be connected)
        console.log(`Generating mock entries for leaderboard...`);
        const mockEntries: LeaderboardEntry[] = Array.from({ length: 500 }, (_, i) => {
            const userCategory = filters.category === 'agent' ? 'Agent' : 'Regular';
            const countries = ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP', 'BR', 'IN', 'NG', 'GH', 'ZA'];
            
            return {
                id: `mock-${filters.category}-${i}`,
                userId: `${filters.category}-user-${i}`,
                points: Math.floor(Math.random() * 2000) + 8000 - (i * 5), // Start high and decrease
                rank: i + 1,
                rankCategory: filters.category,
                optIn: true,
                lastUpdated: new Date(),
                createdAt: new Date(),
                user: {
                    username: `${userCategory.toLowerCase()}user${i + 1}`,
                    fullName: `${userCategory} User ${i + 1}`,
                    profileImage: null,
                    country: countries[Math.floor(Math.random() * countries.length)],
                    isVerified: Math.random() > 0.7
                },
                stats: {
                    totalEarnings: Math.floor(Math.random() * 5000) + 1000,
                    referralCount: Math.floor(Math.random() * 50) + 5,
                    completedTasks: Math.floor(Math.random() * 100) + 10
                }
            };
        });

        // Sort mock entries by points in descending order
        entries = mockEntries.sort((a, b) => b.points - a.points);
        
        // Update ranks for all entries
        entries.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        console.log(`Returning ${entries.length} leaderboard entries`);
        return entries;
    }

    async getUserRanking(userId: string, category: 'regular' | 'agent'): Promise<UserRanking | null> {
        if (!supabase || !isSupabaseConnected()) {
            console.log('No database connection, returning null for user ranking');
            return null;
        }
        
        try {
            const { data, error } = await supabase
                .from('user_rankings')
                .select('*')
                .eq('user_id', userId)
                .eq('rank_category', category)
                .single();

            if (error) return null;
            return data as UserRanking;
        } catch (error) {
            console.error('Exception getting user ranking:', error);
            return null;
        }
    }

    async updateOptInStatus(userId: string, category: 'regular' | 'agent', optIn: boolean): Promise<boolean> {
        if (!supabase || !isSupabaseConnected()) {
            console.log('No database connection, simulating opt-in status update');
            return true; // Simulate success in testing mode
        }
        
        try {
            const { error } = await supabase
                .from('user_rankings')
                .update({ opt_in: optIn })
                .eq('user_id', userId)
                .eq('rank_category', category);

            return !error;
        } catch (error) {
            console.error('Exception updating opt-in status:', error);
            return false;
        }
    }

    async getLeaderboardStats(category: 'regular' | 'agent'): Promise<LeaderboardStats> {
        let rankings = null;
        let error = null;
        
        if (supabase && isSupabaseConnected()) {
            try {
                const result = await supabase
                    .from('user_rankings')
                    .select(`
                        points,
                        users!user_id(country)
                    `)
                    .eq('rank_category', category)
                    .eq('opt_in', true);
                
                rankings = result.data;
                error = result.error;
            } catch (e) {
                console.error('Exception fetching leaderboard stats:', e);
                error = e;
            }
        } else {
            console.log('No database connection, using mock stats');
        }

        if (error || !rankings || rankings.length === 0) {
            // Generate mock stats if no real data exists
            const mockCountries = ['US', 'UK', 'CA', 'AU', 'DE'];
            const mockPoints = Array.from({ length: 100 }, () => Math.floor(Math.random() * 10000) + 5000);
            
            const countryCount = mockCountries.reduce((acc, country) => {
                acc[country] = Math.floor(Math.random() * 30) + 10; // Random number of users per country
                return acc;
            }, {} as Record<string, number>);

            const topCountries = Object.entries(countryCount)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
            .map(([country, count]) => ({ country, participantCount: count }));

            const totalParticipants = 100; // Mock total participants
            const averagePoints = mockPoints.reduce((sum, points) => sum + points, 0) / totalParticipants;

            return {
                totalParticipants,
                averagePoints,
                topCountries,
                lastUpdated: new Date()
            };
        }

        // Process real data if available
        const totalParticipants = rankings.length;
        const averagePoints = rankings.reduce((sum, curr) => sum + curr.points, 0) / totalParticipants;

        const countryCount = rankings.reduce((acc, curr) => {
            const country = curr.users.country;
            acc[country] = (acc[country] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topCountries = Object.entries(countryCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([country, count]) => ({ country, participantCount: count }));

        return {
            totalParticipants,
            averagePoints,
            topCountries,
            lastUpdated: new Date()
        };
    }
}

export const leaderboardService = LeaderboardService.getInstance();