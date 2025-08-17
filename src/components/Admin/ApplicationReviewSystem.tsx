import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Eye, 
  Filter,
  RefreshCw,
  Download,
  Search,
  MessageSquare
} from 'lucide-react';
import AIApplicationService, { 
  ApplicationReview, 
  ApplicationStats,
  PlatformRequirement 
} from '../../services/aiApplicationService';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';

const ApplicationReviewSystem: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationReview[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [platformRequirements, setPlatformRequirements] = useState<PlatformRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationReview | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'flagged' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [filterStatus]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadApplications(),
        loadStats(),
        loadPlatformRequirements()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Error loading application data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const status = filterStatus === 'all' ? undefined : filterStatus;
      const data = await AIApplicationService.getApplicationsForReview(status as any);
      setApplications(data);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await AIApplicationService.getApplicationStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPlatformRequirements = async () => {
    try {
      const data = await AIApplicationService.getPlatformRequirements();
      setPlatformRequirements(data);
    } catch (error) {
      console.error('Error loading platform requirements:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadInitialData();
      showToast('Data refreshed successfully', 'success');
    } catch (error) {
      showToast('Error refreshing data', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAdminReview = async (
    applicationId: string, 
    decision: 'approved' | 'rejected', 
    reason?: string
  ) => {
    if (!user?.id) return;

    try {
      const result = await AIApplicationService.processAdminReview(
        applicationId, 
        user.id, 
        decision, 
        reason
      );

      if (result.success) {
        await loadApplications();
        await loadStats();
        setSelectedApplication(null);
        setReviewMode(false);
      }
    } catch (error) {
      showToast('Error processing review', 'error');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'flagged':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'flagged':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformRequirement = (platform: string): number => {
    const requirement = platformRequirements.find(req => req.platformName === platform);
    return requirement?.minFollowers || 1000;
  };

  const getComplianceStatus = (followers: number, required: number) => {
    if (followers >= required) return { status: 'compliant', color: 'text-green-600' };
    if (followers >= required * 0.8) return { status: 'close', color: 'text-yellow-600' };
    return { status: 'non-compliant', color: 'text-red-600' };
  };

  const filteredApplications = applications.filter(app => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        app.userEmail?.toLowerCase().includes(searchLower) ||
        app.applicationData.personalInfo.fullName.toLowerCase().includes(searchLower) ||
        app.id.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Application Review System</h2>
          <p className="text-gray-600">AI-powered agent application review and management</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
              </div>
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.aiApproved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Flagged for Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.aiFlagged}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average AI Score</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.averageAiScore.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Filter className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'flagged', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Decision
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {application.applicationData.personalInfo.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {application.applicationData.personalInfo.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.userEmail}
                        </div>
                        {application.isReapplication && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Reapplication
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {application.aiScore?.toFixed(1) || 0}%
                      </div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${application.aiScore || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.aiDecision)}`}>
                      {getStatusIcon(application.aiDecision)}
                      <span className="ml-1">{application.aiDecision}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.adminStatus)}`}>
                      {getStatusIcon(application.adminStatus)}
                      <span className="ml-1">{application.adminStatus}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(application.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      {(application.adminStatus === 'pending' || application.aiDecision === 'flagged') && (
                        <button
                          onClick={() => {
                            setSelectedApplication(application);
                            setReviewMode(true);
                          }}
                          className="text-green-600 hover:text-green-900 flex items-center gap-1"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Review
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No applications match the current filter.'}
            </p>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Application Review - {selectedApplication.applicationData.personalInfo.fullName}
              </h3>
              <button
                onClick={() => {
                  setSelectedApplication(null);
                  setReviewMode(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Personal Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><span className="font-medium">Name:</span> {selectedApplication.applicationData.personalInfo.fullName}</p>
                    <p><span className="font-medium">Email:</span> {selectedApplication.applicationData.personalInfo.email}</p>
                    <p><span className="font-medium">Phone:</span> {selectedApplication.applicationData.personalInfo.phone}</p>
                    <p><span className="font-medium">Country:</span> {selectedApplication.applicationData.personalInfo.country}</p>
                    <p><span className="font-medium">Language:</span> {selectedApplication.applicationData.personalInfo.preferredLanguage}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Motivation</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><span className="font-medium">Experience:</span> {selectedApplication.applicationData.motivation.experience}</p>
                    <p><span className="font-medium">Reason:</span> {selectedApplication.applicationData.motivation.reason}</p>
                    <p><span className="font-medium">Goals:</span> {selectedApplication.applicationData.motivation.goals}</p>
                  </div>
                </div>

                {/* AI Analysis */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">AI Analysis</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><span className="font-medium">Score:</span> {selectedApplication.aiScore?.toFixed(1) || 0}%</p>
                    <p><span className="font-medium">Decision:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-sm ${getStatusColor(selectedApplication.aiDecision)}`}>
                        {selectedApplication.aiDecision}
                      </span>
                    </p>
                    <p><span className="font-medium">Reason:</span> {selectedApplication.aiDecisionReason}</p>
                  </div>
                </div>
              </div>

              {/* Social Media Profiles */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Social Media Profiles</h4>
                  <div className="space-y-3">
                    {Object.entries(selectedApplication.applicationData.socialMediaProfiles).map(([platform, profile]) => {
                      const required = getPlatformRequirement(platform);
                      const compliance = getComplianceStatus(profile.followers, required);
                      
                      return (
                        <div key={platform} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-medium text-gray-900 capitalize">{platform}</h5>
                              <p className="text-sm text-gray-600">@{profile.username}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${compliance.color}`}>
                              {compliance.status}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="font-medium">Followers:</span> 
                              <span className={compliance.color}> {profile.followers.toLocaleString()}</span>
                              <span className="text-gray-500"> / {required.toLocaleString()} required</span>
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">URL:</span> 
                              <a href={profile.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 ml-1">
                                {profile.url}
                              </a>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Admin Review Actions */}
                {reviewMode && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Admin Review</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Review Reason (Optional)
                        </label>
                        <textarea
                          id="reviewReason"
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Enter reason for your decision..."
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            const reason = (document.getElementById('reviewReason') as HTMLTextAreaElement)?.value;
                            handleAdminReview(selectedApplication.id, 'approved', reason);
                          }}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = (document.getElementById('reviewReason') as HTMLTextAreaElement)?.value;
                            handleAdminReview(selectedApplication.id, 'rejected', reason);
                          }}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationReviewSystem;
