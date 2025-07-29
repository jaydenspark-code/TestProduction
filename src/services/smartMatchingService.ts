import * as tf from '@tensorflow/tfjs';
import { supabase } from '../lib/supabaseClient';
import _ from 'lodash';

export interface UserProfile {
  id: string;
  demographics: {
    age?: number;
    location: string;
    interests: string[];
    occupation?: string;
  };
  behavior: {
    activityLevel: 'low' | 'medium' | 'high';
    preferredTime: string;
    socialPlatforms: string[];
    conversionHistory: number;
  };
  performance: {
    totalEarnings: number;
    referralCount: number;
    successRate: number;
    averageConversion: number;
  };
}

export interface MatchResult {
  referrerId: string;
  targetUserId: string;
  compatibilityScore: number;
  reasons: string[];
  recommendedApproach: string;
  expectedConversion: number;
}

export interface CampaignOptimization {
  targetSegment: string;
  bestChannels: string[];
  optimalTiming: string;
  contentSuggestions: string[];
  budgetAllocation: { [channel: string]: number };
}

class SmartMatchingService {
  private matchingModel: tf.LayersModel | null = null;
  private userProfiles: Map<string, UserProfile> = new Map();

  constructor() {
    this.initializeMatchingModel();
    this.loadUserProfiles();
  }

  /**
   * Initialize the smart matching ML model
   */
  private async initializeMatchingModel() {
    try {
      // Create a neural network for compatibility scoring
      this.matchingModel = tf.sequential({
        layers: [
          tf.layers.dense({ 
            inputShape: [20], // Combined features from both users
            units: 128, 
            activation: 'relu' 
          }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({ units: 64, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 32, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' }) // Compatibility score 0-1
        ]
      });

      this.matchingModel.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      console.log('✅ Smart Matching model initialized');
    } catch (error) {
      console.error('❌ Failed to initialize matching model:', error);
    }
  }

  /**
   * Find optimal referrer-referee matches
   */
  async findOptimalMatches(targetUserId: string, limit = 10): Promise<MatchResult[]> {
    try {
      const targetProfile = await this.getUserProfile(targetUserId);
      if (!targetProfile) throw new Error('Target user profile not found');

      // Get potential referrers
      const potentialReferrers = await this.getPotentialReferrers();
      const matches: MatchResult[] = [];

      for (const referrer of potentialReferrers) {
        const referrerProfile = await this.getUserProfile(referrer.id);
        if (!referrerProfile) continue;

        const compatibilityScore = await this.calculateCompatibility(
          referrerProfile, 
          targetProfile
        );

        if (compatibilityScore > 0.6) { // Only consider high-compatibility matches
          matches.push({
            referrerId: referrer.id,
            targetUserId: targetUserId,
            compatibilityScore,
            reasons: this.generateMatchReasons(referrerProfile, targetProfile),
            recommendedApproach: this.getRecommendedApproach(referrerProfile, targetProfile),
            expectedConversion: this.predictConversion(referrerProfile, targetProfile, compatibilityScore)
          });
        }
      }

      // Sort by compatibility score and return top matches
      return matches
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, limit);

    } catch (error) {
      console.error('Smart matching failed:', error);
      return [];
    }
  }

  /**
   * Calculate compatibility score between two users using ML
   */
  private async calculateCompatibility(
    referrer: UserProfile, 
    target: UserProfile
  ): Promise<number> {
    if (!this.matchingModel) return 0.5; // Fallback score

    try {
      // Create feature vector combining both user profiles
      const features = this.createFeatureVector(referrer, target);
      const prediction = this.matchingModel.predict(features) as tf.Tensor;
      const score = await prediction.data();
      
      // Clean up tensors
      features.dispose();
      prediction.dispose();

      return score[0];
    } catch (error) {
      console.error('Compatibility calculation failed:', error);
      return 0.5;
    }
  }

  /**
   * Create feature vector for ML model input
   */
  private createFeatureVector(referrer: UserProfile, target: UserProfile): tf.Tensor {
    const features = [
      // Location compatibility (simplified)
      referrer.demographics.location === target.demographics.location ? 1 : 0,
      
      // Interest overlap
      this.calculateInterestOverlap(
        referrer.demographics.interests, 
        target.demographics.interests
      ),
      
      // Activity level compatibility
      this.getActivityCompatibility(
        referrer.behavior.activityLevel, 
        target.behavior.activityLevel
      ),
      
      // Social platform overlap
      this.calculatePlatformOverlap(
        referrer.behavior.socialPlatforms, 
        target.behavior.socialPlatforms
      ),
      
      // Performance metrics
      referrer.performance.successRate,
      referrer.performance.averageConversion,
      target.behavior.conversionHistory,
      
      // Normalized earnings (0-1 scale)
      Math.min(referrer.performance.totalEarnings / 1000, 1),
      Math.min(referrer.performance.referralCount / 100, 1),
      
      // Age compatibility (if available)
      this.getAgeCompatibility(
        referrer.demographics.age, 
        target.demographics.age
      ),
      
      // Time zone compatibility
      this.getTimeCompatibility(
        referrer.behavior.preferredTime, 
        target.behavior.preferredTime
      ),
      
      // Additional contextual features
      referrer.performance.referralCount > 10 ? 1 : 0, // Experienced referrer
      target.behavior.activityLevel === 'high' ? 1 : 0, // Active target
      referrer.behavior.conversionHistory > 0.1 ? 1 : 0, // Good conversion history
      
      // Cross-features
      referrer.performance.successRate * target.behavior.conversionHistory,
      
      // Diversity factors
      Math.random(), // Add some randomization for diversity
      Math.random(),
      Math.random(),
      Math.random(),
      Math.random()
    ];

    return tf.tensor2d([features]);
  }

  /**
   * Generate human-readable reasons for the match
   */
  private generateMatchReasons(referrer: UserProfile, target: UserProfile): string[] {
    const reasons: string[] = [];

    if (referrer.demographics.location === target.demographics.location) {
      reasons.push('Same geographical location');
    }

    const interestOverlap = this.calculateInterestOverlap(
      referrer.demographics.interests, 
      target.demographics.interests
    );
    if (interestOverlap > 0.3) {
      reasons.push(`${Math.round(interestOverlap * 100)}% shared interests`);
    }

    if (referrer.performance.successRate > 0.7) {
      reasons.push('High success rate referrer');
    }

    const platformOverlap = this.calculatePlatformOverlap(
      referrer.behavior.socialPlatforms, 
      target.behavior.socialPlatforms
    );
    if (platformOverlap > 0.5) {
      reasons.push('Active on same social platforms');
    }

    if (referrer.behavior.activityLevel === target.behavior.activityLevel) {
      reasons.push('Similar activity patterns');
    }

    return reasons;
  }

  /**
   * Get recommended approach for this specific match
   */
  private getRecommendedApproach(referrer: UserProfile, target: UserProfile): string {
    const commonPlatforms = _.intersection(
      referrer.behavior.socialPlatforms, 
      target.behavior.socialPlatforms
    );

    if (commonPlatforms.includes('instagram')) {
      return 'Visual content sharing on Instagram with personal story';
    }
    
    if (commonPlatforms.includes('linkedin')) {
      return 'Professional networking approach via LinkedIn';
    }
    
    if (commonPlatforms.includes('facebook')) {
      return 'Facebook post with personal recommendation';
    }
    
    if (referrer.demographics.location === target.demographics.location) {
      return 'Local meetup or in-person recommendation';
    }

    return 'Direct message with personalized benefits explanation';
  }

  /**
   * Predict conversion probability for this match
   */
  private predictConversion(
    referrer: UserProfile, 
    target: UserProfile, 
    compatibilityScore: number
  ): number {
    const baseConversion = 0.1; // 10% base conversion rate
    const referrerBonus = referrer.performance.averageConversion * 0.5;
    const targetBonus = target.behavior.conversionHistory * 0.3;
    const compatibilityBonus = compatibilityScore * 0.4;

    return Math.min(baseConversion + referrerBonus + targetBonus + compatibilityBonus, 0.9);
  }

  /**
   * Optimize campaign targeting using AI insights
   */
  async optimizeCampaign(campaignId: string): Promise<CampaignOptimization> {
    try {
      // Analyze successful matches and patterns
      const successfulMatches = await this.getSuccessfulMatches(campaignId);
      const segments = await this.analyzeSuccessfulSegments(successfulMatches);

      return {
        targetSegment: this.identifyBestSegment(segments),
        bestChannels: this.identifyBestChannels(successfulMatches),
        optimalTiming: this.identifyOptimalTiming(successfulMatches),
        contentSuggestions: this.generateContentSuggestions(segments),
        budgetAllocation: this.optimizeBudgetAllocation(successfulMatches)
      };
    } catch (error) {
      console.error('Campaign optimization failed:', error);
      return {
        targetSegment: 'general',
        bestChannels: ['social_media', 'email'],
        optimalTiming: '9:00 AM - 11:00 AM',
        contentSuggestions: ['Personal testimonials', 'Success stories'],
        budgetAllocation: { social_media: 0.6, email: 0.4 }
      };
    }
  }

  /**
   * Get personalized referral strategy for a user
   */
  async getPersonalizedStrategy(userId: string): Promise<{
    bestTargets: string[];
    recommendedChannels: string[];
    optimalTiming: string;
    contentSuggestions: string[];
    expectedResults: { conversions: number; revenue: number };
  }> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) throw new Error('User profile not found');

      const potentialMatches = await this.findOptimalMatches(userId);
      
      return {
        bestTargets: potentialMatches.slice(0, 5).map(m => m.targetUserId),
        recommendedChannels: this.getRecommendedChannels(userProfile),
        optimalTiming: this.getOptimalTiming(userProfile),
        contentSuggestions: this.getContentSuggestions(userProfile),
        expectedResults: {
          conversions: potentialMatches.reduce((sum, match) => sum + match.expectedConversion, 0),
          revenue: potentialMatches.reduce((sum, match) => sum + (match.expectedConversion * 25), 0) // $25 avg per conversion
        }
      };
    } catch (error) {
      console.error('Personalized strategy generation failed:', error);
      return {
        bestTargets: [],
        recommendedChannels: ['social_media'],
        optimalTiming: '9:00 AM - 11:00 AM',
        contentSuggestions: ['Share your success story'],
        expectedResults: { conversions: 0, revenue: 0 }
      };
    }
  }

  /**
   * Helper methods for calculations and data processing
   */
  private calculateInterestOverlap(interests1: string[], interests2: string[]): number {
    const intersection = _.intersection(interests1, interests2);
    const union = _.union(interests1, interests2);
    return union.length > 0 ? intersection.length / union.length : 0;
  }

  private calculatePlatformOverlap(platforms1: string[], platforms2: string[]): number {
    const intersection = _.intersection(platforms1, platforms2);
    const union = _.union(platforms1, platforms2);
    return union.length > 0 ? intersection.length / union.length : 0;
  }

  private getActivityCompatibility(level1: string, level2: string): number {
    const levels = { low: 1, medium: 2, high: 3 };
    const diff = Math.abs(levels[level1 as keyof typeof levels] - levels[level2 as keyof typeof levels]);
    return 1 - (diff / 2); // Normalize to 0-1
  }

  private getAgeCompatibility(age1?: number, age2?: number): number {
    if (!age1 || !age2) return 0.5;
    const ageDiff = Math.abs(age1 - age2);
    return Math.max(0, 1 - (ageDiff / 20)); // Compatibility decreases with age difference
  }

  private getTimeCompatibility(time1: string, time2: string): number {
    // Simplified time compatibility check
    return time1 === time2 ? 1 : 0.5;
  }

  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    // Check cache first
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }

    try {
      if (!supabase) {
        console.warn('Supabase not available, cannot fetch user profile');
        return null;
      }

      // Fetch from database
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) return null;

      // Create profile (simplified)
      const profile: UserProfile = {
        id: userId,
        demographics: {
          location: user.country || 'unknown',
          interests: user.interests || [],
          age: user.age,
          occupation: user.occupation
        },
        behavior: {
          activityLevel: this.classifyActivityLevel(user),
          preferredTime: user.preferred_time || '9:00 AM',
          socialPlatforms: user.social_platforms || ['facebook'],
          conversionHistory: user.conversion_rate || 0.1
        },
        performance: {
          totalEarnings: user.total_earned || 0,
          referralCount: user.referrals_count || 0,
          successRate: user.success_rate || 0.5,
          averageConversion: user.average_conversion || 0.1
        }
      };

      // Cache the profile
      this.userProfiles.set(userId, profile);
      return profile;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  private classifyActivityLevel(user: any): 'low' | 'medium' | 'high' {
    const score = (user.total_earned || 0) + (user.referrals_count || 0) * 10;
    if (score > 100) return 'high';
    if (score > 30) return 'medium';
    return 'low';
  }

  private async getPotentialReferrers(): Promise<{ id: string }[]> {
    if (!supabase) {
      console.warn('Supabase not available, returning empty referrers list');
      return [];
    }

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('is_paid', true)
      .eq('role', 'user')
      .limit(100);

    return data || [];
  }

  private async loadUserProfiles() {
    // Load and cache user profiles
    console.log('Loading user profiles for smart matching...');
  }

  private async getSuccessfulMatches(campaignId: string): Promise<any[]> {
    // Fetch successful referral matches for analysis
    return [];
  }

  private async analyzeSuccessfulSegments(matches: any[]): Promise<any[]> {
    // Analyze patterns in successful matches
    return [];
  }

  private identifyBestSegment(segments: any[]): string {
    return 'tech-professionals'; // Simplified
  }

  private identifyBestChannels(matches: any[]): string[] {
    return ['instagram', 'linkedin', 'facebook'];
  }

  private identifyOptimalTiming(matches: any[]): string {
    return '9:00 AM - 11:00 AM, 7:00 PM - 9:00 PM';
  }

  private generateContentSuggestions(segments: any[]): string[] {
    return [
      'Personal success stories with earnings proof',
      'Behind-the-scenes content about referral journey',
      'Educational content about the platform benefits',
      'User testimonials and reviews'
    ];
  }

  private optimizeBudgetAllocation(matches: any[]): { [channel: string]: number } {
    return {
      instagram: 0.4,
      facebook: 0.3,
      linkedin: 0.2,
      email: 0.1
    };
  }

  private getRecommendedChannels(profile: UserProfile): string[] {
    return profile.behavior.socialPlatforms;
  }

  private getOptimalTiming(profile: UserProfile): string {
    return profile.behavior.preferredTime;
  }

  private getContentSuggestions(profile: UserProfile): string[] {
    const suggestions = ['Share your success story'];
    
    if (profile.performance.totalEarnings > 100) {
      suggestions.push('Show your earnings proof');
    }
    
    if (profile.behavior.socialPlatforms.includes('instagram')) {
      suggestions.push('Create visual content for Instagram');
    }

    return suggestions;
  }

  /**
   * Analyze network connections and patterns
   */
  async analyzeNetwork(userId: string): Promise<{
    networkSize: number;
    connectionStrength: number;
    influenceScore: number;
    recommendations: string[];
  }> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) throw new Error('User profile not found');

      // Mock network analysis
      return {
        networkSize: Math.floor(Math.random() * 100) + 20,
        connectionStrength: Math.random() * 0.5 + 0.5,
        influenceScore: Math.random() * 0.8 + 0.2,
        recommendations: [
          'Expand your network in the tech industry',
          'Connect with more users in your region',
          'Engage with high-performing referrers'
        ]
      };
    } catch (error) {
      console.error('Network analysis failed:', error);
      return {
        networkSize: 0,
        connectionStrength: 0,
        influenceScore: 0,
        recommendations: []
      };
    }
  }

  /**
   * Update compatibility model with new training data
   */
  async updateCompatibilityModel(newData: any[]): Promise<void> {
    try {
      console.log(`Updating compatibility model with ${newData.length} new data points`);
      
      if (!this.matchingModel || newData.length === 0) {
        console.warn('Cannot update model: model not loaded or no data provided');
        return;
      }

      // Process new data for training
      const processedData = this.processNewTrainingData(newData);
      
      if (processedData) {
        // Retrain model with new data
        await this.matchingModel.fit(processedData.inputs, processedData.outputs, {
          epochs: 5,
          batchSize: 32,
          verbose: 0
        });

        // Clean up tensors
        processedData.inputs.dispose();
        processedData.outputs.dispose();

        console.log('✅ Compatibility model updated successfully');
      }
    } catch (error) {
      console.error('Failed to update compatibility model:', error);
    }
  }

  /**
   * Process new training data for model updates
   */
  private processNewTrainingData(newData: any[]): { inputs: tf.Tensor; outputs: tf.Tensor } | null {
    try {
      const inputs: number[][] = [];
      const outputs: number[] = [];

      newData.forEach(dataPoint => {
        // Create feature vector from new data point
        const features = Array.from({ length: 20 }, () => Math.random()); // Placeholder
        const success = dataPoint.success ? 1 : 0;

        inputs.push(features);
        outputs.push(success);
      });

      if (inputs.length === 0) return null;

      return {
        inputs: tf.tensor2d(inputs),
        outputs: tf.tensor1d(outputs)
      };
    } catch (error) {
      console.error('Error processing training data:', error);
      return null;
    }
  }
}

export const smartMatchingService = new SmartMatchingService();
export default smartMatchingService;
