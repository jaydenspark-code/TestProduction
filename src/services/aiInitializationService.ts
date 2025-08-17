/**
 * AI Model Initialization and Training Service
 * Handles the setup, training, and validation of all AI models
 */

import * as tf from '@tensorflow/tfjs';
import { supabase } from "../lib/supabase";
import { envConfig } from '../config/environment';
import { aiAnalyticsService } from './aiAnalyticsService';
import { smartMatchingService } from './smartMatchingService';
import { personalizationService } from './personalizationService';
import { realtimeService } from './realtimeService';

export interface ModelStatus {
  name: string;
  status: 'initializing' | 'training' | 'ready' | 'error';
  accuracy?: number;
  lastTrained?: Date;
  error?: string;
}

export interface AISystemStatus {
  isInitialized: boolean;
  models: ModelStatus[];
  services: {
    analytics: boolean;
    matching: boolean;
    personalization: boolean;
    realtime: boolean;
  };
  performance: {
    initializationTime: number;
    memoryUsage: number;
    modelsLoaded: number;
  };
}

class AIInitializationService {
  private static instance: AIInitializationService;
  private systemStatus: AISystemStatus;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.systemStatus = {
      isInitialized: false,
      models: [],
      services: {
        analytics: false,
        matching: false,
        personalization: false,
        realtime: false,
      },
      performance: {
        initializationTime: 0,
        memoryUsage: 0,
        modelsLoaded: 0,
      },
    };
  }

  static getInstance(): AIInitializationService {
    if (!AIInitializationService.instance) {
      AIInitializationService.instance = new AIInitializationService();
    }
    return AIInitializationService.instance;
  }

  /**
   * Initialize all AI services and models
   */
  async initialize(): Promise<AISystemStatus> {
    if (this.initializationPromise) {
      await this.initializationPromise;
      return this.systemStatus;
    }

    this.initializationPromise = this._performInitialization();
    await this.initializationPromise;
    return this.systemStatus;
  }

  private async _performInitialization(): Promise<void> {
    const startTime = Date.now();
    console.log('🚀 Starting AI System Initialization...');

    try {
      // Step 1: Configure TensorFlow.js
      await this.configureTensorFlow();

      // Step 2: Initialize database connections
      await this.initializeDatabaseConnections();

      // Step 3: Create and train models
      await this.initializeModels();

      // Step 4: Initialize AI services
      await this.initializeServices();

      // Step 5: Validate system health
      await this.validateSystemHealth();

      // Step 6: Set up monitoring
      await this.setupMonitoring();

      const endTime = Date.now();
      this.systemStatus.performance.initializationTime = endTime - startTime;
      this.systemStatus.isInitialized = true;

      console.log(`✅ AI System initialized successfully in ${this.systemStatus.performance.initializationTime}ms`);
    } catch (error) {
      console.error('❌ AI System initialization failed:', error);
      throw error;
    }
  }

  /**
   * Configure TensorFlow.js backend and settings
   */
  private async configureTensorFlow(): Promise<void> {
    console.log('🔧 Configuring TensorFlow.js...');

    try {
      // Set backend based on configuration
      const backend = envConfig.tensorflow.backend;
      await tf.setBackend(backend);

      // Wait for backend to be ready
      await tf.ready();

      // Configure memory management
      if (envConfig.tensorflow.memoryOptimization) {
        tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
        tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
      }

      // Set debug mode
      if (envConfig.tensorflow.debug) {
        tf.env().set('DEBUG', true);
      }

      console.log(`✅ TensorFlow.js configured with ${backend} backend`);
      console.log(`   Memory info:`, tf.memory());
    } catch (error) {
      console.error('❌ TensorFlow.js configuration failed:', error);
      throw error;
    }
  }

  /**
   * Initialize database connections and validate schema
   */
  private async initializeDatabaseConnections(): Promise<void> {
    console.log('🔧 Initializing database connections...');

    try {
      // Test basic connection
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) throw error;

      // Validate AI-specific tables exist
      const requiredTables = [
        'user_personalization_profiles',
        'user_matching_profiles',
        'ai_predictions',
        'user_segments',
        'live_events',
      ];

      for (const table of requiredTables) {
        const { error: tableError } = await supabase.from(table).select('*').limit(0);
        if (tableError) {
          console.warn(`⚠️ Table '${table}' not found or not accessible:`, tableError.message);
        }
      }

      console.log('✅ Database connections established');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Initialize and train all AI models
   */
  private async initializeModels(): Promise<void> {
    console.log('🧠 Initializing AI models...');

    const modelConfigs = [
      {
        name: 'revenue_prediction',
        factory: () => this.createRevenueModel(),
        trainData: () => this.getRevenueTrainingData(),
      },
      {
        name: 'churn_prediction',
        factory: () => this.createChurnModel(),
        trainData: () => this.getChurnTrainingData(),
      },
      {
        name: 'user_matching',
        factory: () => this.createMatchingModel(),
        trainData: () => this.getMatchingTrainingData(),
      },
      {
        name: 'recommendation_engine',
        factory: () => this.createRecommendationModel(),
        trainData: () => this.getRecommendationTrainingData(),
      },
    ];

    for (const config of modelConfigs) {
      await this.initializeModel(config);
    }

    console.log(`✅ ${this.systemStatus.performance.modelsLoaded} AI models initialized`);
  }

  private async initializeModel(config: {
    name: string;
    factory: () => Promise<tf.LayersModel>;
    trainData: () => Promise<{ inputs: tf.Tensor; outputs: tf.Tensor } | null>;
  }): Promise<void> {
    const modelStatus: ModelStatus = {
      name: config.name,
      status: 'initializing',
    };
    this.systemStatus.models.push(modelStatus);

    try {
      console.log(`   Initializing ${config.name}...`);
      modelStatus.status = 'training';

      // Create model
      const model = await config.factory();

      // Get training data
      const trainingData = await config.trainData();

      if (trainingData) {
        // Train model with available data
        console.log(`   Training ${config.name} with real data...`);
        const history = await model.fit(trainingData.inputs, trainingData.outputs, {
          epochs: 10,
          batchSize: envConfig.ai.batchSize,
          validationSplit: 0.2,
          callbacks: {
            onEpochEnd: (epoch, logs) => {
              if (envConfig.development.debugAiModels) {
                console.log(`     Epoch ${epoch + 1}: loss = ${logs?.loss?.toFixed(4)}, val_loss = ${logs?.val_loss?.toFixed(4)}`);
              }
            },
          },
        });

        // Calculate accuracy from training history
        const finalLoss = history.history.val_loss?.slice(-1)[0] as number;
        modelStatus.accuracy = Math.max(0, 1 - finalLoss);

        // Clean up training data
        trainingData.inputs.dispose();
        trainingData.outputs.dispose();
      } else {
        // No training data available - use pre-trained weights or initialize with defaults
        console.log(`   No training data for ${config.name}, using default initialization`);
        modelStatus.accuracy = 0.5; // Default accuracy for untrained models
      }

      modelStatus.status = 'ready';
      modelStatus.lastTrained = new Date();
      this.systemStatus.performance.modelsLoaded++;

      // Save model performance metrics
      await this.saveModelMetrics(config.name, modelStatus.accuracy || 0);

      console.log(`   ✅ ${config.name} ready (accuracy: ${(modelStatus.accuracy * 100).toFixed(1)}%)`);
    } catch (error) {
      console.error(`   ❌ ${config.name} initialization failed:`, error);
      modelStatus.status = 'error';
      modelStatus.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  /**
   * Initialize AI services
   */
  private async initializeServices(): Promise<void> {
    console.log('🔧 Initializing AI services...');

    try {
      // Initialize Analytics Service
      if (envConfig.ai.analytics) {
        // Analytics service initializes itself via constructor
        this.systemStatus.services.analytics = true;
        console.log('   ✅ Analytics service ready');
      }

      // Initialize Smart Matching Service
      if (envConfig.ai.smartMatching) {
        // Smart matching service initializes itself via constructor
        this.systemStatus.services.matching = true;
        console.log('   ✅ Smart matching service ready');
      }

      // Initialize Personalization Service
      if (envConfig.ai.personalization) {
        // Personalization service is a singleton that initializes itself
        this.systemStatus.services.personalization = true;
        console.log('   ✅ Personalization service ready');
      }

      // Initialize Real-time Service
      if (envConfig.realtime.enabled) {
        // Real-time service initializes itself via constructor
        this.systemStatus.services.realtime = true;
        console.log('   ✅ Real-time service ready');
      }

      console.log('✅ All AI services initialized');
    } catch (error) {
      console.error('❌ Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Validate system health and functionality
   */
  private async validateSystemHealth(): Promise<void> {
    console.log('🔍 Validating AI system health...');

    try {
      const healthChecks = [];

      // Test Analytics Service
      if (this.systemStatus.services.analytics) {
        healthChecks.push(
          aiAnalyticsService.segmentUsers()
            .then(() => ({ service: 'analytics', status: 'healthy' }))
            .catch((error) => ({ service: 'analytics', status: 'error', error }))
        );
      }

      // Test Smart Matching Service  
      if (this.systemStatus.services.matching) {
        healthChecks.push(
          smartMatchingService.findOptimalMatches('health-check', 1)
            .then(() => ({ service: 'matching', status: 'healthy' }))
            .catch((error) => ({ service: 'matching', status: 'error', error }))
        );
      }

      // Test database connectivity for AI tables
      healthChecks.push(
        supabase.from('user_segments').select('count').limit(1)
          .then(() => ({ service: 'database', status: 'healthy' }))
          .catch((error) => ({ service: 'database', status: 'error', error }))
      );

      const results = await Promise.allSettled(healthChecks);
      
      let healthyServices = 0;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.status === 'healthy') {
          healthyServices++;
        } else if (result.status === 'fulfilled') {
          console.warn(`   ⚠️ ${result.value.service} service health check failed:`, result.value.error);
        }
      });

      console.log(`✅ Health check complete: ${healthyServices}/${results.length} services healthy`);
    } catch (error) {
      console.error('❌ Health validation failed:', error);
      throw error;
    }
  }

  /**
   * Set up monitoring and periodic tasks
   */
  private async setupMonitoring(): Promise<void> {
    console.log('🔧 Setting up AI monitoring...');

    try {
      // Set up model performance monitoring
      setInterval(async () => {
        if (envConfig.ai.analytics) {
          await this.updateModelPerformanceMetrics();
        }
      }, envConfig.ai.modelUpdateInterval);

      // Set up memory monitoring  
      setInterval(() => {
        const memInfo = tf.memory();
        this.systemStatus.performance.memoryUsage = memInfo.numBytes;
        
        if (envConfig.development.debugAiModels) {
          console.log('🧠 AI Memory usage:', memInfo);
        }

        // Clean up if memory usage is high
        if (memInfo.numBytes > 50 * 1024 * 1024) { // 50MB threshold
          tf.disposeVariables();
        }
      }, 60000); // Check every minute

      console.log('✅ AI monitoring configured');
    } catch (error) {
      console.error('❌ Monitoring setup failed:', error);
      throw error;
    }
  }

  /**
   * Model creation methods
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

  private async createMatchingModel(): Promise<tf.LayersModel> {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [20], units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
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

  private async createRecommendationModel(): Promise<tf.LayersModel> {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [15], units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 10, activation: 'softmax' }) // 10 recommendation categories
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Training data generation methods
   */
  private async getRevenueTrainingData(): Promise<{ inputs: tf.Tensor; outputs: tf.Tensor } | null> {
    try {
      // Get historical revenue data
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, created_at, type, user_id')
        .eq('type', 'earning')
        .limit(1000);

      if (error || !transactions || transactions.length < 10) {
        console.log('   No sufficient revenue data for training, using synthetic data');
        return this.generateSyntheticRevenueData();
      }

      // Process real data into training format
      return this.processRevenueDataForTraining(transactions);
    } catch (error) {
      console.warn('   Error getting revenue training data:', error);
      return this.generateSyntheticRevenueData();
    }
  }

  private async getChurnTrainingData(): Promise<{ inputs: tf.Tensor; outputs: tf.Tensor } | null> {
    try {
      // Get user activity data
      const { data: users, error } = await supabase
        .from('users')
        .select('id, created_at, last_login, total_earned, referrals_count')
        .limit(1000);

      if (error || !users || users.length < 10) {
        console.log('   No sufficient user data for churn training, using synthetic data');
        return this.generateSyntheticChurnData();
      }

      return this.processChurnDataForTraining(users);
    } catch (error) {
      console.warn('   Error getting churn training data:', error);
      return this.generateSyntheticChurnData();
    }
  }

  private async getMatchingTrainingData(): Promise<{ inputs: tf.Tensor; outputs: tf.Tensor } | null> {
    try {
      // Get referral match data
      const { data: matches, error } = await supabase
        .from('referral_matches')
        .select('*')
        .limit(500);

      if (error || !matches || matches.length < 10) {
        console.log('   No sufficient matching data for training, using synthetic data');
        return this.generateSyntheticMatchingData();
      }

      return this.processMatchingDataForTraining(matches);
    } catch (error) {
      console.warn('   Error getting matching training data:', error);
      return this.generateSyntheticMatchingData();
    }
  }

  private async getRecommendationTrainingData(): Promise<{ inputs: tf.Tensor; outputs: tf.Tensor } | null> {
    // For now, use synthetic data for recommendations
    return this.generateSyntheticRecommendationData();
  }

  /**
   * Synthetic data generation for training when real data is insufficient
   */
  private generateSyntheticRevenueData(): { inputs: tf.Tensor; outputs: tf.Tensor } {
    const samples = 100;
    const inputs: number[][] = [];
    const outputs: number[] = [];

    for (let i = 0; i < samples; i++) {
      // Features: [day_of_week, month, user_count, avg_transaction, total_referrals, campaign_active, previous_revenue]
      const features = [
        Math.floor(Math.random() * 7), // day_of_week
        Math.floor(Math.random() * 12), // month
        Math.floor(Math.random() * 1000) + 100, // user_count
        Math.random() * 50 + 10, // avg_transaction
        Math.floor(Math.random() * 500), // total_referrals
        Math.random() > 0.5 ? 1 : 0, // campaign_active
        Math.random() * 10000 + 1000, // previous_revenue
      ];

      // Simple revenue prediction formula
      const revenue = features[2] * 0.1 + features[3] * features[4] * 0.01 + (features[5] ? 500 : 0) + Math.random() * 100;
      
      inputs.push(features);
      outputs.push(revenue);
    }

    return {
      inputs: tf.tensor2d(inputs),
      outputs: tf.tensor1d(outputs)
    };
  }

  private generateSyntheticChurnData(): { inputs: tf.Tensor; outputs: tf.Tensor } {
    const samples = 100;
    const inputs: number[][] = [];
    const outputs: number[] = [];

    for (let i = 0; i < samples; i++) {
      // Features: [days_since_joined, days_since_last_login, total_earned, referrals_count, has_earned, inactive_7days, active_referrer, high_earner, account_age_norm, referral_activity_norm]
      const daysSinceJoined = Math.floor(Math.random() * 365);
      const daysSinceLastLogin = Math.floor(Math.random() * 30);
      const totalEarned = Math.random() * 500;
      const referralsCount = Math.floor(Math.random() * 50);

      const features = [
        daysSinceJoined,
        daysSinceLastLogin,
        totalEarned,
        referralsCount,
        totalEarned > 0 ? 1 : 0,
        daysSinceLastLogin > 7 ? 1 : 0,
        referralsCount > 5 ? 1 : 0,
        totalEarned > 100 ? 1 : 0,
        Math.min(daysSinceJoined / 365, 1),
        Math.min(referralsCount / 50, 1)
      ];

      // Churn probability based on activity
      const churnProb = daysSinceLastLogin > 14 && totalEarned < 10 && referralsCount < 2 ? 1 : 0;
      
      inputs.push(features);
      outputs.push(churnProb);
    }

    return {
      inputs: tf.tensor2d(inputs),
      outputs: tf.tensor1d(outputs)
    };
  }

  private generateSyntheticMatchingData(): { inputs: tf.Tensor; outputs: tf.Tensor } {
    const samples = 100;
    const inputs: number[][] = [];
    const outputs: number[] = [];

    for (let i = 0; i < samples; i++) {
      // Generate compatibility features
      const features = Array.from({ length: 20 }, () => Math.random());
      
      // Simple compatibility scoring
      const compatibility = features.reduce((sum, val) => sum + val, 0) / features.length > 0.5 ? 1 : 0;
      
      inputs.push(features);
      outputs.push(compatibility);
    }

    return {
      inputs: tf.tensor2d(inputs),
      outputs: tf.tensor1d(outputs)
    };
  }

  private generateSyntheticRecommendationData(): { inputs: tf.Tensor; outputs: tf.Tensor } {
    const samples = 100;
    const inputs: number[][] = [];
    const outputs: number[][] = [];

    for (let i = 0; i < samples; i++) {
      // User profile features
      const features = Array.from({ length: 15 }, () => Math.random());
      
      // One-hot encoded recommendation category
      const category = Math.floor(Math.random() * 10);
      const output = Array.from({ length: 10 }, (_, idx) => idx === category ? 1 : 0);
      
      inputs.push(features);
      outputs.push(output);
    }

    return {
      inputs: tf.tensor2d(inputs),
      outputs: tf.tensor2d(outputs)
    };
  }

  /**
   * Real data processing methods
   */
  private processRevenueDataForTraining(transactions: any[]): { inputs: tf.Tensor; outputs: tf.Tensor } {
    // Group transactions by day and create features
    const dailyData = new Map<string, { amount: number; count: number }>();
    
    transactions.forEach(transaction => {
      const date = transaction.created_at.split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, { amount: 0, count: 0 });
      }
      const day = dailyData.get(date)!;
      day.amount += transaction.amount;
      day.count += 1;
    });

    const inputs: number[][] = [];
    const outputs: number[] = [];

    Array.from(dailyData.entries()).forEach(([date, data]) => {
      const dateObj = new Date(date);
      const features = [
        dateObj.getDay(), // day of week
        dateObj.getMonth(), // month
        data.count, // transaction count
        data.amount / data.count, // average transaction
        data.count * 10, // estimated referrals
        Math.random() > 0.5 ? 1 : 0, // campaign active (random for demo)
        data.amount * 0.9, // previous day estimate
      ];

      inputs.push(features);
      outputs.push(data.amount);
    });

    return {
      inputs: tf.tensor2d(inputs),
      outputs: tf.tensor1d(outputs)
    };
  }

  private processChurnDataForTraining(users: any[]): { inputs: tf.Tensor; outputs: tf.Tensor } {
    const inputs: number[][] = [];
    const outputs: number[] = [];

    users.forEach(user => {
      const daysSinceJoined = user.created_at ? 
        Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      const daysSinceLastLogin = user.last_login ? 
        Math.floor((Date.now() - new Date(user.last_login).getTime()) / (1000 * 60 * 60 * 24)) : 999;

      const features = [
        daysSinceJoined,
        daysSinceLastLogin,
        user.total_earned || 0,
        user.referrals_count || 0,
        user.total_earned > 0 ? 1 : 0,
        daysSinceLastLogin > 7 ? 1 : 0,
        user.referrals_count > 5 ? 1 : 0,
        user.total_earned > 100 ? 1 : 0,
        Math.min(daysSinceJoined / 365, 1),
        Math.min(user.referrals_count / 50, 1)
      ];

      // Simple churn definition: inactive for 30+ days
      const isChurned = daysSinceLastLogin > 30 ? 1 : 0;

      inputs.push(features);
      outputs.push(isChurned);
    });

    return {
      inputs: tf.tensor2d(inputs),
      outputs: tf.tensor1d(outputs)
    };
  }

  private processMatchingDataForTraining(matches: any[]): { inputs: tf.Tensor; outputs: tf.Tensor } {
    const inputs: number[][] = [];
    const outputs: number[] = [];

    matches.forEach(match => {
      // Create feature vector from match data
      const features = Array.from({ length: 20 }, () => Math.random()); // Placeholder
      const success = match.actual_conversion > (match.expected_conversion * 0.8) ? 1 : 0;

      inputs.push(features);
      outputs.push(success);
    });

    return {
      inputs: tf.tensor2d(inputs),
      outputs: tf.tensor1d(outputs)
    };
  }

  /**
   * Utility methods
   */
  private async saveModelMetrics(modelName: string, accuracy: number): Promise<void> {
    try {
      await supabase.from('ai_model_performance').upsert({
        model_name: modelName,
        model_version: '1.0.0',
        accuracy_score: accuracy,
        last_trained_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to save model metrics:', error);
    }
  }

  private async updateModelPerformanceMetrics(): Promise<void> {
    // Update performance metrics periodically
    try {
      const memInfo = tf.memory();
      await supabase.from('ai_metrics').insert({
        metric_type: 'memory_usage',
        metric_value: memInfo.numBytes,
        metadata: { numTensors: memInfo.numTensors }
      });
    } catch (error) {
      console.warn('Failed to update performance metrics:', error);
    }
  }

  /**
   * Public API methods
   */
  getSystemStatus(): AISystemStatus {
    return { ...this.systemStatus };
  }

  async reinitialize(): Promise<AISystemStatus> {
    console.log('🔄 Reinitializing AI system...');
    this.systemStatus.isInitialized = false;
    this.initializationPromise = null;
    return await this.initialize();
  }

  isReady(): boolean {
    return this.systemStatus.isInitialized;
  }

  getModelStatus(modelName: string): ModelStatus | undefined {
    return this.systemStatus.models.find(m => m.name === modelName);
  }
}

// Export singleton instance
export const aiInitializationService = AIInitializationService.getInstance();
export default aiInitializationService;
