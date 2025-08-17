import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Award, 
  Clock, 
  Target, 
  Zap, 
  AlertTriangle,
  Trophy,
  Calendar,
  DollarSign,
  Activity,
  RefreshCw,
  Filter,
  Search,
  Eye,
  Star,
  ArrowUp,
  ArrowDown,
  Pause,
  Play,
  BarChart3,
  PieChart,
  LineChart,
  Crown,
  Diamond,
  Shield,
  Sparkles,
  FileCheck,
  Brain
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import AgentProgressionService from '../../services/agentProgressionService';
import AgentDashboardCommunicationService from '../../services/agentDashboardCommunication';
import { realtimeService } from '../../services/realtimeService';
import { supabase } from '../../lib/supabase';
import { AgentProfile, AgentTier, AgentStats } from '../../types';
import { showToast } from '../../utils/toast';
import ApplicationReviewSystem from './ApplicationReviewSystem';

interface EnhancedAgentProfile extends AgentProfile {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  tier?: AgentTier;
  challengeTier?: AgentTier;
  weeklyPerformance?: {
    currentWeekEarnings: number;
    currentWeekReferrals: number;
    weeklyGrowthRate: number;
    performanceRating: 'excellent' | 'good' | 'average' | 'needs_improvement';
  };
  realTimeStats?: {
    todayReferrals: number;
    todayEarnings: number;
    onlineStatus: 'online' | 'offline' | 'away';
    lastActive: Date;
  };
}

interface AgentManagementStats {
  totalAgents: number;
  activeAgents: number;
  totalCommissionPaid: number;
  averagePerformanceScore: number;
  tierDistribution: { [tierName: string]: number };
  challengesInProgress: number;
  topPerformers: EnhancedAgentProfile[];
  strugglingAgents: EnhancedAgentProfile[];
  recentTierAdvances: Array<{
    agentId: string;
    agentName: string;
    fromTier: string;
    toTier: string;
    date: Date;
  }>;
}

const AgentManagement: React.FC = () => {
  const { theme } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<'management' | 'applications'>('management');
  const [agents, setAgents] = useState<EnhancedAgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AgentManagementStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'tier' | 'performance' | 'earnings' | 'referrals'>('performance');
  const [selectedAgent, setSelectedAgent] = useState<EnhancedAgentProfile | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Theme colors
  const getThemeColors = () => {
    if (theme === 'professional') {
      return {
        background: 'bg-gradient-to-br from-gray-900 via-black to-gray-800',
        card: 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50',
        cardInner: 'bg-gray-700/30 rounded-lg p-4 border border-gray-600/30',
        textPrimary: 'text-white',
        textSecondary: 'text-white/70',
        textMuted: 'text-white/50',
        accent: 'text-cyan-400',
        success: 'text-emerald-400',
        warning: 'text-amber-400',
        danger: 'text-red-400',
        buttonPrimary: 'bg-cyan-600 hover:bg-cyan-700 text-white',
        buttonSecondary: 'bg-gray-600 hover:bg-gray-700 text-white',
        input: 'bg-gray-700 border-gray-600 text-white placeholder-gray-400',
      };
    } else {
      return {
        background: 'bg-gradient-to-br from-purple-900 to-indigo-900',
        card: 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20',
        cardInner: 'bg-white/5 rounded-lg p-4 border border-white/10',
        textPrimary: 'text-white',
        textSecondary: 'text-white/70',
        textMuted: 'text-white/50',
        accent: 'text-purple-300',
        success: 'text-emerald-300',
        warning: 'text-amber-300',
        danger: 'text-red-300',
        buttonPrimary: 'bg-purple-600 hover:bg-purple-700 text-white',
        buttonSecondary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        input: 'bg-purple-800/30 border-purple-600/30 text-white placeholder-purple-300',
      };
    }
  };

  const colors = getThemeColors();

  // Tier icons and colors
  const getTierIcon = (tierName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      rookie: Users,
      bronze: Award,
      iron: Shield,
      steel: Zap,
      silver: Star,
      gold: Trophy,
      platinum: Crown,
      diamond: Diamond
    };
    return iconMap[tierName] || Users;
  };

  const getTierColor = (tierName: string) => {
    const colorMap: { [key: string]: string } = {
      rookie: 'text-gray-400',
      bronze: 'text-amber-600',
      iron: 'text-gray-500',
      steel: 'text-blue-400',
      silver: 'text-gray-300',
      gold: 'text-yellow-400',
      platinum: 'text-purple-400',
      diamond: 'text-cyan-400'
    };
    return colorMap[tierName] || 'text-gray-400';
  };

  const getTierGradient = (tierName: string) => {
    const gradientMap: { [key: string]: string } = {
      rookie: 'from-gray-400 to-gray-600',
      bronze: 'from-amber-600 to-orange-700',
      iron: 'from-gray-500 to-gray-700',
      steel: 'from-blue-400 to-blue-600',
      silver: 'from-gray-300 to-gray-500',
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-purple-400 to-purple-600',
      diamond: 'from-cyan-400 to-blue-500'
    };
    return gradientMap[tierName] || 'from-gray-400 to-gray-600';
  };

  // Load agent data
  useEffect(() => {
    loadAgentData();
    
    // Set up real-time subscriptions for agent updates
    const cleanupRealtimeSubscriptions = setupRealtimeSubscriptions();
    
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(loadAgentData, 30000);
    return () => {
      clearInterval(interval);
      cleanupRealtimeSubscriptions();
    };
  }, []);

  const setupRealtimeSubscriptions = () => {
    // Subscribe to agent profile changes
    const unsubscribeAgentTier = realtimeService.onLiveEvent('agent_tier_updated', (event) => {
      showToast.success(`Agent ${event.data.agentName} advanced to ${event.data.newTier}!`);
      loadAgentData(); // Refresh data
    });

    // Subscribe to new referrals
    const unsubscribeReferrals = realtimeService.onLiveEvent('new_referral', (event) => {
      if (event.data.isAgentReferral) {
        // Update agent's referral count in real-time
        setAgents(prevAgents => 
          prevAgents.map(agent => 
            agent.userId === event.data.referrerUserId 
              ? { 
                  ...agent, 
                  totalDirectReferrals: agent.totalDirectReferrals + 1,
                  challengeDirectReferrals: agent.challengeDirectReferrals + 1
                }
              : agent
          )
        );
      }
    });

    // Subscribe to challenge completions
    const unsubscribeChallenges = realtimeService.onLiveEvent('challenge_completed', (event) => {
      showToast.success(`Agent ${event.data.agentName} completed ${event.data.tier} challenge!`);
      loadAgentData(); // Refresh to show tier advancement
    });

    // Store unsubscribe functions for cleanup
    return () => {
      unsubscribeAgentTier();
      unsubscribeReferrals();
      unsubscribeChallenges();
    };
  };

  const cleanupRealtimeSubscriptions = () => {
    // This function is now handled by the returned cleanup function from setupRealtimeSubscriptions
  };

  const loadAgentData = async () => {
    try {
      setLoading(true);
      
      // Check if supabase client is available
      if (!supabase) {
        console.warn('No database connection available, using mock data');
        showToast.warning('Database connection unavailable - using mock data');
        
        // Load mock agent data
        const mockAgents = await AgentProgressionService.getAllAgentProfiles();
        setAgents(mockAgents as EnhancedAgentProfile[]);
        
        // Set mock stats
        const mockStats: AgentManagementStats = {
          totalAgents: mockAgents.length,
          activeAgents: mockAgents.filter(a => a.status === 'active').length,
          totalCommissionPaid: 50000,
          averagePerformanceScore: 85,
          tierDistribution: { rookie: 5, bronze: 3, silver: 2 },
          challengesInProgress: 8,
          topPerformers: [],
          strugglingAgents: [],
          recentTierAdvances: []
        };
        setStats(mockStats);
        return;
      }
      
      // Load all agents with their profiles from the actual database
      const agentProfiles = await AgentProgressionService.getAllAgentProfiles();
      
      // Get real user data from supabase
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, avatar_url, last_seen, status')
        .in('id', agentProfiles.map(p => p.userId));

      if (usersError) {
        console.error('Error loading user data:', usersError);
      }

      // Get real-time stats for each agent (with fallback)
      let weeklyStats = null;
      let todayStats = null;
      
      try {
        const { data: weeklyStatsData, error: statsError } = await supabase
          .from('agent_weekly_performance')
          .select('*')
          .gte('week_start_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        if (statsError) {
          console.error('Error loading weekly stats:', statsError);
        } else {
          weeklyStats = weeklyStatsData;
        }
      } catch (error) {
        console.warn('Weekly stats table not available, using fallback');
      }

      // Get today's performance data (with fallback)
      try {
        const { data: todayStatsData, error: todayError } = await supabase
          .from('transactions')
          .select('user_id, amount, created_at')
          .gte('created_at', new Date().toDateString())
          .in('user_id', agentProfiles.map(p => p.userId));

        if (todayError) {
          console.error('Error loading today stats:', todayError);
        } else {
          todayStats = todayStatsData;
        }
      } catch (error) {
        console.warn('Transactions table not available, using fallback');
      }
      
      // Enhance with real data
      const enhancedAgents = await Promise.all(
        agentProfiles.map(async (agent) => {
          const tier = await AgentProgressionService.getTierByName(agent.currentTier);
          const challengeTier = agent.currentChallengeTier ? 
            await AgentProgressionService.getTierByName(agent.currentChallengeTier) : null;
          
          // Get real user data
          const userData = usersData?.find(u => u.id === agent.userId);
          
          // Get weekly performance
          const weeklyPerf = weeklyStats?.find(s => s.user_id === agent.userId);
          
          // Get today's earnings and referrals
          const todayData = todayStats?.filter(t => t.user_id === agent.userId) || [];
          const todayEarnings = todayData.reduce((sum, t) => sum + t.amount, 0);
          
          // Calculate performance rating based on actual data
          const getPerformanceRating = (weeklyEarnings: number, targetEarnings: number) => {
            const ratio = weeklyEarnings / targetEarnings;
            if (ratio >= 1.2) return 'excellent';
            if (ratio >= 0.8) return 'good';
            if (ratio >= 0.5) return 'average';
            return 'needs_improvement';
          };

          // Determine online status based on last_seen
          const getOnlineStatus = (lastSeen: string | null) => {
            if (!lastSeen) return 'offline';
            const lastSeenDate = new Date(lastSeen);
            const now = new Date();
            const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
            
            if (diffMinutes <= 5) return 'online';
            if (diffMinutes <= 30) return 'away';
            return 'offline';
          };

          const enhanced: EnhancedAgentProfile = {
            ...agent,
            tier,
            challengeTier,
            user: {
              id: agent.userId,
              firstName: userData?.first_name || 'Unknown',
              lastName: userData?.last_name || 'Agent',
              email: userData?.email || `agent${agent.id}@example.com`,
              avatar: userData?.avatar_url,
            },
            weeklyPerformance: {
              currentWeekEarnings: weeklyPerf?.total_earnings || 0,
              currentWeekReferrals: weeklyPerf?.new_referrals || 0,
              weeklyGrowthRate: weeklyPerf ? 
                ((weeklyPerf.total_earnings / (weeklyPerf.total_earnings - weeklyPerf.referral_earnings)) - 1) * 100 : 0,
              performanceRating: getPerformanceRating(
                weeklyPerf?.total_earnings || 0,
                tier?.referralRequirement * 10 || 100 // Base target
              )
            },
            realTimeStats: {
              todayReferrals: Math.floor(todayData.length / 10), // Assuming some transactions are referrals
              todayEarnings: todayEarnings,
              onlineStatus: getOnlineStatus(userData?.last_seen),
              lastActive: userData?.last_seen ? new Date(userData.last_seen) : new Date()
            }
          };
          
          return enhanced;
        })
      );

      setAgents(enhancedAgents);
      
      // Calculate real stats
      const calculatedStats: AgentManagementStats = {
        totalAgents: enhancedAgents.length,
        activeAgents: enhancedAgents.filter(a => a.status === 'active').length,
        totalCommissionPaid: enhancedAgents.reduce((sum, a) => sum + a.totalCommissionEarned, 0),
        averagePerformanceScore: enhancedAgents.length > 0 ? 
          enhancedAgents.reduce((sum, a) => {
            const scores = { excellent: 95, good: 80, average: 65, needs_improvement: 40 };
            return sum + scores[a.weeklyPerformance?.performanceRating || 'average'];
          }, 0) / enhancedAgents.length : 0,
        tierDistribution: enhancedAgents.reduce((acc, agent) => {
          acc[agent.currentTier] = (acc[agent.currentTier] || 0) + 1;
          return acc;
        }, {} as { [tierName: string]: number }),
        challengesInProgress: enhancedAgents.filter(a => a.isChallengeActive).length,
        topPerformers: enhancedAgents
          .filter(a => a.weeklyPerformance?.performanceRating === 'excellent')
          .sort((a, b) => (b.weeklyPerformance?.currentWeekEarnings || 0) - (a.weeklyPerformance?.currentWeekEarnings || 0))
          .slice(0, 5),
        strugglingAgents: enhancedAgents
          .filter(a => a.weeklyPerformance?.performanceRating === 'needs_improvement')
          .sort((a, b) => (a.weeklyPerformance?.currentWeekEarnings || 0) - (b.weeklyPerformance?.currentWeekEarnings || 0))
          .slice(0, 5),
        recentTierAdvances: [] // This would come from challenge history
      };

      setStats(calculatedStats);
      
    } catch (error) {
      console.error('Error loading agent data:', error);
      showToast.error('Failed to load agent data');
      
      // Fallback to mock data if real data fails
      const mockAgents = await AgentProgressionService.getAllAgentProfiles();
      setAgents(mockAgents as EnhancedAgentProfile[]);
    } finally {
      setLoading(false);
    }
  };

  // Admin actions
  const handleAgentAction = async (agentId: number, action: 'suspend' | 'activate' | 'reset_challenge' | 'manual_tier_update') => {
    try {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;

      // Check if supabase is available
      if (!supabase) {
        showToast.warning('Database connection unavailable - action cannot be performed');
        return;
      }

      switch (action) {
        case 'suspend':
          await supabase
            .from('agent_profiles')
            .update({ status: 'suspended' })
            .eq('id', agentId);
          
          // Notify agent via real-time communication
          await AgentDashboardCommunicationService.notifyStatusChange(
            agent.userId, 
            'suspended', 
            'Account suspended by administrator'
          );
          
          showToast.success('Agent suspended successfully');
          break;
          
        case 'activate':
          await supabase
            .from('agent_profiles')
            .update({ status: 'active' })
            .eq('id', agentId);
            
          // Notify agent via real-time communication
          await AgentDashboardCommunicationService.notifyStatusChange(
            agent.userId, 
            'active'
          );
          
          showToast.success('Agent activated successfully');
          break;
          
        case 'reset_challenge':
          // Reset current challenge
          await AgentProgressionService.resetChallenge(agent.userId);
          
          // Notify agent about challenge reset
          await AgentDashboardCommunicationService.notifyChallengeUpdate(
            agent.userId,
            'start',
            {
              tier: agent.currentChallengeTier,
              daysRemaining: 7, // Default challenge duration
              currentReferrals: 0,
              targetReferrals: agent.challengeTier?.referralRequirement || 0
            }
          );
          
          showToast.success('Challenge reset successfully');
          break;
          
        case 'manual_tier_update':
          // This would open a modal for manual tier adjustment
          await handleManualTierUpdate(agent);
          break;
      }
      
      // Sync agent data to their dashboard
      await AgentDashboardCommunicationService.syncAgentData(agent.userId);
      
      // Refresh admin dashboard data
      loadAgentData();
    } catch (error) {
      console.error('Error performing agent action:', error);
      showToast.error('Failed to perform action');
    }
  };

  const handleManualTierUpdate = async (agent: EnhancedAgentProfile) => {
    const tiers = ['rookie', 'bronze', 'iron', 'steel', 'silver', 'gold', 'platinum', 'diamond'];
    const currentIndex = tiers.indexOf(agent.currentTier);
    const nextTier = tiers[currentIndex + 1];
    
    if (!nextTier) {
      showToast.info('Agent is already at the highest tier');
      return;
    }

    // Check if supabase is available
    if (!supabase) {
      showToast.warning('Database connection unavailable - tier update cannot be performed');
      return;
    }

    try {
      // Update tier in database
      await supabase
        .from('agent_profiles')
        .update({ 
          current_tier: nextTier,
          last_tier_achieved_date: new Date().toISOString()
        })
        .eq('id', agent.id);

      // Notify agent about tier advancement
      await AgentDashboardCommunicationService.notifyTierUpdate(
        agent.userId,
        agent.currentTier,
        nextTier,
        `${agent.user?.firstName} ${agent.user?.lastName}`
      );

      showToast.success(`Agent promoted to ${nextTier} tier`);
    } catch (error) {
      console.error('Error updating tier:', error);
      showToast.error('Failed to update tier');
    }
  };

  // Export agent data
  const exportAgentData = () => {
    const csvData = agents.map(agent => ({
      Name: `${agent.user?.firstName} ${agent.user?.lastName}`,
      Email: agent.user?.email,
      Tier: agent.currentTier,
      'Total Referrals': agent.totalDirectReferrals,
      'Weekly Earnings': agent.weeklyPerformance?.currentWeekEarnings.toFixed(2),
      'Commission Rate': agent.tier?.commissionRate + '%',
      Status: agent.status,
      'Challenge Active': agent.isChallengeActive ? 'Yes' : 'No',
      'Last Active': agent.realTimeStats?.lastActive.toLocaleDateString()
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast.success('Agent data exported successfully');
  };

  // Filter and sort agents
  const filteredAgents = agents
    .filter(agent => {
      const matchesSearch = !searchTerm || 
        agent.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTier = filterTier === 'all' || agent.currentTier === filterTier;
      const matchesStatus = filterStatus === 'all' || agent.status === filterStatus;
      
      return matchesSearch && matchesTier && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'tier':
          const tierOrder = ['rookie', 'bronze', 'iron', 'steel', 'silver', 'gold', 'platinum', 'diamond'];
          return tierOrder.indexOf(b.currentTier) - tierOrder.indexOf(a.currentTier);
        case 'performance':
          const performanceOrder = { excellent: 4, good: 3, average: 2, needs_improvement: 1 };
          const aScore = performanceOrder[a.weeklyPerformance?.performanceRating || 'average'];
          const bScore = performanceOrder[b.weeklyPerformance?.performanceRating || 'average'];
          return bScore - aScore;
        case 'earnings':
          return (b.weeklyPerformance?.currentWeekEarnings || 0) - (a.weeklyPerformance?.currentWeekEarnings || 0);
        case 'referrals':
          return b.totalDirectReferrals - a.totalDirectReferrals;
        default:
          return 0;
      }
    });

  const getPerformanceColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return colors.success;
      case 'good': return colors.accent;
      case 'average': return colors.warning;
      case 'needs_improvement': return colors.danger;
      default: return colors.textMuted;
    }
  };

  const getOnlineStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${colors.background} flex items-center justify-center`}>
        <div className="text-center">
          <RefreshCw className={`w-8 h-8 ${colors.accent} animate-spin mx-auto mb-4`} />
          <p className={colors.textSecondary}>Loading agent management dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.background} p-6`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${colors.textPrimary} mb-2`}>
              Agent Management Dashboard
            </h1>
            <p className={colors.textSecondary}>
              Monitor agent performance, tier progression, and real-time analytics
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={exportAgentData}
              className={`px-4 py-2 ${colors.buttonSecondary} rounded-lg flex items-center gap-2 transition-colors`}
            >
              <ArrowDown className="w-4 h-4" />
              Export Data
            </button>
            
            <button
              onClick={loadAgentData}
              className={`px-4 py-2 ${colors.buttonSecondary} rounded-lg flex items-center gap-2 transition-colors`}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded transition-colors ${
                  viewMode === 'grid' ? colors.buttonPrimary : 'text-gray-400 hover:text-white'
                }`}
              >
                <PieChart className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded transition-colors ${
                  viewMode === 'list' ? colors.buttonPrimary : 'text-gray-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-gray-800/50 rounded-lg p-1 border border-gray-700">
            <button
              onClick={() => setActiveSubTab('management')}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeSubTab === 'management' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-white/70 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              Agent Management
            </button>
            <button
              onClick={() => setActiveSubTab('applications')}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeSubTab === 'applications' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-white/70 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Brain className="w-4 h-4" />
              AI Application Review
            </button>
          </div>
        </div>

        {/* Conditional Content */}
        {activeSubTab === 'applications' ? (
          <ApplicationReviewSystem />
        ) : (
          <>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={colors.card}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${colors.textPrimary}`}>Total Agents</h3>
                <Users className={`w-5 h-5 ${colors.accent}`} />
              </div>
              <p className={`text-2xl font-bold ${colors.textPrimary}`}>{stats.totalAgents}</p>
              <p className={`text-sm ${colors.success}`}>
                {stats.activeAgents} active
              </p>
            </div>

            <div className={colors.card}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${colors.textPrimary}`}>Total Commission</h3>
                <DollarSign className={`w-5 h-5 ${colors.success}`} />
              </div>
              <p className={`text-2xl font-bold ${colors.textPrimary}`}>
                ${stats.totalCommissionPaid.toLocaleString()}
              </p>
              <p className={`text-sm ${colors.success}`}>
                +12% this month
              </p>
            </div>

            <div className={colors.card}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${colors.textPrimary}`}>Avg Performance</h3>
                <TrendingUp className={`w-5 h-5 ${colors.success}`} />
              </div>
              <p className={`text-2xl font-bold ${colors.textPrimary}`}>
                {stats.averagePerformanceScore}%
              </p>
              <p className={`text-sm ${colors.success}`}>
                Excellent rating
              </p>
            </div>

            <div className={colors.card}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${colors.textPrimary}`}>Active Challenges</h3>
                <Target className={`w-5 h-5 ${colors.warning}`} />
              </div>
              <p className={`text-2xl font-bold ${colors.textPrimary}`}>{stats.challengesInProgress}</p>
              <p className={`text-sm ${colors.textSecondary}`}>
                In progress
              </p>
            </div>
          </div>
        )}

        {/* Tier Distribution */}
        {stats && (
          <div className={colors.card}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${colors.textPrimary}`}>Tier Distribution</h3>
              <PieChart className={`w-5 h-5 ${colors.accent}`} />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {Object.entries(stats.tierDistribution).map(([tierName, count]) => {
                const TierIcon = getTierIcon(tierName);
                return (
                  <div key={tierName} className={`${colors.cardInner} text-center`}>
                    <TierIcon className={`w-8 h-8 ${getTierColor(tierName)} mx-auto mb-2`} />
                    <p className={`text-lg font-bold ${colors.textPrimary}`}>{count}</p>
                    <p className={`text-sm ${colors.textSecondary} capitalize`}>{tierName}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className={`${colors.card} space-y-4`}>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${colors.textMuted}`} />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 ${colors.input} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
            </div>
            
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className={`px-4 py-2 ${colors.input} border rounded-lg focus:ring-2 focus:ring-blue-500`}
            >
              <option value="all">All Tiers</option>
              <option value="rookie">Rookie</option>
              <option value="bronze">Bronze</option>
              <option value="iron">Iron</option>
              <option value="steel">Steel</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
              <option value="diamond">Diamond</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2 ${colors.input} border rounded-lg focus:ring-2 focus:ring-blue-500`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-4 py-2 ${colors.input} border rounded-lg focus:ring-2 focus:ring-blue-500`}
            >
              <option value="performance">Sort by Performance</option>
              <option value="tier">Sort by Tier</option>
              <option value="earnings">Sort by Earnings</option>
              <option value="referrals">Sort by Referrals</option>
            </select>
          </div>
        </div>

        {/* Agents Grid/List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredAgents.map((agent) => {
            const TierIcon = getTierIcon(agent.currentTier);
            
            if (viewMode === 'list') {
              return (
                <div key={agent.id} className={`${colors.card} hover:scale-105 transition-transform cursor-pointer`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`w-12 h-12 bg-gradient-to-r ${getTierGradient(agent.currentTier)} rounded-full flex items-center justify-center`}>
                          <TierIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getOnlineStatusColor(agent.realTimeStats?.onlineStatus || 'offline')} rounded-full border-2 border-gray-800`}></div>
                      </div>
                      
                      <div>
                        <h4 className={`font-semibold ${colors.textPrimary}`}>
                          {agent.user?.firstName} {agent.user?.lastName}
                        </h4>
                        <p className={`text-sm ${colors.textSecondary}`}>{agent.user?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-sm font-medium ${getTierColor(agent.currentTier)} capitalize`}>
                            {agent.currentTier}
                          </span>
                          {agent.isChallengeActive && (
                            <span className={`text-xs px-2 py-1 bg-blue-600 text-white rounded-full`}>
                              Challenging {agent.currentChallengeTier}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-semibold ${colors.textPrimary}`}>
                        ${agent.weeklyPerformance?.currentWeekEarnings.toFixed(2)}
                      </p>
                      <p className={`text-sm ${colors.textSecondary}`}>
                        {agent.totalDirectReferrals} referrals
                      </p>
                      <div className={`text-sm font-medium ${getPerformanceColor(agent.weeklyPerformance?.performanceRating || 'average')}`}>
                        {agent.weeklyPerformance?.performanceRating}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Grid view
            return (
              <div key={agent.id} className={`${colors.card} hover:scale-105 transition-transform cursor-pointer`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="relative">
                    <div className={`w-16 h-16 bg-gradient-to-r ${getTierGradient(agent.currentTier)} rounded-full flex items-center justify-center`}>
                      <TierIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${getOnlineStatusColor(agent.realTimeStats?.onlineStatus || 'offline')} rounded-full border-2 border-gray-800`}></div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`text-sm font-medium ${getPerformanceColor(agent.weeklyPerformance?.performanceRating || 'average')} capitalize`}>
                      {agent.weeklyPerformance?.performanceRating}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className={`font-semibold ${colors.textPrimary} mb-1`}>
                    {agent.user?.firstName} {agent.user?.lastName}
                  </h4>
                  <p className={`text-sm ${colors.textSecondary} mb-2`}>{agent.user?.email}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-medium ${getTierColor(agent.currentTier)} capitalize`}>
                      {agent.currentTier} Agent
                    </span>
                    {agent.isChallengeActive && (
                      <span className={`text-xs px-2 py-1 bg-blue-600 text-white rounded-full`}>
                        Challenge Active
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${colors.textSecondary}`}>Total Referrals</span>
                    <span className={`font-semibold ${colors.textPrimary}`}>{agent.totalDirectReferrals}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${colors.textSecondary}`}>Week Earnings</span>
                    <span className={`font-semibold ${colors.success}`}>
                      ${agent.weeklyPerformance?.currentWeekEarnings.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${colors.textSecondary}`}>Commission Rate</span>
                    <span className={`font-semibold ${colors.accent}`}>
                      {agent.tier?.commissionRate}%
                    </span>
                  </div>
                  
                  {agent.isChallengeActive && (
                    <div className="mt-4 p-3 bg-blue-600/20 rounded-lg border border-blue-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${colors.textPrimary}`}>
                          {agent.currentChallengeTier} Challenge
                        </span>
                        <Clock className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, (agent.challengeDirectReferrals / (agent.challengeTier?.referralRequirement || 1)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className={`text-xs ${colors.textSecondary}`}>
                        {agent.challengeDirectReferrals} / {agent.challengeTier?.referralRequirement} referrals
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setSelectedAgent(agent)}
                    className={`px-4 py-2 ${colors.buttonPrimary} rounded-lg text-sm transition-colors flex items-center gap-2`}
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Agent Detail Modal */}
        {selectedAgent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`${colors.card} max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-2xl font-bold ${colors.textPrimary}`}>Agent Details</h3>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className={`p-2 ${colors.buttonSecondary} rounded-lg`}
                >
                  ×
                </button>
              </div>
              
              {/* Agent detail content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className={`font-semibold ${colors.textPrimary} mb-4`}>Profile Information</h4>
                  <div className="space-y-3">
                    <div>
                      <span className={colors.textSecondary}>Name:</span>
                      <span className={`ml-2 ${colors.textPrimary}`}>
                        {selectedAgent.user?.firstName} {selectedAgent.user?.lastName}
                      </span>
                    </div>
                    <div>
                      <span className={colors.textSecondary}>Email:</span>
                      <span className={`ml-2 ${colors.textPrimary}`}>{selectedAgent.user?.email}</span>
                    </div>
                    <div>
                      <span className={colors.textSecondary}>Current Tier:</span>
                      <span className={`ml-2 ${getTierColor(selectedAgent.currentTier)} font-semibold capitalize`}>
                        {selectedAgent.currentTier}
                      </span>
                    </div>
                    <div>
                      <span className={colors.textSecondary}>Status:</span>
                      <span className={`ml-2 ${colors.success} capitalize`}>{selectedAgent.status}</span>
                    </div>
                    <div>
                      <span className={colors.textSecondary}>Commission Rate:</span>
                      <span className={`ml-2 ${colors.accent}`}>{selectedAgent.tier?.commissionRate}%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className={`font-semibold ${colors.textPrimary} mb-4`}>Performance Metrics</h4>
                  <div className="space-y-3">
                    <div>
                      <span className={colors.textSecondary}>Total Referrals:</span>
                      <span className={`ml-2 ${colors.textPrimary}`}>{selectedAgent.totalDirectReferrals}</span>
                    </div>
                    <div>
                      <span className={colors.textSecondary}>Total Commission:</span>
                      <span className={`ml-2 ${colors.success}`}>${selectedAgent.totalCommissionEarned.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className={colors.textSecondary}>Weekly Earnings:</span>
                      <span className={`ml-2 ${colors.success}`}>
                        ${selectedAgent.weeklyPerformance?.currentWeekEarnings.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className={colors.textSecondary}>Performance Rating:</span>
                      <span className={`ml-2 ${getPerformanceColor(selectedAgent.weeklyPerformance?.performanceRating || 'average')} capitalize`}>
                        {selectedAgent.weeklyPerformance?.performanceRating}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedAgent.isChallengeActive && (
                <div className="mt-6">
                  <h4 className={`font-semibold ${colors.textPrimary} mb-4`}>Active Challenge</h4>
                  <div className={`${colors.cardInner} p-4`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`font-medium ${colors.textPrimary}`}>
                        {selectedAgent.currentChallengeTier} Challenge
                      </span>
                      <span className={`text-sm ${colors.textSecondary}`}>
                        Attempt {selectedAgent.challengeAttempts + 1}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
                      <div 
                        className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, (selectedAgent.challengeDirectReferrals / (selectedAgent.challengeTier?.referralRequirement || 1)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className={colors.textSecondary}>
                        Progress: {selectedAgent.challengeDirectReferrals} / {selectedAgent.challengeTier?.referralRequirement} referrals
                      </span>
                      <span className={colors.textSecondary}>
                        {selectedAgent.daysRemainingInChallenge} days remaining
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              <div className="mt-6">
                <h4 className={`font-semibold ${colors.textPrimary} mb-4`}>Admin Actions</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleAgentAction(selectedAgent.id, 'manual_tier_update')}
                    className={`px-4 py-2 ${colors.buttonPrimary} rounded-lg text-sm transition-colors flex items-center gap-2`}
                  >
                    <ArrowUp className="w-4 h-4" />
                    Promote Tier
                  </button>
                  
                  <button
                    onClick={() => handleAgentAction(selectedAgent.id, 'reset_challenge')}
                    className={`px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset Challenge
                  </button>
                  
                  {selectedAgent.status === 'active' ? (
                    <button
                      onClick={() => handleAgentAction(selectedAgent.id, 'suspend')}
                      className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2`}
                    >
                      <Pause className="w-4 h-4" />
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAgentAction(selectedAgent.id, 'activate')}
                      className={`px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2`}
                    >
                      <Play className="w-4 h-4" />
                      Activate
                    </button>
                  )}
                  
                  <button
                    onClick={() => AgentDashboardCommunicationService.syncAgentData(selectedAgent.userId)}
                    className={`px-4 py-2 ${colors.buttonSecondary} rounded-lg text-sm transition-colors flex items-center gap-2`}
                  >
                    <Activity className="w-4 h-4" />
                    Sync Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No results */}
        {filteredAgents.length === 0 && !loading && (
          <div className={`${colors.card} text-center py-12`}>
            <Users className={`w-16 h-16 ${colors.textMuted} mx-auto mb-4`} />
            <h3 className={`text-xl font-semibold ${colors.textPrimary} mb-2`}>No agents found</h3>
            <p className={colors.textSecondary}>
              Try adjusting your filters or search terms.
            </p>
          </div>
        )}
        
          </>
        )}
      </div>
    </div>
  );
};

export default AgentManagement;
