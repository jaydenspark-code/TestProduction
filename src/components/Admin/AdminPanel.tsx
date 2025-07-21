import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Eye, User, ExternalLink, Briefcase } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAgentApplications, AgentApplication } from '../../context/AgentApplicationContext';
import { useAdvertiserApplications, AdvertiserApplication } from '../../context/AdvertiserApplicationContext';

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

  // Check if user is admin
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

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
            <p className={colors.textSecondary}>Review and manage applications</p>
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
            </div>
          </div>

          {/* Stats */}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {activeTab === 'agents' ? (
              <>
                {/* Pending Agent Applications */}
                <div className={colors.card}>
                  <h3 className={`text-xl font-bold ${colors.textPrimary} mb-4`}>Pending Agent Applications</h3>
                  <div className="space-y-4">
                    {pendingAgentApplications.map(app => (
                      <div key={app.id} className={colors.cardInner}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <User className={`w-5 h-5 ${colors.iconSecondary}`} />
                            <div>
                              <div className={`font-medium ${colors.textPrimary}`}>{app.userName}</div>
                              <div className={`${colors.textSecondary} text-sm`}>{app.userEmail}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(app.status)}
                            <span className={`text-sm font-medium ${getStatusColor(app.status)}`}>
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className={colors.textSecondary}>Platform:</span>
                            <span className={colors.textPrimary}>{app.platformName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={colors.textSecondary}>Username:</span>
                            <span className={colors.textPrimary}>@{app.username}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={colors.textSecondary}>Followers:</span>
                            <span className="text-emerald-300">{app.followerCount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={colors.textSecondary}>Applied:</span>
                            <span className={colors.textPrimary}>{new Date(app.appliedAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className={`flex-1 ${colors.buttonPrimary} text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2`}>
                            <Eye className="w-4 h-4" />
                            <span>Review</span>
                          </button>
                          <a
                            href={app.channelLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${colors.buttonSecondary} text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center`}>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}

                    {pendingAgentApplications.length === 0 && (
                      <div className="text-center py-8">
                        <Clock className={`w-12 h-12 ${colors.textMuted} mx-auto mb-4`} />
                        <p className={colors.textSecondary}>No pending agent applications</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Agent Reviews */}
                <div className={colors.card}>
                  <h3 className={`text-xl font-bold ${colors.textPrimary} mb-4`}>Recent Agent Reviews</h3>
                  <div className="space-y-4">
                    {reviewedAgentApplications.slice(0, 5).map(app => (
                      <div key={app.id} className={colors.cardInner}>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`font-medium ${colors.textPrimary}`}>{app.userName}</div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(app.status)}
                            <span className={`text-sm font-medium ${getStatusColor(app.status)}`}>
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className={colors.textSecondary}>
                          {app.platformName} • {app.followerCount.toLocaleString()} followers
                        </div>
                        {app.notes && (
                          <div className={`${colors.textSecondary} text-sm ${colors.cardInner} rounded p-2`}>
                            {app.notes}
                          </div>
                        )}
                        <div className={colors.textMuted}>
                          Reviewed by {app.reviewedBy} on {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    ))}

                    {reviewedAgentApplications.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className={`w-12 h-12 ${colors.textMuted} mx-auto mb-4`} />
                        <p className={colors.textSecondary}>No reviewed agent applications</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Pending Advertiser Applications */}
                <div className={colors.card}>
                  <h3 className={`text-xl font-bold ${colors.textPrimary} mb-4`}>Pending Advertiser Applications</h3>
                  <div className="space-y-4">
                    {pendingAdvertiserApplications.map(app => (
                      <div key={app.id} className={colors.cardInner}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Briefcase className={`w-5 h-5 ${colors.iconSecondary}`} />
                            <div>
                              <div className={`font-medium ${colors.textPrimary}`}>{app.companyName}</div>
                              <div className={`${colors.textSecondary} text-sm`}>{app.campaignTitle}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(app.status)}
                            <span className={`text-sm font-medium ${getStatusColor(app.status)}`}>
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className={colors.textSecondary}>Budget:</span>
                            <span className="text-emerald-300">{app.budgetRange}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={colors.textSecondary}>Duration:</span>
                            <span className={colors.textPrimary}>{app.campaignDuration}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={colors.textSecondary}>Applied:</span>
                            <span className={colors.textPrimary}>{new Date(app.appliedAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedAdvertiserApp(app)}
                            className={`flex-1 ${colors.buttonPrimary} text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2`}>
                            <Eye className="w-4 h-4" />
                            <span>Review</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {pendingAdvertiserApplications.length === 0 && (
                      <div className="text-center py-8">
                        <Clock className={`w-12 h-12 ${colors.textMuted} mx-auto mb-4`} />
                        <p className={colors.textSecondary}>No pending advertiser applications</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Advertiser Reviews */}
                <div className={colors.card}>
                  <h3 className={`text-xl font-bold ${colors.textPrimary} mb-4`}>Recent Advertiser Reviews</h3>
                  <div className="space-y-4">
                    {reviewedAdvertiserApplications.slice(0, 5).map(app => (
                      <div key={app.id} className={colors.cardInner}>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`font-medium ${colors.textPrimary}`}>{app.companyName}</div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(app.status)}
                            <span className={`text-sm font-medium ${getStatusColor(app.status)}`}>
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className={colors.textSecondary}>
                          {app.campaignTitle}
                        </div>
                        {app.notes && (
                          <div className={`${colors.textSecondary} text-sm ${colors.cardInner} rounded p-2`}>
                            {app.notes}
                          </div>
                        )}
                        <div className={colors.textMuted}>
                          Reviewed by {app.reviewedBy} on {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    ))}

                    {reviewedAdvertiserApplications.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className={`w-12 h-12 ${colors.textMuted} mx-auto mb-4`} />
                        <p className={colors.textSecondary}>No reviewed advertiser applications</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Agent Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 kdrop-blur-sm flex items-center justify-center p-4z-50">
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
        <div className="fixed inset-0 bg-black/50 kdrop-blur-sm flex items-center justify-center p-4z-50">
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