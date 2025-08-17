import { supabase } from '../lib/supabase';

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  type: 'earnings' | 'referrals' | 'tasks' | 'engagement' | 'streak';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  startDate: Date;
  endDate: Date;
  participants: number;
  maxParticipants?: number;
  target: number;
  metric: string;
  timeframe: string;
  rewards?: {
    first?: string;
    second?: string;
    third?: string;
    participation?: string;
  };
  requirements?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  progress: number;
  percentage: number;
  rank?: number;
  joinedAt: Date;
  lastUpdated: Date;
}

export interface CreateChallengeData {
  title: string;
  description: string;
  type: CommunityChallenge['type'];
  difficulty: CommunityChallenge['difficulty'];
  startDate: Date;
  endDate: Date;
  maxParticipants?: number;
  target: number;
  metric: string;
  timeframe: string;
  rewards?: CommunityChallenge['rewards'];
  requirements?: string[];
}

class ChallengesService {
  async getChallenges(filters?: {
    status?: string;
    type?: string;
    difficulty?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: CommunityChallenge[] | null; error: any }> {
    try {
      if (!supabase) {
        return { data: this.getMockChallenges(), error: null };
      }

      let query = supabase
        .from('community_challenges')
        .select('*')
        .order('start_date', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }

      if (filters?.difficulty && filters.difficulty !== 'all') {
        query = query.eq('difficulty', filters.difficulty);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      const challenges: CommunityChallenge[] = data?.map(challenge => ({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        difficulty: challenge.difficulty,
        status: challenge.status,
        startDate: new Date(challenge.start_date),
        endDate: new Date(challenge.end_date),
        participants: challenge.participants,
        maxParticipants: challenge.max_participants,
        target: challenge.target,
        metric: challenge.metric,
        timeframe: challenge.timeframe,
        rewards: challenge.rewards,
        requirements: challenge.requirements,
        createdAt: new Date(challenge.created_at),
        updatedAt: new Date(challenge.updated_at)
      })) || [];

      return { data: challenges, error: null };
    } catch (error) {
      console.error('Error fetching challenges:', error);
      return { data: null, error };
    }
  }

  async getChallengeById(challengeId: string): Promise<{ data: CommunityChallenge | null; error: any }> {
    try {
      if (!supabase) {
        const mockChallenges = this.getMockChallenges();
        const challenge = mockChallenges.find(c => c.id === challengeId) || null;
        return { data: challenge, error: null };
      }

      const { data, error } = await supabase
        .from('community_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (error) throw error;

      const challenge: CommunityChallenge = {
        id: data.id,
        title: data.title,
        description: data.description,
        type: data.type,
        difficulty: data.difficulty,
        status: data.status,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        participants: data.participants,
        maxParticipants: data.max_participants,
        target: data.target,
        metric: data.metric,
        timeframe: data.timeframe,
        rewards: data.rewards,
        requirements: data.requirements,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { data: challenge, error: null };
    } catch (error) {
      console.error('Error fetching challenge:', error);
      return { data: null, error };
    }
  }

  async joinChallenge(userId: string, challengeId: string): Promise<{ success: boolean; error?: any }> {
    try {
      if (!supabase) {
        return { success: true };
      }

      // Check if user is already participating
      const { data: existingParticipation } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .single();

      if (existingParticipation) {
        return { success: false, error: 'Already participating in this challenge' };
      }

      // Check if challenge is full
      const { data: challenge } = await supabase
        .from('community_challenges')
        .select('participants, max_participants, status')
        .eq('id', challengeId)
        .single();

      if (challenge?.status !== 'active' && challenge?.status !== 'upcoming') {
        return { success: false, error: 'Challenge is not available for participation' };
      }

      if (challenge?.max_participants && challenge.participants >= challenge.max_participants) {
        return { success: false, error: 'Challenge is full' };
      }

      // Add participant
      const { error: insertError } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: userId,
          progress: 0,
          percentage: 0
        });

      if (insertError) throw insertError;

      // Update participant count
      const { error: updateError } = await supabase
        .from('community_challenges')
        .update({ participants: supabase.raw('participants + 1') })
        .eq('id', challengeId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      console.error('Error joining challenge:', error);
      return { success: false, error };
    }
  }

  async leaveChallenge(userId: string, challengeId: string): Promise<{ success: boolean; error?: any }> {
    try {
      if (!supabase) {
        return { success: true };
      }

      // Remove participant
      const { error: deleteError } = await supabase
        .from('challenge_participants')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Update participant count
      const { error: updateError } = await supabase
        .from('community_challenges')
        .update({ participants: supabase.raw('participants - 1') })
        .eq('id', challengeId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      console.error('Error leaving challenge:', error);
      return { success: false, error };
    }
  }

  async getChallengeParticipants(challengeId: string, limit = 50): Promise<{ data: ChallengeParticipant[] | null; error: any }> {
    try {
      if (!supabase) {
        return { data: this.getMockParticipants(challengeId), error: null };
      }

      const { data, error } = await supabase
        .from('challenge_participants')
        .select(`
          *,
          users!challenge_participants_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('challenge_id', challengeId)
        .order('progress', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const participants: ChallengeParticipant[] = data?.map((participant, index) => ({
        id: participant.id,
        challengeId: participant.challenge_id,
        userId: participant.user_id,
        userName: participant.users?.full_name || 'Anonymous',
        userAvatar: participant.users?.avatar_url,
        progress: participant.progress,
        percentage: participant.percentage,
        rank: index + 1,
        joinedAt: new Date(participant.joined_at),
        lastUpdated: new Date(participant.updated_at || participant.joined_at)
      })) || [];

      return { data: participants, error: null };
    } catch (error) {
      console.error('Error fetching challenge participants:', error);
      return { data: null, error };
    }
  }

  async updateProgress(userId: string, challengeId: string, progress: number): Promise<{ success: boolean; error?: any }> {
    try {
      if (!supabase) {
        return { success: true };
      }

      // Get challenge target to calculate percentage
      const { data: challenge } = await supabase
        .from('community_challenges')
        .select('target')
        .eq('id', challengeId)
        .single();

      if (!challenge) {
        return { success: false, error: 'Challenge not found' };
      }

      const percentage = Math.min(Math.round((progress / challenge.target) * 100), 100);

      const { error } = await supabase
        .from('challenge_participants')
        .update({
          progress,
          percentage,
          updated_at: new Date().toISOString()
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating progress:', error);
      return { success: false, error };
    }
  }

  async getUserChallenges(userId: string): Promise<{ data: { challenge: CommunityChallenge; participation: ChallengeParticipant }[] | null; error: any }> {
    try {
      if (!supabase) {
        return { data: [], error: null };
      }

      const { data, error } = await supabase
        .from('challenge_participants')
        .select(`
          *,
          community_challenges!challenge_participants_challenge_id_fkey (*),
          users!challenge_participants_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      const userChallenges = data?.map(item => ({
        challenge: {
          id: item.community_challenges.id,
          title: item.community_challenges.title,
          description: item.community_challenges.description,
          type: item.community_challenges.type,
          difficulty: item.community_challenges.difficulty,
          status: item.community_challenges.status,
          startDate: new Date(item.community_challenges.start_date),
          endDate: new Date(item.community_challenges.end_date),
          participants: item.community_challenges.participants,
          maxParticipants: item.community_challenges.max_participants,
          target: item.community_challenges.target,
          metric: item.community_challenges.metric,
          timeframe: item.community_challenges.timeframe,
          rewards: item.community_challenges.rewards,
          requirements: item.community_challenges.requirements,
          createdAt: new Date(item.community_challenges.created_at),
          updatedAt: new Date(item.community_challenges.updated_at)
        } as CommunityChallenge,
        participation: {
          id: item.id,
          challengeId: item.challenge_id,
          userId: item.user_id,
          userName: item.users?.full_name || 'Anonymous',
          userAvatar: item.users?.avatar_url,
          progress: item.progress,
          percentage: item.percentage,
          rank: item.rank,
          joinedAt: new Date(item.joined_at),
          lastUpdated: new Date(item.updated_at || item.joined_at)
        } as ChallengeParticipant
      })) || [];

      return { data: userChallenges, error: null };
    } catch (error) {
      console.error('Error fetching user challenges:', error);
      return { data: null, error };
    }
  }

  private getMockChallenges(): CommunityChallenge[] {
    return [
      {
        id: '1',
        title: '30-Day Referral Sprint',
        description: 'Refer 50 new active users in 30 days. Track your progress and compete with other members for amazing rewards!',
        type: 'referrals',
        difficulty: 'intermediate',
        status: 'active',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-03-01'),
        participants: 127,
        maxParticipants: 200,
        target: 50,
        metric: 'Active Referrals',
        timeframe: '30 days',
        rewards: {
          first: '$500 Cash + Premium Badge',
          second: '$300 Cash + Gold Badge',
          third: '$150 Cash + Silver Badge',
          participation: '25 Bonus Points'
        },
        requirements: ['Minimum 10 completed tasks', 'Account verified'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        title: 'Weekly Earnings Challenge',
        description: 'Earn $200 in a single week through platform activities. Perfect for beginners looking to boost their income!',
        type: 'earnings',
        difficulty: 'beginner',
        status: 'active',
        startDate: new Date('2024-02-05'),
        endDate: new Date('2024-02-12'),
        participants: 89,
        target: 200,
        metric: 'USD Earned',
        timeframe: '7 days',
        rewards: {
          first: '$100 Bonus',
          second: '$50 Bonus',
          third: '$25 Bonus',
          participation: '10 Bonus Points'
        },
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: '3',
        title: 'Master Streaker',
        description: 'Maintain a 21-day login and task completion streak. Consistency is key to long-term success!',
        type: 'streak',
        difficulty: 'advanced',
        status: 'upcoming',
        startDate: new Date('2024-02-15'),
        endDate: new Date('2024-03-08'),
        participants: 45,
        maxParticipants: 100,
        target: 21,
        metric: 'Consecutive Days',
        timeframe: '21 days',
        rewards: {
          first: 'Exclusive Master Badge + $200',
          participation: 'Streak Badge + 50 Points'
        },
        requirements: ['Premium membership', 'Previous challenge completion'],
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25')
      }
    ];
  }

  private getMockParticipants(challengeId: string): ChallengeParticipant[] {
    return [
      {
        id: '1',
        challengeId,
        userId: 'user1',
        userName: 'Alex Rodriguez',
        progress: 42,
        percentage: 84,
        rank: 1,
        joinedAt: new Date('2024-02-01'),
        lastUpdated: new Date('2024-02-10')
      },
      {
        id: '2',
        challengeId,
        userId: 'user2',
        userName: 'Sarah Kim',
        progress: 38,
        percentage: 76,
        rank: 2,
        joinedAt: new Date('2024-02-01'),
        lastUpdated: new Date('2024-02-09')
      },
      {
        id: '3',
        challengeId,
        userId: 'user3',
        userName: 'Michael Zhang',
        progress: 35,
        percentage: 70,
        rank: 3,
        joinedAt: new Date('2024-02-02'),
        lastUpdated: new Date('2024-02-10')
      }
    ];
  }
}

export const challengesService = new ChallengesService();
export default challengesService;
