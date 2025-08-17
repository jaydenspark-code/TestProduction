import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRealtime } from '../../hooks/useRealtime';
import { Users, TrendingUp, DollarSign, Gift, Copy, Share2, CheckCircle, QrCode, Calendar, Play, MessageCircle, Youtube, Wallet, Brain } from 'lucide-react';
import { ReferralStats } from '../../types';
import { DualCurrencyDisplay } from '../../utils/currency';
import QRCodeGenerator from '../QRCode/QRCodeGenerator';
import ReferralTemplate from './ReferralTemplate';
import { Link } from 'react-router-dom';
import { PersonalizedInsightsWidget } from '../AIWidgets/PersonalizedInsightsWidget';
import SmartMatchingWidget from '../AIWidgets/SmartMatchingWidget';
import AIPerformanceWidget from '../AIWidgets/AIPerformanceWidget';
import AdWidget from '../AIWidgets/AdWidget';
import PersonalizedDashboardLayout from '../AIPersonalization/PersonalizedDashboardLayout';
import EnhancedLeaderboardWidget from './EnhancedLeaderboardWidget';
import EnhancedEarningsBreakdown from './EnhancedEarningsBreakdown';
import { adDisplayService } from '../../services/adDisplayService';
import AdvertisingDemo from '../Demo/AdvertisingDemo';
import EnhancedReferralSystem from '../Referral/EnhancedReferralSystem';
import SocialMediaOnboarding from './SocialMediaOnboarding';
import { showToast } from '../../utils/toast';

const UserDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  
  // Listen for role update events
  const { events } = useRealtime({
    enableEvents: true,
    eventTypes: ['user_role_updated', 'achievement_unlocked']
  });
  
  const [stats] = useState<ReferralStats>({
    directReferrals: 12,
    indirectReferrals: 34,
    totalEarnings: 1247.50,
    pendingEarnings: 89.25,
    level2Earnings: 156.75,
    level3Earnings: 78.30,
    weeklyReferrals: 5,
    cumulativeReferrals: 46,
    currentWeekEarnings: 125.50,
    weeklyCommission: 0,
    withdrawalFrequency: 'once',
    taskEarnings: 45.75,
    completedTasks: 8
  });
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(true);
  const [showAdDemo, setShowAdDemo] = useState(false);
  const [adEarnings] = useState(47.85); // Mock ad earnings

  // Calculate total earnings including ads
  const totalEarningsWithAds = stats.totalEarnings + adEarnings;

  // Initialize advertising service
  useEffect(() => {
    const initializeAdvertising = async () => {
      try {
        // Mock campaigns - integrate with your existing campaign system
        const mockCampaigns = [
          {
            id: 'earnpro-tech-1',
            title: 'TechStart Pro - Premium Development Tools',
            description: 'Boost your coding productivity with our advanced development suite. Sign up for a free trial and earn rewards!',
            advertiser: {
              id: 'techstart-inc',
              name: 'TechStart Inc.',
              logo: '/images/advertisers/techstart.png'
            },
            targeting: {
              countries: ['United States', 'Canada', 'United Kingdom'],
              ageRange: [22, 45] as [number, number],
              interests: ['technology', 'programming', 'software'],
              languages: ['en']
            },
            budget: {
              total: 5000,
              spent: 1250,
              dailyLimit: 200
            },
            reward: {
              type: 'per_completion' as const,
              amount: 2.50
            },
            schedule: {
              startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              timezone: 'UTC'
            },
            metrics: {
              impressions: 15420,
              clicks: 847,
              conversions: 156,
              engagement: 5.8
            },
            status: 'active' as const,
            priority: 8,
            category: 'Technology',
            imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop',
            callToAction: 'Start Free Trial',
            requirements: [
              'Complete signup process',
              'Verify email address',
              'Complete profile setup'
            ],
            estimatedDuration: 5
          },
          {
            id: 'earnpro-fitness-1',
            title: 'FitLife Premium - Transform Your Health',
            description: 'Join thousands who achieved their fitness goals with personalized workout plans and nutrition guidance.',
            advertiser: {
              id: 'fitlife-premium',
              name: 'FitLife Premium',
              logo: '/images/advertisers/fitlife.png'
            },
            targeting: {
              countries: ['United States', 'Canada'],
              ageRange: [18, 55] as [number, number],
              interests: ['fitness', 'health', 'wellness'],
              languages: ['en']
            },
            budget: {
              total: 3500,
              spent: 890,
              dailyLimit: 150
            },
            reward: {
              type: 'per_click' as const,
              amount: 0.75
            },
            schedule: {
              startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
              endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
              timezone: 'UTC'
            },
            metrics: {
              impressions: 9840,
              clicks: 524,
              conversions: 89,
              engagement: 5.3
            },
            status: 'active' as const,
            priority: 6,
            category: 'Health & Fitness',
            imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
            callToAction: 'Join FitLife',
            estimatedDuration: 3
          },
          {
            id: 'earnpro-education-1',
            title: 'SkillBoost Academy - Learn & Earn',
            description: 'Master new skills with our online courses. Complete lessons and earn certificates while getting paid!',
            advertiser: {
              id: 'skillboost-academy',
              name: 'SkillBoost Academy',
              logo: '/images/advertisers/skillboost.png'
            },
            targeting: {
              countries: ['United States', 'Canada', 'United Kingdom', 'Australia'],
              ageRange: [18, 65] as [number, number],
              interests: ['education', 'career', 'learning'],
              languages: ['en']
            },
            budget: {
              total: 4200,
              spent: 1560,
              dailyLimit: 180
            },
            reward: {
              type: 'per_completion' as const,
              amount: 1.50
            },
            schedule: {
              startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
              timezone: 'UTC'
            },
            metrics: {
              impressions: 12360,
              clicks: 672,
              conversions: 134,
              engagement: 6.2
            },
            status: 'active' as const,
            priority: 7,
            category: 'Education',
            imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop',
            callToAction: 'Start Learning',
            requirements: [
              'Create SkillBoost account',
              'Complete welcome tutorial',
              'Enroll in first course'
            ],
            estimatedDuration: 7
          }
        ];

        await adDisplayService.initializeService(mockCampaigns);
        console.log('🎯 Advertising service initialized with', mockCampaigns.length, 'campaigns');
      } catch (error) {
        console.error('Failed to initialize advertising service:', error);
      }
    };

    initializeAdvertising();
  }, []);

  // Handle role update events
  useEffect(() => {
    console.log('🔍 UserDashboard: Checking for role update events...', {
      eventsCount: events.length,
      userId: user?.id,
      events: events.map(e => ({ type: e.type, userId: e.data?.userId }))
    });

    const roleUpdateEvent = events.find(event => 
      event.type === 'user_role_updated' && 
      event.data?.userId === user?.id
    );

    if (roleUpdateEvent) {
      console.log('✅ Role update event found!', roleUpdateEvent);
      // Refresh user session to get updated role
      refreshUser().then(({ success }) => {
        if (success) {
          console.log('✅ User session refreshed successfully');
          showToast.success('🎉 Your account has been upgraded! New features are now available.');
        } else {
          console.error('❌ Failed to refresh user session');
        }
      });
    }
  }, [events, user?.id, refreshUser]);

  // Periodic check for role updates (fallback mechanism)
  useEffect(() => {
    if (!user?.id) return;

    const checkForRoleUpdates = async () => {
      try {
        const result = await refreshUser();
        if (result.success) {
          console.log('🔄 Periodic user data refresh completed');
        }
      } catch (error) {
        console.error('Error during periodic refresh:', error);
      }
    };

    // Check every 10 seconds for role updates
    const interval = setInterval(checkForRoleUpdates, 10000);

    // Listen for testing mode agent approval events
    const handleAgentApproval = (event: any) => {
      const { userId, userEmail, newRole } = event.detail;
      console.log('🎯 Received agent approval event:', { userId, userEmail, newRole });
      
      // Check if this event is for the current user
      if (userEmail === user?.email || userId === user?.id) {
        console.log('✅ This approval is for the current user! Refreshing...');
        refreshUser().then(({ success }) => {
          if (success) {
            showToast.success('🎉 Congratulations! You are now an EarnPro Agent!');
          }
        });
      }
    };

    // Add event listener for testing mode
    window.addEventListener('agentApprovalUpdate', handleAgentApproval);

    return () => {
      clearInterval(interval);
      window.removeEventListener('agentApprovalUpdate', handleAgentApproval);
    };
  }, [user?.id, user?.email, refreshUser]);

  const referralLink = `https://earnpro.org/register?ref=${user?.referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinTelegram = () => {
    window.open('https://t.me/earnpro_official', '_blank');
  };

  const handleJoinYoutube = () => {
    window.open('https://youtube.com/@earnpro', '_blank');
  };

  const todayTasks = [
    { title: 'Watch Welcome Video', reward: 2.50, completed: true },
    { title: 'Join Telegram Channel', reward: 1.50, completed: true },
    { title: 'Complete Survey', reward: 3.00, completed: false },
  ];

  const bgClass = theme === 'professional'
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800'
    : 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20';

  const buttonPrimaryClass = theme === 'professional'
    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700';

  const buttonSecondaryClass = theme === 'professional'
    ? 'bg-gray-700/50 hover:bg-gray-600/60 border-gray-600/50'
    : 'bg-white/10 hover:bg-white/20 border-white/20';

  const buttonSuccessClass = theme === 'professional'
    ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700'
    : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700';

  return (
    <div className={`${bgClass} py-8`}>
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.fullName}!</h1>
              <p className="text-white/70">Here's your performance overview</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAdDemo(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md transform hover:scale-105"
                title="Access our advertising platform"
              >
                <DollarSign className="w-4 h-4" />
                <span>Ad Platform</span>
              </button>
              <button
                onClick={() => {
                  refreshUser().then(({ success }) => {
                    if (success) {
                      showToast.success('✅ Dashboard refreshed!');
                    } else {
                      showToast.error('❌ Failed to refresh dashboard');
                    }
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-all duration-200"
                title="Refresh your dashboard data"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
          
          {user?.role !== 'agent' && user?.role !== 'advertiser' && (
            <div className="mt-2">
              <Link
                to="/advertise"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-200 text-sm font-medium"
              >
                🤝 Advertise with Us
              </Link>
            </div>
          )}
          {user?.isAgent && (
            <div className="mt-2">
              <Link
                to="/agent/portal"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 text-sm font-medium"
              >
                👑 Access Agent Portal
              </Link>
            </div>
          )}
        </div>

    <PersonalizedDashboardLayout>
      {/* Wrap the existing dashboard components as children */}

          {/* Enhanced Leaderboard Widget */}
          <EnhancedLeaderboardWidget className="mb-8" />

          {/* Welcome Bonus Message */}
          {showWelcomeBonus && (
            <div className={`${cardClass} mb-8 relative`}>
              <button
                onClick={() => setShowWelcomeBonus(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                ✕
              </button>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-4">🎉 Welcome Bonus Activated!</h3>
                <p className="text-white/80 mb-6">
                  Congratulations! You've received a{' '}
                  <DualCurrencyDisplay
                    usdAmount={3.00}
                    userCurrency={user?.currency || 'USD'}
                    className={`font-bold ${theme === 'professional' ? 'text-cyan-300' : 'text-purple-300'}`}
                  />{' '}
                  welcome bonus for activating your account.
                </p>
                <button
                  onClick={() => setShowWelcomeBonus(false)}
                  className={`${buttonPrimaryClass} text-white px-6 py-2 rounded-lg font-medium transition-all duration-200`}
                >
                  Claim Bonus
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Referral System */}
          <EnhancedReferralSystem />

          {/* Social Media Onboarding */}
          <SocialMediaOnboarding />

        {/* Quick Actions */}
        <div className={`${cardClass} mb-8`}>
          <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/withdraw"
              className={`${buttonSuccessClass} text-white p-4 rounded-lg text-center transition-all duration-200 hover:scale-105`}>
              <Wallet className="w-8 h-8 mx-auto mb-2" />
              <div className="font-medium">Withdraw Funds</div>
              <div className="text-sm opacity-80">Get your earnings</div>
            </Link>

            <Link
              to="/tasks"
              className={`${buttonPrimaryClass} text-white p-4 rounded-lg text-center transition-all duration-200 hover:scale-105`}>
              <Play className="w-8 h-8 mx-auto mb-2" />
              <div className="font-medium">Complete Tasks</div>
              <div className="text-sm opacity-80">Earn more money</div>
            </Link>

            <button
              onClick={() => setShowTemplate(true)}
              className={`${buttonSecondaryClass} text-white p-4 rounded-lg text-center transition-all duration-200 hover:scale-105`}>
              <Share2 className="w-8 h-8 mx-auto mb-2" />
              <div className="font-medium">Share Template</div>
              <div className="text-sm opacity-80">Boost referrals</div>
            </button>

            <button
              onClick={() => setShowQR(true)}
              className={`${buttonSecondaryClass} text-white p-4 rounded-lg text-center transition-all duration-200 hover:scale-105`}>
              <QrCode className="w-8 h-8 mx-auto mb-2" />
              <div className="font-medium">QR Code</div>
              <div className="text-sm opacity-80">Share easily</div>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={cardClass + " p-6"}>
            <div className="flex items-center justify-between mb-4">
              <Users className={`w-8 h-8 ${theme === 'professional' ? 'text-cyan-300' : 'text-purple-300'}`} />
              <span className="text-2xl font-bold text-white">{stats.directReferrals}</span>
            </div>
            <h3 className="text-white font-medium">Direct Referrals</h3>
            <p className="text-white/70 text-sm">People you directly referred</p>
          </div>

          <div className={cardClass + " p-6"}>
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className={`w-8 h-8 ${theme === 'professional' ? 'text-blue-300' : 'text-blue-300'}`} />
              <span className="text-2xl font-bold text-white">{stats.indirectReferrals}</span>
            </div>
            <h3 className="text-white font-medium">Indirect Referrals</h3>
            <p className="text-white/70 text-sm">Multi-level network growth</p>
          </div>

          <div className={cardClass + " p-6"}>
            <div className="flex items-center justify-between mb-4">
              <DollarSign className={`w-8 h-8 ${theme === 'professional' ? 'text-green-400' : 'text-green-300'}`} />
              <DualCurrencyDisplay
                usdAmount={totalEarningsWithAds}
                userCurrency={user?.currency || 'USD'}
                className="text-2xl font-bold text-white"
              />
            </div>
            <h3 className="text-white font-medium">Total Earnings</h3>
            <p className="text-white/70 text-sm">Lifetime earnings (referrals + ads)</p>
          </div>

          <div className={cardClass + " p-6"}>
            <div className="flex items-center justify-between mb-4">
              <Wallet className={`w-8 h-8 ${theme === 'professional' ? 'text-emerald-400' : 'text-emerald-300'}`} />
              <DualCurrencyDisplay
                usdAmount={totalEarningsWithAds - stats.pendingEarnings}
                userCurrency={user?.currency || 'USD'}
                className="text-2xl font-bold text-white"
              />
            </div>
            <h3 className="text-white font-medium">Available for Withdrawal</h3>
            <p className="text-white/70 text-sm">Ready to withdraw</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Referral Link Card */}
          <div className={cardClass}>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Share2 className="w-6 h-6 mr-2" />
              Your Referral Link
            </h3>
            <div className="space-y-4">
              <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}>
                <p className="text-white/70 text-sm mb-2">Share this link to earn rewards:</p>
                <div className={`flex items-center justify-between ${theme === 'professional' ? 'bg-gray-900/50' : 'bg-black/20'} rounded-lg p-3`}>
                  <span className="text-white text-sm truncate mr-2">{referralLink}</span>
                  <button
                    onClick={handleCopyLink}
                    className={`flex items-center space-x-1 ${theme === 'professional' ? 'text-cyan-300 hover:text-cyan-200' : 'text-purple-300 hover:text-purple-200'} transition-colors`}
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCopyLink}
                  className={`flex-1 ${buttonPrimaryClass} text-white py-2 px-4 rounded-lg transition-all duration-200`}
                >
                  Copy Link
                </button>
                <button
                  onClick={() => setShowTemplate(true)}
                  className={`flex-1 ${buttonSecondaryClass} text-white py-2 px-4 rounded-lg transition-all duration-200 border`}
                >
                  Get Template
                </button>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className={`${buttonSecondaryClass} text-white py-2 px-4 rounded-lg transition-all duration-200 border`}
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>

              {showQR && (
                <div className="flex justify-center mt-4">
                  <div className="bg-white p-4 rounded-lg">
                    <QRCodeGenerator value={referralLink} size={200} />
                  </div>
                </div>
              )}

              {showTemplate && user && (
                <ReferralTemplate user={{ referralCode: user.referralCode }} onClose={() => setShowTemplate(false)} />
              )}
            </div>
          </div>

          {/* Enhanced Earnings Breakdown */}
          <EnhancedEarningsBreakdown 
            userId={user?.id || ''} 
            referralStats={stats}
            adEarnings={adEarnings}
          />

          {/* Today's Tasks */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Calendar className="w-6 h-6 mr-2" />
                Today's Tasks
              </h3>
              <Link
                to="/tasks"
                className={`${theme === 'professional' ? 'text-cyan-300 hover:text-cyan-200' : 'text-purple-300 hover:text-purple-200'} text-sm`}
              >
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {todayTasks.map((task, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${task.completed
                  ? theme === 'professional'
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-green-500/10 border border-green-500/30'
                  : theme === 'professional'
                    ? 'bg-gray-700/30 border border-gray-600/30'
                    : 'bg-white/5 border border-white/10'
                  }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${task.completed
                      ? 'bg-green-500/20'
                      : theme === 'professional'
                        ? 'bg-cyan-500/20'
                        : 'bg-purple-500/20'
                      }`}>
                      {task.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-300" />
                      ) : (
                        <Play className={`w-5 h-5 ${theme === 'professional' ? 'text-cyan-300' : 'text-purple-300'}`} />
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{task.title}</p>
                      <DualCurrencyDisplay
                        usdAmount={task.reward}
                        userCurrency={user?.currency || 'USD'}
                        className="text-green-300 text-xs"
                      />
                    </div>
                  </div>
                  {!task.completed && (
                    <Link
                      to="/tasks"
                      className={`${buttonPrimaryClass} text-white px-3 py-1 rounded text-xs transition-all duration-200`}
                    >
                      Start
                    </Link>
                  )}
                </div>
              ))}
            </div>

            <div className={`mt-4 p-3 ${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Task Progress</span>
                <span className="text-white text-sm">{stats.completedTasks} completed</span>
              </div>
              <div className="mt-2">
                <Link
                  to="/tasks"
                  className={`w-full ${buttonPrimaryClass} text-white py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-2`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>View All Tasks</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Community Links */}
        <div className={`${cardClass} mb-8`}>
          <h3 className="text-xl font-bold text-white mb-4">Join Our Community</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleJoinTelegram}
              className={`${buttonSecondaryClass} text-white p-4 rounded-lg transition-all duration-200 hover:scale-105 flex items-center space-x-3`}>
              <MessageCircle className="w-6 h-6" />
              <div className="text-left">
                <div className="font-medium">Telegram Channel</div>
                <div className="text-sm opacity-80">Get updates & tips</div>
              </div>
            </button>
            <button
              onClick={handleJoinYoutube}
              className={`${buttonSecondaryClass} text-white p-4 rounded-lg transition-all duration-200 hover:scale-105 flex items-center space-x-3`}>
              <Youtube className="w-6 h-6" />
              <div className="text-left">
                <div className="font-medium">YouTube Channel</div>
                <div className="text-sm opacity-80">Tutorials & guides</div>
              </div>
            </button>
          </div>
        </div>

        {/* AI-Powered Insights Section */}
        <div className="mt-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Brain className={`w-8 h-8 ${theme === 'professional' ? 'text-cyan-400' : 'text-purple-400'}`} />
            <h2 className="text-2xl font-bold text-white">AI-Powered Insights</h2>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Personalized Insights Widget */}
            {user?.id && (
              <PersonalizedInsightsWidget />
            )}
            
            {/* Smart Matching Widget */}
            {user?.id && (
              <SmartMatchingWidget 
                userId={user.id} 
                className="" 
                maxMatches={3}
              />
            )}
          </div>
          
          {/* AI Performance Widget - Full Width */}
          <div className="mt-8">
            {user?.id && (
              <AIPerformanceWidget 
                userId={user.id} 
                className="" 
              />
            )}
          </div>
        </div>

        {/* Advertising Platform - Earn More Money */}
        <div className={`mt-8 ${cardClass}`}>
          <div className="flex items-center space-x-3 mb-6">
            <DollarSign className={`w-8 h-8 ${theme === 'professional' ? 'text-green-400' : 'text-green-400'}`} />
            <h2 className="text-2xl font-bold text-white">Earn More Money</h2>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Dashboard Native Ad Widget */}
            {user?.id && (
              <AdWidget
                placement="dashboard-native"
                userId={user.id}
                userProfile={{
                  id: user.id,
                  location: 'United States',
                  age: 28,
                  interests: ['technology', 'gaming', 'fitness'],
                  deviceType: 'desktop' as const,
                  language: 'en',
                  timezone: 'UTC'
                }}
                maxAds={1}
                className=""
              />
            )}
            
            {/* Sidebar Ad Widget */}
            {user?.id && (
              <AdWidget
                placement="sidebar-ad"
                userId={user.id}
                userProfile={{
                  id: user.id,
                  location: 'United States',
                  age: 28,
                  interests: ['technology', 'gaming', 'fitness'],
                  deviceType: 'desktop' as const,
                  language: 'en',
                  timezone: 'UTC'
                }}
                maxAds={1}
                autoRotate={true}
                rotationInterval={30}
                className=""
              />
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`mt-8 ${cardClass}`}>
          <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { type: 'bonus', message: 'Welcome bonus credited to your account', time: 'Just now', amount: 3.00 },
              { type: 'referral', message: 'New user joined through your link', time: '2 hours ago', amount: 15.00 },
              { type: 'task', message: 'Completed video watching task', time: '4 hours ago', amount: 2.50 },
              { type: 'earning', message: 'Level 2 earnings from Sarah M.', time: '1 day ago', amount: 7.50 },
              { type: 'task', message: 'Joined Telegram channel', time: '1 day ago', amount: 1.50 },
              { type: 'referral', message: 'Direct referral activated account', time: '3 days ago', amount: 25.00 }
            ].map((activity, index) => (
              <div key={index} className={`flex items-center justify-between py-3 border-b ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'} last:border-b-0`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'bonus'
                    ? 'bg-yellow-500/20'
                    : activity.type === 'referral'
                      ? theme === 'professional' ? 'bg-cyan-500/20' : 'bg-purple-500/20'
                      : activity.type === 'task'
                        ? 'bg-blue-500/20'
                        : 'bg-green-500/20'
                    }`}>
                    {activity.type === 'bonus' ?
                      <Gift className="w-4 h-4 text-yellow-300" /> :
                      activity.type === 'referral' ?
                        <Users className={`w-4 h-4 ${theme === 'professional' ? 'text-cyan-300' : 'text-purple-300'}`} /> :
                        activity.type === 'task' ?
                          <Play className="w-4 h-4 text-blue-300" /> :
                          <DollarSign className="w-4 h-4 text-green-300" />
                    }
                  </div>
                  <div>
                    <p className="text-white text-sm">{activity.message}</p>
                    <p className="text-white/50 text-xs">{activity.time}</p>
                  </div>
                </div>
                <DualCurrencyDisplay
                  usdAmount={activity.amount}
                  userCurrency={user?.currency || 'USD'}
                  className="text-green-300 font-medium"
                />
              </div>
            ))}
          </div>
        </div>
      </PersonalizedDashboardLayout>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md ${cardClass}`}>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-4">Your QR Code</h3>
              <QRCodeGenerator value={referralLink} size={200} />
              <p className="text-white/70 mt-4">Scan this QR code to join EarnPro</p>
              <button
                onClick={() => setShowQR(false)}
                className={`${buttonPrimaryClass} text-white px-6 py-2 rounded-lg font-medium mt-4 transition-all duration-200`}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Template Modal */}
      {showTemplate && user && (
        <ReferralTemplate user={{ referralCode: user.referralCode }} onClose={() => setShowTemplate(false)} />
      )}

      {/* Ad Platform Demo Modal */}
      {showAdDemo && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAdDemo(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowAdDemo(false);
            }
          }}
          tabIndex={-1}
        >
          <div className="relative w-full max-w-4xl max-h-[85vh] bg-gradient-to-br from-gray-900 to-black rounded-xl border border-green-500/20 shadow-2xl overflow-hidden">
            {/* Header with Close Button */}
            <div className="sticky top-0 z-20 bg-gradient-to-r from-gray-900 to-black border-b border-green-500/20 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                <h2 className="text-lg font-bold text-white">Advertising Platform Demo</h2>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-white/50 hidden sm:block">Press ESC or click outside to close</span>
                <button
                  onClick={() => setShowAdDemo(false)}
                  className="text-white/70 hover:text-white transition-colors bg-red-500/20 hover:bg-red-500/30 rounded-full p-1.5 flex items-center justify-center"
                  title="Close Demo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-60px)]" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#10b981 #374151'
            }}>
              <div className="p-4">
                <AdvertisingDemo userId={user?.id || 'demo-user'} isModal={true} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
