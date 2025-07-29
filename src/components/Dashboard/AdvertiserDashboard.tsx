import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Megaphone, TrendingUp, Target, DollarSign, Eye, MousePointer, Users, Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Campaign } from '../../types';

const AdvertiserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('campaigns');
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

  const tabs = [
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'targeting', label: 'Targeting', icon: Target },
    { id: 'billing', label: 'Billing', icon: DollarSign }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Megaphone className="w-8 h-8 mr-3 text-blue-400" />
            Advertiser Dashboard
          </h1>
          <p className="text-white/70">Manage campaigns and track performance</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-green-300" />
              <span className="text-2xl font-bold text-white">{formatCurrency(overallStats.totalBudget, user?.currency || 'USD')}</span>
            </div>
            <h3 className="text-white font-medium">Total Budget</h3>
            <p className="text-white/70 text-sm">Across all campaigns</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <Eye className="w-8 h-8 text-purple-300" />
              <span className="text-2xl font-bold text-white">{overallStats.totalImpressions.toLocaleString()}</span>
            </div>
            <h3 className="text-white font-medium">Impressions</h3>
            <p className="text-white/70 text-sm">Total ad views</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <MousePointer className="w-8 h-8 text-blue-300" />
              <span className="text-2xl font-bold text-white">{overallStats.totalClicks.toLocaleString()}</span>
            </div>
            <h3 className="text-white font-medium">Clicks</h3>
            <p className="text-white/70 text-sm">CTR: {overallStats.averageCTR}%</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-yellow-300" />
              <span className="text-2xl font-bold text-white">{overallStats.totalConversions}</span>
            </div>
            <h3 className="text-white font-medium">Conversions</h3>
            <p className="text-white/70 text-sm">Rate: {overallStats.averageConversionRate}%</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 mb-8">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
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
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Campaign Management</h3>
                <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>New Campaign</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
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
                <div className="bg-white/5 rounded-lg p-4">
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvertiserDashboard;
