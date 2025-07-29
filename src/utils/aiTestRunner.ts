/**
 * AI System Test Runner
 * Comprehensive testing suite for all AI features and models
 */

import { aiAnalyticsService } from '../services/aiAnalyticsService';
import { smartMatchingService } from '../services/smartMatchingService';
import { personalizationService } from '../services/personalizationService';
import { realtimeService } from '../services/realtimeService';
import { aiInitializationService } from '../services/aiInitializationService';
import { supabase } from '../lib/supabaseClient';

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip' | 'warning';
  duration: number;
  error?: string;
  details?: any;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  skipped: number;
  warnings: number;
  totalDuration: number;
}

class AITestRunner {
  private testResults: TestSuite[] = [];

  /**
   * Run all AI system tests
   */
  async runAllTests(): Promise<TestSuite[]> {
    console.log('🧪 Starting AI System Test Suite...');
    this.testResults = [];

    // Test suites in order of dependency
    await this.runInitializationTests();
    await this.runDatabaseTests();
    await this.runAnalyticsTests();
    await this.runMatchingTests();
    await this.runPersonalizationTests();
    await this.runRealtimeTests();
    await this.runIntegrationTests();

    this.printTestSummary();
    return this.testResults;
  }

  /**
   * Test AI system initialization
   */
  private async runInitializationTests(): Promise<void> {
    const suite: TestSuite = {
      name: 'AI System Initialization',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      warnings: 0,
      totalDuration: 0,
    };

    // Test 1: System initialization
    await this.runTest(suite, 'System Initialization', async () => {
      const status = await aiInitializationService.initialize();
      if (!status.isInitialized) {
        throw new Error('AI system failed to initialize');
      }
      return { modelsLoaded: status.performance.modelsLoaded };
    });

    // Test 2: Model loading
    await this.runTest(suite, 'Model Loading', async () => {
      const status = aiInitializationService.getSystemStatus();
      const readyModels = status.models.filter(m => m.status === 'ready');
      if (readyModels.length === 0) {
        throw new Error('No models are ready');
      }
      return { readyModels: readyModels.length, totalModels: status.models.length };
    });

    // Test 3: Service availability
    await this.runTest(suite, 'Service Availability', async () => {
      const status = aiInitializationService.getSystemStatus();
      const activeServices = Object.values(status.services).filter(Boolean).length;
      if (activeServices === 0) {
        throw new Error('No AI services are active');
      }
      return { activeServices, totalServices: Object.keys(status.services).length };
    });

    this.testResults.push(suite);
  }

  /**
   * Test database connectivity and schema
   */
  private async runDatabaseTests(): Promise<void> {
    const suite: TestSuite = {
      name: 'Database Schema & Connectivity',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      warnings: 0,
      totalDuration: 0,
    };

    // Test 1: Basic database connection
    await this.runTest(suite, 'Database Connection', async () => {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) throw error;
      return { connected: true };
    });

    // Test 2: AI tables existence
    const aiTables = [
      'user_personalization_profiles',
      'user_matching_profiles',
      'ai_predictions',
      'user_segments',
      'live_events',
      'ai_metrics',
      'user_recommendations',
    ];

    for (const table of aiTables) {
      await this.runTest(suite, `Table: ${table}`, async () => {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (error) {
          if (error.message.includes('relation') && error.message.includes('does not exist')) {
            throw new Error(`Table ${table} does not exist - run AI schema migration`);
          }
          throw error;
        }
        return { tableExists: true };
      });
    }

    // Test 3: Sample data insertion
    await this.runTest(suite, 'Sample Data Insertion', async () => {
      const testData = {
        metric_type: 'test_metric',
        metric_value: 42,
        metadata: { test: true, timestamp: new Date().toISOString() }
      };

      const { data, error } = await supabase
        .from('ai_metrics')
        .insert(testData)
        .select()
        .single();

      if (error) throw error;

      // Clean up test data
      await supabase.from('ai_metrics').delete().eq('id', data.id);

      return { insertSuccess: true };
    });

    this.testResults.push(suite);
  }

  /**
   * Test AI Analytics Service
   */
  private async runAnalyticsTests(): Promise<void> {
    const suite: TestSuite = {
      name: 'AI Analytics Service',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      warnings: 0,
      totalDuration: 0,
    };

    // Test 1: User segmentation
    await this.runTest(suite, 'User Segmentation', async () => {
      const segments = await aiAnalyticsService.segmentUsers();
      if (!Array.isArray(segments)) {
        throw new Error('Segmentation did not return an array');
      }
      return { segmentCount: segments.length };
    });

    // Test 2: Revenue prediction
    await this.runTest(suite, 'Revenue Prediction', async () => {
      const prediction = await aiAnalyticsService.predictRevenue(30);
      if (!prediction || typeof prediction.prediction !== 'number') {
        throw new Error('Revenue prediction failed or returned invalid data');
      }
      return { 
        prediction: prediction.prediction,
        confidence: prediction.confidence,
        timeframe: prediction.timeframe 
      };
    });

    // Test 3: Anomaly detection
    await this.runTest(suite, 'Anomaly Detection', async () => {
      const anomalies = await aiAnalyticsService.detectAnomalies();
      if (!Array.isArray(anomalies)) {
        throw new Error('Anomaly detection did not return an array');
      }
      return { anomalyCount: anomalies.length };
    });

    // Test 4: Churn risk analysis
    await this.runTest(suite, 'Churn Risk Analysis', async () => {
      const churnRisks = await aiAnalyticsService.identifyChurnRisk();
      if (!Array.isArray(churnRisks)) {
        throw new Error('Churn analysis did not return an array');
      }
      return { usersAtRisk: churnRisks.length };
    });

    this.testResults.push(suite);
  }

  /**
   * Test Smart Matching Service
   */
  private async runMatchingTests(): Promise<void> {
    const suite: TestSuite = {
      name: 'Smart Matching Service',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      warnings: 0,
      totalDuration: 0,
    };

    const testUserId = 'test-user-' + Math.random().toString(36).substr(2, 9);

    // Test 1: Find optimal matches
    await this.runTest(suite, 'Find Optimal Matches', async () => {
      const matches = await smartMatchingService.findOptimalMatches(testUserId, 5);
      if (!Array.isArray(matches)) {
        throw new Error('Matching did not return an array');
      }
      return { matchCount: matches.length };
    });

    // Test 2: Personalized strategy
    await this.runTest(suite, 'Personalized Strategy', async () => {
      const strategy = await smartMatchingService.getPersonalizedStrategy(testUserId);
      if (!strategy || !strategy.bestTargets || !strategy.recommendedChannels) {
        throw new Error('Strategy generation failed or returned invalid data');
      }
      return { 
        targetCount: strategy.bestTargets.length,
        channelCount: strategy.recommendedChannels.length,
        expectedConversions: strategy.expectedResults.conversions 
      };
    });

    // Test 3: Campaign optimization
    await this.runTest(suite, 'Campaign Optimization', async () => {
      const optimization = await smartMatchingService.optimizeCampaign('test-campaign');
      if (!optimization || !optimization.bestChannels) {
        throw new Error('Campaign optimization failed or returned invalid data');
      }
      return { 
        targetSegment: optimization.targetSegment,
        channelCount: optimization.bestChannels.length 
      };
    });

    this.testResults.push(suite);
  }

  /**
   * Test Personalization Service
   */
  private async runPersonalizationTests(): Promise<void> {
    const suite: TestSuite = {
      name: 'Personalization Service',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      warnings: 0,
      totalDuration: 0,
    };

    const testUserId = 'test-user-' + Math.random().toString(36).substr(2, 9);

    // Test 1: Get user profile
    await this.runTest(suite, 'User Profile Creation', async () => {
      const profile = await personalizationService.getUserProfile(testUserId);
      if (!profile || !profile.preferences || !profile.aiInsights) {
        throw new Error('Profile creation failed or returned invalid data');
      }
      return { 
        userId: profile.userId,
        personalityType: profile.aiInsights.personalityType,
        motivationFactors: profile.aiInsights.motivationFactors.length 
      };
    });

    // Test 2: Personalized experience
    await this.runTest(suite, 'Personalized Experience', async () => {
      const experience = await personalizationService.createPersonalizedExperience(testUserId);
      if (!experience || !experience.dashboard || !experience.content) {
        throw new Error('Experience creation failed or returned invalid data');
      }
      return { 
        widgetCount: experience.dashboard.widgets.length,
        recommendationCount: experience.content.recommendations.length 
      };
    });

    // Test 3: Update preferences
    await this.runTest(suite, 'Update User Preferences', async () => {
      const preferences = {
        contentTypes: ['tips', 'tutorials'],
        communicationStyle: 'casual' as const,
        notificationFrequency: 'weekly' as const,
      };
      
      await personalizationService.updateUserPreferences(testUserId, preferences);
      return { preferencesUpdated: true };
    });

    this.testResults.push(suite);
  }

  /**
   * Test Real-time Service
   */
  private async runRealtimeTests(): Promise<void> {
    const suite: TestSuite = {
      name: 'Real-time Service',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      warnings: 0,
      totalDuration: 0,
    };

    // Test 1: Connection status
    await this.runTest(suite, 'Connection Status', async () => {
      const status = realtimeService.getConnectionStatus();
      return { 
        connected: status.connected,
        activeChannels: status.activeChannels 
      };
    });

    // Test 2: Live stats
    await this.runTest(suite, 'Live Stats', async () => {
      const stats = await realtimeService.getLiveStats();
      if (!stats || typeof stats.activeUsers !== 'number') {
        throw new Error('Live stats failed or returned invalid data');
      }
      return { 
        activeUsers: stats.activeUsers,
        totalEarnings: stats.totalEarnings,
        newReferrals: stats.newReferrals 
      };
    });

    // Test 3: Event broadcasting
    await this.runTest(suite, 'Event Broadcasting', async () => {
      const testEvent = {
        type: 'notification' as const,
        data: { test: true, timestamp: Date.now() },
      };

      await realtimeService.broadcastEvent(testEvent);
      return { eventBroadcast: true };
    });

    this.testResults.push(suite);
  }

  /**
   * Test integration between services
   */
  private async runIntegrationTests(): Promise<void> {
    const suite: TestSuite = {
      name: 'Service Integration',
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      warnings: 0,
      totalDuration: 0,
    };

    const testUserId = 'integration-test-' + Math.random().toString(36).substr(2, 9);

    // Test 1: Analytics + Personalization integration
    await this.runTest(suite, 'Analytics-Personalization Integration', async () => {
      const insights = await aiAnalyticsService.getPersonalizedInsights(testUserId);
      const profile = await personalizationService.getUserProfile(testUserId);
      
      if (!insights || !profile) {
        throw new Error('Integration test failed - missing data');
      }
      
      return { 
        insightsGenerated: true,
        profileCreated: true,
        recommendationCount: insights.recommendations.length 
      };
    });

    // Test 2: Matching + Analytics integration
    await this.runTest(suite, 'Matching-Analytics Integration', async () => {
      const matches = await smartMatchingService.findOptimalMatches(testUserId, 3);
      const segments = await aiAnalyticsService.segmentUsers();
      
      return { 
        matchesFound: matches.length,
        segmentsAvailable: segments.length,
        integrationWorking: true 
      };
    });

    // Test 3: End-to-end user journey
    await this.runTest(suite, 'End-to-End User Journey', async () => {
      // Simulate complete user journey
      const profile = await personalizationService.getUserProfile(testUserId);
      const matches = await smartMatchingService.findOptimalMatches(testUserId, 2);
      const insights = await aiAnalyticsService.getPersonalizedInsights(testUserId);
      const experience = await personalizationService.createPersonalizedExperience(testUserId);
      
      return {
        profileCreated: !!profile,
        matchesGenerated: matches.length > 0,
        insightsProvided: !!insights,
        experiencePersonalized: !!experience,
        journeyComplete: true
      };
    });

    this.testResults.push(suite);
  }

  /**
   * Run a single test and record results
   */
  private async runTest(
    suite: TestSuite,
    testName: string,
    testFunction: () => Promise<any>
  ): Promise<void> {
    const startTime = Date.now();
    const result: TestResult = {
      name: testName,
      status: 'pass',
      duration: 0,
    };

    try {
      console.log(`  ⏳ Running: ${testName}`);
      const details = await testFunction();
      result.details = details;
      result.status = 'pass';
      suite.passed++;
      console.log(`  ✅ Passed: ${testName}`);
    } catch (error) {
      result.status = 'fail';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      suite.failed++;
      console.log(`  ❌ Failed: ${testName} - ${result.error}`);
    }

    result.duration = Date.now() - startTime;
    suite.totalDuration += result.duration;
    suite.tests.push(result);
  }

  /**
   * Print test summary
   */
  private printTestSummary(): void {
    console.log('\n📊 AI System Test Summary');
    console.log('=' .repeat(50));

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalDuration = 0;

    this.testResults.forEach(suite => {
      totalTests += suite.tests.length;
      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalDuration += suite.totalDuration;

      const passRate = suite.tests.length > 0 ? (suite.passed / suite.tests.length) * 100 : 0;
      const status = suite.failed === 0 ? '✅' : '❌';
      
      console.log(`${status} ${suite.name}: ${suite.passed}/${suite.tests.length} passed (${passRate.toFixed(1)}%)`);
      
      if (suite.failed > 0) {
        suite.tests
          .filter(test => test.status === 'fail')
          .forEach(test => {
            console.log(`    ❌ ${test.name}: ${test.error}`);
          });
      }
    });

    console.log('=' .repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed} (${totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : 0}%)`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);

    if (totalFailed === 0) {
      console.log('🎉 All AI system tests passed!');
    } else {
      console.log(`⚠️ ${totalFailed} test(s) failed. Check the errors above.`);
    }
  }

  /**
   * Get test results
   */
  getResults(): TestSuite[] {
    return this.testResults;
  }

  /**
   * Run specific test suite
   */
  async runTestSuite(suiteName: string): Promise<TestSuite | null> {
    switch (suiteName) {
      case 'initialization':
        await this.runInitializationTests();
        break;
      case 'database':
        await this.runDatabaseTests();
        break;
      case 'analytics':
        await this.runAnalyticsTests();
        break;
      case 'matching':
        await this.runMatchingTests();
        break;
      case 'personalization':
        await this.runPersonalizationTests();
        break;
      case 'realtime':
        await this.runRealtimeTests();
        break;
      case 'integration':
        await this.runIntegrationTests();
        break;
      default:
        return null;
    }

    return this.testResults[this.testResults.length - 1] || null;
  }
}

// Export singleton instance
export const aiTestRunner = new AITestRunner();
export default aiTestRunner;
