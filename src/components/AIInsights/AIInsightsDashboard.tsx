import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Target, 
  AlertTriangle, 
  Sparkles,
  BarChart3,
  UserCheck,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { aiAnalyticsService } from '../../services/aiAnalyticsService';
import { recommendationService } from '../../services/recommendationService';
import { smartMatchingService } from '../../services/smartMatchingService';
import type { 
  PredictiveInsight, 
  UserSegment, 
  AnomalyDetection, 
  UserBehaviorPattern 
} from '../../services/aiAnalyticsService';
import type { Recommendation } from '../../services/recommendationService';
import type { MatchResult } from '../../services/smartMatchingService';

const AIInsightsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'recommendations' | 'matching' | 'analytics'>('insights');
  
  // AI Analytics State
  const [revenueInsight, setRevenueInsight] = useState<PredictiveInsight | null>(null);
  const [userSegments, setUserSegments] = useState<UserSegment[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [churnRisks, setChurnRisks] = useState<UserBehaviorPattern[]>([]);
  const [personalInsights, setPersonalInsights] = useState<any>(null);
  
  // Recommendations State
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  
  // Smart Matching State
  const [optimalMatches, setOptimalMatches] = useState<MatchResult[]>([]);
  const [personalStrategy, setPersonalStrategy] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadAIInsights();
    }
  }, [user?.id]);

  const loadAIInsights = async () => {
    setLoading(true);
    try {
      // Load AI Analytics
      const [
        revenueData,
        segmentsData,
        anomaliesData,
        churnData,
        personalData
      ] = await Promise.all([
        aiAnalyticsService.predictRevenue(30),
        aiAnalyticsService.segmentUsers(),
        aiAnalyticsService.detectAnomalies(),
        aiAnalyticsService.identifyChurnRisk(),
        aiAnalyticsService.getPersonalizedInsights(user!.id)
      ]);

      setRevenueInsight(revenueData);
      setUserSegments(segmentsData);
      setAnomalies(anomaliesData);
      setChurnRisks(churnData);
      setPersonalInsights(personalData);

      // Load Recommendations
      const recommendationsData = await recommendationService.getRecommendationsForUser(user!.id, 10);
      setRecommendations(recommendationsData);

      // Load Smart Matching
      const [matchesData, strategyData] = await Promise.all([
        smartMatchingService.findOptimalMatches(user!.id, 5),
        smartMatchingService.getPersonalizedStrategy(user!.id)
      ]);

      setOptimalMatches(matchesData);
      setPersonalStrategy(strategyData);

    } catch (error) {
      console.error('Failed to load AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'high_value': return 'text-green-600 bg-green-50';
      case 'growing': return 'text-blue-600 bg-blue-50';
      case 'churning': return 'text-red-600 bg-red-50';
      case 'dormant': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-md w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI Insights Dashboard</h1>
        </div>
        <p className="text-gray-600">
          Leverage artificial intelligence to optimize your referral performance and grow your earnings.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          {[
            { key: 'insights', label: 'Personal Insights', icon: Sparkles },
            { key: 'recommendations', label: 'Recommendations', icon: Target },
            { key: 'matching', label: 'Smart Matching', icon: UserCheck },
            { key: 'analytics', label: 'Platform Analytics', icon: BarChart3 }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 pb-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === key
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'insights' && personalInsights && (
        <div className="space-y-6">
          {/* Personal AI Insights */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Your Personal AI Insights
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">AI Recommendations</h4>
                <ul className="space-y-2">
                  {personalInsights.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Predicted Value</span>
                    <span className="font-semibold text-green-600">
                      ${personalInsights.predictedValue.toFixed(2)}
                    </span>
                  </div>
                  
                  {personalInsights.riskFactors.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-2">Risk Factors</span>
                      <div className="space-y-1">
                        {personalInsights.riskFactors.map((risk: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            {risk}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Personalized Strategy */}
          {personalStrategy && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Your Personalized Referral Strategy
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recommended Channels</h4>
                  <div className="space-y-1">
                    {personalStrategy.recommendedChannels.map((channel: string, index: number) => (
                      <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Optimal Timing</h4>
                  <p className="text-sm text-gray-700">{personalStrategy.optimalTiming}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Expected Results</h4>
                  <div className="text-sm">
                    <div className="text-green-600 font-medium">
                      {personalStrategy.expectedResults.conversions.toFixed(1)} conversions
                    </div>
                    <div className="text-gray-600">
                      ${personalStrategy.expectedResults.revenue.toFixed(2)} revenue
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Content Suggestions</h4>
                <div className="flex flex-wrap gap-2">
                  {personalStrategy.contentSuggestions.map((suggestion: string, index: number) => (
                    <span key={index} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                      {suggestion}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              AI-Powered Recommendations
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">Recommendation #{rec.itemId}</h4>
                    <span className="text-sm font-medium text-green-600">
                      {(rec.score * 100).toFixed(1)}% match
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{width: `${rec.score * 100}%`}}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'matching' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              Smart Matching Results
            </h3>
            
            <div className="space-y-4">
              {optimalMatches.map((match, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Match #{index + 1}</h4>
                      <p className="text-sm text-gray-600">Target: {match.targetUserId}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-blue-600">
                        {(match.compatibilityScore * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">compatibility</div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Match Reasons:</h5>
                    <div className="flex flex-wrap gap-1">
                      {match.reasons.map((reason, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Recommended Approach:</span>
                      <p className="text-gray-600 mt-1">{match.recommendedApproach}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Expected Conversion:</span>
                      <p className="text-green-600 font-medium mt-1">
                        {(match.expectedConversion * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Revenue Prediction */}
          {revenueInsight && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Revenue Prediction
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    ${revenueInsight.prediction.toFixed(2)}
                  </div>
                  <p className="text-gray-600">Predicted revenue for next {revenueInsight.timeframe}</p>
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">Confidence: </span>
                    <span className="font-medium text-blue-600">
                      {(revenueInsight.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">AI Recommendations</h4>
                  <ul className="space-y-1">
                    {revenueInsight.recommendations?.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <Zap className="h-3 w-3 text-yellow-500 mt-1 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* User Segments */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              User Segments
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userSegments.map((segment) => (
                <div key={segment.id} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{segment.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size:</span>
                      <span className="font-medium">{segment.size} users</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Conversion Rate:</span>
                      <span className="font-medium text-green-600">
                        {(segment.conversionRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Revenue:</span>
                      <span className="font-medium">${segment.averageRevenue}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-1">Characteristics:</div>
                    <div className="flex flex-wrap gap-1">
                      {segment.characteristics.slice(0, 2).map((char, idx) => (
                        <span key={idx} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Anomalies & Churn Risks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Anomalies */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Detected Anomalies
              </h3>
              
              <div className="space-y-3">
                {anomalies.length > 0 ? (
                  anomalies.slice(0, 5).map((anomaly, index) => (
                    <div key={index} className={`p-3 rounded-lg ${getSeverityColor(anomaly.severity)}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium capitalize">{anomaly.metric}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                          {anomaly.severity}
                        </span>
                      </div>
                      <p className="text-sm">{anomaly.description}</p>
                      <div className="text-xs mt-1 opacity-75">
                        Current: {anomaly.value} | Expected: {anomaly.expected}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No anomalies detected</p>
                )}
              </div>
            </div>

            {/* Churn Risks */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                Churn Risk Analysis
              </h3>
              
              <div className="space-y-3">
                {churnRisks.length > 0 ? (
                  churnRisks.slice(0, 5).map((risk, index) => (
                    <div key={index} className={`p-3 rounded-lg ${getPatternColor(risk.pattern)}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">User {risk.userId.slice(0, 8)}...</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                          {(risk.confidence * 100).toFixed(0)}% risk
                        </span>
                      </div>
                      <p className="text-sm mb-2">{risk.nextBestAction}</p>
                      <div className="text-xs">
                        Indicators: {risk.indicators.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No high-risk users identified</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-8 text-center">
        <button
          onClick={loadAIInsights}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh AI Insights'}
        </button>
      </div>
    </div>
  );
};

export default AIInsightsDashboard;
