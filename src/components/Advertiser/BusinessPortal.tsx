
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Building, BarChart3, Target, DollarSign, Settings, 
  HelpCircle, Plus, TrendingUp, Users, Play, PauseCircle,
  Calendar, CheckCircle, AlertTriangle, PlayCircle, 
  CreditCard, FileText, Activity, ArrowUp, ArrowDown,
  Eye, MousePointer, X, ChevronRight, Briefcase
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import CampaignHistory from './CampaignHistory';
import PerformanceAnalytics from './PerformanceAnalytics';
import Billing from './Billing';
import ActiveCampaigns from './ActiveCampaigns';
import AudienceInsights from './AudienceInsights';
import BusinessSettings from './BusinessSettings';
import Support from './Support';

interface Campaign {
  id: string;
  name: string;
  type: 'video' | 'survey' | 'social';
  status: 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  reach: number;
  completion: number;
  createdAt: Date;
  duration: number;
}

interface ActivityItem {
  id: string;
  type: 'completion' | 'warning' | 'launch' | 'payment';
  title: string;
  description: string;
  timestamp: Date;
  icon: any;
  color: string;
}

const CampaignOverview = ({ stats, recentActivity, campaigns, handleCreateCampaign }) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-sky-300 mb-2">Campaign Overview</h1>
        <p className="text-gray-200">An overview of your campaign performance and recent activities.</p>
      </div>
      <button
        onClick={handleCreateCampaign}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all"
      >
        <Plus className="w-5 h-5" />
        <span>Create Campaign</span>
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gray-800/50 p-4 rounded-lg"><h3 class="text-sm text-gray-400">Total Campaigns</h3><p class="text-2xl font-bold text-white">{stats.totalCampaigns}</p></div>
        <div className="bg-gray-800/50 p-4 rounded-lg"><h3 class="text-sm text-gray-400">Active Now</h3><p class="text-2xl font-bold text-white">{stats.activeNow}</p></div>
        <div className="bg-gray-800/50 p-4 rounded-lg"><h3 class="text-sm text-gray-400">Total Reach</h3><p class="text-2xl font-bold text-white">{stats.totalReach.toLocaleString()}</p></div>
        <div className="bg-gray-800/50 p-4 rounded-lg"><h3 class="text-sm text-gray-400">Total Spent</h3><p class="text-2xl font-bold text-white">{formatCurrency(stats.totalSpent)}</p></div>
        <div className="bg-gray-800/50 p-4 rounded-lg"><h3 class="text-sm text-gray-400">Avg. Completion</h3><p class="text-2xl font-bold text-white">{stats.avgCompletion}%</p></div>
        <div className="bg-gray-800/50 p-4 rounded-lg"><h3 class="text-sm text-gray-400">Monthly Growth</h3><p class="text-2xl font-bold text-green-400">+{stats.monthlyGrowth}%</p></div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800/50 p-6 rounded-lg">
            <h3 class="text-lg font-bold text-white mb-4">Recent Activity</h3>
            <ul class="space-y-4">
                {recentActivity.map(item => (
                    <li key={item.id} class="flex items-start space-x-4">
                        <div class={item.color + " mt-1"}><item.icon size={20} /></div>
                        <div>
                            <p class="font-medium text-white">{item.title}</p>
                            <p class="text-sm text-gray-400">{item.description}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-lg">
            <h3 class="text-lg font-bold text-white mb-4">Active Campaigns</h3>
            <ul class="space-y-4">
                {campaigns.filter(c => c.status === 'active').map(campaign => (
                    <li key={campaign.id}>
                        <p class="font-medium text-white">{campaign.name}</p>
                        <div class="flex justify-between items-center text-sm text-gray-400">
                            <span>{formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}</span>
                            <span>{campaign.completion}% complete</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                            <div class="bg-blue-600 h-2.5 rounded-full" style={{width: `${(campaign.spent/campaign.budget)*100}%`}}></div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    </div>
  </div>
);

const BusinessPortal: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [campaignStep, setCampaignStep] = useState(1);
  
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'video' as const,
    budget: '',
    duration: '3',
    targetAudience: '',
    description: ''
  });

  const darkMode = theme === 'professional';

  const stats = {
    totalCampaigns: 12,
    activeNow: 3,
    totalReach: 49290,
    totalSpent: 1247.8,
    avgCompletion: 77.8,
    monthlyGrowth: 12.5
  };

  const campaigns: Campaign[] = [
    {
      id: '1',
      name: 'Holiday Promotion',
      type: 'video',
      status: 'completed',
      budget: 5000,
      spent: 4850,
      reach: 15230,
      completion: 78.3,
      createdAt: new Date('2024-01-15'),
      duration: 30
    },
    {
      id: '2',
      name: 'Summer Product Launch',
      type: 'survey',
      status: 'active',
      budget: 3000,
      spent: 2400,
      reach: 12048,
      completion: 80.0,
      createdAt: new Date('2024-01-10'),
      duration: 21
    },
    {
      id: '3',
      name: 'Brand Awareness Survey',
      type: 'social',
      status: 'active',
      budget: 2000,
      spent: 580,
      reach: 8924,
      completion: 65.2,
      createdAt: new Date('2024-01-20'),
      duration: 14
    }
  ];

  const recentActivity: ActivityItem[] = [
    {
      id: '1',
      type: 'completion',
      title: 'Campaign "Holiday Promotion" completed',
      description: '2,340 tasks completed with 78.3% completion rate',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      icon: CheckCircle,
      color: 'text-green-400'
    },
    {
      id: '2',
      type: 'warning',
      title: 'Budget threshold reached',
      description: 'Summer Product Launch campaign at 80% budget',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      icon: AlertTriangle,
      color: 'text-yellow-400'
    },
    {
      id: '3',
      type: 'launch',
      title: 'New campaign launched',
      description: 'Brand Awareness Survey is now live',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      icon: PlayCircle,
      color: 'text-blue-400'
    },
    {
      id: '4',
      type: 'payment',
      title: 'Payment processed',
      description: '$500.00 added to account balance',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      icon: DollarSign,
      color: 'text-green-400'
    }
  ];



  const handleCreateCampaign = () => {
    setCampaignStep(1);
    setShowCreateCampaign(true);
  };

    const sidebarItems = [
    { id: 'dashboard', label: 'Campaign Overview', icon: BarChart3 },
    { id: 'create', label: 'Create Campaign', icon: Plus, action: handleCreateCampaign },
    { id: 'active', label: 'Active Campaigns', icon: Activity },
    { id: 'history', label: 'Campaign History', icon: FileText },
    { id: 'analytics', label: 'Performance Analytics', icon: TrendingUp },
    { id: 'audience', label: 'Audience Insights', icon: Target },
    { id: 'billing', label: 'Billing & Payments', icon: CreditCard },
    { id: 'settings', label: 'Business Settings', icon: Settings },
    { id: 'support', label: 'Support', icon: HelpCircle }
  ];

  const campaignTypes = [
    {
      id: 'video',
      name: 'Video Advertisement',
      description: 'Users watch promotional videos',
      icon: Play
    },
    {
      id: 'survey',
      name: 'Survey Campaign',
      description: 'Collect user feedback and data',
      icon: FileText
    },
    {
      id: 'social',
      name: 'Social Media Engagement',
      description: 'Likes, follows, and shares',
      icon: Users
    }
  ];



  const handleCampaignSubmit = () => {
    // Simulate campaign creation
    console.log('Creating campaign:', newCampaign);
    setShowCreateCampaign(false);
    setCampaignStep(1);
    setNewCampaign({
      name: '',
      type: 'video',
      budget: '',
      duration: '3',
      targetAudience: '',
      description: ''
    });
  };

  const getEstimatedCost = () => {
    const budget = parseFloat(newCampaign.budget) || 0;
    const completionRate = 0.30; // 30% estimated completion rate
    return budget * completionRate;
  };

  const getEstimatedReach = () => {
    const budget = parseFloat(newCampaign.budget) || 0;
    const costPerTask = 0.15; // $0.15 per task completion
    return Math.floor(budget / costPerTask);
  };

  const renderCreateCampaignModal = () => {
    if (!showCreateCampaign) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className={`${darkMode ? 'bg-[#232936]' : 'bg-gray-900'} rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Create New Campaign</h2>
            <button
              onClick={() => setShowCreateCampaign(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[
              { step: 1, label: 'Campaign Basics', icon: Briefcase },
              { step: 2, label: 'Target Audience', icon: Target },
              { step: 3, label: 'Task Configuration', icon: Settings },
              { step: 4, label: 'Budget & Schedule', icon: DollarSign }
            ].map((item, index) => (
              <React.Fragment key={item.step}>
                <div className={`flex items-center space-x-2 ${campaignStep >= item.step ? 'text-blue-400' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    campaignStep >= item.step ? 'bg-blue-600' : 'bg-gray-700'
                  }`}>
                    {campaignStep > item.step ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <item.icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {index < 3 && (
                  <ChevronRight className={`w-4 h-4 mx-4 ${campaignStep > item.step ? 'text-blue-400' : 'text-gray-500'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content */}
          {campaignStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  placeholder="Enter campaign name"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-4">Campaign Type</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {campaignTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setNewCampaign({...newCampaign, type: type.id as any})}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        newCampaign.type === type.id
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                      }`}
                    >
                      <type.icon className={`w-8 h-8 mx-auto mb-2 ${
                        newCampaign.type === type.id ? 'text-blue-400' : 'text-gray-400'
                      }`} />
                      <h3 className="text-white font-medium mb-1">{type.name}</h3>
                      <p className="text-gray-400 text-sm">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {campaignStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Target Audience</label>
                <input
                  type="text"
                  value={newCampaign.targetAudience}
                  onChange={(e) => setNewCampaign({...newCampaign, targetAudience: e.target.value})}
                  placeholder="Describe your target audience (e.g., age, location, interests)"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {campaignStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Task Description</label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                  placeholder="Provide clear instructions for the task"
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {campaignStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">Total Budget (USD)</label>
                  <input
                    type="number"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign({...newCampaign, budget: e.target.value})}
                    placeholder="Enter budget amount"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Campaign Duration (days)</label>
                  <select
                    value={newCampaign.duration}
                    onChange={(e) => setNewCampaign({...newCampaign, duration: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="3">3 days</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="21">21 days</option>
                    <option value="30">30 days</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center text-orange-400 mb-2">
                    <DollarSign className="w-5 h-5 mr-2" />
                    <span className="font-medium">Estimated Cost</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    ${getEstimatedCost().toFixed(2)}
                  </div>
                  <p className="text-gray-400 text-sm">based on 30% completion rate</p>
                </div>

                <div className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center text-green-400 mb-2">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    <span className="font-medium">Expected Reach</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {getEstimatedReach().toLocaleString()}
                  </div>
                  <p className="text-gray-400 text-sm">task completions</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 mt-6 border-t border-gray-700">
            <button
              onClick={() => setCampaignStep(Math.max(1, campaignStep - 1))}
              disabled={campaignStep === 1}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {campaignStep < 4 ? (
              <button
                onClick={() => setCampaignStep(campaignStep + 1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleCampaignSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create Campaign
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <CampaignOverview stats={stats} recentActivity={recentActivity} campaigns={campaigns} handleCreateCampaign={handleCreateCampaign} />;
      case 'active':
        return <ActiveCampaigns campaigns={campaigns} />;
      case 'history':
        return <CampaignHistory campaigns={campaigns} />;
      case 'analytics':
        return <PerformanceAnalytics stats={stats} />;
      case 'audience':
        return <AudienceInsights />;
      case 'billing':
        return <Billing />;
      case 'settings':
        return <BusinessSettings />;
      case 'support':
        return <Support />;
      default:
        return <CampaignOverview stats={stats} recentActivity={recentActivity} campaigns={campaigns} handleCreateCampaign={handleCreateCampaign} />;
    }
  };

  const cardClass = darkMode ? 'bg-gray-800/50' : 'bg-white/10 backdrop-blur-sm';
  const sidebarClass = darkMode ? 'bg-[#1f242c]' : 'bg-black/20 backdrop-blur-lg';

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#181c23]' : 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900'}`}>
      <div className="flex">
        {/* Sidebar */}
        <div className={`w-64 h-screen ${sidebarClass} p-4`}>
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <Building className="w-8 h-8 text-blue-400" />
              <div>
                <h2 className="text-white font-bold">Business Portal</h2>
                <p className="text-gray-400 text-sm">Advertisement Management</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t border-gray-700/50">
            <div className={`${cardClass} p-3`}>
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-white text-sm font-medium">Campaign Status</span>
              </div>
              <div className="text-green-400 text-xs">3 Active, 15 Completed</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 lg:p-12">
          {renderContent()}
        </main>
      </div>

      {/* Create Campaign Modal */}
      {showCreateCampaign && renderCreateCampaignModal()}
    </div>
  );
};

export default BusinessPortal;
