import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Megaphone, TrendingUp, Target, DollarSign, Eye, MousePointer, Users, Plus, Package, BarChart3, Settings, X } from 'lucide-react';
import AIOptimization from './AIOptimization';
import ABTesting from './ABTesting';
import AudienceInsights from './AudienceInsights';
import AdvertiserSettings from './AdvertiserSettings';
import PaymentGateway from '../Payment/PaymentGateway';
import { Campaign } from '../../types';
import { AdvertisingPackage } from '../../types/package';

// Currency formatting utility
const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const AdvertiserPortal: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState('packages');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [showCreateCampaign, setShowCreateCampaign] = useState<boolean>(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState<boolean>(false);
  const [selectedPackageForPurchase, setSelectedPackageForPurchase] = useState<AdvertisingPackage | null>(null);
  const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({
    title: '',
    description: '',
    targetCountries: [],
    budget: 0,
    status: 'active',
    impressions: 0,
    clicks: 0,
    conversions: 0
  });

  // Initialize campaigns with sample data
  const [campaigns, setCampaigns] = useState<Campaign[]>([
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
      createdAt: new Date('2024-01-15') as Date
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
      createdAt: new Date('2024-01-10') as Date
    }
  ]);

  const [overallStats] = useState({
    totalBudget: 15000,
    totalSpent: 8765,
    totalImpressions: 123456,
    totalClicks: 6789,
    totalConversions: 345,
    averageCTR: 5.5,
    averageConversionRate: 5.1
  });

  // Advertisement Packages like in the image
  const advertisementPackages: AdvertisingPackage[] = [
    {
      id: 'starter',
      name: 'Starter Package',
      price: 500,
      currency: 'USD',
      duration: 7, // 1 week in days
      features: [
        { id: '1', name: 'Homepage banner placement', description: 'Featured placement on homepage', included: true },
        { id: '2', name: 'Email newsletter mention', description: 'Mention in weekly newsletter', included: true },
        { id: '3', name: 'Basic analytics report', description: 'Basic performance metrics', included: true },
        { id: '4', name: 'Up to 10,000 impressions', description: 'Maximum 10K ad impressions', included: true }
      ],
      limits: {
        maxCampaigns: 1,
        maxImpressions: 10000,
        maxClicks: 500,
        maxBudget: 500,
        targetingOptions: ['country', 'age'],
        analyticsLevel: 'basic',
        supportLevel: 'basic',
        aiOptimization: false,
        abTesting: false,
        audienceInsights: false
      },
      description: 'Perfect for small businesses getting started with advertising',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'professional',
      name: 'Professional Package',
      price: 1500,
      currency: 'USD',
      duration: 30, // 1 month in days
      features: [
        { id: '1', name: 'Homepage + dashboard placement', description: 'Premium placement locations', included: true },
        { id: '2', name: 'Email newsletter feature', description: 'Featured spot in newsletter', included: true },
        { id: '3', name: 'Social media promotion', description: 'Cross-platform promotion', included: true },
        { id: '4', name: 'Detailed analytics report', description: 'Advanced performance insights', included: true },
        { id: '5', name: 'Up to 50,000 impressions', description: 'Maximum 50K ad impressions', included: true }
      ],
      limits: {
        maxCampaigns: 3,
        maxImpressions: 50000,
        maxClicks: 2500,
        maxBudget: 1500,
        targetingOptions: ['country', 'age', 'interests', 'behavior'],
        analyticsLevel: 'advanced',
        supportLevel: 'priority',
        aiOptimization: true,
        abTesting: true,
        audienceInsights: true
      },
      popular: true,
      description: 'Recommended for growing businesses with serious advertising needs',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'enterprise',
      name: 'Enterprise Package',
      price: 3000,
      currency: 'USD',
      duration: 90, // 3 months in days
      features: [
        { id: '1', name: 'Premium placement across platform', description: 'Top-tier placement everywhere', included: true },
        { id: '2', name: 'Dedicated account manager', description: 'Personal account management', included: true },
        { id: '3', name: 'Custom campaign optimization', description: 'Tailored optimization strategies', included: true },
        { id: '4', name: 'Advanced targeting options', description: 'Sophisticated targeting tools', included: true },
        { id: '5', name: 'Up to 200,000 impressions', description: 'Maximum 200K ad impressions', included: true }
      ],
      limits: {
        maxCampaigns: 10,
        maxImpressions: 200000,
        maxClicks: 10000,
        maxBudget: 3000,
        targetingOptions: ['country', 'age', 'interests', 'behavior', 'custom_audiences', 'lookalike'],
        analyticsLevel: 'premium',
        supportLevel: 'dedicated',
        aiOptimization: true,
        abTesting: true,
        audienceInsights: true
      },
      description: 'Enterprise solution for large-scale advertising campaigns',
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  // Payment handlers
  const handlePackagePurchase = (pkg: AdvertisingPackage) => {
    setSelectedPackageForPurchase(pkg);
    setShowPaymentGateway(true);
  };

  const handlePaymentSuccess = (data: any) => {
    console.log('Package purchase successful:', data);
    setShowPaymentGateway(false);
    setSelectedPackageForPurchase(null);
    // Update UI to reflect successful purchase
    alert(`Successfully purchased ${selectedPackageForPurchase?.name}!`);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    alert(`Payment failed: ${error}`);
  };

  const handlePaymentCancel = () => {
    setShowPaymentGateway(false);
    setSelectedPackageForPurchase(null);
  };

  const tabs = [
    { id: 'packages', label: 'Advertisement Packages', icon: Package },
    { id: 'campaigns', label: 'My Campaigns', icon: Megaphone },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'targeting', label: 'Targeting', icon: Target },
    { id: 'optimization', label: 'AI Optimization', icon: BarChart3 },
    { id: 'ab-testing', label: 'A/B Testing', icon: Eye },
    { id: 'audience', label: 'Audience Insights', icon: Users },
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
    <>
      {/* Payment Gateway Modal */}
      {showPaymentGateway && selectedPackageForPurchase && (
        <PaymentGateway
          type="package_purchase"
          packageDetails={selectedPackageForPurchase}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={handlePaymentCancel}
        />
      )}

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
          {activeTab === 'optimization' && <AIOptimization />}
          {activeTab === 'ab-testing' && <ABTesting />}
          {activeTab === 'audience' && <AudienceInsights />}
          {activeTab === 'packages' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">Advertisement Packages</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {advertisementPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-6 border relative ${selectedPackage === pkg.name ? 'border-blue-500' : theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'} hover:border-blue-400 transition-all duration-200`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm px-3 py-1 rounded-full">
                          Recommended
                        </span>
                      </div>
                    )}
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-white mb-2">{pkg.name}</h4>
                      <p className="text-3xl font-bold text-white mb-2">${pkg.price}</p>
                      <p className="text-white/70">
                        {pkg.duration === 7 ? '1 Week' : 
                         pkg.duration === 30 ? '1 Month' : 
                         pkg.duration === 90 ? '3 Months' : 
                         `${pkg.duration} days`}
                      </p>
                      <p className="text-white/60 text-sm mt-2">{pkg.description}</p>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {pkg.features.map((feature) => (
                        <li key={feature.id} className="flex items-center text-white">
                          <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature.name}
                        </li>
                      ))}
                    </ul>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setSelectedPackage(pkg.name);
                          setActiveTab('campaigns');
                        }}
                        className={`w-full py-3 rounded-lg transition-all duration-200 ${selectedPackage === pkg.name ? 'bg-blue-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'}`}
                      >
                        {selectedPackage === pkg.name ? 'Selected' : 'Select Package'}
                      </button>
                      <button
                        onClick={() => handlePackagePurchase(pkg)}
                        className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
                          pkg.id === 'starter' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' :
                          pkg.id === 'professional' ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white' :
                          'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        } hover:opacity-90`}
                      >
                        Purchase Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
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
          )}
          
          {selectedPackage && activeTab !== 'packages' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">Selected Package: {selectedPackage}</h3>
              </div>
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Campaign Management</h3>
                <button 
                  onClick={() => setShowCreateCampaign(true)}
                  className={`${theme === 'professional' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'} text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2`}
                >
                  <Plus className="w-4 h-4" />
                  <span>New Campaign</span>
                </button>
              </div>
              
              {showCreateCampaign && (
                <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-6 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">Create New Campaign</h3>
                    <button
                      onClick={() => setShowCreateCampaign(false)}
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white/70 mb-2">Campaign Name</label>
                      <input
                        type="text"
                        value={newCampaign.title}
                        onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter campaign name"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 mb-2">Campaign Description</label>
                      <textarea
                        value={newCampaign.description}
                        onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe your campaign"
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 mb-2">Budget</label>
                      <input
                        type="number"
                        value={newCampaign.budget}
                        onChange={(e) => setNewCampaign({ ...newCampaign, budget: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter campaign budget"
                      />
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                      <button
                        onClick={() => setShowCreateCampaign(false)}
                        className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          const newCampaignData: Campaign = {
                            id: String(campaigns.length + 1),
                            title: newCampaign.title || '',
                            description: newCampaign.description || '',
                            budget: newCampaign.budget || 0,
                            targetCountries: newCampaign.targetCountries || ['US'],
                            status: newCampaign.status || 'active',
                            impressions: newCampaign.impressions || 0,
                            clicks: newCampaign.clicks || 0,
                            conversions: newCampaign.conversions || 0,
                            createdAt: new Date() as Date
                          };
                          setCampaigns([...campaigns, newCampaignData]);
                          setNewCampaign({
                            title: '',
                            description: '',
                            targetCountries: [],
                            budget: 0,
                            status: 'active',
                            impressions: 0,
                            clicks: 0,
                            conversions: 0
                          });
                          setShowCreateCampaign(false);
                        }}
                        disabled={!newCampaign.title || !newCampaign.description || !newCampaign.budget}
                        className={`px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg transition-all duration-200 ${(!newCampaign.title || !newCampaign.description || !newCampaign.budget) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                      >
                        Create Campaign
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
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

          {activeTab === 'targeting' && <AudienceInsights />}

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

          {activeTab === 'settings' && <AdvertiserSettings />}
        </div>
      </div>
    </div>
    </>
  );
};

export default AdvertiserPortal;
