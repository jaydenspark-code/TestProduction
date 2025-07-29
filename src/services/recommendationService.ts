import * as tf from '@tensorflow/tfjs';
import axios from 'axios'; 
import _ from 'lodash';
import { differenceInDays } from 'date-fns';

export interface UserInteraction {
  userId: string;
  action: string; // e.g., 'view', 'click', 'purchase'
  itemId: string;
  timestamp: Date;
}

export interface Recommendation {
  itemId: string;
  score: number;
}

class RecommendationService {
  private model: tf.LayersModel | null = null;
  private interactions: UserInteraction[] = [];

  constructor() {
    this.loadModel();
  }

  // Load ML model
  async loadModel(path = '/model/tfjs-model.json') {
    try {
      this.model = await tf.loadLayersModel(path);
      console.log('✅ Recommendation model loaded');
    } catch (error) {
      console.warn('⚠️ ML model not available, using fallback recommendations:', error instanceof Error ? error.message : 'Unknown error');
      // Don't throw error, just use fallback methods
    }
  }

  // Add user interaction
  addInteraction(interaction: UserInteraction) {
    this.interactions.push(interaction);
  }

  // Get recommendations for a specific user using ML predictions or fallback
  async getRecommendationsForUser(userId: string, limit = 5): Promise<Recommendation[]> {
    if (!this.model) {
      console.log('Using fallback recommendation algorithm');
      return this.getFallbackRecommendations(userId, limit);
    }

    // Mock data - replace with actual user/item features
    const userFeatures = tf.tensor2d([[1, 0, 1, 0, 1]]);
    const itemFeatures = tf.tensor2d([
      [0, 1, 0, 1, 1],
      [1, 0, 1, 0, 0],
      [0, 0, 1, 1, 1],
      [1, 1, 0, 0, 1],
      [0, 1, 1, 0, 1],
    ]);

    const prediction = this.model.predict([userFeatures, itemFeatures]) as tf.Tensor;
    const scores = await prediction.array() as number[][];

    const recommendations: Recommendation[] = scores
      .map((score: number[], index: number) => ({
        itemId: String(index + 1),
        score: score[0],
      }))
      .sort((a: Recommendation, b: Recommendation) => b.score - a.score)
      .slice(0, limit);

    return recommendations;
  }

  // Fallback recommendation method when ML model is not available
  private getFallbackRecommendations(userId: string, limit = 5): Recommendation[] {
    // Simple rule-based recommendations based on user interactions
    const userInteractions = this.interactions.filter(i => i.userId === userId);
    
    // Generate mock recommendations with random scores
    const fallbackItems = ['task_1', 'task_2', 'task_3', 'task_4', 'task_5', 'task_6'];
    
    const recommendations: Recommendation[] = fallbackItems
      .map(itemId => ({
        itemId,
        score: Math.random() * 0.9 + 0.1 // Random score between 0.1 and 1.0
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
      
    console.log(`Generated ${recommendations.length} fallback recommendations for user ${userId}`);
    return recommendations;
  }

  // Analyze past interactions to adjust recommendation strategy
  private analyzePastInteractions() {
    const recentInteractions = this.interactions.filter((interaction) =>
      differenceInDays(new Date(), new Date(interaction.timestamp)) < 30
    );

    // Analyze patterns such as most frequent items, times, actions, etc.
    const patterns = _.groupBy(recentInteractions, 'action');
    console.log('Interaction patterns:', patterns);

    // TODO: Implement pattern understanding and strategy adjustment
    console.log('Current interactions:', recentInteractions);
    console.log('Analyzing patterns...');
  }

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: any): Promise<void> {
    console.log(`Updating preferences for user ${userId}:`, preferences);
    // TODO: Implement preference storage and model updates
  }

  // Train model with new data
  async trainModel(newData: any[]): Promise<void> {
    console.log('Training recommendation model with new data:', newData.length, 'samples');
    // TODO: Implement model retraining
  }

  // Get similar users based on behavior patterns
  async getSimilarUsers(userId: string, limit: number = 10): Promise<{ userId: string; similarity: number }[]> {
    console.log(`Finding similar users for ${userId}`);
    
    // Mock implementation - return random similar users
    const similarUsers = Array.from({ length: Math.min(limit, 5) }, (_, index) => ({
      userId: `user_${Math.random().toString(36).substr(2, 9)}`,
      similarity: Math.random() * 0.5 + 0.5 // Similarity between 0.5 and 1.0
    }));

    return similarUsers.sort((a, b) => b.similarity - a.similarity);
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;
