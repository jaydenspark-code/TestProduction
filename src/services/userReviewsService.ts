import { supabase } from '../lib/supabase';

export interface UserReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  content: string;
  category: 'product' | 'service' | 'support' | 'experience';
  rating: number;
  tags: string[];
  likes: number;
  dislikes: number;
  replies: number;
  views: number;
  isVerified: boolean;
  isFeatured: boolean;
  status: 'active' | 'hidden' | 'pending_review';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReviewData {
  title: string;
  content: string;
  category: UserReview['category'];
  rating: number;
  tags?: string[];
}

class UserReviewsService {
  async getReviews(filters?: {
    category?: string;
    rating?: number;
    limit?: number;
    offset?: number;
    featured?: boolean;
  }): Promise<{ data: UserReview[] | null; error: any }> {
    try {
      if (!supabase) {
        return { data: this.getMockReviews(), error: null };
      }

      let query = supabase
        .from('user_reviews')
        .select(`
          *,
          users!user_reviews_user_id_fkey (
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

      if (filters?.rating) {
        query = query.gte('rating', filters.rating);
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

      const reviews: UserReview[] = data?.map(review => ({
        id: review.id,
        userId: review.user_id,
        userName: review.users?.full_name || 'Anonymous',
        userAvatar: review.users?.avatar_url,
        title: review.title,
        content: review.content,
        category: review.category,
        rating: review.rating,
        likes: review.likes,
        dislikes: review.dislikes,
        replies: review.replies,
        views: review.views,
        tags: review.tags || [],
        isVerified: review.users?.is_verified || false,
        isFeatured: review.is_featured,
        status: review.status,
        createdAt: new Date(review.created_at),
        updatedAt: new Date(review.updated_at)
      })) || [];

      return { data: reviews, error: null };
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      return { data: null, error };
    }
  }

  async createReview(userId: string, reviewData: CreateReviewData): Promise<{ data: UserReview | null; error: any }> {
    try {
      if (!supabase) {
        // Return mock success for testing
        const mockReview: UserReview = {
          id: Date.now().toString(),
          userId,
          userName: 'Test User',
          title: reviewData.title,
          content: reviewData.content,
          category: reviewData.category,
          rating: reviewData.rating,
          likes: 0,
          dislikes: 0,
          replies: 0,
          views: 0,
          isVerified: false,
          isFeatured: false,
          tags: reviewData.tags || [],
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return { data: mockReview, error: null };
      }

      const { data, error } = await supabase
        .from('user_reviews')
        .insert({
          user_id: userId,
          title: reviewData.title,
          content: reviewData.content,
          category: reviewData.category,
          rating: reviewData.rating,
          tags: reviewData.tags || []
        })
        .select(`
          *,
          users!user_reviews_user_id_fkey (
            full_name,
            avatar_url,
            is_verified
          )
        `)
        .single();

      if (error) throw error;

      const review: UserReview = {
        id: data.id,
        userId: data.user_id,
        userName: data.users?.full_name || 'Anonymous',
        userAvatar: data.users?.avatar_url,
        title: data.title,
        content: data.content,
        category: data.category,
        rating: data.rating,
        likes: data.likes,
        dislikes: data.dislikes,
        replies: data.replies,
        views: data.views,
        tags: data.tags || [],
        isVerified: data.users?.is_verified || false,
        isFeatured: data.is_featured,
        status: data.status,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { data: review, error: null };
    } catch (error) {
      console.error('Error creating user review:', error);
      return { data: null, error };
    }
  }

  async likeReview(userId: string, reviewId: string): Promise<{ success: boolean; error?: any }> {
    try {
      if (!supabase) {
        return { success: true };
      }

      // Check if user already liked this review
      const { data: existingLike } = await supabase
        .from('review_likes')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        // Unlike - remove the like
        const { error: deleteLikeError } = await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', userId);

        if (deleteLikeError) throw deleteLikeError;

        // Decrement likes count
        const { error: updateError } = await supabase
          .from('user_reviews')
          .update({ likes: supabase.raw('likes - 1') })
          .eq('id', reviewId);

        if (updateError) throw updateError;
      } else {
        // Like - add the like
        const { error: insertLikeError } = await supabase
          .from('review_likes')
          .insert({ review_id: reviewId, user_id: userId });

        if (insertLikeError) throw insertLikeError;

        // Increment likes count
        const { error: updateError } = await supabase
          .from('user_reviews')
          .update({ likes: supabase.raw('likes + 1') })
          .eq('id', reviewId);

        if (updateError) throw updateError;
      }

      return { success: true };
    } catch (error) {
      console.error('Error liking review:', error);
      return { success: false, error };
    }
  }

  async getUserLikedReviews(userId: string): Promise<{ data: string[] | null; error: any }> {
    try {
      if (!supabase) {
        return { data: [], error: null };
      }

      const { data, error } = await supabase
        .from('review_likes')
        .select('review_id')
        .eq('user_id', userId);

      if (error) throw error;

      const likedReviewIds = data?.map(like => like.review_id) || [];
      return { data: likedReviewIds, error: null };
    } catch (error) {
      console.error('Error fetching user liked reviews:', error);
      return { data: null, error };
    }
  }

  async deleteReview(userId: string, reviewId: string): Promise<{ success: boolean; error?: any }> {
    try {
      if (!supabase) {
        return { success: true };
      }

      const { error } = await supabase
        .from('user_reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', userId); // Ensure user can only delete their own reviews

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting user review:', error);
      return { success: false, error };
    }
  }

  private getMockReviews(): UserReview[] {
    return [
      {
        id: '1',
        userId: 'user1',
        userName: 'Emily Clark',
        userAvatar: undefined,
        title: 'Great Product Experience',
        content: 'I loved using this product. It really solved my problem and the support was excellent!',
        category: 'product',
        rating: 5,
        likes: 87,
        dislikes: 10,
        replies: 12,
        views: 200,
        isVerified: true,
        isFeatured: false,
        tags: ['satisfied', 'recommend', 'high-quality'],
        status: 'active',
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25')
      },
      {
        id: '2',
        userId: 'user2',
        userName: 'John Doe',
        userAvatar: undefined,
        title: 'Service Could be Improved',
        content: 'The service was okay, but there were some delays in responses. Expected a bit more efficiency.',
        category: 'service',
        rating: 3,
        likes: 50,
        dislikes: 20,
        replies: 5,
        views: 150,
        isVerified: false,
        isFeatured: false,
        tags: ['service', 'delay', 'improvement-needed'],
        status: 'active',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      }
    ];
  }
}

export const userReviewsService = new UserReviewsService();
export default userReviewsService;

