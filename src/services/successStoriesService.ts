import { supabase } from '../lib/supabase';

export interface SuccessStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  content: string;
  category: 'earnings' | 'referrals' | 'growth' | 'milestone' | 'achievement';
  metrics: {
    earnings?: number;
    referrals?: number;
    timeframe?: string;
  };
  imageUrl?: string;
  likes: number;
  comments: number;
  shares: number;
  isVerified: boolean;
  isFeatured: boolean;
  tags: string[];
  status: 'active' | 'hidden' | 'pending_review';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStoryData {
  title: string;
  content: string;
  category: SuccessStory['category'];
  metrics?: {
    earnings?: number;
    referrals?: number;
    timeframe?: string;
  };
  tags?: string[];
  imageUrl?: string;
}

class SuccessStoriesService {
  async getStories(filters?: {
    category?: string;
    limit?: number;
    offset?: number;
    featured?: boolean;
  }): Promise<{ data: SuccessStory[] | null; error: any }> {
    try {
      if (!supabase) {
        return { data: this.getMockStories(), error: null };
      }

      let query = supabase
        .from('success_stories')
        .select(`
          *,
          users!success_stories_user_id_fkey (
            full_name,
            avatar_url,
            is_verified
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters?.featured) {
        query = query.eq('is_featured', true);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stories: SuccessStory[] = data?.map(story => ({
        id: story.id,
        userId: story.user_id,
        userName: story.users?.full_name || 'Anonymous',
        userAvatar: story.users?.avatar_url,
        title: story.title,
        content: story.content,
        category: story.category,
        metrics: story.metrics || {},
        imageUrl: story.image_url,
        likes: story.likes,
        comments: story.comments,
        shares: story.shares,
        isVerified: story.users?.is_verified || false,
        isFeatured: story.is_featured,
        tags: story.tags || [],
        status: story.status,
        createdAt: new Date(story.created_at),
        updatedAt: new Date(story.updated_at)
      })) || [];

      return { data: stories, error: null };
    } catch (error) {
      console.error('Error fetching success stories:', error);
      return { data: null, error };
    }
  }

  async createStory(userId: string, storyData: CreateStoryData): Promise<{ data: SuccessStory | null; error: any }> {
    try {
      if (!supabase) {
        // Return mock success for testing
        const mockStory: SuccessStory = {
          id: Date.now().toString(),
          userId,
          userName: 'Test User',
          title: storyData.title,
          content: storyData.content,
          category: storyData.category,
          metrics: storyData.metrics || {},
          imageUrl: storyData.imageUrl,
          likes: 0,
          comments: 0,
          shares: 0,
          isVerified: false,
          isFeatured: false,
          tags: storyData.tags || [],
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return { data: mockStory, error: null };
      }

      const { data, error } = await supabase
        .from('success_stories')
        .insert({
          user_id: userId,
          title: storyData.title,
          content: storyData.content,
          category: storyData.category,
          metrics: storyData.metrics || {},
          image_url: storyData.imageUrl,
          tags: storyData.tags || []
        })
        .select(`
          *,
          users!success_stories_user_id_fkey (
            full_name,
            avatar_url,
            is_verified
          )
        `)
        .single();

      if (error) throw error;

      const story: SuccessStory = {
        id: data.id,
        userId: data.user_id,
        userName: data.users?.full_name || 'Anonymous',
        userAvatar: data.users?.avatar_url,
        title: data.title,
        content: data.content,
        category: data.category,
        metrics: data.metrics || {},
        imageUrl: data.image_url,
        likes: data.likes,
        comments: data.comments,
        shares: data.shares,
        isVerified: data.users?.is_verified || false,
        isFeatured: data.is_featured,
        tags: data.tags || [],
        status: data.status,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { data: story, error: null };
    } catch (error) {
      console.error('Error creating success story:', error);
      return { data: null, error };
    }
  }

  async likeStory(userId: string, storyId: string): Promise<{ success: boolean; error?: any }> {
    try {
      if (!supabase) {
        return { success: true };
      }

      // Check if user already liked this story
      const { data: existingLike } = await supabase
        .from('story_likes')
        .select('id')
        .eq('story_id', storyId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        // Unlike - remove the like
        const { error: deleteLikeError } = await supabase
          .from('story_likes')
          .delete()
          .eq('story_id', storyId)
          .eq('user_id', userId);

        if (deleteLikeError) throw deleteLikeError;

        // Decrement likes count
        const { error: updateError } = await supabase
          .from('success_stories')
          .update({ likes: supabase.raw('likes - 1') })
          .eq('id', storyId);

        if (updateError) throw updateError;
      } else {
        // Like - add the like
        const { error: insertLikeError } = await supabase
          .from('story_likes')
          .insert({ story_id: storyId, user_id: userId });

        if (insertLikeError) throw insertLikeError;

        // Increment likes count
        const { error: updateError } = await supabase
          .from('success_stories')
          .update({ likes: supabase.raw('likes + 1') })
          .eq('id', storyId);

        if (updateError) throw updateError;
      }

      return { success: true };
    } catch (error) {
      console.error('Error liking story:', error);
      return { success: false, error };
    }
  }

  async getUserLikedStories(userId: string): Promise<{ data: string[] | null; error: any }> {
    try {
      if (!supabase) {
        return { data: [], error: null };
      }

      const { data, error } = await supabase
        .from('story_likes')
        .select('story_id')
        .eq('user_id', userId);

      if (error) throw error;

      const likedStoryIds = data?.map(like => like.story_id) || [];
      return { data: likedStoryIds, error: null };
    } catch (error) {
      console.error('Error fetching user liked stories:', error);
      return { data: null, error };
    }
  }

  async updateStory(userId: string, storyId: string, updates: Partial<CreateStoryData>): Promise<{ success: boolean; error?: any }> {
    try {
      if (!supabase) {
        return { success: true };
      }

      const { error } = await supabase
        .from('success_stories')
        .update({
          title: updates.title,
          content: updates.content,
          category: updates.category,
          metrics: updates.metrics,
          image_url: updates.imageUrl,
          tags: updates.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId)
        .eq('user_id', userId); // Ensure user can only update their own stories

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating success story:', error);
      return { success: false, error };
    }
  }

  async deleteStory(userId: string, storyId: string): Promise<{ success: boolean; error?: any }> {
    try {
      if (!supabase) {
        return { success: true };
      }

      const { error } = await supabase
        .from('success_stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', userId); // Ensure user can only delete their own stories

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting success story:', error);
      return { success: false, error };
    }
  }

  private getMockStories(): SuccessStory[] {
    return [
      {
        id: '1',
        userId: 'user1',
        userName: 'Sarah Johnson',
        userAvatar: undefined,
        title: 'From $0 to $5,000 in 3 Months!',
        content: 'I started with EarnPro as a complete beginner. Through consistent daily tasks and building my referral network, I\'ve managed to earn over $5,000 in just 3 months! The key was focusing on quality referrals and staying active in the community.',
        category: 'earnings',
        metrics: {
          earnings: 5000,
          referrals: 150,
          timeframe: '3 months'
        },
        likes: 127,
        comments: 23,
        shares: 15,
        isVerified: true,
        isFeatured: true,
        tags: ['newbie-success', 'referral-master', 'consistent-growth'],
        status: 'active',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        userId: 'user2',
        userName: 'Mike Chen',
        userAvatar: undefined,
        title: 'Built a Network of 500+ Active Referrals',
        content: 'My strategy was simple: help others succeed first. I created tutorial videos, shared tips in social media groups, and always responded to questions from my referrals. Now I have 500+ active members in my network!',
        category: 'referrals',
        metrics: {
          referrals: 500,
          timeframe: '6 months'
        },
        likes: 89,
        comments: 31,
        shares: 22,
        isVerified: true,
        isFeatured: false,
        tags: ['network-building', 'community-helper', 'mentor'],
        status: 'active',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10')
      }
    ];
  }
}

export const successStoriesService = new SuccessStoriesService();
export default successStoriesService;
