import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Megaphone, TrendingUp, Target, DollarSign, Eye, MousePointer, Users, Plus, Package, BarChart3, Settings, Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Campaign } from '../../types';

const AdvertiserPortal: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('packages');
  const [campaigns] = useState<Campaign[]>([
    {
      id: '1',
      title: 'Global Fitness Challenge',
      description: 'Promote healthy lifestyle across Africa',
      budget: 5000,
      targetCountries: ['GH', 'NG', 'KE'],
      status: 'active',
      impressions: 45678,
      clicks: 2345,
      conversions: 156,
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      title: 'Tech Skills Bootcamp',
      description: 'Online programming courses',
      budget: 3000,
      targetCountries: ['US', 'CA', 'GB'],
      status: 'paused',
      impressions: 23456,
      clicks: 1234,
      conversions: 89,
      createdAt: new Date('2024-01-10')
    }
  ]);

  const overallStats = {
    totalBudget: 15000,
    totalSpent: 8765,
    totalImpressions: 123456,
    totalClicks: 6789,
    totalConversions: 345,
    averageCTR: 5.5,
    averageConversionRate: 5.1
  };

  // Advertisement Packages like in the image
  const advertisementPackages = [
    {
      id: 'starter',
      name: 'Starter Package',
      price: 500,
      duration: '1 Week',
      features: [
        'Homepage banner placement',
        'Email newsletter mention',
        'Basic analytics report',
        'Up to 10,000 impressions'
      ],
      color: 'from-blue-600 to-purple-600'
    },
    {
      id: 'professional',
      name: 'Professional Package',
      price: 1500,
      duration: '1 Month',
      features: [
        'Homepage + dashboard placement',
        'Email newsletter feature',
        'Social media promotion',
        'Detailed analytics report',
        'Up to 50,000 impressions'
      ],
      color: 'from-purple-600 to-pink-600',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Package',
      price: 5000,
      duration: '3 Months',
      features: [
        'Premium placement across platform',
        'Dedicated email campaign',
        'Social media campaign',
        'Comprehensive analytics',
        'Unlimited impressions'
      ],
      color: 'from-yellow-500 to-orange-500'
    }
  ];

  const tabs = [
    { id: 'packages', label: 'Advertisement Packages', icon: Package },
    { id: 'campaigns', label: 'My Campaigns', icon: Megaphone },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'targeting', label: 'Targeting', icon: Target },
    { id: 'billing', label: 'Billing', icon: DollarSign },
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

  return (
    <div className={`${bgClass} py-8`}>
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Megaphone className="w-8 h-8 mr-3 text-blue-400" />
            Advertiser Portal
          </h1>
          <p className="text-white/70">Reach thousands of active users with our advertising solutions</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-green-300" />
              <span className="text-2xl font-bold text-white">{formatCurrency(overallStats.totalBudget, user?.currency || 'USD')}</span>
            </div>
            <h3 className="text-white font-medium">Total Budget</h3>
            <p className="text-white/70 text-sm">Across all campaigns</p>
          </div>

          <div className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <Eye className="w-8 h-8 text-purple-300" />
              <span className="text-2xl font-bold text-white">{overallStats.totalImpressions.toLocaleString()}</span>
            </div>
            <h3 className="text-white font-medium">Impressions</h3>
            <p className="text-white/70 text-sm">Total ad views</p>
          </div>

          <div className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <MousePointer className="w-8 h-8 text-blue-300" />
              <span className="text-2xl font-bold text-white">{overallStats.totalClicks.toLocaleString()}</span>
            </div>
            <h3 className="text-white font-medium">Clicks</h3>
            <p className="text-white/70 text-sm">CTR: {overallStats.averageCTR}%</p>
          </div>

          <div className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-yellow-300" />
              <span className="text-2xl font-bold text-white">{overallStats.totalConversions}</span>
            </div>
            <h3 className="text-white font-medium">Conversions</h3>
            <p className="text-white/70 text-sm">Rate: {overallStats.averageConversionRate}%</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={cardClass}>
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id ? tabActiveClass : tabInactiveClass
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className={`${cardClass} p-6 mt-8`}>
          {activeTab === 'packages' && (
            <div className="space-y-8">
              {/* Why Advertise with Us Section */}
              <div className="text-center mb-12">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center justify-center">
                  <Target className="w-8 h-8 mr-3 text-blue-400" />
                  Why Advertise with Us?
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                  <div className="text-center">
                    <div className={`w-16 h-16 ${theme === 'professional' ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-gradient-to-br from-blue-500 to-purple-500'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-white font-bold text-xl mb-2">Active User Base</h4>
                    <p className="text-white/70">10,000+ engaged users actively earning</p>
                  </div>
                  
                  <div className="text-center">
                    <div className={`w-16 h-16 ${theme === 'professional' ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-green-500 to-teal-500'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-white font-bold text-xl mb-2">Targeted Reach</h4>
                    <p className="text-white/70">Reach users interested in financial opportunities</p>
                  </div>
                  
                  <div className="text-center">
                    <div className={`w-16 h-16 ${theme === 'professional' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-white font-bold text-xl mb-2">High ROI</h4>
                    <p className="text-white/70">Proven conversion rates with engaged audience</p>
                  </div>
                </div>
              </div>

              {/* Advertisement Packages */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {advertisementPackages.map((pkg) => (
                  <div key={pkg.id} className={`${cardClass} p-6 relative overflow-hidden ${pkg.popular ? 'ring-2 ring-purple-500' : ''}`}>
                    {pkg.popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 text-xs font-bold">
                        POPULAR
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <h4 className="text-white font-bold text-xl mb-2">{pkg.name}</h4>
                      <div className="text-4xl font-bold text-white mb-2">
                        ${pkg.price.toLocaleString()}
                      </div>
                      <p className="text-white/70">{pkg.duration}</p>
                    </div>
                    
                    <div className="space-y-3 mb-8">
                      {pkg.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <span className="text-white/80 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <button className={`w-full bg-gradient-to-r ${pkg.color} text-white py-3 rounded-lg font-medium hover:opacity-90 transition-all duration-200`}>
                      Choose Package
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Campaign Management</h3>
                <button className={`${theme === 'professional' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'} text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2`}>
                  <Plus className="w-4 h-4" />
                  <span>New Campaign</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-white font-medium">{campaign.title}</h4>
                        <p className="text-white/70 text-sm">{campaign.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        campaign.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-white/70">Budget</span>
                        <div className="text-white font-medium">{formatCurrency(campaign.budget, user?.currency || 'USD')}</div>
                      </div>
                      <div>
                        <span className="text-white/70">Impressions</span>
                        <div className="text-white font-medium">{campaign.impressions.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-white/70">Clicks</span>
                        <div className="text-white font-medium">{campaign.clicks.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-white/70">Conversions</span>
                        <div className="text-white font-medium">{campaign.conversions}</div>
                      </div>
                      <div>
                        <span className="text-white/70">CTR</span>
                        <div className="text-white font-medium">{((campaign.clicks / campaign.impressions) * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">Performance Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4`}>
                  <h4 className="text-white font-medium mb-3">Campaign Performance</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Total Spend</span>
                      <span className="text-white">{formatCurrency(overallStats.totalSpent, user?.currency || 'USD')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Cost per Click</span>
                      <span className="text-white">{formatCurrency(overallStats.totalSpent / overallStats.totalClicks, user?.currency || 'USD')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Cost per Conversion</span>
                      <span className="text-white">{formatCurrency(overallStats.totalSpent / overallStats.totalConversions, user?.currency || 'USD')}</span>
                    </div>
                  </div>
                </div>
                
                <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4`}>
                  <h4 className="text-white font-medium mb-3">Audience Insights</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Top Country</span>
                      <span className="text-white">Ghana (35%)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Peak Time</span>
                      <span className="text-white">2-4 PM GMT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Mobile Traffic</span>
                      <span className="text-white">78%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'targeting' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">Audience Targeting</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4`}>
                  <h4 className="text-white font-medium mb-3">Geographic Targeting</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Ghana</span>
                      <span className="text-white">35.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Nigeria</span>
                      <span className="text-white">28.7%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Kenya</span>
                      <span className="text-white">22.1%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Others</span>
                      <span className="text-white">14.0%</span>
                    </div>
                  </div>
                </div>
                
                <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4`}>
                  <h4 className="text-white font-medium mb-3">Demographics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Age 18-25</span>
                      <span className="text-white">42%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Age 26-35</span>
                      <span className="text-white">38%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Age 36+</span>
                      <span className="text-white">20%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">Billing & Payments</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4`}>
                  <h4 className="text-white font-medium mb-3">Account Balance</h4>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-300 mb-2">
                      {formatCurrency(overallStats.totalBudget - overallStats.totalSpent, user?.currency || 'USD')}
                    </div>
                    <div className="text-white/70 text-sm">Available Balance</div>
                  </div>
                </div>
                
                <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4`}>
                  <h4 className="text-white font-medium mb-3">Monthly Spending</h4>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-300 mb-2">
                      {formatCurrency(overallStats.totalSpent, user?.currency || 'USD')}
                    </div>
                    <div className="text-white/70 text-sm">This month</div>
                  </div>
                </div>
              </div>
              
              <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4`}>
                <h4 className="text-white font-medium mb-3">Recent Transactions</h4>
                <div className="space-y-2">
                  {[
                    { date: '2024-01-20', description: 'Campaign: Global Fitness Challenge', amount: -125.50 },
                    { date: '2024-01-18', description: 'Account Top-up', amount: 1000.00 },
                    { date: '2024-01-15', description: 'Campaign: Tech Skills Bootcamp', amount: -89.75 }
                  ].map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-white/10 last:border-b-0">
                      <div>
                        <div className="text-white text-sm">{transaction.description}</div>
                        <div className="text-white/70 text-xs">{transaction.date}</div>
                      </div>
                      <div className={`font-medium ${transaction.amount > 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount, user?.currency || 'USD')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white">Advertiser Settings</h3>
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/70">Advertiser settings and preferences coming soon!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvertiserPortal;