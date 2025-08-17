// Database integration service for advertising platform
import { supabase } from '../lib/supabase';
import type { 
  AdCampaign, 
  UserActivity, 
  CampaignMetrics,
  DetailedUserEarnings 
} from '../types/advertising';

export class AdvertisingDatabaseService {
  // Get active ad campaigns for user
  async getActiveCampaigns(userId: string): Promise<AdCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);

      if (error) throw error;
      
      // Filter by frequency cap
      const filteredCampaigns = [];
      for (const campaign of data || []) {
        const canShow = await this.canShowAd(userId, campaign.id);
        if (canShow) {
          filteredCampaigns.push(campaign);
        }
      }
      
      return filteredCampaigns;
    } catch (error) {
      console.error('Error fetching active campaigns:', error);
      return [];
    }
  }

  // Record user activity and update metrics
  async recordActivity(
    userId: string,
    campaignId: string,
    activityType: 'view' | 'click' | 'complete' | 'share' | 'like',
    rewardAmount: number = 0,
    metadata: Record<string, any> = {}
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('record_user_activity', {
        p_user_id: userId,
        p_campaign_id: campaignId,
        p_activity_type: activityType,
        p_reward_amount: rewardAmount,
        p_metadata: metadata
      });

      if (error) throw error;
      
      // Update ad frequency
      await this.updateAdFrequency(userId, campaignId);
      
      return data;
    } catch (error) {
      console.error('Error recording activity:', error);
      return null;
    }
  }

  // Check if ad can be shown to user (frequency cap)
  async canShowAd(userId: string, campaignId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_show_ad', {
        p_user_id: userId,
        p_campaign_id: campaignId
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking ad frequency:', error);
      return false;
    }
  }

  // Update ad frequency tracking
  private async updateAdFrequency(userId: string, campaignId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_ad_frequency', {
        p_user_id: userId,
        p_campaign_id: campaignId
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating ad frequency:', error);
    }
  }

  // Get user's activity history
  async getUserActivities(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<UserActivity[]> {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select(`
          *,
          ad_campaigns (
            title,
            description,
            campaign_type
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      return data?.map((activity: any) => ({
        id: activity.id,
        user_id: activity.user_id,
        campaign_id: activity.campaign_id,
        activity_type: activity.activity_type,
        reward_amount: activity.reward_amount,
        metadata: activity.metadata || {},
        created_at: activity.created_at
      })) || [];
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return [];
    }
  }

  // Get campaign metrics
  async getCampaignMetrics(
    campaignId: string,
    startDate?: string,
    endDate?: string
  ): Promise<CampaignMetrics[]> {
    try {
      let query = supabase
        .from('campaign_metrics')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaign metrics:', error);
      return [];
    }
  }

  // Get user earnings breakdown
  async getUserEarnings(
    userId: string,
    timeframe: 'today' | 'week' | 'month' | 'all' = 'all'
  ): Promise<DetailedUserEarnings> {
    try {
      let dateFilter = '';
      const now = new Date();
      
      switch (timeframe) {
        case 'today':
          dateFilter = now.toISOString().split('T')[0];
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = weekAgo.toISOString().split('T')[0];
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = monthAgo.toISOString().split('T')[0];
          break;
      }

      let query = supabase
        .from('user_activities')
        .select('activity_type, reward_amount, created_at')
        .eq('user_id', userId)
        .gt('reward_amount', 0);

      if (dateFilter && timeframe !== 'all') {
        if (timeframe === 'today') {
          query = query.gte('created_at', `${dateFilter}T00:00:00.000Z`)
                      .lt('created_at', `${dateFilter}T23:59:59.999Z`);
        } else {
          query = query.gte('created_at', `${dateFilter}T00:00:00.000Z`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calculate earnings breakdown
      const earnings: DetailedUserEarnings = {
        total: 0,
        byActivity: {
          view: 0,
          click: 0,
          complete: 0,
          share: 0,
          like: 0
        },
        activityCount: {
          view: 0,
          click: 0,
          complete: 0,
          share: 0,
          like: 0
        },
        timeframe
      };

      data?.forEach((activity: any) => {
        earnings.total += activity.reward_amount;
        earnings.byActivity[activity.activity_type as keyof typeof earnings.byActivity] += activity.reward_amount;
        earnings.activityCount[activity.activity_type as keyof typeof earnings.activityCount] += 1;
      });

      return earnings;
    } catch (error) {
      console.error('Error fetching user earnings:', error);
      return {
        total: 0,
        byActivity: { view: 0, click: 0, complete: 0, share: 0, like: 0 },
        activityCount: { view: 0, click: 0, complete: 0, share: 0, like: 0 },
        timeframe
      };
    }
  }

  // Get personalized ads based on user behavior
  async getPersonalizedAds(userId: string, limit: number = 5): Promise<AdCampaign[]> {
    try {
      // Get user's past activities to understand preferences
      const { data: activities } = await supabase
        .from('user_activities')
        .select('campaign_id, activity_type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      // Get campaigns this user can see
      const campaigns = await this.getActiveCampaigns(userId);
      
      // Simple personalization: prioritize campaign types user has engaged with
      const engagedTypes = new Set(
        activities?.map((a: any) => a.campaign_id) || []
      );

      // Sort campaigns by user engagement history
      const personalizedCampaigns = campaigns
        .sort((a, b) => {
          const aEngaged = engagedTypes.has(a.id) ? 1 : 0;
          const bEngaged = engagedTypes.has(b.id) ? 1 : 0;
          return bEngaged - aEngaged;
        })
        .slice(0, limit);

      return personalizedCampaigns;
    } catch (error) {
      console.error('Error getting personalized ads:', error);
      return this.getActiveCampaigns(userId);
    }
  }

  // Create new ad campaign (for advertisers)
  async createCampaign(campaignData: Partial<AdCampaign>): Promise<AdCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      return null;
    }
  }

  // Update campaign status
  async updateCampaignStatus(
    campaignId: string, 
    status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ad_campaigns')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', campaignId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating campaign status:', error);
      return false;
    }
  }

  // Get campaign performance summary
  async getCampaignSummary(campaignId: string): Promise<{
    totalViews: number;
    totalClicks: number;
    totalEarnings: number;
    ctr: number;
    avgEngagement: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('campaign_metrics')
        .select('*')
        .eq('campaign_id', campaignId);

      if (error) throw error;

      const summary = data?.reduce((acc: any, metric: any) => ({
        totalViews: acc.totalViews + metric.total_views,
        totalClicks: acc.totalClicks + metric.total_clicks,
        totalEarnings: acc.totalEarnings + metric.total_earned,
        ctr: 0, // Will calculate after
        avgEngagement: acc.avgEngagement + metric.average_engagement_time
      }), {
        totalViews: 0,
        totalClicks: 0,
        totalEarnings: 0,
        ctr: 0,
        avgEngagement: 0
      }) || { totalViews: 0, totalClicks: 0, totalEarnings: 0, ctr: 0, avgEngagement: 0 };

      // Calculate CTR
      summary.ctr = summary.totalViews > 0 ? summary.totalClicks / summary.totalViews : 0;
      
      // Calculate average engagement
      summary.avgEngagement = data?.length ? summary.avgEngagement / data.length : 0;

      return summary;
    } catch (error) {
      console.error('Error fetching campaign summary:', error);
      return { totalViews: 0, totalClicks: 0, totalEarnings: 0, ctr: 0, avgEngagement: 0 };
    }
  }
}

export const advertisingDbService = new AdvertisingDatabaseService();
