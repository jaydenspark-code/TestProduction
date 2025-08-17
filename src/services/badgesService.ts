import { supabase } from '../lib/supabase';

export interface UserBadge {
  id: string;
  userId: string;
  badgeName: string;
  badgeIcon?: string;
  badgeLevel?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  earnedPoints: number;
  earnedAt: Date;
  description?: string;
  requirements?: string[];
}

export interface BadgeType {
  name: string;
  icon: string;
  description: string;
  requirements: string[];
  pointsRequired: number;
  level: UserBadge['badgeLevel'];
  category: 'earnings' | 'referrals' | 'engagement' | 'milestones' | 'special';
}

class BadgesService {
  async getUserBadges(userId: string): Promise<{ data: UserBadge[] | null; error: any }> {
    try {
      if (!supabase) {
        return { data: this.getMockUserBadges(userId), error: null };
      }

      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;

      const badges: UserBadge[] = data?.map(badge => ({
        id: badge.id,
        userId: badge.user_id,
        badgeName: badge.badge_name,
        badgeIcon: badge.badge_icon,
        badgeLevel: badge.badge_level,
        earnedPoints: badge.earned_points,
        earnedAt: new Date(badge.earned_at),
        description: this.getBadgeDescription(badge.badge_name),
        requirements: this.getBadgeRequirements(badge.badge_name)
      })) || [];

      return { data: badges, error: null };
    } catch (error) {
      console.error('Error fetching user badges:', error);
      return { data: null, error };
    }
  }

  async getAllBadgeTypes(): Promise<{ data: BadgeType[] | null; error: any }> {
    try {
      // For now, return predefined badge types
      // In the future, this could come from a badges_catalog table
      return { data: this.getBadgeTypes(), error: null };
    } catch (error) {
      console.error('Error fetching badge types:', error);
      return { data: null, error };
    }
  }

  async awardBadge(userId: string, badgeName: string, earnedPoints: number = 0): Promise<{ success: boolean; error?: any }> {
    try {
      if (!supabase) {
        return { success: true };
      }

      // Check if user already has this badge
      const { data: existingBadge } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_name', badgeName)
        .single();

      if (existingBadge) {
        return { success: false, error: 'Badge already awarded to user' };
      }

      const badgeInfo = this.getBadgeInfo(badgeName);

      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_name: badgeName,
          badge_icon: badgeInfo?.icon,
          badge_level: badgeInfo?.level,
          earned_points: earnedPoints
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error awarding badge:', error);
      return { success: false, error };
    }
  }

  async checkAndAwardBadges(userId: string, userStats: {
    totalEarnings?: number;
    totalReferrals?: number;
    tasksCompleted?: number;
    loginStreak?: number;
    reviewsPosted?: number;
    storiesShared?: number;
  }): Promise<{ newBadges: string[]; error?: any }> {
    try {
      const newBadges: string[] = [];

      // Get current user badges to avoid duplicates
      const { data: currentBadges } = await this.getUserBadges(userId);
      const currentBadgeNames = currentBadges?.map(b => b.badgeName) || [];

      // Check earnings badges
      if (userStats.totalEarnings && userStats.totalEarnings >= 100 && !currentBadgeNames.includes('First Century')) {
        await this.awardBadge(userId, 'First Century', 100);
        newBadges.push('First Century');
      }

      if (userStats.totalEarnings && userStats.totalEarnings >= 1000 && !currentBadgeNames.includes('Money Maker')) {
        await this.awardBadge(userId, 'Money Maker', 500);
        newBadges.push('Money Maker');
      }

      // Check referral badges
      if (userStats.totalReferrals && userStats.totalReferrals >= 10 && !currentBadgeNames.includes('Referral Pro')) {
        await this.awardBadge(userId, 'Referral Pro', 200);
        newBadges.push('Referral Pro');
      }

      if (userStats.totalReferrals && userStats.totalReferrals >= 100 && !currentBadgeNames.includes('Network Builder')) {
        await this.awardBadge(userId, 'Network Builder', 1000);
        newBadges.push('Network Builder');
      }

      // Check engagement badges
      if (userStats.loginStreak && userStats.loginStreak >= 7 && !currentBadgeNames.includes('Week Warrior')) {
        await this.awardBadge(userId, 'Week Warrior', 100);
        newBadges.push('Week Warrior');
      }

      if (userStats.reviewsPosted && userStats.reviewsPosted >= 5 && !currentBadgeNames.includes('Reviewer')) {
        await this.awardBadge(userId, 'Reviewer', 150);
        newBadges.push('Reviewer');
      }

      return { newBadges };
    } catch (error) {
      console.error('Error checking and awarding badges:', error);
      return { newBadges: [], error };
    }
  }

  async getUserBadgeStats(userId: string): Promise<{ 
    data: { 
      totalBadges: number; 
      totalPoints: number; 
      recentBadges: UserBadge[];
      badgesByCategory: Record<string, number>;
    } | null; 
    error: any 
  }> {
    try {
      const { data: badges, error } = await this.getUserBadges(userId);

      if (error) throw error;

      if (!badges) {
        return { data: null, error: null };
      }

      const totalBadges = badges.length;
      const totalPoints = badges.reduce((sum, badge) => sum + badge.earnedPoints, 0);
      const recentBadges = badges.slice(0, 3); // Last 3 badges

      // Group badges by category
      const badgesByCategory: Record<string, number> = {};
      badges.forEach(badge => {
        const badgeInfo = this.getBadgeInfo(badge.badgeName);
        const category = badgeInfo?.category || 'other';
        badgesByCategory[category] = (badgesByCategory[category] || 0) + 1;
      });

      return {
        data: {
          totalBadges,
          totalPoints,
          recentBadges,
          badgesByCategory
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching user badge stats:', error);
      return { data: null, error };
    }
  }

  private getBadgeTypes(): BadgeType[] {
    return [
      {
        name: 'First Century',
        icon: '💰',
        description: 'Earned your first $100',
        requirements: ['Earn $100 total'],
        pointsRequired: 100,
        level: 'bronze',
        category: 'earnings'
      },
      {
        name: 'Money Maker',
        icon: '💎',
        description: 'Earned $1,000 total',
        requirements: ['Earn $1,000 total'],
        pointsRequired: 1000,
        level: 'gold',
        category: 'earnings'
      },
      {
        name: 'Referral Pro',
        icon: '🤝',
        description: 'Referred 10 active users',
        requirements: ['Refer 10 active users'],
        pointsRequired: 200,
        level: 'silver',
        category: 'referrals'
      },
      {
        name: 'Network Builder',
        icon: '🌐',
        description: 'Built a network of 100+ referrals',
        requirements: ['Refer 100+ active users'],
        pointsRequired: 1000,
        level: 'platinum',
        category: 'referrals'
      },
      {
        name: 'Week Warrior',
        icon: '🔥',
        description: 'Maintained a 7-day login streak',
        requirements: ['Login for 7 consecutive days'],
        pointsRequired: 100,
        level: 'bronze',
        category: 'engagement'
      },
      {
        name: 'Streak Master',
        icon: '⚡',
        description: 'Maintained a 30-day login streak',
        requirements: ['Login for 30 consecutive days'],
        pointsRequired: 500,
        level: 'gold',
        category: 'engagement'
      },
      {
        name: 'Reviewer',
        icon: '⭐',
        description: 'Posted 5 helpful reviews',
        requirements: ['Post 5 reviews'],
        pointsRequired: 150,
        level: 'silver',
        category: 'engagement'
      },
      {
        name: 'Story Teller',
        icon: '📖',
        description: 'Shared 3 success stories',
        requirements: ['Share 3 success stories'],
        pointsRequired: 200,
        level: 'silver',
        category: 'engagement'
      },
      {
        name: 'Challenge Champion',
        icon: '🏆',
        description: 'Won a community challenge',
        requirements: ['Place 1st in any challenge'],
        pointsRequired: 1000,
        level: 'platinum',
        category: 'special'
      },
      {
        name: 'Early Adopter',
        icon: '🌟',
        description: 'One of the first 1000 users',
        requirements: ['Join within first 1000 users'],
        pointsRequired: 500,
        level: 'diamond',
        category: 'special'
      }
    ];
  }

  private getBadgeInfo(badgeName: string): BadgeType | undefined {
    return this.getBadgeTypes().find(badge => badge.name === badgeName);
  }

  private getBadgeDescription(badgeName: string): string {
    return this.getBadgeInfo(badgeName)?.description || '';
  }

  private getBadgeRequirements(badgeName: string): string[] {
    return this.getBadgeInfo(badgeName)?.requirements || [];
  }

  private getMockUserBadges(userId: string): UserBadge[] {
    return [
      {
        id: '1',
        userId,
        badgeName: 'First Century',
        badgeIcon: '💰',
        badgeLevel: 'bronze',
        earnedPoints: 100,
        earnedAt: new Date('2024-01-15'),
        description: 'Earned your first $100',
        requirements: ['Earn $100 total']
      },
      {
        id: '2',
        userId,
        badgeName: 'Week Warrior',
        badgeIcon: '🔥',
        badgeLevel: 'bronze',
        earnedPoints: 100,
        earnedAt: new Date('2024-01-20'),
        description: 'Maintained a 7-day login streak',
        requirements: ['Login for 7 consecutive days']
      },
      {
        id: '3',
        userId,
        badgeName: 'Referral Pro',
        badgeIcon: '🤝',
        badgeLevel: 'silver',
        earnedPoints: 200,
        earnedAt: new Date('2024-01-25'),
        description: 'Referred 10 active users',
        requirements: ['Refer 10 active users']
      }
    ];
  }
}

export const badgesService = new BadgesService();
export default badgesService;
