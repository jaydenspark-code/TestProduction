import { supabase } from '../lib/supabaseClient';
import { aiAnalyticsService } from '../services/aiAnalyticsService';
import { recommendationService } from '../services/recommendationService';
import { smartMatchingService } from '../services/smartMatchingService';

// Mock AI Analytics API
export const aiAnalyticsAPI = {
  async getPersonalizedInsights(userId: string) {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            title: 'Conversion Rate',
            value: '3.2%',
            change: 15,
            trend: 'up',
            description: 'Your conversion rate improved this week'
          }
        ]);
      }, 1000);
    });
  },

  async predictRevenue(days: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          predicted: 5000,
          confidence: 0.85,
          trend: 'up'
        });
      }, 1000);
    });
  },

  async segmentUsers() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { segment: 'High Value', count: 150 },
          { segment: 'Regular', count: 300 },
          { segment: 'New', count: 75 }
        ]);
      }, 1000);
    });
  },

  async detectAnomalies() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([]);
      }, 1000);
    });
  },

  async identifyChurnRisk() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([]);
      }, 1000);
    });
  }
};

// API wrapper for Recommendation Service
export const recommendationAPI = {
  // Get User Recommendations
  async getRecommendations(userId: string, limit: number = 10) {
    try {
      return await recommendationService.getRecommendationsForUser(userId, limit);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new Error('Failed to get recommendations');
    }
  },

  // Update User Preferences
  async updateUserPreferences(userId: string, preferences: any) {
    try {
      await recommendationService.updateUserPreferences(userId, preferences);
      return { success: true };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error('Failed to update user preferences');
    }
  },

  // Train Model with New Data
  async trainModel(newData: any[]) {
    try {
      await recommendationService.trainModel(newData);
      return { success: true };
    } catch (error) {
      console.error('Error training model:', error);
      throw new Error('Failed to train model');
    }
  },

  // Get Similar Users
  async getSimilarUsers(userId: string, limit: number = 10) {
    try {
      return await recommendationService.getSimilarUsers(userId, limit);
    } catch (error) {
      console.error('Error getting similar users:', error);
      throw new Error('Failed to get similar users');
    }
  }
};

// API wrapper for Smart Matching Service
export const smartMatchingAPI = {
  // Find Optimal Matches
  async findOptimalMatches(userId: string, limit: number = 5) {
    try {
      return await smartMatchingService.findOptimalMatches(userId, limit);
    } catch (error) {
      console.error('Error finding optimal matches:', error);
      throw new Error('Failed to find optimal matches');
    }
  },

  // Get Personalized Strategy
  async getPersonalizedStrategy(userId: string) {
    try {
      return await smartMatchingService.getPersonalizedStrategy(userId);
    } catch (error) {
      console.error('Error getting personalized strategy:', error);
      throw new Error('Failed to get personalized strategy');
    }
  },

  // Analyze Network
  async analyzeNetwork(userId: string) {
    try {
      return await smartMatchingService.analyzeNetwork(userId);
    } catch (error) {
      console.error('Error analyzing network:', error);
      throw new Error('Failed to analyze network');
    }
  },

  // Update Compatibility Model
  async updateCompatibilityModel(newData: any[]) {
    try {
      await smartMatchingService.updateCompatibilityModel(newData);
      return { success: true };
    } catch (error) {
      console.error('Error updating compatibility model:', error);
      throw new Error('Failed to update compatibility model');
    }
  },

  // Get Match History
  async getMatchHistory(userId: string, limit: number = 20) {
    try {
      if (!supabase) {
        console.warn('Supabase not available, returning empty match history');
        return [];
      }

      const { data, error } = await supabase
        .from('referral_matches')
        .select(`
          id,
          referrer_id,
          referee_id,
          compatibility_score,
          match_reasons,
          recommended_approach,
          expected_conversion,
          actual_conversion,
          created_at,
          updated_at
        `)
        .or(`referrer_id.eq.${userId},referee_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting match history:', error);
      throw new Error('Failed to get match history');
    }
  },

  // Save Match Result
  async saveMatchResult(matchData: {
    referrerId: string;
    refereeId: string;
    compatibilityScore: number;
    matchReasons: string[];
    recommendedApproach: string;
    expectedConversion: number;
  }) {
    try {
      if (!supabase) {
        console.warn('Supabase not available, cannot save match result');
        return null;
      }

      const { data, error } = await supabase
        .from('referral_matches')
        .insert({
          referrer_id: matchData.referrerId,
          referee_id: matchData.refereeId,
          compatibility_score: matchData.compatibilityScore,
          match_reasons: matchData.matchReasons,
          recommended_approach: matchData.recommendedApproach,
          expected_conversion: matchData.expectedConversion
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving match result:', error);
      throw new Error('Failed to save match result');
    }
  },

  // Update Match Outcome
  async updateMatchOutcome(matchId: string, actualConversion: number, notes?: string) {
    try {
      if (!supabase) {
        console.warn('Supabase not available, cannot update match outcome');
        return null;
      }

      const { data, error } = await supabase
        .from('referral_matches')
        .update({
          actual_conversion: actualConversion,
          outcome_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', matchId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating match outcome:', error);
      throw new Error('Failed to update match outcome');
    }
  }
};

// Combined AI API for dashboard integration
export const aiDashboardAPI = {
  // Get comprehensive dashboard data
  async getDashboardData(userId: string) {
    try {
      const [
        personalInsights,
        recommendations,
        optimalMatches,
        personalStrategy,
        revenueInsight,
        userSegments,
        anomalies,
        churnRisks,
        matchHistory
      ] = await Promise.allSettled([
        aiAnalyticsAPI.getPersonalizedInsights(userId),
        recommendationAPI.getRecommendations(userId, 10),
        smartMatchingAPI.findOptimalMatches(userId, 5),
        smartMatchingAPI.getPersonalizedStrategy(userId),
        aiAnalyticsAPI.predictRevenue(30),
        aiAnalyticsAPI.segmentUsers(),
        aiAnalyticsAPI.detectAnomalies(),
        aiAnalyticsAPI.identifyChurnRisk(),
        smartMatchingAPI.getMatchHistory(userId, 10)
      ]);

      return {
        personalInsights: personalInsights.status === 'fulfilled' ? personalInsights.value : null,
        recommendations: recommendations.status === 'fulfilled' ? recommendations.value : [],
        optimalMatches: optimalMatches.status === 'fulfilled' ? optimalMatches.value : [],
        personalStrategy: personalStrategy.status === 'fulfilled' ? personalStrategy.value : null,
        revenueInsight: revenueInsight.status === 'fulfilled' ? revenueInsight.value : null,
        userSegments: userSegments.status === 'fulfilled' ? userSegments.value : [],
        anomalies: anomalies.status === 'fulfilled' ? anomalies.value : [],
        churnRisks: churnRisks.status === 'fulfilled' ? churnRisks.value : [],
        matchHistory: matchHistory.status === 'fulfilled' ? matchHistory.value : []
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw new Error('Failed to get dashboard data');
    }
  },

  // Get AI metrics for performance tracking
  async getAIMetrics(userId?: string) {
    try {
      if (!supabase) {
        console.warn('Supabase not available, returning empty metrics');
        return [];
      }

      const { data: metrics, error } = await supabase
        .from('ai_metrics')
        .select('*')
        .eq('user_id', userId || 'system')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return metrics || [];
    } catch (error) {
      console.error('Error getting AI metrics:', error);
      throw new Error('Failed to get AI metrics');
    }
  },

  // Save AI metrics for tracking
  async saveAIMetrics(data: {
    userId?: string;
    metricType: string;
    metricValue: number;
    metadata?: any;
  }) {
    try {
      if (!supabase) {
        console.warn('Supabase not available, cannot save AI metrics');
        return null;
      }

      const { data: saved, error } = await supabase
        .from('ai_metrics')
        .insert({
          user_id: data.userId || 'system',
          metric_type: data.metricType,
          metric_value: data.metricValue,
          metadata: data.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;
      return saved;
    } catch (error) {
      console.error('Error saving AI metrics:', error);
      throw new Error('Failed to save AI metrics');
    }
  },

  // Refresh AI models (admin function)
  async refreshModels() {
    try {
      if (!supabase) {
        console.warn('Supabase not available, cannot refresh AI models');
        return { success: false, error: 'Database not available' };
      }

      // This would typically trigger model retraining
      // For now, we'll simulate this with database updates
      const { data, error } = await supabase.rpc('refresh_ai_models');
      
      if (error) throw error;
      return { success: true, refreshedAt: new Date().toISOString() };
    } catch (error) {
      console.error('Error refreshing AI models:', error);
      throw new Error('Failed to refresh AI models');
    }
  },

  // Get AI system health
  async getSystemHealth() {
    try {
      // Check various AI service components
      const healthChecks = await Promise.allSettled([
        aiAnalyticsAPI.segmentUsers(),
        recommendationAPI.getRecommendations('health-check', 1),
        smartMatchingAPI.analyzeNetwork('health-check')
      ]);

      const services = {
        analytics: healthChecks[0].status === 'fulfilled',
        recommendations: healthChecks[1].status === 'fulfilled',
        matching: healthChecks[2].status === 'fulfilled'
      };

      const overallHealth = Object.values(services).every(status => status);

      return {
        healthy: overallHealth,
        services,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error checking AI system health:', error);
      return {
        healthy: false,
        services: { analytics: false, recommendations: false, matching: false },
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

// Export all APIs
export {
  aiAnalyticsAPI as analytics,
  recommendationAPI as recommendations,
  smartMatchingAPI as matching,
  aiDashboardAPI as dashboard
};
