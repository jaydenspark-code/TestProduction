import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { leaderboardService } from '../../services/leaderboardService';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Users, 
  Trophy, 
  BarChart3, 
  Activity, 
  Globe,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface PrivacySettings {
  showPublicProfile: boolean;
  showNetworkOverview: boolean;
  showAchievements: boolean;
  showRankHistory: boolean;
  showActivity: boolean;
  leaderboardOptIn: {
    regular: boolean;
    agent: boolean;
  };
  showTotalEarnings: boolean;
  showReferralCount: boolean;
  showCountry: boolean;
  showJoinDate: boolean;
}

const PrivacySettings: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [settings, setSettings] = useState<PrivacySettings>({
    showPublicProfile: true,
    showNetworkOverview: true,
    showAchievements: true,
    showRankHistory: true,
    showActivity: false,
    leaderboardOptIn: {
      regular: true,
      agent: true
    },
    showTotalEarnings: true,
    showReferralCount: true,
    showCountry: true,
    showJoinDate: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Theme-based styling
  const isClassic = theme === 'classic';
  const accentColor = isClassic ? 'text-purple-400' : 'text-cyan-400';
  const accentBg = isClassic ? 'bg-purple-500' : 'bg-cyan-500';
  const accentBorder = isClassic ? 'border-purple-500' : 'border-cyan-500';
  const cardBg = isClassic 
    ? 'bg-white/10 backdrop-blur-lg border-white/20' 
    : 'bg-gray-800/50 backdrop-blur-lg border-gray-700/50';
  const buttonBg = isClassic
    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700';

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load leaderboard opt-in status
      const [regularRanking, agentRanking] = await Promise.all([
        leaderboardService.getUserRanking(user.id, 'regular'),
        user.isAgent ? leaderboardService.getUserRanking(user.id, 'agent') : null
      ]);

      // Load other privacy settings (would come from API in real app)
      // For now, using defaults with some randomization for demo
      setSettings(prev => ({
        ...prev,
        leaderboardOptIn: {
          regular: regularRanking?.optIn ?? true,
          agent: agentRanking?.optIn ?? true
        },
        showPublicProfile: Math.random() > 0.1, // 90% show profile
        showNetworkOverview: Math.random() > 0.3, // 70% show network
        showAchievements: Math.random() > 0.2, // 80% show achievements
        showRankHistory: Math.random() > 0.4, // 60% show history
        showActivity: Math.random() > 0.6, // 40% show activity
      }));
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof PrivacySettings | string) => {
    if (key === 'leaderboardOptIn.regular' || key === 'leaderboardOptIn.agent') {
      const [parent, child] = key.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof PrivacySettings] as any,
          [child]: !((prev[parent as keyof PrivacySettings] as any)[child])
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [key]: !prev[key as keyof PrivacySettings]
      }));
    }
  };

  const handleSave = async () => {
    if (!user || saving) return;

    try {
      setSaving(true);
      setSaveStatus('idle');

      // Save leaderboard settings
      await Promise.all([
        leaderboardService.updateOptInStatus(user.id, 'regular', settings.leaderboardOptIn.regular),
        user.isAgent ? leaderboardService.updateOptInStatus(user.id, 'agent', settings.leaderboardOptIn.agent) : Promise.resolve()
      ]);

      // In a real app, you would save other settings to the database
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isClassic ? 'border-purple-500' : 'border-cyan-500'}`} />
        <span className="ml-3 text-gray-400">Loading privacy settings...</span>
      </div>
    );
  }

  const privacyOptions = [
    {
      key: 'showPublicProfile',
      icon: Globe,
      title: 'Public Profile',
      description: 'Allow others to view your profile information',
      value: settings.showPublicProfile
    },
    {
      key: 'showNetworkOverview',
      icon: Users,
      title: 'Network Overview',
      description: 'Show your referral network statistics',
      value: settings.showNetworkOverview
    },
    {
      key: 'showAchievements',
      icon: Trophy,
      title: 'Achievements',
      description: 'Display your earned achievements and badges',
      value: settings.showAchievements
    },
    {
      key: 'showRankHistory',
      icon: BarChart3,
      title: 'Rank History',
      description: 'Show your ranking progression over time',
      value: settings.showRankHistory
    },
    {
      key: 'showActivity',
      icon: Activity,
      title: 'Recent Activity',
      description: 'Show your recent actions and completed tasks',
      value: settings.showActivity
    }
  ];

  const leaderboardOptions = [
    {
      key: 'showTotalEarnings',
      title: 'Total Earnings',
      description: 'Show your earnings amount on leaderboard',
      value: settings.showTotalEarnings
    },
    {
      key: 'showReferralCount',
      title: 'Referral Count',
      description: 'Display number of successful referrals',
      value: settings.showReferralCount
    },
    {
      key: 'showCountry',
      title: 'Country',
      description: 'Show your country flag and location',
      value: settings.showCountry
    },
    {
      key: 'showJoinDate',
      title: 'Join Date',
      description: 'Display when you joined the platform',
      value: settings.showJoinDate
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold text-white`}>Privacy Settings</h2>
          <p className="text-gray-400 mt-1">Control what information others can see</p>
        </div>
        <Shield className={`w-8 h-8 ${accentColor}`} />
      </div>

      {/* Leaderboard Participation */}
      <div className={`${cardBg} rounded-xl p-6 border`}>
        <div className="flex items-center space-x-3 mb-4">
          <Trophy className={`w-6 h-6 ${accentColor}`} />
          <h3 className="text-lg font-semibold text-white">Leaderboard Participation</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Regular User Leaderboard</h4>
              <p className="text-gray-400 text-sm">Appear in the main leaderboard rankings</p>
            </div>
            <button
              onClick={() => handleToggle('leaderboardOptIn.regular')}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                settings.leaderboardOptIn.regular ? accentBg : 'bg-gray-600'
              } ${isClassic ? 'focus:ring-purple-500' : 'focus:ring-cyan-500'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.leaderboardOptIn.regular ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {user?.isAgent && (
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Agent Leaderboard</h4>
                <p className="text-gray-400 text-sm">Appear in the agent-specific rankings</p>
              </div>
              <button
                onClick={() => handleToggle('leaderboardOptIn.agent')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  settings.leaderboardOptIn.agent ? accentBg : 'bg-gray-600'
                } ${isClassic ? 'focus:ring-purple-500' : 'focus:ring-cyan-500'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.leaderboardOptIn.agent ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Visibility */}
      <div className={`${cardBg} rounded-xl p-6 border`}>
        <div className="flex items-center space-x-3 mb-4">
          <Eye className={`w-6 h-6 ${accentColor}`} />
          <h3 className="text-lg font-semibold text-white">Profile Visibility</h3>
        </div>
        
        <div className="space-y-4">
          {privacyOptions.map((option) => {
            const Icon = option.icon;
            return (
              <div key={option.key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${accentColor}`} />
                  <div>
                    <h4 className="text-white font-medium">{option.title}</h4>
                    <p className="text-gray-400 text-sm">{option.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(option.key)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    option.value ? accentBg : 'bg-gray-600'
                  } ${isClassic ? 'focus:ring-purple-500' : 'focus:ring-cyan-500'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      option.value ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Information Display */}
      <div className={`${cardBg} rounded-xl p-6 border`}>
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className={`w-6 h-6 ${accentColor}`} />
          <h3 className="text-lg font-semibold text-white">Leaderboard Information</h3>
        </div>
        
        <div className="space-y-4">
          {leaderboardOptions.map((option) => (
            <div key={option.key} className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">{option.title}</h4>
                <p className="text-gray-400 text-sm">{option.description}</p>
              </div>
              <button
                onClick={() => handleToggle(option.key)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  option.value ? accentBg : 'bg-gray-600'
                } ${isClassic ? 'focus:ring-purple-500' : 'focus:ring-cyan-500'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    option.value ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Notice */}
      <div className={`${isClassic ? 'bg-blue-500/10 border-blue-500/30' : 'bg-cyan-500/10 border-cyan-500/30'} rounded-xl p-4 border`}>
        <div className="flex items-start space-x-3">
          <Shield className={`w-5 h-5 ${accentColor} flex-shrink-0 mt-0.5`} />
          <div>
            <h4 className={`text-white font-medium mb-1`}>Privacy Protection</h4>
            <p className="text-gray-300 text-sm">
              Your privacy is important to us. These settings give you full control over what information 
              is visible to other users. You can change these settings at any time, and your current 
              ranking and progress will always remain visible to you regardless of these privacy settings.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center space-x-2">
          {saveStatus === 'success' && (
            <>
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 text-sm">Settings saved successfully!</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">Failed to save settings. Please try again.</span>
            </>
          )}
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg ${buttonBg} text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
};

export default PrivacySettings;
