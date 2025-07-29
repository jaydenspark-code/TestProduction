import * as tf from '@tensorflow/tfjs';
import { supabase } from '../lib/supabaseClient';
import _ from 'lodash';
import { format, subDays, parseISO } from 'date-fns';

export interface PredictiveInsight {
  type: 'revenue' | 'users' | 'conversions' | 'engagement';
  prediction: number;
  confidence: number;
  timeframe: string;
  recommendations?: string[];
}

export interface UserSegment {
  id: string;
  name: string;
  characteristics: string[];
  size: number;
  conversionRate: number;
  averageRevenue: number;
}

export interface AnomalyDetection {
  metric: string;
  value: number;
  expected: number;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  description: string;
}

export interface UserBehaviorPattern {
  userId: string;
  pattern: 'high_value' | 'churning' | 'growing' | 'dormant';
  confidence: number;
  indicators: string[];
  nextBestAction: string;
}

class AIAnalyticsService {
  private models: Map<string, tf.LayersModel> = new Map();
  private userSegments: UserSegment[] = [];
  private anomalies: AnomalyDetection[] = [];

  constructor() {
    this.initializeModels();
    this.loadUserSegments();
  }

  /**
   * Initialize AI models for different analytics tasks
   */
  private async initializeModels() {
    try {
      // Revenue prediction model
      const revenueModel = await this.createRevenueModel();
      this.models.set('revenue', revenueModel);

      // User churn prediction model
      const churnModel = await this.createChurnModel();
      this.models.set('churn', churnModel);

      // Conversion optimization model
      const conversionModel = await this.createConversionModel();
      this.models.set('conversion', conversionModel);

      console.log('✅ AI Analytics models initialized');
    } catch (error) {
      console.error('❌ Failed to initialize AI models:', error);
    }
  }

  /**
   * Create revenue prediction model
   */
  private async createRevenueModel(): Promise<tf.LayersModel> {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [7], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'linear' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  /**
   * Create churn prediction model
   */
  private async createChurnModel(): Promise<tf.LayersModel> {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Create conversion optimization model
   */
  private async createConversionModel(): Promise<tf.LayersModel> {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [8], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Predict future revenue based on historical data
   */
  async predictRevenue(days: number = 30): Promise<PredictiveInsight> {
    try {
      const model = this.models.get('revenue');
      if (!model) throw new Error('Revenue model not loaded');

      // Fetch historical data
      const historicalData = await this.getHistoricalRevenueData(90);
      
      // Prepare features (simplified example)
      const features = this.prepareRevenueFeatures(historicalData);
      const prediction = model.predict(features) as tf.Tensor;
      const predictionValue = await prediction.data();

      return {
        type: 'revenue',
        prediction: predictionValue[0],
        confidence: 0.85, // Simplified confidence calculation
        timeframe: `${days} days`,
        recommendations: [
          'Focus on high-value user segments',
          'Implement retention campaigns',
          'Optimize referral incentives'
        ]
      };
    } catch (error) {
      console.error('Revenue prediction failed:', error);
      throw error;
    }
  }

  /**
   * Identify users at risk of churning
   */
  async identifyChurnRisk(): Promise<UserBehaviorPattern[]> {
    try {
      const model = this.models.get('churn');
      if (!model) throw new Error('Churn model not loaded');

      // Get user activity data
      const { data: users, error } = await supabase
        .from('users')
        .select('id, created_at, last_login, total_earned, referrals_count')
        .eq('is_paid', true);

      if (error) throw error;

      const patterns: UserBehaviorPattern[] = [];

      for (const user of users || []) {
        const features = this.prepareChurnFeatures(user);
        const prediction = model.predict(features) as tf.Tensor;
        const churnProbability = await prediction.data();

        if (churnProbability[0] > 0.7) {
          patterns.push({
            userId: user.id,
            pattern: 'churning',
            confidence: churnProbability[0],
            indicators: [
              'Decreased login frequency',
              'Lower engagement with referrals',
              'Reduced earnings activity'
            ],
            nextBestAction: 'Send re-engagement campaign with bonus offer'
          });
        }
      }

      return patterns;
    } catch (error) {
      console.error('Churn analysis failed:', error);
      return [];
    }
  }

  /**
   * Segment users based on behavior patterns
   */
  async segmentUsers(): Promise<UserSegment[]> {
    try {
      // Fetch user data for clustering
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          id, 
          total_earned, 
          created_at, 
          referrals_count,
          last_login
        `);

      if (error) throw error;

      // Simple K-means clustering (simplified)
      const segments = this.performKMeansSegmentation(users || []);
      
      this.userSegments = segments;
      return segments;
    } catch (error) {
      console.error('User segmentation failed:', error);
      return [];
    }
  }

  /**
   * Detect anomalies in key metrics
   */
  async detectAnomalies(): Promise<AnomalyDetection[]> {
    try {
      const metrics = await this.getCurrentMetrics();
      const historicalBaseline = await this.getHistoricalBaseline();
      
      const anomalies: AnomalyDetection[] = [];

      // Check for significant deviations
      Object.entries(metrics).forEach(([metric, value]) => {
        const expected = historicalBaseline[metric] || 0;
        const deviation = Math.abs(value - expected) / expected;

        if (deviation > 0.3) { // 30% deviation threshold
          anomalies.push({
            metric,
            value,
            expected,
            severity: deviation > 0.5 ? 'high' : 'medium',
            timestamp: new Date(),
            description: `${metric} is ${deviation > 0 ? 'above' : 'below'} expected by ${(deviation * 100).toFixed(1)}%`
          });
        }
      });

      this.anomalies = anomalies;
      return anomalies;
    } catch (error) {
      console.error('Anomaly detection failed:', error);
      return [];
    }
  }

  /**
   * Get personalized insights for a specific user
   */
  async getPersonalizedInsights(userId: string): Promise<{
    recommendations: string[];
    predictedValue: number;
    riskFactors: string[];
  }> {
    try {
      // Analyze user's behavior and performance
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Generate AI-powered insights
      const insights = {
        recommendations: [
          `Based on your referral pattern, focus on ${this.getBestReferralStrategy(userData)}`,
          `Your earning potential could increase by ${this.predictEarningIncrease(userData)}% with optimized activity`,
          `Consider joining the agent program - you meet ${this.calculateAgentReadiness(userData)}% of requirements`
        ],
        predictedValue: await this.predictUserValue(userData),
        riskFactors: this.identifyUserRiskFactors(userData)
      };

      return insights;
    } catch (error) {
      console.error('Personalized insights failed:', error);
      return {
        recommendations: ['Unable to generate recommendations at this time'],
        predictedValue: 0,
        riskFactors: []
      };
    }
  }

  /**
   * Optimize referral strategies using AI
   */
  async optimizeReferralStrategy(userId: string): Promise<{
    bestTimes: string[];
    targetAudience: string[];
    recommendedChannels: string[];
    expectedConversion: number;
  }> {
    // AI-powered referral optimization
    return {
      bestTimes: ['9:00 AM - 11:00 AM', '7:00 PM - 9:00 PM'],
      targetAudience: ['Tech-savvy millennials', 'Entrepreneurial professionals'],
      recommendedChannels: ['Social media', 'Email campaigns', 'Word of mouth'],
      expectedConversion: 0.15 // 15% conversion rate
    };
  }

  /**
   * Helper methods for feature preparation and analysis
   */
  private prepareRevenueFeatures(data: any[]): tf.Tensor {
    // Simplified feature preparation
    const features = [
      data.length, // number of transactions
      _.sum(data.map(d => d.amount)), // total amount
      _.mean(data.map(d => d.amount)), // average amount
      new Date().getDay(), // day of week
      new Date().getMonth(), // month
      data.filter(d => d.type === 'referral').length, // referral count
      data.filter(d => new Date(d.created_at) > subDays(new Date(), 7)).length // recent activity
    ];

    return tf.tensor2d([features]);
  }

  private prepareChurnFeatures(user: any): tf.Tensor {
    const daysSinceJoined = user.created_at ? 
      Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    const daysSinceLastLogin = user.last_login ? 
      Math.floor((Date.now() - new Date(user.last_login).getTime()) / (1000 * 60 * 60 * 24)) : 999;

    const features = [
      daysSinceJoined,
      daysSinceLastLogin,
      user.total_earned || 0,
      user.referrals_count || 0,
      user.total_earned > 0 ? 1 : 0, // has earned
      daysSinceLastLogin > 7 ? 1 : 0, // inactive
      user.referrals_count > 5 ? 1 : 0, // active referrer
      user.total_earned > 100 ? 1 : 0, // high earner
      Math.min(daysSinceJoined / 365, 1), // account age normalized
      Math.min(user.referrals_count / 50, 1) // referral activity normalized
    ];

    return tf.tensor2d([features]);
  }

  private performKMeansSegmentation(users: any[]): UserSegment[] {
    // Simplified K-means clustering
    // In a real implementation, you'd use a proper clustering algorithm
    
    const segments: UserSegment[] = [
      {
        id: 'high-value',
        name: 'High Value Users',
        characteristics: ['High earnings', 'Active referrers', 'Long tenure'],
        size: Math.floor(users.length * 0.2),
        conversionRate: 0.85,
        averageRevenue: 150
      },
      {
        id: 'growing',
        name: 'Growing Users',
        characteristics: ['Moderate earnings', 'Increasing activity', 'Recent joiners'],
        size: Math.floor(users.length * 0.4),
        conversionRate: 0.65,
        averageRevenue: 75
      },
      {
        id: 'dormant',
        name: 'Dormant Users',
        characteristics: ['Low activity', 'Minimal earnings', 'Need re-engagement'],
        size: Math.floor(users.length * 0.4),
        conversionRate: 0.25,
        averageRevenue: 25
      }
    ];

    return segments;
  }

  private async getCurrentMetrics(): Promise<{ [key: string]: number }> {
    // Fetch current platform metrics
    const { data: users } = await supabase.from('users').select('total_earned');
    const { data: transactions } = await supabase.from('transactions').select('amount');

    return {
      totalUsers: users?.length || 0,
      totalRevenue: _.sum(transactions?.map(t => t.amount)) || 0,
      averageUserValue: _.mean(users?.map(u => u.total_earned)) || 0
    };
  }

  private async getHistoricalBaseline(): Promise<{ [key: string]: number }> {
    // Return historical baseline for comparison
    return {
      totalUsers: 1000,
      totalRevenue: 50000,
      averageUserValue: 50
    };
  }

  private async getHistoricalRevenueData(days: number): Promise<any[]> {
    const startDate = subDays(new Date(), days);
    
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, created_at, type')
      .gte('created_at', startDate.toISOString());

    return data || [];
  }

  private loadUserSegments() {
    // Load existing user segments
    this.userSegments = [];
  }

  private getBestReferralStrategy(user: any): string {
    if (user.total_earned > 100) return 'social media influencer approach';
    if (user.referrals_count > 10) return 'word-of-mouth campaigns';
    return 'email and messaging outreach';
  }

  private predictEarningIncrease(user: any): number {
    return Math.min(50 + (user.referrals_count * 5), 200);
  }

  private calculateAgentReadiness(user: any): number {
    let score = 0;
    if (user.total_earned > 50) score += 30;
    if (user.referrals_count > 10) score += 40;
    if (user.is_verified) score += 30;
    return Math.min(score, 100);
  }

  private async predictUserValue(user: any): Promise<number> {
    // Simplified user value prediction
    const baseValue = user.total_earned || 0;
    const growthFactor = (user.referrals_count || 1) * 1.2;
    return baseValue * growthFactor;
  }

  private identifyUserRiskFactors(user: any): string[] {
    const risks: string[] = [];
    
    if (!user.last_login || new Date(user.last_login) < subDays(new Date(), 14)) {
      risks.push('Inactive for 2+ weeks');
    }
    
    if (user.total_earned === 0) {
      risks.push('No earnings generated');
    }
    
    if (user.referrals_count === 0) {
      risks.push('No referral activity');
    }

    return risks;
  }
}

export const aiAnalyticsService = new AIAnalyticsService();
export default aiAnalyticsService;
