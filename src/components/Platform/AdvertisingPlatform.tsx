import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Monitor, 
  Target, 
  DollarSign, 
  Eye, 
  MousePointer, 
  TrendingUp,
  Users,
  BarChart3,
  Clock,
  MapPin,
  Star,
  Play,
  Pause,
  RefreshCw,
  Filter,
  Search,
  Zap,
  Heart,
  Share2,
  MessageSquare,
  Award,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface AdCampaign {
  id: string;
  title: string;
  description: string;
  advertiser: {
    name: string;
    logo?: string;
    verified: boolean;
  };
  type: 'video' | 'banner' | 'interactive' | 'survey' | 'social';
  reward: {
    amount: number;
    currency: string;
    type: 'per_click' | 'per_view' | 'per_completion' | 'per_action';
  };
  targeting: {
    countries: string[];
    ageRange: [number, number];
    interests: string[];
    demographics: string[];
  };
  content: {
    imageUrl?: string;
    videoUrl?: string;
    ctaText: string;
    landingUrl: string;
  };
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    engagement: number;
  };
  budget: {
    total: number;
    spent: number;
    dailyLimit: number;
  };
  schedule: {
    startDate: Date;
    endDate: Date;
    timezone: string;
  };
  status: 'active' | 'paused' | 'completed' | 'pending';
  placement: 'homepage' | 'dashboard' | 'tasks' | 'sidebar' | 'native';
  priority: number;
}

interface UserActivity {
  id: string;
  userId: string;
  campaignId: string;
  action: 'view' | 'click' | 'complete' | 'share' | 'like';
  timestamp: Date;
  reward: number;
  location?: string;
  device?: string;
}

const AdvertisingPlatform: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [userEarnings, setUserEarnings] = useState(0);

  const isDark = theme === 'professional';

  useEffect(() => {
    // Simulate loading campaigns from API
    const mockCampaigns: AdCampaign[] = [
      {
        id: 'camp-001',
        title: 'Crypto Trading Platform',
        description: 'Start your crypto journey with our secure platform. Get $10 bonus for signing up!',
        advertiser: {
          name: 'CryptoMax',
          verified: true
        },
        type: 'interactive',
        reward: {
          amount: 5.50,
          currency: 'USD',
          type: 'per_completion'
        },
        targeting: {
          countries: ['US', 'CA', 'GB', 'AU'],
          ageRange: [18, 65],
          interests: ['finance', 'cryptocurrency', 'investment'],
          demographics: ['tech-savvy', 'income-focused']
        },
        content: {
          imageUrl: '/api/placeholder/400/300',
          ctaText: 'Start Trading Now',
          landingUrl: 'https://cryptomax.example.com/signup'
        },
        metrics: {
          impressions: 125000,
          clicks: 6250,
          conversions: 1875,
          engagement: 5.2
        },
        budget: {
          total: 50000,
          spent: 28500,
          dailyLimit: 2000
        },
        schedule: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-03-31'),
          timezone: 'UTC'
        },
        status: 'active',
        placement: 'homepage',
        priority: 10
      },
      {
        id: 'camp-002',
        title: 'Fitness App Download',
        description: 'Transform your health with our AI-powered fitness app. Download and complete onboarding!',
        advertiser: {
          name: 'FitLife Pro',
          verified: true
        },
        type: 'video',
        reward: {
          amount: 3.25,
          currency: 'USD',
          type: 'per_completion'
        },
        targeting: {
          countries: ['US', 'CA', 'GB', 'AU', 'DE'],
          ageRange: [16, 55],
          interests: ['health', 'fitness', 'wellness'],
          demographics: ['health-conscious', 'active-lifestyle']
        },
        content: {
          videoUrl: '/api/placeholder/video/fitness',
          ctaText: 'Download Free App',
          landingUrl: 'https://fitlifepro.example.com/download'
        },
        metrics: {
          impressions: 89000,
          clicks: 4450,
          conversions: 1247,
          engagement: 6.8
        },
        budget: {
          total: 25000,
          spent: 15750,
          dailyLimit: 1200
        },
        schedule: {
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-04-15'),
          timezone: 'UTC'
        },
        status: 'active',
        placement: 'dashboard',
        priority: 8
      },
      {
        id: 'camp-003',
        title: 'Online Course Survey',
        description: 'Help us improve our online learning platform. Share your thoughts and earn rewards!',
        advertiser: {
          name: 'EduTech Solutions',
          verified: false
        },
        type: 'survey',
        reward: {
          amount: 2.00,
          currency: 'USD',
          type: 'per_completion'
        },
        targeting: {
          countries: ['US', 'CA', 'GB', 'AU', 'IN'],
          ageRange: [18, 45],
          interests: ['education', 'technology', 'career-development'],
          demographics: ['students', 'professionals']
        },
        content: {
          imageUrl: '/api/placeholder/400/250',
          ctaText: 'Take Survey',
          landingUrl: 'https://edutech.example.com/survey'
        },
        metrics: {
          impressions: 67000,
          clicks: 3350,
          conversions: 2010,
          engagement: 8.1
        },
        budget: {
          total: 15000,
          spent: 8200,
          dailyLimit: 800
        },
        schedule: {
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-03-01'),
          timezone: 'UTC'
        },
        status: 'active',
        placement: 'tasks',
        priority: 6
      }
    ];

    setCampaigns(mockCampaigns);
    setUserEarnings(247.85); // Simulated user earnings
  }, []);

  const handleCampaignInteraction = (campaign: AdCampaign, action: UserActivity['action']) => {
    if (!user) return;

    const activity: UserActivity = {
      id: `activity-${Date.now()}`,
      userId: user.id,
      campaignId: campaign.id,
      action,
      timestamp: new Date(),
      reward: getRewardForAction(campaign, action),
      location: 'Unknown', // Could be detected via IP
      device: 'Web'
    };

    setUserActivities(prev => [activity, ...prev]);
    setUserEarnings(prev => prev + activity.reward);

    // Update campaign metrics
    setCampaigns(prev => prev.map(c => {
      if (c.id === campaign.id) {
        return {
          ...c,
          metrics: {
            ...c.metrics,
            [action === 'view' ? 'impressions' : action === 'click' ? 'clicks' : 'conversions']: 
              c.metrics[action === 'view' ? 'impressions' : action === 'click' ? 'clicks' : 'conversions'] + 1
          },
          budget: {
            ...c.budget,
            spent: c.budget.spent + activity.reward
          }
        };
      }
      return c;
    }));
  };

  const getRewardForAction = (campaign: AdCampaign, action: UserActivity['action']): number => {
    switch (action) {
      case 'view':
        return campaign.reward.type === 'per_view' ? campaign.reward.amount : 0.05;
      case 'click':
        return campaign.reward.type === 'per_click' ? campaign.reward.amount : 0.25;
      case 'complete':
        return campaign.reward.type === 'per_completion' ? campaign.reward.amount : 1.00;
      case 'share':
        return 0.50;
      case 'like':
        return 0.10;
      default:
        return 0;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesFilter = activeFilter === 'all' || campaign.type === activeFilter;
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.advertiser.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch && campaign.status === 'active';
  });

  const cardClass = isDark 
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-xl border border-white/20';

  const bgClass = isDark 
    ? 'bg-[#181c23]' 
    : 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

  const renderCampaignCard = (campaign: AdCampaign) => (
    <div key={campaign.id} className={`${cardClass} p-6 hover:scale-105 transition-all duration-200 cursor-pointer`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{campaign.title}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">{campaign.advertiser.name}</span>
              {campaign.advertiser.verified && (
                <CheckCircle className="w-4 h-4 text-blue-400" />
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">
            ${campaign.reward.amount}
          </div>
          <div className="text-xs text-gray-400">{campaign.reward.type.replace('_', ' ')}</div>
        </div>
      </div>

      <p className="text-gray-300 text-sm mb-4 line-clamp-2">{campaign.description}</p>

      <div className="flex items-center space-x-4 mb-4 text-xs text-gray-400">
        <div className="flex items-center space-x-1">
          <Eye className="w-3 h-3" />
          <span>{campaign.metrics.impressions.toLocaleString()}</span>
        </div>
        <div className="flex items-center space-x-1">
          <MousePointer className="w-3 h-3" />
          <span>{campaign.metrics.clicks.toLocaleString()}</span>
        </div>
        <div className="flex items-center space-x-1">
          <TrendingUp className="w-3 h-3" />
          <span>{campaign.metrics.engagement}%</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs ${
            campaign.type === 'video' ? 'bg-red-500/20 text-red-300' :
            campaign.type === 'survey' ? 'bg-blue-500/20 text-blue-300' :
            campaign.type === 'interactive' ? 'bg-purple-500/20 text-purple-300' :
            'bg-gray-500/20 text-gray-300'
          }`}>
            {campaign.type}
          </span>
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <MapPin className="w-3 h-3" />
            <span>{campaign.targeting.countries.length} countries</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleCampaignInteraction(campaign, 'view')}
            className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
            title="View Campaign"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleCampaignInteraction(campaign, 'click')}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200"
          >
            {campaign.content.ctaText}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${bgClass} py-8`}>
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
              <Monitor className="w-8 h-8 mr-3 text-purple-400" />
              Advertising Platform
            </h1>
            <p className="text-white/70">Discover campaigns and earn rewards for your engagement</p>
          </div>

          {/* Earnings Dashboard */}
          <div className={`${cardClass} p-6 mb-8`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">${userEarnings.toFixed(2)}</h3>
                  <p className="text-gray-400">Total Earnings</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{userActivities.filter(a => a.action === 'view').length}</div>
                  <div className="text-gray-400 text-sm">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{userActivities.filter(a => a.action === 'click').length}</div>
                  <div className="text-gray-400 text-sm">Clicks</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{userActivities.filter(a => a.action === 'complete').length}</div>
                  <div className="text-gray-400 text-sm">Completions</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className={`${cardClass} p-6 mb-8`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Available Campaigns</h3>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </button>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search campaigns..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                {['all', 'video', 'survey', 'interactive', 'social'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                      activeFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/30 text-gray-300 hover:bg-gray-600/30'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Campaign Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCampaigns.map(renderCampaignCard)}
            </div>

            {filteredCampaigns.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Campaigns Found</h3>
                <p className="text-gray-400">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>

          {/* Analytics Panel */}
          {showAnalytics && (
            <div className={`${cardClass} p-6 mb-8`}>
              <h3 className="text-xl font-bold text-white mb-6">Platform Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Monitor className="w-8 h-8 text-blue-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">{campaigns.length}</div>
                      <div className="text-gray-400 text-sm">Active Campaigns</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Eye className="w-8 h-8 text-green-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {campaigns.reduce((sum, c) => sum + c.metrics.impressions, 0).toLocaleString()}
                      </div>
                      <div className="text-gray-400 text-sm">Total Impressions</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <MousePointer className="w-8 h-8 text-purple-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {campaigns.reduce((sum, c) => sum + c.metrics.clicks, 0).toLocaleString()}
                      </div>
                      <div className="text-gray-400 text-sm">Total Clicks</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-8 h-8 text-yellow-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">
                        ${campaigns.reduce((sum, c) => sum + c.budget.spent, 0).toLocaleString()}
                      </div>
                      <div className="text-gray-400 text-sm">Total Spent</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {userActivities.length > 0 && (
            <div className={`${cardClass} p-6`}>
              <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
              
              <div className="space-y-4">
                {userActivities.slice(0, 5).map(activity => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.action === 'view' ? 'bg-blue-500/20 text-blue-400' :
                        activity.action === 'click' ? 'bg-green-500/20 text-green-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {activity.action === 'view' ? <Eye className="w-5 h-5" /> :
                         activity.action === 'click' ? <MousePointer className="w-5 h-5" /> :
                         <CheckCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {activity.action === 'view' ? 'Viewed' :
                           activity.action === 'click' ? 'Clicked' :
                           'Completed'} campaign
                        </div>
                        <div className="text-gray-400 text-sm">
                          {activity.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-green-400 font-bold">
                      +${activity.reward.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvertisingPlatform;
