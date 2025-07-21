import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Crown, Users, TrendingUp, DollarSign, UserCheck, BarChart3, Settings, Target, Award, Calendar, User, Network, Zap, Activity, Bell, Shield, Globe, Wifi, Clock, Star } from 'lucide-react';
import { formatDualCurrency } from '../../utils/currency';
import { AgentStats } from '../../types';
import { LinkAnalysis } from '../../utils/linkDetection';

// Import advanced components
import AgentProfile from '../Agent/AgentProfile';
import AdvancedPerformance from '../Agent/AdvancedPerformance';
import NetworkManagement from '../Agent/NetworkManagement';
import AgentMilestones from '../Agent/AgentMilestones';

const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [realTimeData, setRealTimeData] = useState({
    activeConnections: 24,
    liveEarnings: 0,
    pendingReferrals: 8,
    conversionRate: 78.5
  });

  const agentStats: AgentStats = {
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
    agentLevel: 'Week 3',
    milestoneProgress: {
      week1: true,
      week2: true,
      week3: true,
      week4: false,
      goldAgent: true
    },
    topPerformers: [
      { name: 'Sarah Johnson', referrals: 123, earnings: 1845.67 },
      { name: 'Michael Chen', referrals: 98, earnings: 1467.50 },
      { name: 'Emma Williams', referrals: 87, earnings: 1305.25 },
      { name: 'David Rodriguez', referrals: 76, earnings: 1140.00 },
      { name: 'Priya Sharma', referrals: 65, earnings: 975.50 }
    ]
  };

  // Real-time updates simulation
  React.useEffect(() => {
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

  const getCommissionInfo = () => {
    const week = agentStats.currentWeek;
    const referrals = agentStats.weeklyReferrals;

    if (week === 1) {
      return {
        target: 50,
        rate: referrals >= 50 ? 5 : 0,
        status: referrals >= 50 ? 'achieved' : 'pending'
      };
    } else if (week === 2) {
      return {
        target: 100,
        rate: referrals >= 100 ? 7 : (referrals >= 80 ? 5 : 0),
        status: referrals >= 100 ? 'achieved' : referrals >= 80 ? 'fallback' : 'pending'
      };
    } else if (week === 3) {
      return {
        target: 200,
        rate: referrals >= 200 ? 10 : (referrals >= 160 ? 7 : 0),
        status: referrals >= 200 ? 'achieved' : referrals >= 160 ? 'fallback' : 'pending'
      };
    }
    return { target: 0, rate: 0, status: 'pending' };
  };

  const commissionInfo = getCommissionInfo();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'milestones', label: 'Milestones', icon: Award },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

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

    const handleLinkDetection = (analysis: LinkAnalysis) => {
    setDetectedPlatform(analysis);
    if (analysis.followers || analysis.subscribers) {
      setFollowerCount(analysis.followers || analysis.subscribers || 0);
    }
  };

  return (
    <div className={`${bgClass} py-8`}>
      <div className="container mx-auto px-4">
        {/* Enhanced Header with Real-time Status */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Crown className="w-8 h-8 mr-3 text-yellow-400" />
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center">
                  Agent Dashboard
                  <span className="ml-3 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-full text-sm font-bold">
                    Gold Agent
                  </span>
                </h1>
                <p className="text-white/70">Elite Network Management Dashboard</p>
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
        </div>

        {/* Enhanced Agent Stats with Real-time Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className={`${cardClass} p-6 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full -mr-8 -mt-8"></div>
            <div className="flex items-center justify-between mb-4">
              <Users className={`w-8 h-8 ${theme === 'professional' ? 'text-cyan-300' : 'text-purple-300'}`} />
              <span className="text-2xl font-bold text-white">{agentStats.cumulativeReferrals.toLocaleString()}</span>
            </div>
            <h3 className="text-white font-medium">Total Network</h3>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-white/70 text-sm">{agentStats.activeUsers.toLocaleString()} active</p>
            </div>
          </div>

          <div className={`${cardClass} p-6 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full -mr-8 -mt-8"></div>
            <div className="flex items-center justify-between mb-4">
              <Calendar className={`w-8 h-8 ${theme === 'professional' ? 'text-blue-400' : 'text-blue-300'}`} />
              <span className="text-2xl font-bold text-white">{agentStats.weeklyReferrals}</span>
            </div>
            <h3 className="text-white font-medium">This Week</h3>
            <p className="text-white/70 text-sm">Week {agentStats.currentWeek} referrals</p>
          </div>

          <div className={`${cardClass} p-6 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -mr-8 -mt-8"></div>
            <div className="flex items-center justify-between mb-4">
              <DollarSign className={`w-8 h-8 ${theme === 'professional' ? 'text-green-400' : 'text-green-300'}`} />
              <span className="text-2xl font-bold text-white">{formatDualCurrency(agentStats.weeklyEarnings, user?.currency || 'USD')}</span>
            </div>
            <h3 className="text-white font-medium">Week Earnings</h3>
            <p className="text-green-300 text-sm">+${realTimeData.liveEarnings.toFixed(2)} live</p>
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
              <span className="text-2xl font-bold text-white">{commissionInfo.rate}%</span>
            </div>
            <h3 className="text-white font-medium">Commission</h3>
            <p className="text-white/70 text-sm">Current rate</p>
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
          {activeTab === 'overview' && <div>Overview Content</div>}
          {activeTab === 'performance' && <AdvancedPerformance stats={agentStats} />}
          {activeTab === 'network' && <NetworkManagement />}
          {activeTab === 'milestones' && <AgentMilestones progress={agentStats.milestoneProgress} />}
          {activeTab === 'profile' && <AgentProfile />}
          {activeTab === 'settings' && <div>Settings Content</div>}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;