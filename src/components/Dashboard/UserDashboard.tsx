import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Users, TrendingUp, DollarSign, Gift, Copy, Share2, CheckCircle, BarChart3, QrCode, Calendar, Play, MessageCircle, Youtube, Wallet, Brain } from 'lucide-react';
import { ReferralStats } from '../../types';
import { DualCurrencyDisplay } from '../../utils/currency';
import QRCodeGenerator from '../QRCode/QRCodeGenerator';
import ReferralTemplate from './ReferralTemplate';
import { Link } from 'react-router-dom';
import { PersonalizedInsightsWidget } from '../AIWidgets/PersonalizedInsightsWidget';
import SmartMatchingWidget from '../AIWidgets/SmartMatchingWidget';
import AIPerformanceWidget from '../AIWidgets/AIPerformanceWidget';
import PersonalizedDashboardLayout from '../AIPersonalization/PersonalizedDashboardLayout';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
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

  const referralLink = `https://earnpro.org/register?ref=${user?.referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join EarnPro',
        text: 'Start earning with the world\'s most trusted referral platform!',
        url: referralLink
      });
    } else {
      handleCopyLink();
    }
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
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.fullName}!</h1>
          <p className="text-white/70">Here's your performance overview</p>
          {user?.role !== 'agent' && user?.role !== 'advertiser' && (
            <div className="mt-2">
              <Link
                to="/advertiser/apply"
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

    <PersonalizedDashboardLayout 
      userId={user?.id || ''}
      availableWidgets={[
        {
          id: 'welcome-bonus',
          name: 'Welcome Bonus',
          category: 'info',
          priority: 10,
          visible: showWelcomeBonus
        },
        {
          id: 'quick-actions',
          name: 'Quick Actions',
          category: 'actions',
          priority: 9,
          visible: true
        },
        {
          id: 'stats-grid',
          name: 'Statistics Overview',
          category: 'analytics',
          priority: 8,
          visible: true
        },
        {
          id: 'referral-link',
          name: 'Referral Link',
          category: 'referral',
          priority: 7,
          visible: true
        },
        {
          id: 'earnings-breakdown',
          name: 'Earnings Breakdown',
          category: 'analytics',
          priority: 6,
          visible: true
        },
        {
          id: 'daily-tasks',
          name: 'Daily Tasks',
          category: 'tasks',
          priority: 5,
          visible: true
        },
        {
          id: 'community-links',
          name: 'Community Links',
          category: 'social',
          priority: 4,
          visible: true
        },
        {
          id: 'ai-insights',
          name: 'AI Personalized Insights',
          category: 'ai',
          priority: 3,
          visible: true
        },
        {
          id: 'smart-matching',
          name: 'Smart Matching',
          category: 'ai',
          priority: 2,
          visible: true
        },
        {
          id: 'ai-performance',
          name: 'AI Performance',
          category: 'ai',
          priority: 1,
          visible: true
        },
        {
          id: 'recent-activity',
          name: 'Recent Activity',
          category: 'analytics',
          priority: 0,
          visible: true
        }
      ]}
    >

      {/* Wrap the existing dashboard components as children */}

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
                usdAmount={stats.totalEarnings}
                userCurrency={user?.currency || 'USD'}
                className="text-2xl font-bold text-white"
              />
            </div>
            <h3 className="text-white font-medium">Total Earnings</h3>
            <p className="text-white/70 text-sm">Lifetime earnings</p>
          </div>

          <div className={cardClass + " p-6"}>
            <div className="flex items-center justify-between mb-4">
              <Wallet className={`w-8 h-8 ${theme === 'professional' ? 'text-emerald-400' : 'text-emerald-300'}`} />
              <DualCurrencyDisplay
                usdAmount={stats.totalEarnings - stats.pendingEarnings}
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

          {/* Earnings Breakdown */}
          <div className={cardClass}>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2" />
              Earnings Breakdown
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-white/70">Direct Referrals</span>
                <DualCurrencyDisplay
                  usdAmount={stats.totalEarnings - stats.level2Earnings - stats.level3Earnings - stats.taskEarnings}
                  userCurrency={user?.currency || 'USD'}
                  className="font-medium text-white"
                />
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-white/70">Level 2 Earnings</span>
                <DualCurrencyDisplay
                  usdAmount={stats.level2Earnings}
                  userCurrency={user?.currency || 'USD'}
                  className="font-medium text-white"
                />
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-white/70">Level 3 Earnings</span>
                <DualCurrencyDisplay
                  usdAmount={stats.level3Earnings}
                  userCurrency={user?.currency || 'USD'}
                  className="font-medium text-white"
                />
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-white/70">Task Earnings</span>
                <DualCurrencyDisplay
                  usdAmount={stats.taskEarnings}
                  userCurrency={user?.currency || 'USD'}
                  className="font-medium text-white"
                />
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-white/70">Welcome Bonus</span>
                <DualCurrencyDisplay
                  usdAmount={3.00}
                  userCurrency={user?.currency || 'USD'}
                  className="font-medium text-green-300"
                />
              </div>
              <div className={`border-t ${theme === 'professional' ? 'border-gray-600/50' : 'border-white/20'} pt-3`}>
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Total Earnings</span>
                  <DualCurrencyDisplay
                    usdAmount={stats.totalEarnings + 3.00}
                    userCurrency={user?.currency || 'USD'}
                    className={`${theme === 'professional' ? 'text-cyan-300' : 'text-purple-300'} font-bold text-lg`}
                  />
                </div>
              </div>

              {/* Weekly Stats */}
              <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-3 mt-4`}>
                <h4 className="text-white font-medium mb-2">This Week</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">New Referrals:</span>
                    <span className="text-white">{stats.weeklyReferrals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Week Earnings:</span>
                    <DualCurrencyDisplay
                      usdAmount={stats.currentWeekEarnings}
                      userCurrency={user?.currency || 'USD'}
                      className="text-white"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Withdrawal Frequency:</span>
                    <span className="text-white capitalize">{stats.withdrawalFrequency} per week</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
              <PersonalizedInsightsWidget 
                userId={user.id} 
                className="" 
              />
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
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4z-50">
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
      {showTemplate && (
        <ReferralTemplate user={{ referralCode: user.referralCode }} onClose={() => setShowTemplate(false)} />
      )}
    </div>
  );
};

export default UserDashboard;
