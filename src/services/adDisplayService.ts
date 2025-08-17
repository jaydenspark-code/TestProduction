import { AdCampaign, UserActivity } from '../types/advertising';
import { advertisingDbService } from './advertisingDatabaseService';

interface AdPlacement {
  id: string;
  type: 'banner' | 'sidebar' | 'modal' | 'native' | 'interstitial';
  position: string;
  dimensions: {
    width: number;
    height: number;
  };
  active: boolean;
}

interface TargetingCriteria {
  userId: string;
  location?: string;
  age?: number;
  interests?: string[];
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  timeOfDay?: number;
}

class AdDisplayService {
  private placements: AdPlacement[] = [
    {
      id: 'homepage-banner',
      type: 'banner',
      position: 'top',
      dimensions: { width: 728, height: 90 },
      active: true
    },
    {
      id: 'sidebar-ad',
      type: 'sidebar',
      position: 'right',
      dimensions: { width: 300, height: 250 },
      active: true
    },
    {
      id: 'dashboard-native',
      type: 'native',
      position: 'feed',
      dimensions: { width: 400, height: 300 },
      active: true
    },
    {
      id: 'task-completion-modal',
      type: 'modal',
      position: 'center',
      dimensions: { width: 500, height: 400 },
      active: true
    }
  ];

  private campaigns: AdCampaign[] = [];
  private userActivities: UserActivity[] = [];

  public async initializeService(campaigns?: AdCampaign[]): Promise<void> {
    try {
      if (campaigns) {
        // Use provided campaigns (for backward compatibility)
        this.campaigns = campaigns.filter(c => c.status === 'active');
      } else {
        // Load campaigns from database
        const dbCampaigns = await advertisingDbService.getActiveCampaigns('system');
        this.campaigns = dbCampaigns;
      }
      
      console.log(`📢 Ad Display Service initialized with ${this.campaigns.length} active campaigns`);
    } catch (error) {
      console.error('Error initializing ad service:', error);
      this.campaigns = campaigns || [];
    }
  }

  public async getAdsForPlacement(
    placementId: string, 
    targetingCriteria: TargetingCriteria,
    limit: number = 3
  ): Promise<AdCampaign[]> {
    const placement = this.placements.find(p => p.id === placementId);
    if (!placement || !placement.active) {
      return [];
    }

    // Filter campaigns based on targeting criteria
    const eligibleCampaigns = this.campaigns.filter(campaign => 
      this.matchesTargeting(campaign, targetingCriteria) &&
      this.hasRemainingBudget(campaign) &&
      this.isWithinSchedule(campaign)
    );

    // Sort by priority and performance
    const sortedCampaigns = eligibleCampaigns.sort((a, b) => {
      const aScore = this.calculateCampaignScore(a, targetingCriteria);
      const bScore = this.calculateCampaignScore(b, targetingCriteria);
      return bScore - aScore;
    });

    return sortedCampaigns.slice(0, limit);
  }

  public async recordAdInteraction(
    campaignId: string,
    userId: string,
    action: UserActivity['action'],
    metadata?: Record<string, any>
  ): Promise<UserActivity> {
    try {
      // Get campaign details from database
      const campaigns = await advertisingDbService.getActiveCampaigns(userId);
      const campaign = campaigns.find(c => c.id === campaignId);
      
      if (!campaign) {
        throw new Error('Campaign not found or not active');
      }

      // Calculate reward based on campaign and action
      const reward = this.calculateReward(campaign, action);

      // Record activity in database
      const activityId = await advertisingDbService.recordActivity(
        userId,
        campaignId,
        action,
        reward,
        metadata || {}
      );

      if (!activityId) {
        throw new Error('Failed to record activity');
      }

      // Create activity object for return
      const activity: UserActivity = {
        id: activityId,
        userId,
        campaignId,
        action,
        timestamp: new Date(),
        reward,
        location: metadata?.location,
        device: metadata?.device || 'web'
      };

      // Still maintain local activities for compatibility
      this.userActivities.push(activity);

      return activity;
    } catch (error) {
      console.error('Error recording ad interaction:', error);
      throw error;
    }
  }

  public async getPersonalizedAds(
    userId: string,
    placement: string,
    userProfile: any
  ): Promise<AdCampaign[]> {
    try {
      // Get personalized ads from database
      const personalizedAds = await advertisingDbService.getPersonalizedAds(userId, 5);
      
      // Filter by placement if specific placement requirements exist
      const placementConfig = this.placements.find(p => p.id === placement);
      if (!placementConfig || !placementConfig.active) {
        return personalizedAds.slice(0, 3); // Default limit
      }

      // Apply additional filtering based on placement constraints
      return personalizedAds.filter(ad => {
        // You can add placement-specific filtering logic here
        return true;
      }).slice(0, 3);
    } catch (error) {
      console.error('Error getting personalized ads:', error);
      return [];
    }
  }

  public async generateAdReport(campaignId: string): Promise<any> {
    const campaign = this.campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const activities = this.userActivities.filter(a => a.campaignId === campaignId);
    
    return {
      campaignId,
      campaignTitle: campaign.title,
      totalImpressions: campaign.metrics.impressions,
      totalClicks: campaign.metrics.clicks,
      totalConversions: campaign.metrics.conversions,
      clickThroughRate: (campaign.metrics.clicks / campaign.metrics.impressions) * 100,
      conversionRate: (campaign.metrics.conversions / campaign.metrics.clicks) * 100,
      totalSpent: campaign.budget.spent,
      averageCostPerClick: campaign.budget.spent / campaign.metrics.clicks,
      averageCostPerConversion: campaign.budget.spent / campaign.metrics.conversions,
      topPerformingPlacements: this.getTopPerformingPlacements(campaignId),
      userEngagement: activities.length,
      uniqueUsers: new Set(activities.map(a => a.userId)).size,
      revenueGenerated: activities.reduce((sum, a) => sum + a.reward, 0)
    };
  }

  public async getUserEarnings(
    userId: string, 
    timeframe: 'today' | 'week' | 'month' | 'all' = 'all'
  ): Promise<any> {
    try {
      // Get earnings from database
      const dbEarnings = await advertisingDbService.getUserEarnings(userId, timeframe);
      
      // Also get local activities for compatibility (if any)
      const localActivities = this.userActivities.filter(a => a.userId === userId);
      
      // Combine database and local data
      return {
        ...dbEarnings,
        localActivityCount: localActivities.length,
        source: 'database'
      };
    } catch (error) {
      console.error('Error getting user earnings:', error);
      
      // Fallback to local data if database fails
      const localActivities = this.userActivities.filter(a => a.userId === userId);
      return {
        total: localActivities.reduce((sum, a) => sum + a.reward, 0),
        byActivity: {
          view: localActivities.filter(a => a.action === 'view').reduce((sum, a) => sum + a.reward, 0),
          click: localActivities.filter(a => a.action === 'click').reduce((sum, a) => sum + a.reward, 0),
          complete: localActivities.filter(a => a.action === 'complete').reduce((sum, a) => sum + a.reward, 0),
          share: localActivities.filter(a => a.action === 'share').reduce((sum, a) => sum + a.reward, 0),
          like: localActivities.filter(a => a.action === 'like').reduce((sum, a) => sum + a.reward, 0)
        },
        activityCount: {
          view: localActivities.filter(a => a.action === 'view').length,
          click: localActivities.filter(a => a.action === 'click').length,
          complete: localActivities.filter(a => a.action === 'complete').length,
          share: localActivities.filter(a => a.action === 'share').length,
          like: localActivities.filter(a => a.action === 'like').length
        },
        source: 'local'
      };
    }
  }

  private matchesTargeting(campaign: AdCampaign, criteria: TargetingCriteria): boolean {
    // Check geographic targeting
    if (criteria.location && !campaign.targeting.countries.includes(criteria.location)) {
      return false;
    }

    // Check age targeting
    if (criteria.age) {
      const [minAge, maxAge] = campaign.targeting.ageRange;
      if (criteria.age < minAge || criteria.age > maxAge) {
        return false;
      }
    }

    // Check interest targeting
    if (criteria.interests && criteria.interests.length > 0) {
      const hasMatchingInterest = criteria.interests.some(interest =>
        campaign.targeting.interests.includes(interest.toLowerCase())
      );
      if (!hasMatchingInterest) {
        return false;
      }
    }

    return true;
  }

  private hasRemainingBudget(campaign: AdCampaign): boolean {
    return campaign.budget.spent < campaign.budget.total;
  }

  private isWithinSchedule(campaign: AdCampaign): boolean {
    const now = new Date();
    return now >= campaign.schedule.startDate && now <= campaign.schedule.endDate;
  }

  private calculateCampaignScore(campaign: AdCampaign, criteria: TargetingCriteria): number {
    let score = campaign.priority * 10;

    // Boost score for better performance
    const ctr = campaign.metrics.clicks / campaign.metrics.impressions;
    score += ctr * 1000;

    // Boost score for higher engagement
    score += campaign.metrics.engagement * 5;

    // Boost score for campaigns with remaining budget
    const budgetUtilization = campaign.budget.spent / campaign.budget.total;
    if (budgetUtilization < 0.8) {
      score += 50;
    }

    // Boost score for relevant targeting
    if (criteria.interests && criteria.interests.length > 0) {
      const matchingInterests = criteria.interests.filter(interest =>
        campaign.targeting.interests.includes(interest.toLowerCase())
      ).length;
      score += matchingInterests * 10;
    }

    // Boost score for time-based relevance
    if (criteria.timeOfDay !== undefined) {
      const isBusinessHours = criteria.timeOfDay >= 9 && criteria.timeOfDay <= 17;
      if (isBusinessHours && campaign.category === 'business') {
        score += 20;
      }
    }

    return score;
  }

  private calculateReward(campaign: AdCampaign, action: UserActivity['action']): number {
    switch (action) {
      case 'view':
        return campaign.reward.type === 'per_view' ? campaign.reward.amount : 0.05;
      case 'click':
        return campaign.reward.type === 'per_click' ? campaign.reward.amount : 0.25;
      case 'complete':
        return campaign.reward.type === 'per_completion' ? campaign.reward.amount : 1.00;
      case 'share':
        return 0.50;
      case 'like':
        return 0.10;
      default:
        return 0;
    }
  }

  private async updateCampaignMetrics(
    campaignId: string, 
    action: UserActivity['action'], 
    cost: number
  ): Promise<void> {
    const campaignIndex = this.campaigns.findIndex(c => c.id === campaignId);
    if (campaignIndex === -1) return;

    const campaign = this.campaigns[campaignIndex];
    
    switch (action) {
      case 'view':
        campaign.metrics.impressions += 1;
        break;
      case 'click':
        campaign.metrics.clicks += 1;
        break;
      case 'complete':
        campaign.metrics.conversions += 1;
        break;
    }

    campaign.budget.spent += cost;
    campaign.metrics.engagement = this.calculateEngagementRate(campaign);
  }

  private calculateEngagementRate(campaign: AdCampaign): number {
    if (campaign.metrics.impressions === 0) return 0;
    
    const engagementActions = campaign.metrics.clicks + campaign.metrics.conversions;
    return (engagementActions / campaign.metrics.impressions) * 100;
  }

  private async pauseCampaign(campaignId: string, reason: string): Promise<void> {
    const campaignIndex = this.campaigns.findIndex(c => c.id === campaignId);
    if (campaignIndex !== -1) {
      this.campaigns[campaignIndex].status = 'paused';
      console.log(`📢 Campaign ${campaignId} paused: ${reason}`);
    }
  }

  private detectDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    if (typeof window !== 'undefined' && window.navigator) {
      const userAgent = window.navigator.userAgent;
      if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
        return 'tablet';
      }
      if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
        return 'mobile';
      }
    }
    return 'desktop';
  }

  private checkFrequencyCap(campaignId: string, userId: string): boolean {
    const userInteractions = this.userActivities.filter(
      a => a.campaignId === campaignId && a.userId === userId
    );

    // Limit to 5 interactions per user per day per campaign
    const today = new Date().toDateString();
    const todayInteractions = userInteractions.filter(
      a => a.timestamp.toDateString() === today
    );

    return todayInteractions.length < 5;
  }

  private getTopPerformingPlacements(campaignId: string): string[] {
    // Get activities for this campaign
    const campaignActivities = this.userActivities.filter(a => a.campaignId === campaignId);
    
    // Group by placement and calculate performance
    const placementMetrics: Record<string, { clicks: number; views: number; conversions: number }> = {};
    
    campaignActivities.forEach(activity => {
      const placement = activity.metadata?.placement || 'unknown';
      if (!placementMetrics[placement]) {
        placementMetrics[placement] = { clicks: 0, views: 0, conversions: 0 };
      }
      
      switch (activity.action) {
        case 'view':
          placementMetrics[placement].views += 1;
          break;
        case 'click':
          placementMetrics[placement].clicks += 1;
          break;
        case 'complete':
          placementMetrics[placement].conversions += 1;
          break;
      }
    });

    // Sort placements by performance score
    const sortedPlacements = Object.entries(placementMetrics)
      .map(([placement, metrics]) => ({
        placement,
        score: metrics.conversions * 3 + metrics.clicks * 2 + metrics.views
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.placement);

    return sortedPlacements.slice(0, 3);
  }

  public async getAdPlacements(): Promise<AdPlacement[]> {
    return this.placements.filter(p => p.active);
  }

  public async updatePlacement(placementId: string, updates: Partial<AdPlacement>): Promise<void> {
    const index = this.placements.findIndex(p => p.id === placementId);
    if (index !== -1) {
      this.placements[index] = { ...this.placements[index], ...updates };
    }
  }
}

export const adDisplayService = new AdDisplayService();
export default AdDisplayService;
