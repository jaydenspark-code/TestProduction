import React, { useState, useEffect } from 'react';
import { 
  User, 
  Globe, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Users, 
  Plus, 
  Trash2,
  ExternalLink,
  Brain,
  Zap
} from 'lucide-react';
import AIApplicationService, { 
  ApplicationData, 
  SocialMediaProfile, 
  PlatformRequirement 
} from '../../services/aiApplicationService';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toast';
import { useNavigate } from 'react-router-dom';

const AgentApplicationForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [platformRequirements, setPlatformRequirements] = useState<PlatformRequirement[]>([]);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [complianceScore, setComplianceScore] = useState<{ score: number; details: any } | null>(null);

  // Form state
  const [formData, setFormData] = useState<ApplicationData>({
    personalInfo: {
      fullName: '',
      email: user?.email || '',
      phone: '',
      country: '',
      preferredLanguage: 'English'
    },
    motivation: {
      experience: '',
      reason: '',
      goals: ''
    },
    socialMediaProfiles: {}
  });

  useEffect(() => {
    loadRequirements();
    checkExistingApplication();
  }, [user]);

  useEffect(() => {
    if (Object.keys(formData.socialMediaProfiles).length > 0) {
      calculateCompliance();
    }
  }, [formData.socialMediaProfiles]);

  const loadRequirements = async () => {
    try {
      const requirements = await AIApplicationService.getPlatformRequirements();
      setPlatformRequirements(requirements);
    } catch (error) {
      console.error('Error loading requirements:', error);
    }
  };

  const checkExistingApplication = async () => {
    if (!user?.id) return;
    
    try {
      const application = await AIApplicationService.getUserApplicationStatus(user.id);
      setExistingApplication(application);
    } catch (error) {
      console.error('Error checking existing application:', error);
    }
  };

  const calculateCompliance = async () => {
    try {
      const result = await AIApplicationService.calculateComplianceScore(formData.socialMediaProfiles);
      setComplianceScore(result);
    } catch (error) {
      console.error('Error calculating compliance:', error);
    }
  };

  const addSocialMediaProfile = () => {
    const platformName = 'instagram'; // Default platform
    const profileKey = `platform_${Date.now()}`;
    
    setFormData(prev => ({
      ...prev,
      socialMediaProfiles: {
        ...prev.socialMediaProfiles,
        [profileKey]: {
          platform: platformName,
          username: '',
          followers: 0,
          url: '',
          verified: false
        }
      }
    }));
  };

  const updateSocialMediaProfile = (key: string, profile: Partial<SocialMediaProfile>) => {
    setFormData(prev => ({
      ...prev,
      socialMediaProfiles: {
        ...prev.socialMediaProfiles,
        [key]: {
          ...prev.socialMediaProfiles[key],
          ...profile
        }
      }
    }));
  };

  const removeSocialMediaProfile = (key: string) => {
    setFormData(prev => {
      const newProfiles = { ...prev.socialMediaProfiles };
      delete newProfiles[key];
      return {
        ...prev,
        socialMediaProfiles: newProfiles
      };
    });
  };

  const getPlatformRequirement = (platform: string): number => {
    const requirement = platformRequirements.find(req => req.platformName === platform);
    return requirement?.minFollowers || 1000;
  };

  const getComplianceStatus = (platform: string, followers: number) => {
    const required = getPlatformRequirement(platform);
    if (followers >= required) return { status: 'compliant', color: 'text-green-600', bg: 'bg-green-100' };
    if (followers >= required * 0.8) return { status: 'close', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'non-compliant', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      // Validate form
      if (!formData.personalInfo.fullName || !formData.personalInfo.phone || !formData.personalInfo.country) {
        showToast('Please fill in all personal information fields', 'error');
        return;
      }

      if (!formData.motivation.experience || !formData.motivation.reason || !formData.motivation.goals) {
        showToast('Please fill in all motivation fields', 'error');
        return;
      }

      if (Object.keys(formData.socialMediaProfiles).length === 0) {
        showToast('Please add at least one social media profile', 'error');
        return;
      }

      // Validate social media profiles
      for (const [key, profile] of Object.entries(formData.socialMediaProfiles)) {
        const errors = AIApplicationService.validateSocialMediaProfile(profile);
        if (errors.length > 0) {
          showToast(`Social media profile error: ${errors[0]}`, 'error');
          return;
        }
      }

      // Submit application
      const result = existingApplication?.finalStatus === 'rejected' 
        ? await AIApplicationService.reapplyApplication(user.id, formData, existingApplication.id)
        : await AIApplicationService.submitApplication(user.id, formData);

      if (result.success) {
        showToast('Application submitted successfully!', 'success');
        navigate('/dashboard');
      } else {
        showToast(result.error || 'Failed to submit application', 'error');
      }

    } catch (error) {
      console.error('Error submitting application:', error);
      showToast('Failed to submit application', 'error');
    } finally {
      setLoading(false);
    }
  };

  // If user already has pending/approved application
  if (existingApplication) {
    const canReapply = existingApplication.finalStatus === 'rejected';
    
    if (!canReapply) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="text-center">
                  <div className="mb-6">
                    {existingApplication.finalStatus === 'approved' ? (
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                    ) : (
                      <Brain className="w-16 h-16 text-blue-400 mx-auto" />
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-4">
                    {existingApplication.finalStatus === 'approved' 
                      ? 'Application Approved!' 
                      : 'Application Under Review'}
                  </h1>
                  <p className="text-white/70 mb-6">
                    {existingApplication.finalStatus === 'approved'
                      ? 'Your agent application has been approved. You can now access the agent dashboard.'
                      : 'Your application is being reviewed by our AI system and admin team. We\'ll notify you once a decision is made.'}
                  </p>
                  <div className="bg-white/5 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">AI Score:</span>
                      <span className="text-blue-300 font-medium">{existingApplication.aiScore?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-white/70">Status:</span>
                      <span className={`font-medium ${
                        existingApplication.finalStatus === 'approved' ? 'text-green-400' :
                        existingApplication.finalStatus === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {existingApplication.finalStatus.charAt(0).toUpperCase() + existingApplication.finalStatus.slice(1)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {existingApplication?.finalStatus === 'rejected' ? 'Reapply as Agent' : 'Apply to Become an Agent'}
            </h1>
            <p className="text-white/70">
              Join our platform and start earning through social media promotion
            </p>
            {existingApplication?.finalStatus === 'rejected' && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mt-4">
                <p className="text-red-300">
                  Your previous application was rejected. Please review the requirements and submit an improved application.
                </p>
                {existingApplication.adminReviewReason && (
                  <p className="text-red-200 text-sm mt-2">
                    <strong>Reason:</strong> {existingApplication.adminReviewReason}
                  </p>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Personal Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.personalInfo.fullName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, fullName: e.target.value }
                    }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.personalInfo.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, email: e.target.value }
                    }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.personalInfo.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, phone: e.target.value }
                    }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.personalInfo.country}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, country: e.target.value }
                    }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your country"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Preferred Language
                  </label>
                  <select
                    value={formData.personalInfo.preferredLanguage}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, preferredLanguage: e.target.value }
                    }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Portuguese">Portuguese</option>
                    <option value="Russian">Russian</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Korean">Korean</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Social Media Profiles */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-green-400" />
                  <h2 className="text-xl font-bold text-white">Social Media Profiles</h2>
                </div>
                <button
                  type="button"
                  onClick={addSocialMediaProfile}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Platform
                </button>
              </div>

              {/* Platform Requirements */}
              <div className="mb-6 bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-blue-300 font-medium mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Platform Requirements
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                  {platformRequirements.map(req => (
                    <div key={req.platformName} className="text-white/70">
                      <span className="font-medium capitalize">{req.platformName}:</span> {req.minFollowers.toLocaleString()}+
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Media Profile Forms */}
              <div className="space-y-4">
                {Object.entries(formData.socialMediaProfiles).map(([key, profile]) => {
                  const compliance = getComplianceStatus(profile.platform, profile.followers);
                  const required = getPlatformRequirement(profile.platform);
                  
                  return (
                    <div key={key} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-white font-medium">Social Media Profile</h4>
                        <button
                          type="button"
                          onClick={() => removeSocialMediaProfile(key)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white/70 text-sm font-medium mb-2">
                            Platform *
                          </label>
                          <select
                            value={profile.platform}
                            onChange={(e) => updateSocialMediaProfile(key, { platform: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="instagram">Instagram</option>
                            <option value="youtube">YouTube</option>
                            <option value="tiktok">TikTok</option>
                            <option value="twitter">Twitter/X</option>
                            <option value="facebook">Facebook</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="telegram">Telegram</option>
                            <option value="snapchat">Snapchat</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="twitch">Twitch</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-white/70 text-sm font-medium mb-2">
                            Username *
                          </label>
                          <input
                            type="text"
                            required
                            value={profile.username}
                            onChange={(e) => updateSocialMediaProfile(key, { username: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="@username"
                          />
                        </div>

                        <div>
                          <label className="block text-white/70 text-sm font-medium mb-2">
                            Followers/Subscribers *
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={profile.followers}
                            onChange={(e) => updateSocialMediaProfile(key, { followers: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Number of followers"
                          />
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-white/50 text-xs">Required: {required.toLocaleString()}+</span>
                            <span className={`text-xs px-2 py-1 rounded ${compliance.bg} ${compliance.color}`}>
                              {compliance.status === 'compliant' ? '✓ Meets requirements' :
                               compliance.status === 'close' ? '⚠ Close to requirements' :
                               '✗ Below requirements'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-white/70 text-sm font-medium mb-2">
                            Profile URL *
                          </label>
                          <input
                            type="url"
                            required
                            value={profile.url}
                            onChange={(e) => updateSocialMediaProfile(key, { url: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {Object.keys(formData.socialMediaProfiles).length === 0 && (
                  <div className="text-center py-8 text-white/50">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No social media profiles added yet.</p>
                    <p className="text-sm">Click "Add Platform" to start.</p>
                  </div>
                )}
              </div>

              {/* Compliance Score */}
              {complianceScore && Object.keys(formData.socialMediaProfiles).length > 0 && (
                <div className="mt-6 bg-indigo-500/20 border border-indigo-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-indigo-300 font-medium">AI Compliance Score</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white/70">Overall Score</span>
                        <span className={`font-bold ${
                          complianceScore.score >= 90 ? 'text-green-400' :
                          complianceScore.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {complianceScore.score.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            complianceScore.score >= 90 ? 'bg-green-400' :
                            complianceScore.score >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${complianceScore.score}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded ${
                        complianceScore.score >= 90 ? 'bg-green-600/20 text-green-300' :
                        complianceScore.score >= 60 ? 'bg-yellow-600/20 text-yellow-300' :
                        'bg-red-600/20 text-red-300'
                      }`}>
                        {complianceScore.score >= 90 ? 'Auto-Approve' :
                         complianceScore.score >= 60 ? 'Admin Review' : 'Likely Rejection'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Motivation */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Motivation & Experience</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Social Media Experience *
                  </label>
                  <textarea
                    required
                    value={formData.motivation.experience}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      motivation: { ...prev.motivation, experience: e.target.value }
                    }))}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Describe your experience with social media marketing, content creation, and audience engagement..."
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Why do you want to become an agent? *
                  </label>
                  <textarea
                    required
                    value={formData.motivation.reason}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      motivation: { ...prev.motivation, reason: e.target.value }
                    }))}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Explain your motivation for joining our platform and promoting campaigns..."
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Goals & Expectations *
                  </label>
                  <textarea
                    required
                    value={formData.motivation.goals}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      motivation: { ...prev.motivation, goals: e.target.value }
                    }))}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="What are your goals as an agent? What do you hope to achieve?"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={loading || Object.keys(formData.socialMediaProfiles).length === 0}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    {existingApplication?.finalStatus === 'rejected' ? 'Resubmit Application' : 'Submit Application'}
                  </>
                )}
              </button>
              <p className="text-white/50 text-sm mt-4">
                Your application will be reviewed by our AI system and admin team
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AgentApplicationForm;
