
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { User, Edit, Camera, Save, X, Plus, ExternalLink, CheckCircle, Instagram, Youtube, Twitter, Facebook, Linkedin, MessageCircle, Crown, Star, Trophy, Award, TrendingUp, Users, DollarSign } from 'lucide-react';
import SmartLinkInput from './SmartLinkInput';
import { PlatformDetection } from '../../utils/linkDetection';

interface SocialAccount {
  id: string;
  platform: string;
  platformName: string;
  username: string;
  url: string;
  followerCount: number;
  isVerified: boolean;
  addedAt: Date;
}

const AgentProfile: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [showAddSocial, setShowAddSocial] = useState(false);
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<(PlatformDetection & { followerCount?: number }) | null>(null);
  
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || 'Elite Agent',
    bio: 'Elite Agent specializing in global network expansion and high-conversion referral strategies. Achieved Gold Agent status through exceptional performance and dedication.',
    location: 'Global Operations',
    website: 'https://earnpro.com/agent/profile',
    phone: '+1 (555) 123-4567',
    email: user?.email || 'agent@earnpro.com',
    specialization: 'Network Growth & Conversion Optimization',
    languages: ['English', 'Spanish', 'French'],
    timezone: 'UTC-5 (EST)',
    experience: '2+ years in digital marketing'
  });

  const [agentAchievements] = useState([
    {
      id: 1,
      title: 'Gold Agent Status',
      description: 'Achieved 1000+ referrals milestone',
      icon: Crown,
      color: 'text-yellow-400',
      date: '2024-02-15'
    },
    {
      id: 2,
      title: 'Top Performer',
      description: 'Top 5% of all agents globally',
      icon: Trophy,
      color: 'text-purple-400',
      date: '2024-01-20'
    },
    {
      id: 3,
      title: 'Network Builder',
      description: 'Built network of 2500+ active members',
      icon: Users,
      color: 'text-blue-400',
      date: '2024-01-10'
    },
    {
      id: 4,
      title: 'High Converter',
      description: 'Maintained 75%+ conversion rate',
      icon: TrendingUp,
      color: 'text-green-400',
      date: '2024-01-05'
    }
  ]);

  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([
    {
      id: '1',
      platform: 'telegram',
      platformName: 'Telegram',
      username: 'earnpro_agent',
      url: 'https://t.me/earnpro_agent',
      followerCount: 25750,
      isVerified: true,
      addedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      platform: 'instagram',
      platformName: 'Instagram',
      username: 'earnpro_official',
      url: 'https://instagram.com/earnpro_official',
      followerCount: 45000,
      isVerified: true,
      addedAt: new Date('2024-01-10')
    },
    {
      id: '3',
      platform: 'youtube',
      platformName: 'YouTube',
      username: 'EarnProChannel',
      url: 'https://youtube.com/@EarnProChannel',
      followerCount: 89000,
      isVerified: true,
      addedAt: new Date('2024-01-08')
    }
  ]);

  const [performanceStats] = useState({
    totalEarnings: 15847.89,
    monthlyGrowth: 23.5,
    networkSize: 2847,
    conversionRate: 78.5
  });

  const getIcon = (platform: string) => {
    const icons: { [key: string]: React.ComponentType<any> } = {
      instagram: Instagram,
      youtube: Youtube,
      twitter: Twitter,
      facebook: Facebook,
      linkedin: Linkedin,
      telegram: MessageCircle
    };
    return icons[platform] || MessageCircle;
  };

  const handleSaveProfile = () => {
    // Save profile data logic here
    setIsEditing(false);
  };

  const handlePlatformDetected = (detection: PlatformDetection & { followerCount?: number }) => {
    setDetectedPlatform(detection);
  };

  const handleAddSocialAccount = () => {
    if (!detectedPlatform || !detectedPlatform.isValid) return;

    const newAccount: SocialAccount = {
      id: Date.now().toString(),
      platform: detectedPlatform.platform,
      platformName: detectedPlatform.platformName,
      username: detectedPlatform.username || '',
      url: newSocialUrl,
      followerCount: detectedPlatform.followerCount || 0,
      isVerified: detectedPlatform.followerCount ? detectedPlatform.followerCount > 10000 : false,
      addedAt: new Date()
    };

    setSocialAccounts(prev => [...prev, newAccount]);
    setShowAddSocial(false);
    setNewSocialUrl('');
    setDetectedPlatform(null);
  };

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20';

  const inputClass = theme === 'professional'
    ? 'w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500'
    : 'w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center">
          <User className="w-8 h-8 mr-3 text-blue-400" />
          Elite Agent Profile
          <span className="ml-3 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-full text-sm font-bold">
            Gold Status
          </span>
        </h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 ${theme === 'professional' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-lg transition-all duration-200 flex items-center space-x-2`}
        >
          {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enhanced Profile Card */}
        <div className={`${cardClass} p-6`}>
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 animate-pulse"></div>
                {user?.fullName?.split(' ').map(n => n[0]).join('') || 'AG'}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              {isEditing && (
                <button className="absolute bottom-4 right-4 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                  <Camera className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {isEditing ? (
              <input
                type="text"
                value={profileData.fullName}
                onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                className={inputClass}
                placeholder="Full Name"
              />
            ) : (
              <h4 className="text-2xl font-bold text-white mb-2">{profileData.fullName}</h4>
            )}
            
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-full text-sm font-bold flex items-center space-x-1">
                <Crown className="w-4 h-4" />
                <span>Gold Agent</span>
              </span>
              <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>Verified</span>
              </span>
            </div>

            {/* Agent Level Progress */}
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/70 text-sm">Progress to Platinum</span>
                <span className="text-white text-sm">57%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div className="w-3/5 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
              </div>
              <p className="text-white/60 text-xs mt-1">2,153 more referrals needed</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-white/70 text-sm">Bio</label>
              {isEditing ? (
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  className={`${inputClass} resize-none`}
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-white/80 text-sm mt-1">{profileData.bio}</p>
              )}
            </div>

            <div>
              <label className="text-white/70 text-sm">Specialization</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.specialization}
                  onChange={(e) => setProfileData(prev => ({ ...prev, specialization: e.target.value }))}
                  className={inputClass}
                  placeholder="Your specialization"
                />
              ) : (
                <p className="text-white text-sm mt-1">{profileData.specialization}</p>
              )}
            </div>

            <div>
              <label className="text-white/70 text-sm">Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                  className={inputClass}
                  placeholder="Location"
                />
              ) : (
                <p className="text-white text-sm mt-1">{profileData.location}</p>
              )}
            </div>

            {isEditing && (
              <button
                onClick={handleSaveProfile}
                className={`w-full ${theme === 'professional' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-purple-600 hover:bg-purple-700'} text-white py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2`}
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            )}
          </div>
        </div>

        {/* Performance Dashboard */}
        <div className={`${cardClass} p-6`}>
          <h5 className="text-white font-bold mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Performance Dashboard
          </h5>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-300">${performanceStats.totalEarnings.toLocaleString()}</div>
              <div className="text-white/60 text-sm">Total Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-300">+{performanceStats.monthlyGrowth}%</div>
              <div className="text-white/60 text-sm">Monthly Growth</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-300">{performanceStats.networkSize.toLocaleString()}</div>
              <div className="text-white/60 text-sm">Network Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-300">{performanceStats.conversionRate}%</div>
              <div className="text-white/60 text-sm">Conversion Rate</div>
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="space-y-3">
            <h6 className="text-white/70 text-sm mb-3">Recent Achievements</h6>
            {agentAchievements.slice(0, 3).map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div key={achievement.id} className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-3 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}>
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${achievement.color}`} />
                    <div className="flex-1">
                      <h6 className="text-white font-medium text-sm">{achievement.title}</h6>
                      <p className="text-white/60 text-xs">{achievement.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Social Media Accounts */}
        <div className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between mb-6">
            <h5 className="text-white font-bold flex items-center">
              <Star className="w-5 h-5 mr-2" />
              Social Media Presence
            </h5>
            <button
              onClick={() => setShowAddSocial(true)}
              className={`px-3 py-1 ${theme === 'professional' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-lg transition-all duration-200 flex items-center space-x-1 text-sm`}
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-3">
            {socialAccounts.map((account) => {
              const Icon = getIcon(account.platform);
              return (
                <div key={account.id} className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-6 h-6 ${theme === 'professional' ? 'text-cyan-300' : 'text-purple-300'}`} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{account.platformName}</span>
                          {account.isVerified && <CheckCircle className="w-4 h-4 text-green-400" />}
                        </div>
                        <p className="text-white/70 text-sm">@{account.username}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-green-300 text-sm font-bold">
                            {account.followerCount.toLocaleString()} followers
                          </span>
                          <span className="text-white/50 text-xs">
                            Added {account.addedAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => window.open(account.url, '_blank')}
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-white">
                  {socialAccounts.reduce((sum, acc) => sum + acc.followerCount, 0).toLocaleString()}
                </div>
                <div className="text-white/60 text-sm">Total Reach</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{socialAccounts.length}</div>
                <div className="text-white/60 text-sm">Platforms</div>
              </div>
            </div>
          </div>

          {/* Add Social Account Modal */}
          {showAddSocial && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className={`${theme === 'professional' ? 'bg-gray-800/90' : 'bg-white/10'} backdrop-blur-lg rounded-2xl p-6 border ${theme === 'professional' ? 'border-gray-700/50' : 'border-white/20'} max-w-2xl w-full`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Add Social Media Account</h3>
                  <button
                    onClick={() => {
                      setShowAddSocial(false);
                      setNewSocialUrl('');
                      setDetectedPlatform(null);
                    }}
                    className="text-white/70 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">
                      Social Media URL *
                    </label>
                    <SmartLinkInput
                      value={newSocialUrl}
                      onChange={setNewSocialUrl}
                      onPlatformDetected={handlePlatformDetected}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowAddSocial(false);
                        setNewSocialUrl('');
                        setDetectedPlatform(null);
                      }}
                      className={`flex-1 ${theme === 'professional' ? 'bg-gray-700/50 hover:bg-gray-600/60' : 'bg-white/10 hover:bg-white/20'} text-white py-3 rounded-lg transition-all duration-200 border ${theme === 'professional' ? 'border-gray-600/50' : 'border-white/20'}`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddSocialAccount}
                      disabled={!detectedPlatform?.isValid}
                      className={`flex-1 ${theme === 'professional' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-purple-600 hover:bg-purple-700'} text-white py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Add Account
                    </button>
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

export default AgentProfile;
