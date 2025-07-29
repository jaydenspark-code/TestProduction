import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Eye, User, ExternalLink, Briefcase } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAgentApplications, AgentApplication } from '../../context/AgentApplicationContext';
import { useAdvertiserApplications, AdvertiserApplication } from '../../context/AdvertiserApplicationContext';
// Add missing imports
import { aiAnalyticsService } from '../../services/aiAnalyticsService';
import type { 
  PredictiveInsight, 
  UserSegment, 
  AnomalyDetection 
} from '../../services/aiAnalyticsService';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('agents');
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { applications: agentApplications, updateApplicationStatus: updateAgentApplicationStatus } = useAgentApplications();
  const { applications: advertiserApplications, updateApplicationStatus: updateAdvertiserApplicationStatus } = useAdvertiserApplications();
  const [selectedApp, setSelectedApp] = useState<AgentApplication | null>(null);
  const [selectedAdvertiserApp, setSelectedAdvertiserApp] = useState<AdvertiserApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Analytics state with proper typing
  const [userSegments, setUserSegments] = useState<UserSegment[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [revenuePrediction, setRevenuePrediction] = useState<PredictiveInsight | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Load analytics data when analytics tab is selected
  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalyticsData();
    }
  }, [activeTab]);

  // Load analytics data from aiAnalyticsService
  const loadAnalyticsData = async () => {
    setIsLoadingAnalytics(true);
    try {
      // Load user segments
      const segments = await aiAnalyticsService.segmentUsers();
      setUserSegments(segments);

      // Load anomalies (remove duplicate line)
      const detectedAnomalies = await aiAnalyticsService.detectAnomalies();
      setAnomalies(detectedAnomalies);

      // Load revenue prediction
      const prediction = await aiAnalyticsService.predictRevenue(30);
      setRevenuePrediction(prediction);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Consistent color utilities based on theme
  const getThemeColors = () => {
    if (theme === 'professional') {
      return {
        background: 'bg-gradient-to-br from-gray-900 via-black to-gray-800',
        card: 'bg-gray-800/50 op-blur-lg rounded-2xl p-6 border border-gray-700/50',
        cardInner: 'bg-gray-700/30 rounded-lg p-4 border border-gray-600',
        tabActive: 'bg-cyan-600 text-white',
        tabInactive: 'text-white/70 hover:bg-gray-700',
        tabContainer: 'bg-gray-900 border border-gray-700 rounded-full p-1',
        statusPending: 'text-amber-400',
        statusApproved: 'text-emerald-400',
        statusRejected: 'text-red-400',
        statusInfo: 'text-cyan-400',
        buttonPrimary: 'bg-cyan-600 hover:bg-cyan-700',
        buttonSecondary: 'bg-purple-600 hover:bg-purple-700',
        textPrimary: 'text-white',
        textSecondary: 'text-white/70',
        textMuted: 'text-white/50',
        iconPrimary: 'text-cyan-300',
        iconSecondary: 'text-purple-300',
      };
    } else {
      return {
        background: 'bg-gradient-to-br from-purple-900 to-indigo-900',
        card: 'bg-white/10 op-blur-lg rounded-2xl p-6 border border-white/20',
        cardInner: 'bg-white/5 rounded-lg p-4 border border-white/10',
        tabActive: 'bg-purple-600 text-white',
        tabInactive: 'text-white/70 hover:bg-white/10',
        tabContainer: 'bg-gray-900 border border-gray-700 rounded-full p-1',
        statusPending: 'text-amber-400',
        statusApproved: 'text-emerald-400',
        statusRejected: 'text-red-400',
        statusInfo: 'text-blue-400',
        buttonPrimary: 'bg-blue-600 hover:bg-blue-700',
        buttonSecondary: 'bg-purple-600 hover:bg-purple-700',
        textPrimary: 'text-white',
        textSecondary: 'text-white/70',
        textMuted: 'text-white/50',
        iconPrimary: 'text-blue-300',
        iconSecondary: 'text-purple-300',
      };
    }
  };

  const colors = getThemeColors();

  const handleReview = async (applicationId: string, status: 'approved' | 'rejected') => {
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      updateAgentApplicationStatus(applicationId, status, reviewNotes, user?.fullName || 'Admin');

      setSelectedApp(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Review failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvertiserReview = async (applicationId: string, status: 'approved' | 'rejected') => {
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));

      updateAdvertiserApplicationStatus(applicationId, status, reviewNotes, user?.fullName || 'Admin');

      setSelectedAdvertiserApp(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Review failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className={`w-5 h-5 ${colors.statusApproved}`} />;
      case 'rejected':
        return <XCircle className={`w-5 h-5 ${colors.statusRejected}`} />;
      default:
        return <Clock className={`w-5 h-5 ${colors.statusPending}`} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return colors.statusApproved;
      case 'rejected':
        return colors.statusRejected;
      default:
        return colors.statusPending;
    }
  };

  const pendingAgentApplications = agentApplications.filter(app => app.status === 'pending');
  const reviewedAgentApplications = agentApplications.filter(app => app.status !== 'pending');

  const pendingAdvertiserApplications = advertiserApplications.filter(app => app.status === 'pending');
  const reviewedAdvertiserApplications = advertiserApplications.filter(app => app.status !== 'pending');

  return (
    <div className={`min-h-screen ${colors.background} py-8`}>
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold ${colors.textPrimary} mb-2`}>Admin Dashboard</h1>
            <p className={colors.textSecondary}>Review applications and monitor platform analytics</p>
          </div>

          <div className="mb-8 flex justify-center">
            <div className={`${colors.tabContainer} flex space-x-1`}>
              <button
                onClick={() => setActiveTab('agents')}
                className={`px-6 py-2 text-sm font-medium rounded-full transition-colors ${activeTab === 'agents' ? colors.tabActive : colors.tabInactive}`}>
                Agent Applications
              </button>
              <button
                onClick={() => setActiveTab('advertisers')}
                className={`px-6 py-2 text-sm font-medium rounded-full transition-colors ${activeTab === 'advertisers' ? colors.tabActive : colors.tabInactive}`}>
                Advertiser Applications
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-2 text-sm font-medium rounded-full transition-colors ${activeTab === 'analytics' ? colors.tabActive : colors.tabInactive}`}>
                Analytics
              </button>
            </div>
          </div>

          {/* Stats */}
          {activeTab !== 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className={colors.card}>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${colors.statusPending}`}>{activeTab === 'agents' ? pendingAgentApplications.length : pendingAdvertiserApplications.length}</div>
                  <div className={`${colors.textSecondary} text-sm`}>Pending Review</div>
                </div>
              </div>
              <div className={colors.card}>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${colors.statusApproved}`}>
                    {activeTab === 'agents'
                      ? agentApplications.filter(app => app.status === 'approved').length
                      : advertiserApplications.filter(app => app.status === 'approved').length}
                  </div>
                  <div className={`${colors.textSecondary} text-sm`}>Approved</div>
                </div>
              </div>
              <div className={colors.card}>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${colors.statusRejected}`}>
                    {activeTab === 'agents'
                      ? agentApplications.filter(app => app.status === 'rejected').length
                      : advertiserApplications.filter(app => app.status === 'rejected').length}
                  </div>
                  <div className={`${colors.textSecondary} text-sm`}>Rejected</div>
                </div>
              </div>
              <div className={colors.card}>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${colors.statusInfo}`}>{activeTab === 'agents' ? agentApplications.length : advertiserApplications.length}</div>
                  <div className={`${colors.textSecondary} text-sm`}>Total Applications</div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Dashboard */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              {/* Analytics Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className={colors.card}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${colors.statusInfo}`}>
                      {isLoadingAnalytics ? '...' : revenuePrediction ? `$${Math.round(revenuePrediction.prediction).toLocaleString()}` : 'N/A'}
                    </div>
                    <div className={`${colors.textSecondary} text-sm`}>Predicted Revenue (30d)</div>
                  </div>
                </div>
                <div className={colors.card}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${colors.statusApproved}`}>
                      {isLoadingAnalytics ? '...' : userSegments.length > 0 ? userSegments[0].size : 'N/A'}
                    </div>
                    <div className={`${colors.textSecondary} text-sm`}>High-Value Users</div>
                  </div>
                </div>
                <div className={colors.card}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${colors.statusPending}`}>
                      {isLoadingAnalytics ? '...' : anomalies.length}
                    </div>
                    <div className={`${colors.textSecondary} text-sm`}>Detected Anomalies</div>
                  </div>
                </div>
                <div className={colors.card}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${colors.statusInfo}`}>
                      {isLoadingAnalytics ? '...' : revenuePrediction ? `${(revenuePrediction.confidence * 100).toFixed(0)}%` : 'N/A'}
                    </div>
                    <div className={`${colors.textSecondary} text-sm`}>AI Confidence</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Segments */}
                <div className={colors.card}>
                  <h3 className={`text-xl font-bold ${colors.textPrimary} mb-4`}>User Segments</h3>
                  {isLoadingAnalytics ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-pulse flex space-x-4">
                        <div className="rounded-full bg-gray-700 h-12 w-12"></div>
                        <div className="flex-1 space-y-4 py-1">
                          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-700 rounded"></div>
                            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userSegments.map(segment => (
                        <div key={segment.id} className={colors.cardInner}>
                          <div className="flex items-center justify-between mb-2">
                            <div className={`font-medium ${colors.textPrimary}`}>{segment.name}</div>
                            <div className={`text-sm font-medium ${colors.statusInfo}`}>
                              {segment.size} users
                            </div>
                          </div>
                          <div className={`${colors.textSecondary} text-sm mb-2`}>
                            {segment.characteristics.join(', ')}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className={colors.textSecondary}>Conversion:</span>
                              <span className={colors.statusApproved}>{(segment.conversionRate * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={colors.textSecondary}>Avg Revenue:</span>
                              <span className={colors.statusInfo}>${segment.averageRevenue}</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {userSegments.length === 0 && (
                        <div className="text-center py-8">
                          <p className={colors.textSecondary}>No user segments available</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Anomaly Detection */}
                <div className={colors.card}>
                  <h3 className={`text-xl font-bold ${colors.textPrimary} mb-4`}>Anomaly Detection</h3>
                  {isLoadingAnalytics ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-pulse flex space-x-4">
                        <div className="rounded-full bg-gray-700 h-12 w-12"></div>
                        <div className="flex-1 space-y-4 py-1">
                          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-700 rounded"></div>
                            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {anomalies.map((anomaly, index) => (
                        <div key={index} className={colors.cardInner}>
                          <div className="flex items-center justify-between mb-2">
                            <div className={`font-medium ${colors.textPrimary}`}>{anomaly.metric}</div>
                            <div className={`text-sm font-medium ${
                              anomaly.severity === 'high' ? colors.statusRejected : 
                              anomaly.severity === 'medium' ? colors.statusPending : 
                              colors.statusInfo
                            }`}>
                              {anomaly.severity.toUpperCase()} SEVERITY
                            </div>
                          </div>
                          <div className={`${colors.textSecondary} text-sm mb-2`}>
                            {anomaly.description}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className={colors.textSecondary}>Current:</span>
                              <span className={colors.statusInfo}>{anomaly.value.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={colors.textSecondary}>Expected:</span>
                              <span className={colors.textSecondary}>{anomaly.expected.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="text-xs mt-2 text-right">
                            <span className={colors.textMuted}>
                              {new Date(anomaly.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}

                      {anomalies.length === 0 && (
                        <div className="text-center py-8">
                          <p className={colors.textSecondary}>No anomalies detected</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Revenue Prediction */}
              {revenuePrediction && (
                <div className={colors.card}>
                  <h3 className={`text-xl font-bold ${colors.textPrimary} mb-4`}>Revenue Prediction</h3>
                  {isLoadingAnalytics ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-pulse flex space-x-4">
                        <div className="rounded-full bg-gray-700 h-12 w-12"></div>
                        <div className="flex-1 space-y-4 py-1">
                          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-700 rounded"></div>
                            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className={`${colors.cardInner} col-span-1 md:col-span-1`}>
                        <div className="text-center">
                          <div className={`text-3xl font-bold ${colors.statusInfo}`}>
                            ${Math.round(revenuePrediction.prediction).toLocaleString()}
                          </div>
                          <div className={`${colors.textSecondary} text-sm mt-2`}>
                            Predicted Revenue ({revenuePrediction.timeframe})
                          </div>
                          <div className={`${colors.textMuted} text-xs mt-4`}>
                            Confidence: {(revenuePrediction.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <div className={`${colors.cardInner} col-span-1 md:col-span-2`}>
                        <h4 className={`text-lg font-medium ${colors.textPrimary} mb-3`}>Recommendations</h4>
                        <ul className="space-y-2">
                          {revenuePrediction.recommendations?.map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <span className={`inline-block w-5 h-5 rounded-full ${colors.statusApproved} flex items-center justify-center mr-2 text-xs`}>
                                {index + 1}
                              </span>
                              <span className={colors.textSecondary}>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Agent Applications */}
          {activeTab === 'agents' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pending Applications */}
              <div className={colors.card}>
                <h3 className={`text-xl font-bold ${colors.textPrimary} mb-4 flex items-center`}>
                  <Clock className={`w-5 h-5 ${colors.statusPending} mr-2`} />
                  Pending Applications ({pendingAgentApplications.length})
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {pendingAgentApplications.map(app => (
                    <div key={app.id} className={`${colors.cardInner} border-l-4 border-amber-500`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <User className={`w-8 h-8 ${colors.iconPrimary}`} />
                          <div>
                            <div className={`font-medium ${colors.textPrimary}`}>{app.userName}</div>
                            <div className={`text-sm ${colors.textSecondary}`}>{app.userEmail}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm ${colors.textMuted}`}>
                            {new Date(app.appliedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div>
                          <span className={colors.textSecondary}>Platform:</span>
                          <div className={`font-medium ${colors.textPrimary}`}>{app.platformName}</div>
                        </div>
                        <div>
                          <span className={colors.textSecondary}>Username:</span>
                          <div className={`font-medium ${colors.textPrimary}`}>@{app.username}</div>
                        </div>
                        <div>
                          <span className={colors.textSecondary}>Followers:</span>
                          <div className={`font-bold ${colors.statusApproved}`}>{app.followerCount.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className={colors.textSecondary}>Channel:</span>
                          <a href={app.channelLink} target="_blank" rel="noopener noreferrer" 
                             className={`${colors.statusInfo} hover:underline flex items-center text-xs`}>
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Channel
                          </a>
                        </div>
                      </div>
                      
                      {app.additionalInfo && (
                        <div className="mb-3">
                          <span className={`text-sm ${colors.textSecondary}`}>Additional Info:</span>
                          <div className={`text-sm ${colors.textPrimary} mt-1 line-clamp-2`}>
                            {app.additionalInfo}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className={`flex-1 ${colors.buttonPrimary} text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors hover:opacity-90 flex items-center justify-center`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {pendingAgentApplications.length === 0 && (
                    <div className="text-center py-8">
                      <Briefcase className={`w-12 h-12 ${colors.textMuted} mx-auto mb-4`} />
                      <p className={colors.textSecondary}>No pending agent applications</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Reviewed Applications */}
              <div className={colors.card}>
                <h3 className={`text-xl font-bold ${colors.textPrimary} mb-4 flex items-center`}>
                  <CheckCircle className={`w-5 h-5 ${colors.statusApproved} mr-2`} />
                  Reviewed Applications ({reviewedAgentApplications.length})
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {reviewedAgentApplications.map(app => (
                    <div key={app.id} className={`${colors.cardInner} border-l-4 ${
                      app.status === 'approved' ? 'border-emerald-500' : 'border-red-500'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <User className={`w-8 h-8 ${colors.iconPrimary}`} />
                          <div>
                            <div className={`font-medium ${colors.textPrimary}`}>{app.userName}</div>
                            <div className={`text-sm ${colors.textSecondary}`}>{app.userEmail}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(app.status)}
                            <span className={`text-sm font-medium ${getStatusColor(app.status)}`}>
                              {app.status.toUpperCase()}
                            </span>
                          </div>
                          <div className={`text-xs ${colors.textMuted} mt-1`}>
                            {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : ''}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div>
                          <span className={colors.textSecondary}>Platform:</span>
                          <div className={`font-medium ${colors.textPrimary}`}>{app.platformName}</div>
                        </div>
                        <div>
                          <span className={colors.textSecondary}>Followers:</span>
                          <div className={`font-bold ${colors.statusApproved}`}>{app.followerCount.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      {app.notes && (
                        <div className="mb-3">
                          <span className={`text-sm ${colors.textSecondary}`}>Review Notes:</span>
                          <div className={`text-sm ${colors.textPrimary} mt-1`}>
                            {app.notes}
                          </div>
                        </div>
                      )}
                      
                      {app.reviewedBy && (
                        <div className={`text-xs ${colors.textMuted} text-right`}>
                          Reviewed by {app.reviewedBy}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {reviewedAgentApplications.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className={`w-12 h-12 ${colors.textMuted} mx-auto mb-4`} />
                      <p className={colors.textSecondary}>No reviewed applications yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Advertiser Applications */}
          {activeTab === 'advertisers' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pending Applications */}
              <div className={colors.card}>
                <h3 className={`text-xl font-bold ${colors.textPrimary} mb-4 flex items-center`}>
                  <Clock className={`w-5 h-5 ${colors.statusPending} mr-2`} />
                  Pending Applications ({pendingAdvertiserApplications.length})
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {pendingAdvertiserApplications.map(app => (
                    <div key={app.id} className={`${colors.cardInner} border-l-4 border-amber-500`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Briefcase className={`w-8 h-8 ${colors.iconPrimary}`} />
                          <div>
                            <div className={`font-medium ${colors.textPrimary}`}>{app.companyName}</div>
                            <div className={`text-sm ${colors.textSecondary}`}>{app.contactEmail}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm ${colors.textMuted}`}>
                            {new Date(app.appliedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div>
                          <span className={colors.textSecondary}>Campaign:</span>
                          <div className={`font-medium ${colors.textPrimary}`}>{app.campaignTitle}</div>
                        </div>
                        <div>
                          <span className={colors.textSecondary}>Budget:</span>
                          <div className={`font-medium ${colors.textPrimary}`}>{app.budgetRange}</div>
                        </div>
                        <div>
                          <span className={colors.textSecondary}>Audience:</span>
                          <div className={`font-medium ${colors.textPrimary}`}>{app.targetAudience}</div>
                        </div>
                      </div>
                      
                      {app.campaignDescription && (
                        <div className="mb-3">
                          <span className={`text-sm ${colors.textSecondary}`}>Description:</span>
                          <div className={`text-sm ${colors.textPrimary} mt-1 line-clamp-2`}>
                            {app.campaignDescription}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedAdvertiserApp(app)}
                          className={`flex-1 ${colors.buttonPrimary} text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors hover:opacity-90 flex items-center justify-center`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {pendingAdvertiserApplications.length === 0 && (
                    <div className="text-center py-8">
                      <Briefcase className={`w-12 h-12 ${colors.textMuted} mx-auto mb-4`} />
                      <p className={colors.textSecondary}>No pending advertiser applications</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Reviewed Applications */}
              <div className={colors.card}>
                <h3 className={`text-xl font-bold ${colors.textPrimary} mb-4 flex items-center`}>
                  <CheckCircle className={`w-5 h-5 ${colors.statusApproved} mr-2`} />
                  Reviewed Applications ({reviewedAdvertiserApplications.length})
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {reviewedAdvertiserApplications.map(app => (
                    <div key={app.id} className={`${colors.cardInner} border-l-4 ${
                      app.status === 'approved' ? 'border-emerald-500' : 'border-red-500'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Briefcase className={`w-8 h-8 ${colors.iconPrimary}`} />
                          <div>
                            <div className={`font-medium ${colors.textPrimary}`}>{app.companyName}</div>
                            <div className={`text-sm ${colors.textSecondary}`}>{app.contactEmail}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(app.status)}
                            <span className={`text-sm font-medium ${getStatusColor(app.status)}`}>
                              {app.status.toUpperCase()}
                            </span>
                          </div>
                          <div className={`text-xs ${colors.textMuted} mt-1`}>
                            {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : ''}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div>
                          <span className={colors.textSecondary}>Campaign:</span>
                          <div className={`font-medium ${colors.textPrimary}`}>{app.campaignTitle}</div>
                        </div>
                        <div>
                          <span className={colors.textSecondary}>Budget:</span>
                          <div className={`font-medium ${colors.textPrimary}`}>{app.budgetRange}</div>
                        </div>
                        <div>
                          <span className={colors.textSecondary}>Audience:</span>
                          <div className={`font-medium ${colors.textPrimary}`}>{app.targetAudience}</div>
                        </div>
                      </div>
                      
                      {app.notes && (
                        <div className="mb-3">
                          <span className={`text-sm ${colors.textSecondary}`}>Review Notes:</span>
                          <div className={`text-sm ${colors.textPrimary} mt-1`}>
                            {app.notes}
                          </div>
                        </div>
                      )}
                      
                      {app.reviewedBy && (
                        <div className={`text-xs ${colors.textMuted} text-right`}>
                          Reviewed by {app.reviewedBy}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {reviewedAdvertiserApplications.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className={`w-12 h-12 ${colors.textMuted} mx-auto mb-4`} />
                      <p className={colors.textSecondary}>No reviewed applications yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agent Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-2xl ${colors.card}`}>
            <h3 className={`text-xl font-bold ${colors.textPrimary} mb-4`}>Review Agent Application</h3>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${colors.textSecondary} text-sm`}>Applicant</label>
                  <div className={`${colors.textPrimary} font-medium`}>{selectedApp.userName}</div>
                  <div className={`${colors.textSecondary} text-sm`}>{selectedApp.userEmail}</div>
                </div>
                <div>
                  <label className={`${colors.textSecondary} text-sm`}>Platform</label>
                  <div className={`${colors.textPrimary} font-medium`}>{selectedApp.platformName}</div>
                  <div className={`${colors.textSecondary} text-sm`}>@{selectedApp.username}</div>
                </div>
              </div>

              <div>
                <label className={`${colors.textSecondary} text-sm`}>Channel Link</label>
                <div className="text-cyan-300 break-all">{selectedApp.channelLink}</div>
              </div>

              <div>
                <label className={`${colors.textSecondary} text-sm`}>Follower Count</label>
                <div className="text-emerald-300 font-bold">{selectedApp.followerCount.toLocaleString()}</div>
              </div>

              {selectedApp.additionalInfo && (
                <div>
                  <label className={`${colors.textSecondary} text-sm`}>Additional Information</label>
                  <div className={`${colors.textSecondary} ${colors.cardInner} rounded p-3`}>{selectedApp.additionalInfo}</div>
                </div>
              )}

              <div>
                <label className={`${colors.textSecondary} text-sm`}>Review Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className={`w-full px-4 py-3 ${colors.cardInner} rounded-lg ${colors.textPrimary} placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none`}
                  rows={3}
                  placeholder="Add notes about your decision..."
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => handleReview(selectedApp.id, 'approved')}
                disabled={loading}
                className={`flex-1 ${colors.buttonPrimary} text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50`}>
                {loading ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleReview(selectedApp.id, 'rejected')}
                disabled={loading}
                className={`flex-1 ${colors.buttonSecondary} text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50`}>
                {loading ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => { setSelectedApp(null); setReviewNotes(''); }}
                className="px-6 text-white rounded-lg font-medium hover:bg-white/20 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advertiser Review Modal */}
      {selectedAdvertiserApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-2xl ${colors.card}`}>
            <h3 className={`text-xl font-bold ${colors.textPrimary} mb-4`}>Review Advertiser Application</h3>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${colors.textSecondary} text-sm`}>Company</label>
                  <div className={`${colors.textPrimary} font-medium`}>{selectedAdvertiserApp.companyName}</div>
                  <div className={`${colors.textSecondary} text-sm`}>{selectedAdvertiserApp.contactEmail}</div>
                </div>
                <div>
                  <label className={`${colors.textSecondary} text-sm`}>Campaign</label>
                  <div className={`${colors.textPrimary} font-medium`}>{selectedAdvertiserApp.campaignTitle}</div>
                  <div className={`${colors.textSecondary} text-sm`}>{selectedAdvertiserApp.budgetRange}</div>
                </div>
              </div>

              <div>
                <label className={`${colors.textSecondary} text-sm`}>Campaign Description</label>
                <div className={`${colors.textSecondary} ${colors.cardInner} rounded p-3`}>{selectedAdvertiserApp.campaignDescription}</div>
              </div>

              <div>
                <label className={`${colors.textSecondary} text-sm`}>Target Audience</label>
                <div className={`${colors.textPrimary}`}>{selectedAdvertiserApp.targetAudience}</div>
              </div>

              <div>
                <label className={`${colors.textSecondary} text-sm`}>Review Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className={`w-full px-4 py-3 ${colors.cardInner} rounded-lg ${colors.textPrimary} placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none`}
                  rows={3}
                  placeholder="Add notes about your decision..."
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => handleAdvertiserReview(selectedAdvertiserApp.id, 'approved')}
                disabled={loading}
                className={`flex-1 ${colors.buttonPrimary} text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50`}>
                {loading ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleAdvertiserReview(selectedAdvertiserApp.id, 'rejected')}
                disabled={loading}
                className={`flex-1 ${colors.buttonSecondary} text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50`}>
                {loading ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => { setSelectedAdvertiserApp(null); setReviewNotes(''); }}
                className="px-6 text-white rounded-lg font-medium hover:bg-white/20 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
