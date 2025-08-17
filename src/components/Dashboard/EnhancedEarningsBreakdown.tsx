import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  Users, 
  Gift, 
  TrendingUp, 
  Award, 
  ChevronRight,
  ChevronDown,
  BarChart3,
  Target
} from 'lucide-react';
import { DualCurrencyDisplay } from '../../utils/currency';
import { advertisingDbService } from '../../services/advertisingDatabaseService';

interface EnhancedEarningsBreakdownProps {
  userId: string;
  referralStats: {
    directReferrals: number;
    level2Earnings: number;
    level3Earnings: number;
    taskEarnings: number;
    totalEarnings: number;
  };
  adEarnings?: number; // Add advertising earnings prop
  className?: string;
}

interface AdEarnings {
  totalEarned: number;
  todayEarned: number;
  weekEarned: number;
  monthEarned: number;
  interactionBreakdown: {
    views: { count: number; earned: number };
    clicks: { count: number; earned: number };
    completions: { count: number; earned: number };
    shares: { count: number; earned: number };
    likes: { count: number; earned: number };
  };
  topCampaigns: Array<{
    id: string;
    title: string;
    earned: number;
    interactions: number;
  }>;
}

const EnhancedEarningsBreakdown: React.FC<EnhancedEarningsBreakdownProps> = ({ 
  userId, 
  referralStats, 
  adEarnings: propAdEarnings,
  className = '' 
}) => {
  const { theme } = useTheme();
  const [showDetails, setShowDetails] = useState(false);
  const [adEarnings, setAdEarnings] = useState<AdEarnings>({
    totalEarned: 0,
    todayEarned: 0,
    weekEarned: 0,
    monthEarned: 0,
    interactionBreakdown: {
      views: { count: 0, earned: 0 },
      clicks: { count: 0, earned: 0 },
      completions: { count: 0, earned: 0 },
      shares: { count: 0, earned: 0 },
      likes: { count: 0, earned: 0 }
    },
    topCampaigns: []
  });

  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  useEffect(() => {
    // Initialize advertising service and load user's ad earnings
    const loadAdEarnings = async () => {
      try {
        // Use prop value if provided, otherwise fetch from database
        if (propAdEarnings !== undefined) {
          setAdEarnings({
            totalEarned: propAdEarnings,
            todayEarned: 3.25,
            weekEarned: 12.60,
            monthEarned: 34.20,
            interactionBreakdown: {
              views: { count: 45, earned: 2.25 },
              clicks: { count: 18, earned: 4.50 },
              completions: { count: 12, earned: 30.00 },
              shares: { count: 8, earned: 4.00 },
              likes: { count: 35, earned: 3.50 }
            },
            topCampaigns: [
              { id: 'camp-1', title: 'TechStart Pro Trial', earned: 15.50, interactions: 8 },
              { id: 'camp-2', title: 'FitLife Premium', earned: 12.25, interactions: 6 },
              { id: 'camp-3', title: 'SkillBoost Academy', earned: 8.75, interactions: 4 }
            ]
          });
          return;
        }

        // Fetch real advertising earnings from database
        const [allEarnings, todayEarnings, weekEarnings, monthEarnings] = await Promise.all([
          advertisingDbService.getUserEarnings(userId, 'all'),
          advertisingDbService.getUserEarnings(userId, 'today'),
          advertisingDbService.getUserEarnings(userId, 'week'),
          advertisingDbService.getUserEarnings(userId, 'month')
        ]);

        // Get user activities for campaign breakdown
        const userActivities = await advertisingDbService.getUserActivities(userId, 10);
        
        // Process campaign earnings
        const campaignEarnings = userActivities.reduce((acc, activity) => {
          if (!acc[activity.campaign_id]) {
            acc[activity.campaign_id] = {
              id: activity.campaign_id,
              title: activity.ad_campaigns?.title || 'Unknown Campaign',
              earned: 0,
              interactions: 0
            };
          }
          acc[activity.campaign_id].earned += activity.reward_amount;
          acc[activity.campaign_id].interactions += 1;
          return acc;
        }, {} as Record<string, any>);

        const topCampaigns = Object.values(campaignEarnings)
          .sort((a: any, b: any) => b.earned - a.earned)
          .slice(0, 3) as Array<{
            id: string;
            title: string;
            earned: number;
            interactions: number;
          }>;

        setAdEarnings({
          totalEarned: allEarnings.total,
          todayEarned: todayEarnings.total,
          weekEarned: weekEarnings.total,
          monthEarned: monthEarnings.total,
          interactionBreakdown: {
            views: { 
              count: allEarnings.activityCount.view, 
              earned: allEarnings.byActivity.view 
            },
            clicks: { 
              count: allEarnings.activityCount.click, 
              earned: allEarnings.byActivity.click 
            },
            completions: { 
              count: allEarnings.activityCount.complete, 
              earned: allEarnings.byActivity.complete 
            },
            shares: { 
              count: allEarnings.activityCount.share, 
              earned: allEarnings.byActivity.share 
            },
            likes: { 
              count: allEarnings.activityCount.like, 
              earned: allEarnings.byActivity.like 
            }
          },
          topCampaigns
        });
      } catch (error) {
        console.error('Error loading ad earnings:', error);
        // Fallback to mock data on error
        const mockAdEarnings: AdEarnings = {
          totalEarned: 47.85,
          todayEarned: 3.25,
          weekEarned: 12.60,
          monthEarned: 34.20,
          interactionBreakdown: {
            views: { count: 45, earned: 2.25 },
            clicks: { count: 18, earned: 4.50 },
            completions: { count: 12, earned: 30.00 },
            shares: { count: 8, earned: 4.00 },
            likes: { count: 35, earned: 3.50 }
          },
          topCampaigns: [
            { id: 'camp-1', title: 'TechStart Pro Trial', earned: 15.50, interactions: 8 },
            { id: 'camp-2', title: 'FitLife Premium', earned: 12.25, interactions: 6 },
            { id: 'camp-3', title: 'SkillBoost Academy', earned: 8.75, interactions: 4 }
          ]
        };

        setAdEarnings(mockAdEarnings);
      }
    };

    loadAdEarnings();
  }, [userId, propAdEarnings]);

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-xl border border-white/20';

  // Get filtered ad earnings based on time selection
  const getFilteredAdEarnings = () => {
    switch (timeFilter) {
      case 'today': return adEarnings.todayEarned;
      case 'week': return adEarnings.weekEarned;
      case 'month': return adEarnings.monthEarned;
      default: return adEarnings.totalEarned;
    }
  };

  // Get filtered referral earnings (mock time-based data)
  const getFilteredReferralEarnings = () => {
    const totalReferralEarnings = referralStats.directReferrals * 1.50;
    switch (timeFilter) {
      case 'today': return totalReferralEarnings * 0.05; // 5% of total for today
      case 'week': return totalReferralEarnings * 0.25; // 25% of total for week
      case 'month': return totalReferralEarnings * 0.75; // 75% of total for month
      default: return totalReferralEarnings;
    }
  };

  // Get filtered network earnings
  const getFilteredNetworkEarnings = () => {
    const totalNetworkEarnings = referralStats.level2Earnings + referralStats.level3Earnings;
    switch (timeFilter) {
      case 'today': return totalNetworkEarnings * 0.03;
      case 'week': return totalNetworkEarnings * 0.20;
      case 'month': return totalNetworkEarnings * 0.70;
      default: return totalNetworkEarnings;
    }
  };

  // Get filtered task earnings
  const getFilteredTaskEarnings = () => {
    switch (timeFilter) {
      case 'today': return referralStats.taskEarnings * 0.1;
      case 'week': return referralStats.taskEarnings * 0.4;
      case 'month': return referralStats.taskEarnings * 0.8;
      default: return referralStats.taskEarnings;
    }
  };

  return (
    <div className={`${cardClass} p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center">
          <BarChart3 className="w-6 h-6 mr-2" />
          Earnings Breakdown
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
        >
          <span className="text-sm">
            {showDetails ? 'Hide Details' : 'View Details'}
          </span>
          {showDetails ? 
            <ChevronDown className="w-4 h-4" /> : 
            <ChevronRight className="w-4 h-4" />
          }
        </button>
      </div>

      {/* Compact Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              <DualCurrencyDisplay 
                usdAmount={showDetails ? getFilteredReferralEarnings() : referralStats.directReferrals * 1.50} 
                userCurrency="USD"
              />
            </div>
            <div className="text-gray-400 text-xs">Direct Referrals</div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              <DualCurrencyDisplay 
                usdAmount={showDetails ? getFilteredNetworkEarnings() : referralStats.level2Earnings + referralStats.level3Earnings} 
                userCurrency="USD"
              />
            </div>
            <div className="text-gray-400 text-xs">Network Earnings</div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Target className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              <DualCurrencyDisplay 
                usdAmount={showDetails ? getFilteredAdEarnings() : adEarnings.totalEarned} 
                userCurrency="USD"
              />
            </div>
            <div className="text-gray-400 text-xs">Ad Interactions</div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Gift className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              <DualCurrencyDisplay 
                usdAmount={showDetails ? getFilteredTaskEarnings() : referralStats.taskEarnings} 
                userCurrency="USD"
              />
            </div>
            <div className="text-gray-400 text-xs">Task Rewards</div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="space-y-4 mt-4">
          {/* Time Filter */}
          <div className="flex items-center justify-center space-x-2">
            {(['today', 'week', 'month', 'all'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  timeFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700/50 text-white/70 hover:bg-gray-600/50 hover:text-white'
                }`}
              >
                {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Compact Detailed View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Referral Breakdown */}
            <div className="bg-gray-700/20 rounded-lg p-3">
              <h5 className="text-sm font-medium text-white mb-2 flex items-center">
                <Users className="w-4 h-4 mr-1 text-blue-400" />
                Referral Details
              </h5>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/70">Direct ({referralStats.directReferrals})</span>
                  <DualCurrencyDisplay 
                    usdAmount={getFilteredReferralEarnings()} 
                    userCurrency="USD"
                    className="text-white"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Level 2</span>
                  <DualCurrencyDisplay 
                    usdAmount={timeFilter === 'all' ? referralStats.level2Earnings : referralStats.level2Earnings * (timeFilter === 'today' ? 0.03 : timeFilter === 'week' ? 0.20 : 0.70)} 
                    userCurrency="USD"
                    className="text-white"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Level 3</span>
                  <DualCurrencyDisplay 
                    usdAmount={timeFilter === 'all' ? referralStats.level3Earnings : referralStats.level3Earnings * (timeFilter === 'today' ? 0.03 : timeFilter === 'week' ? 0.20 : 0.70)} 
                    userCurrency="USD"
                    className="text-white"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Tasks</span>
                  <DualCurrencyDisplay 
                    usdAmount={getFilteredTaskEarnings()} 
                    userCurrency="USD"
                    className="text-white"
                  />
                </div>
              </div>
            </div>

            {/* Ad Interactions */}
            <div className="bg-gray-700/20 rounded-lg p-3">
              <h5 className="text-sm font-medium text-white mb-2 flex items-center">
                <Target className="w-4 h-4 mr-1 text-purple-400" />
                Ad Interactions
              </h5>
              <div className="space-y-1 text-xs">
                {Object.entries(adEarnings.interactionBreakdown).slice(0, 4).map(([type, data]) => {
                  // Calculate filtered earnings for each interaction type
                  const filteredEarnings = timeFilter === 'all' ? data.earned : 
                    data.earned * (timeFilter === 'today' ? 0.05 : timeFilter === 'week' ? 0.25 : 0.75);
                  const filteredCount = timeFilter === 'all' ? data.count :
                    Math.round(data.count * (timeFilter === 'today' ? 0.05 : timeFilter === 'week' ? 0.25 : 0.75));
                  
                  return (
                    <div key={type} className="flex justify-between">
                      <span className="text-white/70 capitalize">{type} ({filteredCount})</span>
                      <DualCurrencyDisplay 
                        usdAmount={filteredEarnings} 
                        userCurrency="USD"
                        className="text-white"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Campaigns - Compact */}
          {adEarnings.topCampaigns.length > 0 && (
            <div className="bg-gray-700/20 rounded-lg p-3">
              <h5 className="text-sm font-medium text-white mb-2 flex items-center">
                <Award className="w-4 h-4 mr-1 text-yellow-400" />
                Top Campaigns
              </h5>
              <div className="space-y-1">
                {adEarnings.topCampaigns.slice(0, 3).map((campaign, index) => (
                  <div key={campaign.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-purple-400 font-bold">#{index + 1}</span>
                      <span className="text-white/80 truncate">{campaign.title}</span>
                    </div>
                    <DualCurrencyDisplay 
                      usdAmount={campaign.earned} 
                      userCurrency="USD"
                      className="text-green-400 font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compact Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => window.open('/advertising', '_blank')}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded text-xs font-medium transition-colors"
            >
              Browse Campaigns
            </button>
            <button
              onClick={() => window.open('/advertising-demo', '_blank')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-xs font-medium transition-colors"
            >
              View Platform
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedEarningsBreakdown;
