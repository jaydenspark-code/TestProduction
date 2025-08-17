import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  Target, 
  TrendingUp, 
  DollarSign,
  Users,
  Eye,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertTriangle,
  Settings,
  BarChart3,
  Zap,
  Brain,
  Briefcase,
  Calendar,
  Monitor,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  Download,
  Upload,
  MessageSquare,
  Star,
  Award,
  TrendingDown,
  ArrowLeft,
  X,
  Bot
} from 'lucide-react';

interface Campaign {
  id: string;
  advertiser: {
    id: string;
    name: string;
    email: string;
    company: string;
    tier: 'starter' | 'professional' | 'enterprise';
  };
  details: {
    title: string;
    description: string;
    type: 'video' | 'survey' | 'social' | 'referral';
    budget: number;
    duration: number;
    targetAudience: string;
    objectives: string[];
  };
  status: 'pending_review' | 'approved' | 'active' | 'paused' | 'completed' | 'rejected';
  package: {
    name: string;
    tier: 'starter' | 'professional' | 'enterprise';
    maxImpressions: number;
    duration: number;
    paidAmount: number;
  };
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    reach: number;
    engagement: number;
    spent: number;
    remaining: number;
  };
  aiManagement: {
    enabled: boolean;
    optimization: 'basic' | 'advanced' | 'premium';
    autoAdjustments: boolean;
    smartBidding: boolean;
    audienceExpansion: boolean;
  };
  timeline: {
    submitted: Date;
    reviewed?: Date;
    approved?: Date;
    launched?: Date;
    completed?: Date;
  };
  materials: {
    creatives: string[];
    copy: string[];
    targeting: any;
    landing_pages: string[];
  };
}

const CampaignManagement: React.FC = () => {
  const { theme } = useTheme();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCampaignDetails, setShowCampaignDetails] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  
  // AI Settings state
  const [aiSettings, setAiSettings] = useState({
    autoApprove: false,
    smartBudget: true,
    performanceMonitoring: true
  });

  const isDark = theme === 'professional';

  // Export campaigns data
  const exportCampaigns = () => {
    const csvData = campaigns.map(campaign => ({
      ID: campaign.id,
      Advertiser: campaign.advertiser.name,
      Campaign: campaign.details.title,
      Budget: campaign.details.budget,
      Status: campaign.status,
      Revenue: campaign.performance.revenue,
      Conversions: campaign.performance.conversions
    }));

    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Advertiser,Campaign,Budget,Status,Revenue,Conversions\n"
      + csvData.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `campaigns_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification({
      message: 'Campaign data exported successfully!',
      type: 'success'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // AI Settings toggle
  const toggleAISettings = () => {
    setShowAIConfig(!showAIConfig);
    setNotification({
      message: showAIConfig ? 'AI Settings closed' : 'AI Settings opened',
      type: 'info'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Sample campaign data
  useEffect(() => {
    setCampaigns([
      {
        id: 'camp-001',
        advertiser: {
          id: 'adv-001',
          name: 'John Smith',
          email: 'john@techstart.com',
          company: 'TechStart Inc',
          tier: 'professional'
        },
        details: {
          title: 'Mobile App Launch Campaign',
          description: 'Promoting our new productivity mobile application',
          type: 'video',
          budget: 2500,
          duration: 30,
          targetAudience: 'Young professionals, mobile users',
          objectives: ['App Downloads', 'User Acquisition', 'Brand Awareness']
        },
        status: 'pending_review',
        package: {
          name: 'Professional Package',
          tier: 'professional',
          maxImpressions: 50000,
          duration: 30,
          paidAmount: 1500
        },
        performance: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          reach: 0,
          engagement: 0,
          spent: 0,
          remaining: 2500
        },
        aiManagement: {
          enabled: true,
          optimization: 'advanced',
          autoAdjustments: true,
          smartBidding: true,
          audienceExpansion: false
        },
        timeline: {
          submitted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        materials: {
          creatives: ['video1.mp4', 'banner1.jpg'],
          copy: ['Main headline copy', 'CTA text'],
          targeting: {},
          landing_pages: ['https://app.techstart.com/download']
        }
      },
      {
        id: 'camp-002',
        advertiser: {
          id: 'adv-002',
          name: 'Sarah Johnson',
          email: 'sarah@ecommerce.com',
          company: 'E-Commerce Solutions',
          tier: 'enterprise'
        },
        details: {
          title: 'Holiday Shopping Campaign',
          description: 'Drive sales during holiday season',
          type: 'referral',
          budget: 5000,
          duration: 45,
          targetAudience: 'Online shoppers, deal seekers',
          objectives: ['Sales', 'Revenue Growth', 'Customer Acquisition']
        },
        status: 'active',
        package: {
          name: 'Enterprise Package',
          tier: 'enterprise',
          maxImpressions: 200000,
          duration: 90,
          paidAmount: 3000
        },
        performance: {
          impressions: 25680,
          clicks: 1854,
          conversions: 127,
          reach: 18420,
          engagement: 7.2,
          spent: 1247.50,
          remaining: 3752.50
        },
        aiManagement: {
          enabled: true,
          optimization: 'premium',
          autoAdjustments: true,
          smartBidding: true,
          audienceExpansion: true
        },
        timeline: {
          submitted: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          reviewed: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          approved: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          launched: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        materials: {
          creatives: ['holiday_video.mp4', 'sale_banner.jpg', 'product_images.zip'],
          copy: ['Holiday Sale Copy', 'Email Templates', 'Social Posts'],
          targeting: {},
          landing_pages: ['https://ecommerce.com/holiday-sale', 'https://ecommerce.com/deals']
        }
      }
    ]);
  }, []);

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'pending_review': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'approved': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'paused': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'completed': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'starter': return 'text-blue-400';
      case 'professional': return 'text-green-400';
      case 'enterprise': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.details.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.advertiser.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'all' || campaign.package.tier === filterTier;
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'pending' && campaign.status === 'pending_review') ||
                      (activeTab === 'active' && ['approved', 'active'].includes(campaign.status)) ||
                      (activeTab === 'completed' && ['completed', 'paused'].includes(campaign.status));
    
    return matchesSearch && matchesTier && matchesStatus && matchesTab;
  });

  const cardClass = isDark 
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-xl border border-white/20';

  const bgClass = isDark 
    ? 'bg-[#181c23]' 
    : 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

  return (
    <div className={`min-h-screen ${bgClass} py-8`}>
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
              <Target className="w-8 h-8 mr-3 text-blue-400" />
              Campaign Management Hub
            </h1>
            <p className="text-white/70">Orchestrate advertiser campaigns with AI-powered automation</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={`${cardClass} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8 text-yellow-400" />
                <span className="text-2xl font-bold text-white">
                  {campaigns.filter(c => c.status === 'pending_review').length}
                </span>
              </div>
              <h3 className="text-white font-medium">Pending Review</h3>
              <p className="text-white/60 text-sm">Awaiting admin approval</p>
            </div>

            <div className={`${cardClass} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <Play className="w-8 h-8 text-green-400" />
                <span className="text-2xl font-bold text-white">
                  {campaigns.filter(c => c.status === 'active').length}
                </span>
              </div>
              <h3 className="text-white font-medium">Active Campaigns</h3>
              <p className="text-white/60 text-sm">Currently running</p>
            </div>

            <div className={`${cardClass} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-blue-400" />
                <span className="text-2xl font-bold text-white">
                  ${campaigns.reduce((sum, c) => sum + c.package.paidAmount, 0).toLocaleString()}
                </span>
              </div>
              <h3 className="text-white font-medium">Total Revenue</h3>
              <p className="text-white/60 text-sm">From all packages</p>
            </div>

            <div className={`${cardClass} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <Brain className="w-8 h-8 text-purple-400" />
                <span className="text-2xl font-bold text-white">
                  {campaigns.filter(c => c.aiManagement.enabled).length}
                </span>
              </div>
              <h3 className="text-white font-medium">AI Managed</h3>
              <p className="text-white/60 text-sm">Automated campaigns</p>
            </div>
          </div>

          {/* Controls */}
          <div className={`${cardClass} p-6 mb-8`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Filters */}
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Tiers</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button 
                  onClick={exportCampaigns}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                <button 
                  onClick={toggleAISettings}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    showAIConfig 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Brain className="w-4 h-4" />
                  <span>AI Settings</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mt-6">
              {[
                { id: 'pending', label: 'Pending Review', count: campaigns.filter(c => c.status === 'pending_review').length },
                { id: 'active', label: 'Active', count: campaigns.filter(c => ['approved', 'active'].includes(c.status)).length },
                { id: 'completed', label: 'Completed', count: campaigns.filter(c => ['completed', 'paused'].includes(c.status)).length },
                { id: 'all', label: 'All Campaigns', count: campaigns.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-white/70 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Campaigns List */}
          <div className="space-y-6">
            {filteredCampaigns.map(campaign => (
              <div key={campaign.id} className={`${cardClass} p-6`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center`}>
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{campaign.details.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>{campaign.advertiser.company}</span>
                        <span>•</span>
                        <span className={getTierColor(campaign.package.tier)}>
                          {campaign.package.name}
                        </span>
                        <span>•</span>
                        <span>${campaign.details.budget.toLocaleString()} budget</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status.replace('_', ' ')}
                    </div>
                    {campaign.aiManagement.enabled && (
                      <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-sm font-medium">
                        AI Managed
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance Metrics */}
                {campaign.status === 'active' && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className="bg-gray-700/30 rounded-lg p-3">
                      <div className="text-gray-400 text-xs">Impressions</div>
                      <div className="text-white font-bold">{campaign.performance.impressions.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-3">
                      <div className="text-gray-400 text-xs">Clicks</div>
                      <div className="text-white font-bold">{campaign.performance.clicks.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-3">
                      <div className="text-gray-400 text-xs">Conversions</div>
                      <div className="text-white font-bold">{campaign.performance.conversions}</div>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-3">
                      <div className="text-gray-400 text-xs">Spent</div>
                      <div className="text-white font-bold">${campaign.performance.spent}</div>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-3">
                      <div className="text-gray-400 text-xs">Remaining</div>
                      <div className="text-green-400 font-bold">${campaign.performance.remaining}</div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setShowCampaignDetails(true);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    
                    {campaign.status === 'pending_review' && (
                      <>
                        <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {campaign.status === 'active' && (
                      <button className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
                        <Pause className="w-4 h-4" />
                        <span>Pause</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => {
                        setNotification({
                          message: `Opening messages for ${campaign.advertiser.name}`,
                          type: 'info'
                        });
                        setTimeout(() => setNotification(null), 3000);
                      }}
                      className="p-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
                      title="Messages"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setNotification({
                          message: `Opening campaign settings for ${campaign.details.title}`,
                          type: 'info'
                        });
                        setTimeout(() => setNotification(null), 3000);
                      }}
                      className="p-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
                      title="Campaign Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setNotification({
                          message: `Opening analytics for ${campaign.details.title}`,
                          type: 'info'
                        });
                        setTimeout(() => setNotification(null), 3000);
                      }}
                      className="p-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors"
                      title="Analytics"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCampaigns.length === 0 && (
            <div className={`${cardClass} p-12 text-center`}>
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No campaigns found</h3>
              <p className="text-gray-400">No campaigns match your current filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Configuration Modal */}
      {showAIConfig && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto ${cardClass} p-6`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">AI Campaign Settings</h3>
                  <p className="text-gray-400">Configure AI automation for campaign management</p>
                </div>
              </div>
              <button
                onClick={toggleAISettings}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400 hover:text-white" />
              </button>
            </div>

            <div className="space-y-6">
              {/* AI Automation Settings */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Bot className="w-5 h-5 text-blue-400 mr-2" />
                  Automation Settings
                </h4>
                <div className="space-y-4">
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">Auto-approve campaigns</div>
                        <div className="text-gray-400 text-sm">Automatically approve campaigns that meet criteria</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={aiSettings.autoApprove}
                          onChange={() => {
                            setAiSettings(prev => ({...prev, autoApprove: !prev.autoApprove}));
                            setNotification({
                              message: `Auto-approve campaigns ${!aiSettings.autoApprove ? 'enabled' : 'disabled'}`,
                              type: 'info'
                            });
                            setTimeout(() => setNotification(null), 3000);
                          }}
                          className="sr-only" 
                        />
                        <div className={`w-11 h-6 rounded-full peer transition-all ${
                          aiSettings.autoApprove ? 'bg-blue-600' : 'bg-gray-600'
                        } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                          aiSettings.autoApprove ? 'after:translate-x-full' : ''
                        }`}></div>
                      </label>
                    </div>
                  </div>

                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">Smart budget optimization</div>
                        <div className="text-gray-400 text-sm">AI adjusts budgets based on performance</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={aiSettings.smartBudget}
                          onChange={() => {
                            setAiSettings(prev => ({...prev, smartBudget: !prev.smartBudget}));
                            setNotification({
                              message: `Smart budget optimization ${!aiSettings.smartBudget ? 'enabled' : 'disabled'}`,
                              type: 'info'
                            });
                            setTimeout(() => setNotification(null), 3000);
                          }}
                          className="sr-only" 
                        />
                        <div className={`w-11 h-6 rounded-full peer transition-all ${
                          aiSettings.smartBudget ? 'bg-blue-600' : 'bg-gray-600'
                        } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                          aiSettings.smartBudget ? 'after:translate-x-full' : ''
                        }`}></div>
                      </label>
                    </div>
                  </div>

                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">Performance monitoring</div>
                        <div className="text-gray-400 text-sm">Real-time campaign performance alerts</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={aiSettings.performanceMonitoring}
                          onChange={() => {
                            setAiSettings(prev => ({...prev, performanceMonitoring: !prev.performanceMonitoring}));
                            setNotification({
                              message: `Performance monitoring ${!aiSettings.performanceMonitoring ? 'enabled' : 'disabled'}`,
                              type: 'info'
                            });
                            setTimeout(() => setNotification(null), 3000);
                          }}
                          className="sr-only" 
                        />
                        <div className={`w-11 h-6 rounded-full peer transition-all ${
                          aiSettings.performanceMonitoring ? 'bg-blue-600' : 'bg-gray-600'
                        } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                          aiSettings.performanceMonitoring ? 'after:translate-x-full' : ''
                        }`}></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Insights Settings */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 text-green-400 mr-2" />
                  AI Insights & Recommendations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="text-white font-medium mb-2">Recommendation Frequency</div>
                    <select className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-blue-500 focus:outline-none">
                      <option>Real-time</option>
                      <option>Daily</option>
                      <option>Weekly</option>
                    </select>
                  </div>

                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="text-white font-medium mb-2">Confidence Threshold</div>
                    <select className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-blue-500 focus:outline-none">
                      <option>High (85%+)</option>
                      <option>Medium (70%+)</option>
                      <option>Low (50%+)</option>
                    </select>
                  </div>

                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="text-white font-medium mb-2">Alert Channels</div>
                    <div className="space-y-2 text-sm">
                      <label className="flex items-center text-gray-300">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        Dashboard notifications
                      </label>
                      <label className="flex items-center text-gray-300">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        Email alerts
                      </label>
                      <label className="flex items-center text-gray-300">
                        <input type="checkbox" className="mr-2" />
                        SMS notifications
                      </label>
                    </div>
                  </div>

                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="text-white font-medium mb-2">Data Sources</div>
                    <div className="space-y-2 text-sm">
                      <label className="flex items-center text-gray-300">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        Campaign performance
                      </label>
                      <label className="flex items-center text-gray-300">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        User engagement
                      </label>
                      <label className="flex items-center text-gray-300">
                        <input type="checkbox" className="mr-2" />
                        Market trends
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-700/50">
                <button
                  onClick={toggleAISettings}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setNotification({
                      message: 'AI settings saved successfully!',
                      type: 'success'
                    });
                    setTimeout(() => setNotification(null), 3000);
                    toggleAISettings();
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Details Modal */}
      {showCampaignDetails && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto ${cardClass} p-6`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setShowCampaignDetails(false);
                    setNotification({ type: 'info', message: 'Returned to campaign overview' });
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h3 className="text-2xl font-bold text-white">Campaign Details</h3>
              </div>
              <button
                onClick={() => setShowCampaignDetails(false)}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Detailed campaign information would go here */}
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Campaign Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Title</label>
                    <div className="text-white">{selectedCampaign.details.title}</div>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Type</label>
                    <div className="text-white capitalize">{selectedCampaign.details.type}</div>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Budget</label>
                    <div className="text-white">${selectedCampaign.details.budget.toLocaleString()}</div>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Duration</label>
                    <div className="text-white">{selectedCampaign.details.duration} days</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Description</label>
                <div className="text-white">{selectedCampaign.details.description}</div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Objectives</label>
                <div className="flex flex-wrap gap-2">
                  {selectedCampaign.details.objectives.map(obj => (
                    <span key={obj} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                      {obj}
                    </span>
                  ))}
                </div>
              </div>

              {/* Add more detailed sections as needed */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManagement;
