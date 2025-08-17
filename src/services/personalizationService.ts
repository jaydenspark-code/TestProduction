import { supabase } from "../lib/supabase";
import { aiAnalyticsAPI } from '../api/ai';
import { recommendationAPI } from '../api/ai';
import { smartMatchingAPI } from '../api/ai';

export interface PersonalizationProfile {
  userId: string;
  basicInfo: {
    fullName: string;
    email: string;
    phone: string;
    country: string;
    preferredCurrency: string;
    dateOfBirth: string;
    bio: string;
    website: string;
  };
  preferences: {
    contentTypes: string[];
    communicationStyle: 'formal' | 'casual' | 'friendly' | 'professional';
    notificationFrequency: 'immediate' | 'daily' | 'weekly' | 'never';
    targetAudience: string[];
    industries: string[];
    roles: string[];
  };
  behavior: {
    loginFrequency: number;
    averageSessionDuration: number;
    mostActiveTimeOfDay: string;
    preferredDevices: string[];
    engagementScore: number;
  };
  performance: {
    totalReferrals: number;
    successfulReferrals: number;
    conversionRate: number;
    averageEarnings: number;
    topPerformingCampaigns: string[];
  };
  aiInsights: {
    personalityType: string;
    motivationFactors: string[];
    optimalApproachStrategy: string;
    predictedChurnRisk: number;
    growthPotential: number;
  };
  customization: {
    dashboardLayout: any;
    widgetPreferences: string[];
    colorScheme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
  };
  updatedAt: string;
}

export interface PersonalizedExperience {
  userId: string;
  dashboard: {
    layout: any;
    widgets: any[];
    quickActions: any[];
  };
  content: {
    recommendations: any[];
    articles: any[];
    tips: any[];
  };
  notifications: {
    settings: any;
    templates: any[];
  };
  campaigns: {
    suggested: any[];
    personalized: any[];
  };
  networking: {
    matches: any[];
    suggestions: any[];
  };
}

class PersonalizationService {
  private static instance: PersonalizationService;
  private userProfiles: Map<string, PersonalizationProfile> = new Map();
  private experiences: Map<string, PersonalizedExperience> = new Map();

  static getInstance(): PersonalizationService {
    if (!PersonalizationService.instance) {
      PersonalizationService.instance = new PersonalizationService();
    }
    return PersonalizationService.instance;
  }

  // Get or create user personalization profile
  async getUserProfile(userId: string): Promise<PersonalizationProfile> {
    try {
      // Check cache first
      if (this.userProfiles.has(userId)) {
        return this.userProfiles.get(userId)!;
      }

      // Try to get from database
      if (!supabase) {
        console.warn('Supabase not available, creating default profile');
        return await this.createUserProfile(userId);
      }

      const { data: existingProfile, error } = await supabase
        .from('user_personalization_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!error && existingProfile) {
        const profile = this.parseProfile(existingProfile);
        this.userProfiles.set(userId, profile);
        return profile;
      }

      // Create new profile
      const newProfile = await this.createUserProfile(userId);
      return newProfile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }

  // Create new personalization profile with AI analysis
  private async createUserProfile(userId: string): Promise<PersonalizationProfile> {
    try {
      // Get user data from various sources
      const [userBasicData, userBehavior, userPerformance] = await Promise.allSettled([
        this.getUserBasicData(userId),
        this.getUserBehaviorData(userId),
        this.getUserPerformanceData(userId)
      ]);

      // Generate AI insights
      const aiInsights = await this.generateAIInsights(userId, {
        basic: userBasicData.status === 'fulfilled' ? userBasicData.value : null,
        behavior: userBehavior.status === 'fulfilled' ? userBehavior.value : null,
        performance: userPerformance.status === 'fulfilled' ? userPerformance.value : null
      });

      const profile: PersonalizationProfile = {
        userId,
        basicInfo: {
          fullName: userBasicData.status === 'fulfilled' ? userBasicData.value?.full_name || '' : '',
          email: userBasicData.status === 'fulfilled' ? userBasicData.value?.email || '' : '',
          phone: userBasicData.status === 'fulfilled' ? userBasicData.value?.phone || '' : '',
          country: userBasicData.status === 'fulfilled' ? userBasicData.value?.country || '' : '',
          preferredCurrency: userBasicData.status === 'fulfilled' ? userBasicData.value?.currency || 'USD' : 'USD',
          dateOfBirth: '',
          bio: '',
          website: ''
        },
        preferences: {
          contentTypes: ['tips', 'case_studies', 'tutorials'],
          communicationStyle: 'professional',
          notificationFrequency: 'daily',
          targetAudience: [],
          industries: [],
          roles: []
        },
        behavior: {
          loginFrequency: 0,
          averageSessionDuration: 0,
          mostActiveTimeOfDay: '09:00',
          preferredDevices: ['desktop'],
          engagementScore: 0
        },
        performance: {
          totalReferrals: 0,
          successfulReferrals: 0,
          conversionRate: 0,
          averageEarnings: 0,
          topPerformingCampaigns: []
        },
        aiInsights,
        customization: {
          dashboardLayout: this.getDefaultDashboardLayout(),
          widgetPreferences: ['stats', 'recent_activity', 'recommendations'],
          colorScheme: 'light',
          language: 'en',
          timezone: 'UTC'
        },
        updatedAt: new Date().toISOString()
      };

      // Update with actual data if available
      if (userBehavior.status === 'fulfilled') {
        Object.assign(profile.behavior, userBehavior.value);
      }
      if (userPerformance.status === 'fulfilled') {
        Object.assign(profile.performance, userPerformance.value);
      }

      // Save to database
      await this.saveUserProfile(profile);

      // Cache and return
      this.userProfiles.set(userId, profile);
      return profile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw new Error('Failed to create user profile');
    }
  }

  // Generate AI insights about user
  private async generateAIInsights(userId: string, userData: any): Promise<PersonalizationProfile['aiInsights']> {
    try {
      // Get AI-powered insights
      const [personalizedInsights, churnRisk] = await Promise.allSettled([
        aiAnalyticsAPI.getPersonalizedInsights(userId),
        aiAnalyticsAPI.identifyChurnRisk()
      ]);

      // Analyze personality type based on behavior patterns
      const personalityType = this.analyzePersonalityType(userData);
      
      // Determine motivation factors
      const motivationFactors = this.determineMotivationFactors(userData);
      
      // Calculate growth potential
      const growthPotential = this.calculateGrowthPotential(userData);
      
      // Determine optimal approach strategy
      const optimalApproachStrategy = this.determineOptimalStrategy(userData);

      return {
        personalityType,
        motivationFactors,
        optimalApproachStrategy,
        predictedChurnRisk: churnRisk.status === 'fulfilled' ?
          (churnRisk.value as any[])?.find((risk: any) => risk.userId === userId)?.riskScore || 0 : 0,
        growthPotential
      };
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return {
        personalityType: 'Balanced',
        motivationFactors: ['earnings', 'recognition'],
        optimalApproachStrategy: 'supportive',
        predictedChurnRisk: 0,
        growthPotential: 50
      };
    }
  }

  // Create personalized experience for user
  async createPersonalizedExperience(userId: string): Promise<PersonalizedExperience> {
    try {
      const profile = await this.getUserProfile(userId);
      
      // Get AI-powered recommendations
      const [recommendations, optimalMatches, suggestedCampaigns] = await Promise.allSettled([
        recommendationAPI.getRecommendations(userId, 10),
        smartMatchingAPI.findOptimalMatches(userId, 5),
        this.getSuggestedCampaigns(userId)
      ]);

      const experience: PersonalizedExperience = {
        userId,
        dashboard: {
          layout: profile.customization.dashboardLayout,
          widgets: this.personalizeWidgets(profile),
          quickActions: this.personalizeQuickActions(profile)
        },
        content: {
          recommendations: recommendations.status === 'fulfilled' ? recommendations.value : [],
          articles: await this.personalizeContent(profile),
          tips: await this.personalizeTips(profile)
        },
        notifications: {
          settings: this.personalizeNotificationSettings(profile),
          templates: await this.personalizeNotificationTemplates(profile)
        },
        campaigns: {
          suggested: suggestedCampaigns.status === 'fulfilled' ? suggestedCampaigns.value : [],
          personalized: await this.personalizedCampaigns(profile)
        },
        networking: {
          matches: optimalMatches.status === 'fulfilled' ? optimalMatches.value : [],
          suggestions: await this.personalizeNetworkingSuggestions(profile)
        }
      };

      // Cache the experience
      this.experiences.set(userId, experience);
      
      return experience;
    } catch (error) {
      console.error('Error creating personalized experience:', error);
      throw new Error('Failed to create personalized experience');
    }
  }

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: Partial<PersonalizationProfile['preferences']>): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);
      
      // Update preferences
      Object.assign(profile.preferences, preferences);
      
      // Save to database
      await this.saveUserProfile(profile);
      
      // Update cache
      this.userProfiles.set(userId, profile);
      
      // Update AI recommendation model
      await recommendationAPI.updateUserPreferences(userId, preferences);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error('Failed to update user preferences');
    }
  }

  // Update user behavior data
  async updateUserBehavior(userId: string, behaviorData: {
    action: string;
    timestamp: string;
    metadata?: any;
  }): Promise<void> {
    try {
      // Save behavior data
      if (!supabase) {
        console.warn('Supabase not available, cannot save behavior data');
        return;
      }

      await supabase
        .from('user_behavior_logs')
        .insert({
          user_id: userId,
          action: behaviorData.action,
          timestamp: behaviorData.timestamp,
          metadata: behaviorData.metadata || {}
        });

      // Update cached profile if exists
      if (this.userProfiles.has(userId)) {
        const profile = this.userProfiles.get(userId)!;
        await this.refreshBehaviorData(profile);
        this.userProfiles.set(userId, profile);
      }
    } catch (error) {
      console.error('Error updating user behavior:', error);
      throw new Error('Failed to update user behavior');
    }
  }

  // Get personalized dashboard layout
  async getPersonalizedDashboard(userId: string): Promise<any> {
    try {
      const experience = await this.createPersonalizedExperience(userId);
      return experience.dashboard;
    } catch (error) {
      console.error('Error getting personalized dashboard:', error);
      throw new Error('Failed to get personalized dashboard');
    }
  }

  // Get personalized content recommendations
  async getPersonalizedContent(userId: string, contentType: string, limit: number = 10): Promise<any[]> {
    try {
      const profile = await this.getUserProfile(userId);
      
      if (!supabase) {
        console.warn('Supabase not available, returning empty content');
        return [];
      }

      // Get content based on user preferences and AI insights
      const { data: content, error } = await supabase
        .from('content_library')
        .select('*')
        .eq('type', contentType)
        .in('industry', profile.preferences.industries.length > 0 ? profile.preferences.industries : ['general'])
        .in('role', profile.preferences.roles.length > 0 ? profile.preferences.roles : ['general'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Apply AI-powered ranking
      return this.rankContentByRelevance(content || [], profile);
    } catch (error) {
      console.error('Error getting personalized content:', error);
      throw new Error('Failed to get personalized content');
    }
  }

  // Get personalized notifications
  async getPersonalizedNotifications(userId: string): Promise<any[]> {
    try {
      const profile = await this.getUserProfile(userId);
      
      if (profile.preferences.notificationFrequency === 'never') {
        return [];
      }

      if (!supabase) {
        console.warn('Supabase not available, returning empty notifications');
        return [];
      }

      // Get notifications based on preferences and AI insights
      const { data: notifications, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Filter and personalize notifications
      return this.personalizeNotifications(notifications || [], profile);
    } catch (error) {
      console.error('Error getting personalized notifications:', error);
      throw new Error('Failed to get personalized notifications');
    }
  }

  // Private helper methods
  private parseProfile(data: any): PersonalizationProfile {
    return {
      userId: data.user_id,
      basicInfo: data.basic_info || {
        fullName: '',
        email: '',
        phone: '',
        country: '',
        preferredCurrency: 'USD',
        dateOfBirth: '',
        bio: '',
        website: ''
      },
      preferences: data.preferences || {},
      behavior: data.behavior || {},
      performance: data.performance || {},
      aiInsights: data.ai_insights || {},
      customization: data.customization || {},
      updatedAt: data.updated_at
    };
  }

  private async saveUserProfile(profile: PersonalizationProfile): Promise<void> {
    if (!supabase) {
      console.warn('Supabase not available, cannot save user profile');
      return;
    }

    const { error } = await supabase
      .from('user_personalization_profiles')
      .upsert({
        user_id: profile.userId,
        preferences: profile.preferences,
        behavior: profile.behavior,
        performance: profile.performance,
        ai_insights: profile.aiInsights,
        customization: profile.customization,
        updated_at: profile.updatedAt
      });

    if (error) throw error;
  }

  private async getUserBasicData(userId: string): Promise<any> {
    if (!supabase) {
      console.warn('Supabase not available, returning default user data');
      return { id: userId, email: '', full_name: '', country: '', currency: 'USD' };
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  private async getUserBehaviorData(userId: string): Promise<any> {
    if (!supabase) {
      console.warn('Supabase not available, returning default behavior data');
      return this.analyzeBehaviorPatterns([]);
    }

    const { data, error } = await supabase
      .from('user_behavior_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;
    
    // Analyze behavior patterns
    return this.analyzeBehaviorPatterns(data || []);
  }

  private async getUserPerformanceData(userId: string): Promise<any> {
    if (!supabase) {
      console.warn('Supabase not available, returning default performance data');
      return this.calculatePerformanceMetrics([]);
    }

    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId);

    if (error) throw error;
    
    // Calculate performance metrics
    return this.calculatePerformanceMetrics(data || []);
  }

  private analyzePersonalityType(userData: any): string {
    // Simple personality analysis based on behavior patterns
    const types = ['Analytical', 'Driver', 'Expressive', 'Amiable', 'Balanced'];
    return types[Math.floor(Math.random() * types.length)]; // Simplified for demo
  }

  private determineMotivationFactors(userData: any): string[] {
    const factors = ['earnings', 'recognition', 'learning', 'networking', 'competition'];
    return factors.slice(0, 2 + Math.floor(Math.random() * 3)); // Simplified for demo
  }

  private calculateGrowthPotential(userData: any): number {
    // Calculate growth potential based on various factors
    return Math.floor(Math.random() * 100); // Simplified for demo
  }

  private determineOptimalStrategy(userData: any): string {
    const strategies = ['supportive', 'challenging', 'collaborative', 'independent'];
    return strategies[Math.floor(Math.random() * strategies.length)]; // Simplified for demo
  }

  private getDefaultDashboardLayout(): any {
    return {
      sections: [
        { id: 'stats', position: { x: 0, y: 0, w: 4, h: 2 } },
        { id: 'recent_activity', position: { x: 4, y: 0, w: 4, h: 2 } },
        { id: 'recommendations', position: { x: 0, y: 2, w: 8, h: 3 } },
        { id: 'performance', position: { x: 0, y: 5, w: 8, h: 2 } }
      ]
    };
  }

  private personalizeWidgets(profile: PersonalizationProfile): any[] {
    // Return personalized widgets based on profile
    return profile.customization.widgetPreferences.map(widgetId => ({
      id: widgetId,
      config: this.getWidgetConfig(widgetId, profile)
    }));
  }

  private personalizeQuickActions(profile: PersonalizationProfile): any[] {
    // Return personalized quick actions
    const actions = [];
    
    if (profile.aiInsights.motivationFactors.includes('earnings')) {
      actions.push({ id: 'view_earnings', label: 'View Earnings', icon: 'dollar-sign' });
    }
    
    if (profile.aiInsights.motivationFactors.includes('networking')) {
      actions.push({ id: 'find_matches', label: 'Find Matches', icon: 'users' });
    }
    
    return actions;
  }

  private async personalizeContent(profile: PersonalizationProfile): Promise<any[]> {
    // Get personalized content based on profile
    return [];
  }

  private async personalizeTips(profile: PersonalizationProfile): Promise<any[]> {
    // Get personalized tips based on profile
    return [];
  }

  private personalizeNotificationSettings(profile: PersonalizationProfile): any {
    return {
      frequency: profile.preferences.notificationFrequency,
      channels: ['email', 'push'],
      types: ['earnings', 'matches', 'tips']
    };
  }

  private async personalizeNotificationTemplates(profile: PersonalizationProfile): Promise<any[]> {
    // Get personalized notification templates
    return [];
  }

  private async getSuggestedCampaigns(userId: string): Promise<any[]> {
    // Get AI-suggested campaigns for user
    return [];
  }

  private async personalizedCampaigns(profile: PersonalizationProfile): Promise<any[]> {
    // Get personalized campaigns based on profile
    return [];
  }

  private async personalizeNetworkingSuggestions(profile: PersonalizationProfile): Promise<any[]> {
    // Get personalized networking suggestions
    return [];
  }

  private analyzeBehaviorPatterns(logs: any[]): any {
    // Analyze behavior patterns from logs
    return {
      loginFrequency: logs.filter(log => log.action === 'login').length,
      averageSessionDuration: 1800, // 30 minutes default
      mostActiveTimeOfDay: '09:00',
      preferredDevices: ['desktop'],
      engagementScore: Math.min(100, logs.length * 2)
    };
  }

  private calculatePerformanceMetrics(referrals: any[]): any {
    const successful = referrals.filter(r => r.status === 'completed');
    
    return {
      totalReferrals: referrals.length,
      successfulReferrals: successful.length,
      conversionRate: referrals.length > 0 ? (successful.length / referrals.length) * 100 : 0,
      averageEarnings: successful.reduce((sum, r) => sum + (r.earnings || 0), 0) / Math.max(successful.length, 1),
      topPerformingCampaigns: []
    };
  }

  private async refreshBehaviorData(profile: PersonalizationProfile): Promise<void> {
    const behaviorData = await this.getUserBehaviorData(profile.userId);
    Object.assign(profile.behavior, behaviorData);
    profile.updatedAt = new Date().toISOString();
  }

  private rankContentByRelevance(content: any[], profile: PersonalizationProfile): any[] {
    // Apply AI-powered ranking based on profile
    return content.sort((a, b) => {
      // Simple relevance scoring
      let scoreA = 0;
      let scoreB = 0;
      
      // Boost score based on content type preferences
      if (profile.preferences.contentTypes.includes(a.type)) scoreA += 10;
      if (profile.preferences.contentTypes.includes(b.type)) scoreB += 10;
      
      // Boost score based on AI insights
      if (profile.aiInsights.motivationFactors.some(factor => a.tags?.includes(factor))) scoreA += 5;
      if (profile.aiInsights.motivationFactors.some(factor => b.tags?.includes(factor))) scoreB += 5;
      
      return scoreB - scoreA;
    });
  }

  private personalizeNotifications(notifications: any[], profile: PersonalizationProfile): any[] {
    // Filter and personalize notifications based on profile
    return notifications.filter(notification => {
      // Filter based on preferences and AI insights
      return true; // Simplified for demo
    });
  }

  private getWidgetConfig(widgetId: string, profile: PersonalizationProfile): any {
    // Return widget configuration based on profile
    return {};
  }
}

export const personalizationService = PersonalizationService.getInstance();
