import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Users, Instagram, Youtube, Twitter, Linkedin, Facebook, MessageCircle, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { SocialPlatform } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import SmartLinkInput from './SmartLinkInput';
import { LinkAnalysis } from '../../utils/linkDetection';
import { useAgentApplications } from '../../context/AgentApplicationContext';
import AgentDashboard from '../Dashboard/AgentDashboard';


const AgentApplication: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addApplication } = useAgentApplications();
  const [formData, setFormData] = useState({
    socialPlatform: '',
    channelLink: '',
    followerCount: '',
    additionalInfo: '',
    detectedPlatform: null as (LinkAnalysis & { followerCount?: number }) | null
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);

  if (user?.isAgent) {
    return <AgentDashboard />;
  }

  // Consistent color utilities based on theme
  const getThemeColors = () => {
    if (theme === 'professional') {
      return {
        background: 'bg-gradient-to-br from-gray-900 via-black to-gray-800',
        card: 'bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50',
        cardInner: 'bg-gray-700/30 rounded-lg p-4 border border-gray-600/30',
        buttonPrimary: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700',
        buttonSuccess: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700',
        buttonSecondary: 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800',
        textPrimary: 'text-white',
        textSecondary: 'text-white/70',
        textMuted: 'text-white/50',
        statusPending: 'text-amber-400',
        statusApproved: 'text-emerald-400',
        statusRejected: 'text-red-400',
        iconPrimary: 'text-cyan-300',
        iconSecondary: 'text-purple-300',
        inputBg: 'bg-gray-700/30 border-gray-600/30 focus:ring-cyan-500'
      };
    } else {
      return {
        background: 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900',
        card: 'bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20',
        cardInner: 'bg-white/5 rounded-lg p-4 border border-white/10',
        buttonPrimary: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700',
        buttonSuccess: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700',
        buttonSecondary: 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800',
        textPrimary: 'text-white',
        textSecondary: 'text-white/70',
        textMuted: 'text-white/50',
        statusPending: 'text-amber-400',
        statusApproved: 'text-emerald-400',
        statusRejected: 'text-red-400',
        iconPrimary: 'text-purple-300',
        iconSecondary: 'text-blue-300',
        inputBg: 'bg-white/5 border-white/20 focus:ring-purple-500'
      };
    }
  };

  const colors = getThemeColors();

  const socialPlatforms: SocialPlatform[] = [
    { id: 'youtube', name: 'YouTube', minFollowers: 5000, icon: 'Youtube' },
    { id: 'instagram', name: 'Instagram', minFollowers: 10000, icon: 'Instagram' },
    { id: 'tiktok', name: 'TikTok', minFollowers: 15000, icon: 'Users' },
    { id: 'twitter', name: 'Twitter/X', minFollowers: 8000, icon: 'Twitter' },
    { id: 'linkedin', name: 'LinkedIn', minFollowers: 3000, icon: 'Linkedin' },
    { id: 'facebook', name: 'Facebook', minFollowers: 12000, icon: 'Facebook' },
    { id: 'telegram', name: 'Telegram', minFollowers: 5000, icon: 'MessageCircle' },
    { id: 'snapchat', name: 'Snapchat', minFollowers: 8000, icon: 'Camera' }
  ];

  const getIcon = (iconName: string) => {
    const icons: { [key: string]: React.ComponentType<any> } = {
      Youtube,
      Instagram,
      Users,
      Twitter,
      Linkedin,
      Facebook,
      MessageCircle,
      Camera
    };
    return icons[iconName] || Users;
  };

  const handlePlatformDetected = (detection: LinkAnalysis & { followerCount?: number }) => {
    setFormData(prev => ({
      ...prev,
      detectedPlatform: detection,
      socialPlatform: detection.platform,
      followerCount: detection.followers?.toString() || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!user || !formData.detectedPlatform) {
      setLoading(false);
      return;
    }

    try {
      addApplication({
        userId: user.id,
        userEmail: user.email,
        userName: user.fullName,
        socialPlatform: formData.detectedPlatform.platform,
        platformName: formData.detectedPlatform.platform,
        username: formData.detectedPlatform.handle || '',
        channelLink: formData.channelLink,
        followerCount: formData.detectedPlatform.followers || 0,
        additionalInfo: formData.additionalInfo,
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Application submission failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const selectedPlatform = socialPlatforms.find(p => p.id === formData.socialPlatform);
  const meetsRequirements = formData.detectedPlatform?.followers &&
    selectedPlatform &&
    formData.detectedPlatform.followers >= selectedPlatform.minFollowers;

  // Show existing application status
  if (existingApplication && !submitted) {
    const statusColors = {
      pending: colors.statusPending,
      approved: colors.statusApproved,
      rejected: colors.statusRejected
    };

    const statusIcons = {
      pending: CheckCircle,
      approved: CheckCircle,
      rejected: AlertCircle
    };

    const StatusIcon = statusIcons[existingApplication.status as keyof typeof statusIcons];

    return (
      <div className={`min-h-screen ${colors.background} flex items-center justify-center p-4`}>
        <div className="w-full max-w-md">
          <div className={`${colors.card} shadow-2xl text-center`}>
            <StatusIcon className={`w-16 h-16 mx-auto mb-4 ${statusColors[existingApplication.status as keyof typeof statusColors]}`} />
            <h1 className={`text-3xl font-bold ${colors.textPrimary} mb-4`}>
              Application {existingApplication.status.charAt(0).toUpperCase() + existingApplication.status.slice(1)}
            </h1>
            <p className={`${colors.textSecondary} mb-6`}>
              {existingApplication.status === 'pending' && 'Your agent application is under review. We will notify you once it has been processed.'}
              {existingApplication.status === 'approved' && 'Congratulations! Your agent application has been approved. You now have access to all agent features.'}
              {existingApplication.status === 'rejected' && 'Unfortunately, your agent application was not approved at this time. You can reapply after addressing the feedback.'}
            </p>

            <div className={`${colors.cardInner} mb-6`}>
              <h4 className={`${colors.textPrimary} font-medium mb-2`}>Application Details</h4>
              <div className="text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={colors.textSecondary}>Platform:</span>
                  <span className={colors.textPrimary}>{existingApplication.platformName}</span>
                </div>
                <div className="flex justify-between">
                  <span className={colors.textSecondary}>Username:</span>
                  <span className={colors.textPrimary}>@{existingApplication.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className={colors.textSecondary}>Followers:</span>
                  <span className="text-emerald-300">{existingApplication.followerCount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className={colors.textSecondary}>Applied:</span>
                  <span className={colors.textPrimary}>{new Date(existingApplication.appliedAt).toLocaleDateString()}</span>
                </div>
                {existingApplication.notes && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <span className={`${colors.textSecondary} text-xs`}>Admin Notes:</span>
                    <div className={`${colors.textSecondary} text-sm mt-1`}>{existingApplication.notes}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {existingApplication.status === 'approved' ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`w-full ${colors.buttonSuccess} text-white py-3 rounded-lg font-medium transition-all duration-200`}
                >
                  Go to Agent Dashboard
                </button>
              ) : (
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`w-full ${colors.buttonPrimary} text-white py-3 rounded-lg font-medium transition-all duration-200`}
                >
                  Return to Dashboard
                </button>
              )}
              {existingApplication.status === 'rejected' && (
                <button
                  onClick={() => setExistingApplication(null)}
                  className={`w-full ${colors.buttonSecondary} text-white py-3 rounded-lg font-medium transition-all duration-200`}
                >
                  Apply Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={`min-h-screen ${colors.background} flex items-center justify-center p-4`}>
        <div className="w-full max-w-md">
          <div className={`${colors.card} shadow-2xl text-center`}>
            <CheckCircle className={`w-16 h-16 ${colors.textPrimary} mx-auto mb-4`} />
            <h1 className={`text-3xl font-bold ${colors.textPrimary} mb-4`}>Application Submitted!</h1>
            <p className={`${colors.textSecondary} mb-6`}>
              Thank you for applying to the EarnPro Agent Program. Our team will review your application and get back to you within 3-5 business days.
            </p>
            <div className={`${colors.cardInner} mb-6`}>
              <h4 className={`${colors.textPrimary} font-medium mb-2`}>Application Summary</h4>
              <div className="text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={colors.textSecondary}>Platform:</span>
                  <span className={colors.textPrimary}>{formData.detectedPlatform?.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className={colors.textSecondary}>Username:</span>
                  <span className={colors.textPrimary}>{formData.detectedPlatform?.handle}</span>
                </div>
                <div className="flex justify-between">
                  <span className={colors.textSecondary}>Followers:</span>
                  <span className="text-emerald-300">{formData.detectedPlatform?.followers?.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full ${colors.buttonPrimary} text-white py-3 rounded-lg font-medium transition-all duration-200`}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.background} py-8`}>
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Crown className={`w-16 h-16 ${colors.iconPrimary} mx-auto mb-4`} />
            <h1 className={`text-3xl font-bold ${colors.textPrimary} mb-2`}>Apply for Agent Program</h1>
            <p className={colors.textSecondary}>Join our exclusive influencer program and unlock premium earning opportunities</p>
          </div>

          <div className={`${colors.card} max-w-4xl mx-auto`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Smart Link Input */}
              <div>
                <label className={`block text-sm font-medium ${colors.textSecondary} mb-3`}>
                  Channel/Profile Link *
                </label>
                <SmartLinkInput
                  value={formData.channelLink}
                  onChange={(value) => setFormData(prev => ({ ...prev, channelLink: value }))}
                  onPlatformDetected={handlePlatformDetected}
                />
              </div>

              {/* Platform Selection (Auto-filled) */}
              {formData.detectedPlatform && (
                <div>
                  <label className={`block text-sm font-medium ${colors.textSecondary} mb-3`}>
                    Detected Platform
                  </label>
                  <div className={colors.cardInner}>
                    <div className="flex items-center space-x-3">
                      {(() => {
                        const Icon = getIcon(formData.detectedPlatform.platform);
                        return <Icon className={`w-6 h-6 ${colors.iconPrimary}`} />;
                      })()}
                      <div>
                        <div className={`${colors.textPrimary} font-medium`}>{formData.detectedPlatform.platform}</div>
                        <div className={`${colors.textSecondary} text-sm`}>{formData.detectedPlatform.handle}</div>
                        {formData.detectedPlatform.followers && (
                          <div className="text-emerald-300 text-sm">
                            {formData.detectedPlatform.followers.toLocaleString()} followers
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Requirements Check */}
              {selectedPlatform && formData.detectedPlatform?.followers && (
                <div className={colors.cardInner}>
                  <div className="flex items-center space-x-3">
                    {meetsRequirements ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                    )}
                    <div>
                      <div className={`${colors.textPrimary} font-medium`}>
                        {meetsRequirements ? 'Requirements Met!' : 'Requirements Check'}
                      </div>
                      <div className={`${colors.textSecondary} text-sm`}>
                        {meetsRequirements
                          ? `You have ${formData.detectedPlatform.followers?.toLocaleString()} followers, which meets the minimum requirement.`
                          : `You need at least ${selectedPlatform?.minFollowers.toLocaleString()} followers for ${selectedPlatform?.name}.`
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="additionalInfo" className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
                  Additional Information (Optional)
                </label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  rows={4}
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 ${colors.inputBg} rounded-lg ${colors.textPrimary} placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent resize-none`}
                  placeholder="Tell us about your content, audience, or why you'd be a great agent..."
                />
              </div>

              <div className={colors.cardInner}>
                <h4 className={`${colors.textPrimary} font-medium mb-2`}>Agent Program Benefits:</h4>
                <ul className={`${colors.textSecondary} text-sm space-y-1`}>
                  <li>• Progressive weekly commission rates (5-35%)</li>
                  <li>• Milestone bonuses and one-time rewards</li>
                  <li>• Increased withdrawal frequency (up to 3x per week)</li>
                  <li>• Exclusive marketing materials and support</li>
                  <li>• Priority customer service</li>
                  <li>• Advanced analytics and performance tracking</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading || !meetsRequirements || !formData.detectedPlatform}
                className={`w-full ${colors.buttonPrimary} text-white py-3 rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentApplication;
