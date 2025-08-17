import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Crown, Users, TrendingUp, DollarSign, BarChart3, Settings, Target, Award, User, Network, Activity, Wifi, Star, Timer, Flame, Trophy, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { formatDualCurrencySync } from '../../utils/currency';
import { EnhancedAgentStats } from '../../types';

// Import advanced components
import AgentProfile from '../Agent/AgentProfile';
import NetworkManagement from '../Agent/NetworkManagement';
import AdvancedPerformance from '../Agent/AdvancedPerformance';
import AgentSettings from '../Agent/AgentSettings';

const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [agentData, setAgentData] = useState<EnhancedAgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realTimeData, setRealTimeData] = useState({
    activeConnections: 24,
    liveEarnings: 0,
    pendingReferrals: 8,
    conversionRate: 78.5
  });

  // Load agent data
  useEffect(() => {
    const loadAgentData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        // For now, use mock data until we implement the real service method
        const data = getMockAgentData();
        setAgentData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load agent data:', err);
        setError('Failed to load agent progression data');
        // Fallback to mock data for demo
        setAgentData(getMockAgentData());
      } finally {
        setLoading(false);
      }
    };

    loadAgentData();
  }, [user?.id]);

  // Mock data for demo purposes with new tier names and progressive reset system
  const getMockAgentData = (): EnhancedAgentStats => ({
    totalNetwork: 2847,
    activeUsers: 2456,
    totalEarnings: 15847.89,
    monthlyEarnings: 4567.89,
    weeklyEarnings: 890.45,
    conversionRate: 78.2,
    currentWeek: 3,
    cumulativeReferrals: 2847,
    weeklyReferrals: 45,
    commissionRate: 10,
    agentLevel: 'Iron Agent',
    milestoneProgress: {
      rookie: true,
      bronze: true,
      iron: true,
      steel: false,
      goldAgent: true
    },
    topPerformers: [
      { name: 'Sarah Johnson', referrals: 123, earnings: 1845.67 },
      { name: 'Michael Chen', referrals: 98, earnings: 1467.50 },
      { name: 'Emma Williams', referrals: 87, earnings: 1305.25 },
      { name: 'David Rodriguez', referrals: 76, earnings: 1140.00 },
      { name: 'Priya Sharma', referrals: 65, earnings: 975.50 }
    ],
    currentTier: {
      id: 3,
      tierName: 'iron',
      displayName: 'Iron Agent',
      referralRequirement: 200,
      commissionRate: 10,
      timeLimit: 7,
      withdrawalFrequency: 2,
      bonusMultiplier: 1.0,
      tierOrder: 3,
      requiredReferrals: 200,
      challengeDurationDays: 7,
      fallbackTier: 'bronze',
      resetToTier: 'rookie',
      description: 'Iron tier progression with progressive reset system',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    agentProfile: {
      id: 1,
      userId: user?.id || '',
      currentTier: 'iron',
      totalDirectReferrals: 2847,
      totalLevel1IndirectReferrals: 1200, // Level 1 indirect referrals
      totalNetworkSize: 4047, // 2847 + 1200
      currentChallengeTier: 'steel',
      challengeStartDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      challengeEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      challengeDirectReferrals: 145, // Direct for steel challenge
      challengeLevel1Referrals: 0, // Not counted for first 4 tiers
      challengeTotalNetwork: 145, // Same as direct for first 4 tiers
      progressToNextTier: 145,
      challengeAttempts: 1, // First reset attempt
      challengeStartingReferrals: 200, // Started from half target (400/2)
      challengeMaxReferralsReached: 380, // Max reached in previous failed attempt
      isChallengeActive: true,
      weeklyEarnings: 890.45,
      totalCommissionEarned: 15847.89,
      status: 'active' as const,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      usesDirectOnly: true, // First 4 tiers use direct only
      isFirstFourTiers: true, // Uses progressive reset system
      maxAttemptsAllowed: 2, // 2 resets for first 4 tiers
      resetStartingPoint: 200, // Next reset would start from 200 (400/2)
      tier: {
        id: 3,
        tierName: 'iron',
        displayName: 'Iron Agent',
        referralRequirement: 200,
        commissionRate: 10,
        withdrawalFrequency: 2,
        bonusMultiplier: 1.0,
        tierOrder: 3,
        requiredReferrals: 200,
        timeLimit: 7,
        challengeDurationDays: 7,
        fallbackTier: 'bronze',
        resetToTier: 'rookie',
        description: 'Iron tier - Advanced direct recruitment with progressive reset',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      challengeTier: {
        id: 4,
        tierName: 'steel',
        displayName: 'Steel Agent',
        referralRequirement: 400,
        commissionRate: 15,
        withdrawalFrequency: 3,
        bonusMultiplier: 1.2,
        tierOrder: 4,
        requiredReferrals: 400,
        timeLimit: 7,
        challengeDurationDays: 7, // 10 days for reset attempts
        fallbackTier: 'iron',
        resetToTier: 'rookie',
        description: 'Steel tier - Expert direct recruitment with extended reset time',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    challengeProgress: {
      id: 1,
      agentProfileId: 1,
      targetTier: 'steel',
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      currentReferrals: 145, // Direct referrals for steel challenge (reset attempt)
      requiredReferrals: 400, // Steel requires 400 direct referrals
      isActive: true,
      result: null
    },
    challengeHistory: [
      {
        id: 1,
        agentProfileId: 1,
        targetTier: 'iron',
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        finalReferrals: 200,
        requiredReferrals: 200,
        result: 'success',
        commissionEarned: 150.00,
        tierAtTime: 'bronze'
      }
    ],
    commissionInfo: {
      weeklyRate: 10,
      withdrawalRate: 2,
      totalEarned: 15847.89,
      pendingCommission: 890.45
    },
    withdrawalInfo: {
      frequency: 2,
      usedThisWeek: 1,
      canWithdrawToday: true,
      nextWithdrawalDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    }
  });

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        activeConnections: Math.floor(Math.random() * 10) + 20,
        liveEarnings: prev.liveEarnings + (Math.random() * 5),
        conversionRate: 78.5 + (Math.random() * 4 - 2)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Calculate challenge progress
  const getChallengeProgress = () => {
    if (!agentData?.challengeProgress || !agentData.challengeProgress.isActive) {
      return null;
    }

    const { currentReferrals = 0, requiredReferrals, endDate } = agentData.challengeProgress;
    const timeLeft = new Date(endDate).getTime() - Date.now();
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60)) % 24;
    const progressPercent = (currentReferrals / requiredReferrals) * 100;

    return {
      progressPercent: Math.min(progressPercent, 100),
      referralsNeeded: Math.max(requiredReferrals - currentReferrals, 0),
      daysLeft: Math.max(daysLeft, 0),
      hoursLeft: Math.max(hoursLeft, 0),
      isUrgent: daysLeft <= 1,
      onTrack: progressPercent >= (7 - daysLeft) * (100 / 7) // Simple pace calculation
    };
  };

  const challengeProgress = getChallengeProgress();

  // Get tier display info
  const getTierDisplayInfo = () => {
    if (!agentData?.currentTier) return { name: 'Agent', color: 'gray', icon: User };

    const tier = agentData.currentTier;
    switch (tier.tierName) {
      case 'rookie':
        return { name: 'Rookie Agent', color: 'blue', icon: Star };
      case 'bronze':
        return { name: 'Bronze Agent', color: 'purple', icon: Award };
      case 'iron':
        return { name: 'Iron Agent', color: 'indigo', icon: Crown };
      case 'steel':
        return { name: 'Steel Agent', color: 'pink', icon: Flame };
      case 'silver':
        return { name: 'Silver Agent', color: 'gray', icon: Trophy };
      case 'gold':
        return { name: 'Gold Agent', color: 'yellow', icon: Trophy };
      case 'platinum':
        return { name: 'Platinum Agent', color: 'cyan', icon: Crown };
      case 'diamond':
        return { name: 'Diamond Agent', color: 'white', icon: Star };
      default:
        return { name: tier.displayName || tier.tierName, color: 'gray', icon: User };
    }
  };

  const tierInfo = getTierDisplayInfo();

  const bgClass = theme === 'professional' 
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800'
    : 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20';

  const tabActiveClass = theme === 'professional'
    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white';

  const tabInactiveClass = theme === 'professional'
    ? 'text-white/70 hover:text-white hover:bg-gray-700/30'
    : 'text-white/70 hover:text-white hover:bg-white/5';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'progression', label: 'Progression', icon: TrendingUp },
    { id: 'challenges', label: 'Challenges', icon: Target },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (loading) {
    return (
      <div className={`${bgClass} py-8 flex items-center justify-center min-h-screen`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading agent progression...</p>
        </div>
      </div>
    );
  }

  if (error && !agentData) {
    return (
      <div className={`${bgClass} py-8 flex items-center justify-center min-h-screen`}>
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${bgClass} py-8`}>
      <div className="container mx-auto px-4">
        {/* Enhanced Header with Tier Status */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <tierInfo.icon className={`w-8 h-8 mr-3 text-${tierInfo.color}-400`} />
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center">
                  Agent Dashboard
                  <span className={`ml-3 px-3 py-1 bg-gradient-to-r from-${tierInfo.color}-500 to-${tierInfo.color}-600 text-black rounded-full text-sm font-bold`}>
                    {tierInfo.name}
                  </span>
                </h1>
                <p className="text-white/70">
                  {agentData?.currentTier.commissionRate}% Commission Rate • 
                  {agentData?.currentTier.withdrawalFrequency}x Weekly Withdrawals
                </p>
              </div>
            </div>

            {/* Real-time indicators */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-sm">Live</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 rounded-lg">
                <Wifi className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 text-sm">{realTimeData.activeConnections} Active</span>
              </div>
            </div>
          </div>

          {/* Challenge Progress Banner */}
          {challengeProgress && (
            <div className={`${cardClass} p-6 mb-6 border-l-4 ${challengeProgress.isUrgent ? 'border-red-500' : challengeProgress.onTrack ? 'border-green-500' : 'border-yellow-500'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${challengeProgress.isUrgent ? 'bg-red-500/20' : challengeProgress.onTrack ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                    {challengeProgress.isUrgent ? (
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    ) : challengeProgress.onTrack ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <Timer className="w-6 h-6 text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      Challenge: {agentData?.agentProfile?.challengeTier?.tierName}
                    </h3>
                    <p className="text-white/70">
                      {challengeProgress.referralsNeeded} more referrals needed • 
                      {challengeProgress.daysLeft}d {challengeProgress.hoursLeft}h remaining
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {challengeProgress.progressPercent.toFixed(1)}%
                  </div>
                  <div className="text-white/70 text-sm">Complete</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-white/70 mb-1">
                  <span>{agentData?.challengeProgress?.currentReferrals} / {agentData?.challengeProgress?.requiredReferrals} referrals</span>
                  <span>{challengeProgress.onTrack ? 'On Track' : challengeProgress.isUrgent ? 'Behind Schedule' : 'Needs Focus'}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      challengeProgress.isUrgent ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                      challengeProgress.onTrack ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                      'bg-gradient-to-r from-yellow-500 to-yellow-600'
                    }`}
                    style={{ width: `${challengeProgress.progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Agent Stats with Dual Commission System */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className={`${cardClass} p-6 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full -mr-8 -mt-8"></div>
            <div className="flex items-center justify-between mb-4">
              <Users className={`w-8 h-8 ${theme === 'professional' ? 'text-cyan-300' : 'text-purple-300'}`} />
              <span className="text-2xl font-bold text-white">{agentData?.cumulativeReferrals.toLocaleString()}</span>
            </div>
            <h3 className="text-white font-medium">Total Network</h3>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-white/70 text-sm">{agentData?.activeUsers.toLocaleString()} active</p>
            </div>
          </div>

          <div className={`${cardClass} p-6 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full -mr-8 -mt-8"></div>
            <div className="flex items-center justify-between mb-4">
              <Target className={`w-8 h-8 ${theme === 'professional' ? 'text-blue-400' : 'text-blue-300'}`} />
              <span className="text-2xl font-bold text-white">{agentData?.challengeProgress?.currentReferrals || agentData?.weeklyReferrals}</span>
            </div>
            <h3 className="text-white font-medium">Challenge Progress</h3>
            <p className="text-white/70 text-sm">
              {challengeProgress ? `${challengeProgress.referralsNeeded} more needed` : 'No active challenge'}
            </p>
          </div>

          <div className={`${cardClass} p-6 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -mr-8 -mt-8"></div>
            <div className="flex items-center justify-between mb-4">
              <DollarSign className={`w-8 h-8 ${theme === 'professional' ? 'text-green-400' : 'text-green-300'}`} />
              <span className="text-2xl font-bold text-white">{formatDualCurrencySync(agentData?.weeklyEarnings || 0, user?.currency || 'USD')}</span>
            </div>
            <h3 className="text-white font-medium">Week Earnings</h3>
            <p className="text-green-300 text-sm">Agent + Regular commissions</p>
          </div>

          <div className={`${cardClass} p-6 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -mr-8 -mt-8"></div>
            <div className="flex items-center justify-between mb-4">
              <Activity className={`w-8 h-8 ${theme === 'professional' ? 'text-purple-400' : 'text-purple-300'}`} />
              <span className="text-2xl font-bold text-white">{realTimeData.conversionRate.toFixed(1)}%</span>
            </div>
            <h3 className="text-white font-medium">Conversion Rate</h3>
            <p className="text-white/70 text-sm">Live network performance</p>
          </div>

          <div className={`${cardClass} p-6 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full -mr-8 -mt-8"></div>
            <div className="flex items-center justify-between mb-4">
              <Star className={`w-8 h-8 ${theme === 'professional' ? 'text-yellow-400' : 'text-yellow-300'}`} />
              <span className="text-2xl font-bold text-white">{agentData?.currentTier.commissionRate}%</span>
            </div>
            <h3 className="text-white font-medium">Commission Rate</h3>
            <p className="text-white/70 text-sm">Current tier bonus</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`${cardClass} mb-8`}>
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 whitespace-nowrap transition-all duration-200 ${activeTab === tab.id ? tabActiveClass : tabInactiveClass}`}>
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className={`${cardClass} p-6`}>
          {activeTab === 'overview' && <AgentOverviewTab agentData={agentData} />}
          {activeTab === 'progression' && <AgentProgressionTab agentData={agentData} />}
          {activeTab === 'challenges' && <AgentChallengesTab agentData={agentData} challengeProgress={challengeProgress} />}
          {activeTab === 'performance' && <AdvancedPerformance />}
          {activeTab === 'network' && <NetworkManagement />}
          {activeTab === 'profile' && <AgentProfile />}
          {activeTab === 'settings' && <AgentSettings />}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;

// Tab Components
const AgentOverviewTab: React.FC<{ agentData: EnhancedAgentStats | null }> = ({ agentData }) => {
  if (!agentData) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Agent Overview</h2>
      
      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-400" />
            Dual Commission System
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Regular Referral Bonuses:</span>
              <span className="text-white font-medium">$1.50 + $1.00 + $0.50</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Agent Tier Bonus:</span>
              <span className="text-green-400 font-medium">{agentData.currentTier.commissionRate}% of network earnings</span>
            </div>
            <div className="border-t border-white/10 pt-2">
              <div className="flex justify-between items-center font-semibold">
                <span className="text-white">Total Weekly:</span>
                <span className="text-green-400">${agentData.weeklyEarnings.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
            Hybrid Referral System
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <h4 className="text-blue-300 font-medium text-sm">Week 1-4 Tiers</h4>
              <p className="text-white/70 text-sm">Direct referrals only</p>
              <p className="text-white/50 text-xs">Personal recruitment skills</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <h4 className="text-purple-300 font-medium text-sm">Silver+ Tiers</h4>
              <p className="text-white/70 text-sm">Direct + Level 1 indirect</p>
              <p className="text-white/50 text-xs">Network building & mentoring</p>
            </div>
          </div>
        </div>
      </div>

      {/* Network Stats */}
      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-cyan-400" />
          Your Network Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-cyan-400">{agentData.agentProfile?.totalDirectReferrals.toLocaleString()}</div>
            <div className="text-white/70 text-sm">Direct Referrals</div>
            <div className="text-white/50 text-xs">People you personally recruited</div>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">{agentData.agentProfile?.totalLevel1IndirectReferrals?.toLocaleString() || '0'}</div>
            <div className="text-white/70 text-sm">Level 1 Indirect</div>
            <div className="text-white/50 text-xs">Recruited by your direct referrals</div>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{agentData.agentProfile?.totalNetworkSize?.toLocaleString() || '0'}</div>
            <div className="text-white/70 text-sm">Total Network</div>
            <div className="text-white/50 text-xs">Direct + Level 1 combined</div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-400" />
          Top Network Performers
        </h3>
        <div className="space-y-3">
          {agentData.topPerformers.map((performer, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-300 font-semibold">
                  {index + 1}
                </span>
                <span className="text-white font-medium">{performer.name}</span>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">{performer.referrals} referrals</div>
                <div className="text-green-400 text-sm">${performer.earnings.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AgentProgressionTab: React.FC<{ agentData: EnhancedAgentStats | null }> = ({ agentData }) => {
  if (!agentData) return <div>Loading...</div>;

  const allTiers = [
    { name: 'rookie', displayName: 'Rookie', rate: 5, referrals: 50, timeLimit: 7, order: 1, type: 'Direct Only' },
    { name: 'bronze', displayName: 'Bronze', rate: 7, referrals: 100, timeLimit: 7, order: 2, type: 'Direct Only' },
    { name: 'iron', displayName: 'Iron', rate: 10, referrals: 200, timeLimit: 7, order: 3, type: 'Direct Only' },
    { name: 'steel', displayName: 'Steel', rate: 15, referrals: 400, timeLimit: 7, order: 4, type: 'Direct Only' },
    { name: 'silver', displayName: 'Silver', rate: 20, referrals: 1000, timeLimit: 30, order: 5, type: 'Network (Direct + Level 1)' },
    { name: 'gold', displayName: 'Gold', rate: 25, referrals: 5000, timeLimit: 90, order: 6, type: 'Network (Direct + Level 1)' },
    { name: 'platinum', displayName: 'Platinum', rate: 30, referrals: 10000, timeLimit: 150, order: 7, type: 'Network (Direct + Level 1)' },
    { name: 'diamond', displayName: 'Diamond', rate: 35, referrals: 25000, timeLimit: 300, order: 8, type: 'Network (Direct + Level 1)' }
  ];

  const currentTierOrder = agentData.currentTier.tierOrder || 3;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Agent Progression Path</h2>
      
      <div className="space-y-4">
        {allTiers.map((tier) => {
          const isCompleted = tier.order < currentTierOrder;
          const isCurrent = tier.order === currentTierOrder;
          const isNext = tier.order === currentTierOrder + 1;
          
          return (
            <div
              key={tier.name}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                isCompleted
                  ? 'bg-green-500/10 border-green-500/50'
                  : isCurrent
                  ? 'bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/20'
                  : isNext
                  ? 'bg-yellow-500/10 border-yellow-500/50'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${
                    isCompleted ? 'bg-green-500/20' : isCurrent ? 'bg-blue-500/20' : 'bg-white/10'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : isCurrent ? (
                      <Crown className="w-6 h-6 text-blue-400" />
                    ) : (
                      <Star className="w-6 h-6 text-white/50" />
                    )}
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${
                      isCompleted ? 'text-green-300' : isCurrent ? 'text-blue-300' : 'text-white'
                    }`}>
                      {tier.displayName} Agent
                    </h3>
                    <p className="text-white/70">
                      {tier.referrals.toLocaleString()} referrals in {tier.timeLimit > 0 ? tier.timeLimit : 'unlimited'} days
                    </p>
                    <p className="text-white/50 text-sm">
                      {tier.type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    isCompleted ? 'text-green-400' : isCurrent ? 'text-blue-400' : 'text-white/50'
                  }`}>
                    {tier.rate}%
                  </div>
                  <div className="text-white/70 text-sm">Commission</div>
                </div>
              </div>
              
              {isCurrent && agentData.challengeProgress && (
                <div className="mt-4 p-4 bg-white/5 rounded-lg">
                  <div className="flex justify-between text-sm text-white/70 mb-2">
                    <span>Challenge Progress</span>
                    <span>{agentData.challengeProgress.currentReferrals} / {agentData.challengeProgress.requiredReferrals}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300"
                      style={{ width: `${((agentData.challengeProgress.currentReferrals || 0) / (agentData.challengeProgress.requiredReferrals || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AgentChallengesTab: React.FC<{ 
  agentData: EnhancedAgentStats | null; 
  challengeProgress: any;
}> = ({ agentData, challengeProgress }) => {
  if (!agentData) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Active Challenges</h2>
      
      {/* Current Challenge */}
      {challengeProgress && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Target className="w-6 h-6 mr-2 text-blue-400" />
              {agentData.agentProfile?.challengeTier?.tierName} Challenge
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              challengeProgress.isUrgent ? 'bg-red-500/20 text-red-300' : 
              challengeProgress.onTrack ? 'bg-green-500/20 text-green-300' : 
              'bg-yellow-500/20 text-yellow-300'
            }`}>
              {challengeProgress.onTrack ? 'On Track' : challengeProgress.isUrgent ? 'Urgent' : 'Behind'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{agentData.challengeProgress?.currentReferrals}</div>
              <div className="text-white/70">Current Referrals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{challengeProgress.referralsNeeded}</div>
              <div className="text-white/70">Referrals Needed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{challengeProgress.daysLeft}d {challengeProgress.hoursLeft}h</div>
              <div className="text-white/70">Time Remaining</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white/70">
              <span>Progress</span>
              <span>{challengeProgress.progressPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  challengeProgress.isUrgent ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                  challengeProgress.onTrack ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                  'bg-gradient-to-r from-yellow-500 to-yellow-600'
                }`}
                style={{ width: `${challengeProgress.progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-white/5 rounded-lg">
            <h4 className="text-white font-medium mb-2">Potential Rewards</h4>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Commission Rate Increase:</span>
              <span className="text-green-400 font-medium">
                {agentData.currentTier.commissionRate}% → {agentData.agentProfile?.challengeTier?.commissionRate}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Withdrawal Frequency:</span>
              <span className="text-blue-400 font-medium">
                {agentData.currentTier.withdrawalFrequency}x → {agentData.agentProfile?.challengeTier?.withdrawalFrequency}x per week
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Challenge History */}
      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-gray-400" />
          Challenge History
        </h3>
        <div className="space-y-3">
          {agentData.challengeHistory.map((challenge) => (
            <div key={challenge.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  challenge.result === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {challenge.result === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div>
                  <div className="text-white font-medium">{challenge.targetTier} Challenge</div>
                  <div className="text-white/70 text-sm">
                    {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">
                  {challenge.finalReferrals} / {challenge.requiredReferrals}
                </div>
                <div className={`text-sm ${
                  challenge.result === 'success' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {challenge.result === 'success' ? `+$${challenge.commissionEarned?.toFixed(2)}` : 'Failed'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
