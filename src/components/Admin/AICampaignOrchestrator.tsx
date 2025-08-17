import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  Brain, 
  Zap,
  TrendingUp,
  Target,
  DollarSign,
  Users,
  BarChart3,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Sliders,
  RefreshCw,
  PieChart,
  Activity,
  Layers,
  Cpu,
  Database,
  Network,
  Bot,
  Gauge,
  Monitor,
  Lightbulb,
  Rocket
} from 'lucide-react';

interface AICampaignConfig {
  id: string;
  name: string;
  enabled: boolean;
  optimization: {
    level: 'basic' | 'advanced' | 'premium';
    autoAdjustments: boolean;
    smartBidding: boolean;
    audienceExpansion: boolean;
    budgetOptimization: boolean;
    adScheduling: boolean;
    creativeTesting: boolean;
  };
  monitoring: {
    realTimeAlerts: boolean;
    performanceThresholds: {
      ctr: number;
      cpc: number;
      roas: number;
    };
    budgetAlerts: boolean;
    qualityScoreMonitoring: boolean;
  };
  automation: {
    autoStartCampaigns: boolean;
    autoPauseLowPerformers: boolean;
    autoScaleBudget: boolean;
    autoOptimizeTargeting: boolean;
  };
}

interface AIInsights {
  recommendations: {
    id: string;
    type: 'budget' | 'targeting' | 'creative' | 'timing' | 'performance';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
    action: string;
    confidence: number;
  }[];
  predictions: {
    nextWeekPerformance: {
      impressions: number;
      clicks: number;
      conversions: number;
      revenue: number;
    };
    budgetDepletion: Date;
    optimalBidding: number;
    audienceGrowth: number;
  };
  anomalies: {
    id: string;
    detected: Date;
    type: 'performance_drop' | 'unusual_spike' | 'budget_overrun' | 'low_quality';
    severity: 'critical' | 'warning' | 'info';
    description: string;
    impact: string;
    suggested_action: string;
  }[];
}

const AICampaignOrchestrator: React.FC = () => {
  const { theme } = useTheme();
  const [aiConfig, setAiConfig] = useState<AICampaignConfig | null>(null);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [systemStatus, setSystemStatus] = useState({
    enabled: true,
    lastUpdate: new Date(),
    processedCampaigns: 47,
    activeOptimizations: 12,
    avgPerformanceImprovement: 23.5,
    budgetSavings: 1847.50
  });

  const isDark = theme === 'professional';

  // Initialize AI configuration
  useEffect(() => {
    setAiConfig({
      id: 'ai-orchestrator-main',
      name: 'AI Campaign Orchestrator',
      enabled: true,
      optimization: {
        level: 'premium',
        autoAdjustments: true,
        smartBidding: true,
        audienceExpansion: true,
        budgetOptimization: true,
        adScheduling: true,
        creativeTesting: true
      },
      monitoring: {
        realTimeAlerts: true,
        performanceThresholds: {
          ctr: 2.5,
          cpc: 0.75,
          roas: 4.0
        },
        budgetAlerts: true,
        qualityScoreMonitoring: true
      },
      automation: {
        autoStartCampaigns: true,
        autoPauseLowPerformers: true,
        autoScaleBudget: true,
        autoOptimizeTargeting: true
      }
    });

    // Simulate AI insights
    setInsights({
      recommendations: [
        {
          id: 'rec-001',
          type: 'budget',
          priority: 'high',
          title: 'Increase Budget for High-Performing Campaigns',
          description: 'TechStart Inc campaign showing 340% ROAS, recommend 50% budget increase',
          impact: '+$1,250 potential revenue',
          action: 'Increase daily budget from $50 to $75',
          confidence: 92
        },
        {
          id: 'rec-002',
          type: 'targeting',
          priority: 'medium',
          title: 'Expand Audience Targeting',
          description: 'Similar audiences showing strong engagement, safe to expand targeting',
          impact: '+25% reach expansion',
          action: 'Add lookalike audiences based on top converters',
          confidence: 78
        },
        {
          id: 'rec-003',
          type: 'creative',
          priority: 'high',
          title: 'Creative Refresh Needed',
          description: 'Video creative showing declining CTR over 14 days',
          impact: 'Prevent -15% performance drop',
          action: 'Upload new video variations',
          confidence: 85
        },
        {
          id: 'rec-004',
          type: 'timing',
          priority: 'low',
          title: 'Optimize Ad Scheduling',
          description: 'Peak performance hours identified: 2-4 PM and 7-9 PM',
          impact: '+12% efficiency',
          action: 'Adjust bid modifiers for peak hours',
          confidence: 71
        }
      ],
      predictions: {
        nextWeekPerformance: {
          impressions: 125000,
          clicks: 4200,
          conversions: 340,
          revenue: 8750
        },
        budgetDepletion: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        optimalBidding: 1.23,
        audienceGrowth: 15.7
      },
      anomalies: [
        {
          id: 'anom-001',
          detected: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: 'performance_drop',
          severity: 'warning',
          description: 'E-Commerce campaign CTR dropped 25% in last 6 hours',
          impact: 'Potential revenue loss of $450/day',
          suggested_action: 'Investigate ad fatigue, consider creative refresh'
        },
        {
          id: 'anom-002',
          detected: new Date(Date.now() - 30 * 60 * 1000),
          type: 'unusual_spike',
          severity: 'info',
          description: 'Mobile app campaign seeing 180% conversion spike',
          impact: 'Exceeded daily targets by 80%',
          suggested_action: 'Consider increasing budget allocation'
        }
      ]
    });
  }, []);

  const cardClass = isDark 
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-xl border border-white/20';

  const bgClass = isDark 
    ? 'bg-[#181c23]' 
    : 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'info': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const handleOptimizationToggle = (key: string) => {
    if (!aiConfig) return;
    
    setAiConfig({
      ...aiConfig,
      optimization: {
        ...aiConfig.optimization,
        [key]: !aiConfig.optimization[key as keyof typeof aiConfig.optimization]
      }
    });
  };

  const runOptimization = async () => {
    setIsProcessing(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setSystemStatus(prev => ({
      ...prev,
      lastUpdate: new Date(),
      processedCampaigns: prev.processedCampaigns + 3,
      activeOptimizations: prev.activeOptimizations + 1,
      avgPerformanceImprovement: prev.avgPerformanceImprovement + 2.1
    }));
    
    setIsProcessing(false);
  };

  const applyRecommendation = (recommendationId: string) => {
    if (!insights) return;
    
    const recommendation = insights.recommendations.find(rec => rec.id === recommendationId);
    
    // Remove the applied recommendation from the list
    const updatedRecommendations = insights.recommendations.filter(rec => rec.id !== recommendationId);
    setInsights({
      ...insights,
      recommendations: updatedRecommendations
    });

    // Show success notification
    setNotification({
      message: `Applied: ${recommendation?.title || 'Recommendation'}`,
      type: 'success'
    });
    
    // Clear notification after 3 seconds
    setTimeout(() => setNotification(null), 3000);
  };

  const dismissRecommendation = (recommendationId: string) => {
    if (!insights) return;
    
    const recommendation = insights.recommendations.find(rec => rec.id === recommendationId);
    
    // Remove the dismissed recommendation from the list
    const updatedRecommendations = insights.recommendations.filter(rec => rec.id !== recommendationId);
    setInsights({
      ...insights,
      recommendations: updatedRecommendations
    });

    // Show info notification
    setNotification({
      message: `Dismissed: ${recommendation?.title || 'Recommendation'}`,
      type: 'info'
    });
    
    // Clear notification after 3 seconds
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className={`min-h-screen ${bgClass} py-8`}>
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-6 py-3 rounded-lg shadow-lg backdrop-blur-lg border ${
            notification.type === 'success' 
              ? 'bg-green-500/20 border-green-500/30 text-green-300' 
              : 'bg-blue-500/20 border-blue-500/30 text-blue-300'
          }`}>
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{notification.message}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
              <Brain className="w-8 h-8 mr-3 text-purple-400" />
              AI Campaign Orchestrator
            </h1>
            <p className="text-white/70">Intelligent automation for advertiser campaign management</p>
          </div>

          {/* System Status */}
          <div className={`${cardClass} p-6 mb-8`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center`}>
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">System Status</h3>
                  <p className="text-green-400 text-sm">All systems operational</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-400">Last Update</div>
                  <div className="text-white">{systemStatus.lastUpdate.toLocaleTimeString()}</div>
                </div>
                <button
                  onClick={runOptimization}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      <span>Run Optimization</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-700/30 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Database className="w-8 h-8 text-blue-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{systemStatus.processedCampaigns}</div>
                    <div className="text-gray-400 text-sm">Campaigns Processed</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700/30 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Cpu className="w-8 h-8 text-green-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{systemStatus.activeOptimizations}</div>
                    <div className="text-gray-400 text-sm">Active Optimizations</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700/30 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{systemStatus.avgPerformanceImprovement}%</div>
                    <div className="text-gray-400 text-sm">Avg. Improvement</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700/30 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-8 h-8 text-yellow-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">${systemStatus.budgetSavings.toLocaleString()}</div>
                    <div className="text-gray-400 text-sm">Budget Savings</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-8">
            {[
              { id: 'overview', label: 'Overview', icon: Monitor },
              { id: 'recommendations', label: 'AI Recommendations', icon: Lightbulb },
              { id: 'automation', label: 'Automation Rules', icon: Bot },
              { id: 'monitoring', label: 'Monitoring', icon: Gauge },
              { id: 'settings', label: 'AI Settings', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'text-white/70 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Performance Predictions */}
              <div className={`${cardClass} p-6`}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <PieChart className="w-6 h-6 text-blue-400 mr-2" />
                  Performance Predictions
                </h3>
                
                {insights && (
                  <div className="space-y-4">
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">Next Week Revenue</div>
                      <div className="text-2xl font-bold text-green-400">
                        ${insights.predictions.nextWeekPerformance.revenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">
                        {insights.predictions.nextWeekPerformance.conversions} expected conversions
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <div className="text-gray-400 text-sm">Impressions</div>
                        <div className="text-lg font-bold text-white">
                          {insights.predictions.nextWeekPerformance.impressions.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <div className="text-gray-400 text-sm">Clicks</div>
                        <div className="text-lg font-bold text-white">
                          {insights.predictions.nextWeekPerformance.clicks.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400 font-medium">Budget Alert</span>
                      </div>
                      <div className="text-white text-sm">
                        Current campaigns will exhaust budget by{' '}
                        <span className="font-medium">
                          {insights.predictions.budgetDepletion.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Anomalies */}
              <div className={`${cardClass} p-6`}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <AlertCircle className="w-6 h-6 text-orange-400 mr-2" />
                  Anomaly Detection
                </h3>
                
                <div className="space-y-4">
                  {insights?.anomalies.map(anomaly => (
                    <div key={anomaly.id} className={`border rounded-lg p-4 ${getSeverityColor(anomaly.severity)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-white capitalize">
                          {anomaly.type.replace('_', ' ')}
                        </div>
                        <div className="text-xs opacity-70">
                          {anomaly.detected.toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="text-sm mb-2">{anomaly.description}</div>
                      <div className="text-xs opacity-80">{anomaly.impact}</div>
                      <div className="mt-3 pt-3 border-t border-current/20">
                        <div className="text-xs font-medium">Suggested Action:</div>
                        <div className="text-xs">{anomaly.suggested_action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <div className={`${cardClass} p-6`}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Lightbulb className="w-6 h-6 text-yellow-400 mr-2" />
                  AI-Powered Recommendations
                </h3>
                
                <div className="space-y-4">
                  {insights?.recommendations.map(rec => (
                    <div key={rec.id} className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                            {rec.priority} priority
                          </div>
                          <span className="text-gray-400 text-xs capitalize">{rec.type}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Confidence</div>
                          <div className="text-lg font-bold text-white">{rec.confidence}%</div>
                        </div>
                      </div>
                      
                      <h4 className="text-lg font-semibold text-white mb-2">{rec.title}</h4>
                      <p className="text-gray-300 text-sm mb-3">{rec.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-gray-400 text-xs">Expected Impact</div>
                          <div className="text-green-400 font-medium">{rec.impact}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">Recommended Action</div>
                          <div className="text-white">{rec.action}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => applyRecommendation(rec.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                        >
                          Apply Recommendation
                        </button>
                        <button 
                          onClick={() => dismissRecommendation(rec.id)}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'automation' && aiConfig && (
            <div className={`${cardClass} p-6`}>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Bot className="w-6 h-6 text-green-400 mr-2" />
                Automation Rules
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Campaign Lifecycle</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                      <div>
                        <div className="text-white font-medium">Auto-start approved campaigns</div>
                        <div className="text-gray-400 text-sm">Automatically launch campaigns after admin approval</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiConfig.automation.autoStartCampaigns}
                          onChange={() => {
                            setAiConfig({
                              ...aiConfig,
                              automation: {
                                ...aiConfig.automation,
                                autoStartCampaigns: !aiConfig.automation.autoStartCampaigns
                              }
                            });
                            setNotification({
                              message: `Auto-start campaigns ${!aiConfig.automation.autoStartCampaigns ? 'enabled' : 'disabled'}`,
                              type: 'info'
                            });
                            setTimeout(() => setNotification(null), 3000);
                          }}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full peer transition-all ${
                          aiConfig.automation.autoStartCampaigns ? 'bg-blue-600' : 'bg-gray-600'
                        } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                          aiConfig.automation.autoStartCampaigns ? 'after:translate-x-full' : ''
                        }`}></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                      <div>
                        <div className="text-white font-medium">Auto-pause low performers</div>
                        <div className="text-gray-400 text-sm">Pause campaigns with poor performance metrics</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiConfig.automation.autoPauseLowPerformers}
                          onChange={() => {
                            setAiConfig({
                              ...aiConfig,
                              automation: {
                                ...aiConfig.automation,
                                autoPauseLowPerformers: !aiConfig.automation.autoPauseLowPerformers
                              }
                            });
                            setNotification({
                              message: `Auto-pause low performers ${!aiConfig.automation.autoPauseLowPerformers ? 'enabled' : 'disabled'}`,
                              type: 'info'
                            });
                            setTimeout(() => setNotification(null), 3000);
                          }}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full peer transition-all ${
                          aiConfig.automation.autoPauseLowPerformers ? 'bg-blue-600' : 'bg-gray-600'
                        } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                          aiConfig.automation.autoPauseLowPerformers ? 'after:translate-x-full' : ''
                        }`}></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Budget Management</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                      <div>
                        <div className="text-white font-medium">Auto-scale budget</div>
                        <div className="text-gray-400 text-sm">Automatically adjust budget based on performance</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiConfig.automation.autoScaleBudget}
                          onChange={() => {
                            setAiConfig({
                              ...aiConfig,
                              automation: {
                                ...aiConfig.automation,
                                autoScaleBudget: !aiConfig.automation.autoScaleBudget
                              }
                            });
                            setNotification({
                              message: `Auto-scale budget ${!aiConfig.automation.autoScaleBudget ? 'enabled' : 'disabled'}`,
                              type: 'info'
                            });
                            setTimeout(() => setNotification(null), 3000);
                          }}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full peer transition-all ${
                          aiConfig.automation.autoScaleBudget ? 'bg-blue-600' : 'bg-gray-600'
                        } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                          aiConfig.automation.autoScaleBudget ? 'after:translate-x-full' : ''
                        }`}></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <div className={`${cardClass} p-6`}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Gauge className="w-6 h-6 text-green-400 mr-2" />
                  Real-Time Monitoring
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Performance Thresholds */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-4">Performance Thresholds</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Click-Through Rate (CTR)</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-white">2.5%</span>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Cost Per Click (CPC)</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-white">$0.75</span>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Return on Ad Spend (ROAS)</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-white">4.0x</span>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Alerts */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-4">Active Alerts</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                        <div>
                          <div className="text-white text-sm font-medium">Budget Alert</div>
                          <div className="text-gray-400 text-xs">Campaign #1247 approaching daily limit</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                        <div>
                          <div className="text-white text-sm font-medium">Performance Drop</div>
                          <div className="text-gray-400 text-xs">E-Commerce campaign CTR down 25%</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                          <div className="text-white text-sm font-medium">Optimization Complete</div>
                          <div className="text-gray-400 text-xs">TechStart campaign optimized successfully</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campaign Health Status */}
                <div className="mt-6 bg-gray-700/30 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4">Campaign Health Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">28</div>
                      <div className="text-gray-400 text-sm">Healthy Campaigns</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">8</div>
                      <div className="text-gray-400 text-sm">Need Attention</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">3</div>
                      <div className="text-gray-400 text-sm">Critical Issues</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && aiConfig && (
            <div className={`${cardClass} p-6`}>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Settings className="w-6 h-6 text-blue-400 mr-2" />
                AI Configuration
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Optimization Level</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['basic', 'advanced', 'premium'].map(level => (
                      <button
                        key={level}
                        onClick={() => setAiConfig({
                          ...aiConfig,
                          optimization: {
                            ...aiConfig.optimization,
                            level: level as 'basic' | 'advanced' | 'premium'
                          }
                        })}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          aiConfig.optimization.level === level
                            ? 'border-blue-500 bg-blue-500/20 shadow-lg'
                            : 'border-gray-600 bg-gray-700/30 hover:border-gray-500 hover:bg-gray-600/30'
                        }`}
                      >
                        <div className={`font-medium capitalize mb-2 ${
                          aiConfig.optimization.level === level ? 'text-blue-300' : 'text-white'
                        }`}>
                          {level}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {level === 'basic' && 'Basic optimizations only'}
                          {level === 'advanced' && 'Advanced AI features included'}
                          {level === 'premium' && 'Full AI automation & all features'}
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          {level === 'basic' && '• Auto Adjustments\n• Smart Bidding'}
                          {level === 'advanced' && '• All Basic features\n• Audience Expansion\n• Budget Optimization'}
                          {level === 'premium' && '• All Advanced features\n• Creative Testing\n• Ad Scheduling'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Optimization Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(aiConfig.optimization)
                      .filter(([key]) => key !== 'level')
                      .map(([key, value]) => {
                        // Determine if feature is available based on optimization level
                        const isAvailable = () => {
                          if (aiConfig.optimization.level === 'premium') return true;
                          if (aiConfig.optimization.level === 'advanced') {
                            return !['creativeTesting', 'adScheduling'].includes(key);
                          }
                          if (aiConfig.optimization.level === 'basic') {
                            return ['autoAdjustments', 'smartBidding'].includes(key);
                          }
                          return false;
                        };

                        const available = isAvailable();
                        
                        return (
                          <div key={key} className={`flex items-center justify-between p-4 rounded-lg ${
                            available ? 'bg-gray-700/30' : 'bg-gray-800/50 opacity-50'
                          }`}>
                            <div>
                              <div className={`font-medium capitalize ${available ? 'text-white' : 'text-gray-500'}`}>
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </div>
                              {!available && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {aiConfig.optimization.level === 'basic' ? 'Requires Advanced/Premium' : 'Requires Premium'}
                                </div>
                              )}
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={available ? (value as boolean) : false}
                                onChange={() => available && handleOptimizationToggle(key)}
                                disabled={!available}
                                className="sr-only"
                              />
                              <div className={`w-11 h-6 rounded-full peer transition-all ${
                                available 
                                  ? ((value as boolean) ? 'bg-blue-600' : 'bg-gray-600')
                                  : 'bg-gray-700'
                              } ${
                                available ? 'peer-checked:after:translate-x-full' : ''
                              } after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                            </label>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AICampaignOrchestrator;
