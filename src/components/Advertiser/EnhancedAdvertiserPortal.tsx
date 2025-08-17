import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Target, 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer, 
  DollarSign, 
  Calendar, 
  Star, 
  Settings,
  CreditCard,
  BarChart3,
  Zap,
  TestTube,
  BrainCircuit,
  UserCheck,
  Layers,
  Play,
  Pause,
  Edit,
  Trash2,
  Plus,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Crown,
  ArrowRight,
  Megaphone,
  X,
  Wallet,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AdvertiserSettings from './AdvertiserSettings';
import AudienceTargeting from './AudienceTargeting';
import { packageService } from '../../services/packageService';
import { AdvertisingPackage, UserPackage } from '../../types/package';
import { Campaign } from '../../types';
import Billing from './Billing';
import PaymentGateway from '../Payment/PaymentGateway';
import AIOptimization from './AIOptimization';
import ABTesting from './ABTesting';
import AudienceInsights from './AudienceInsights';

// Currency formatting utility
const formatCurrency = (amount: number, currency: string = 'NGN') => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const EnhancedAdvertiserPortal: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [availablePackages, setAvailablePackages] = useState<AdvertisingPackage[]>([]);
  const [userPackage, setUserPackage] = useState<UserPackage | null>(null);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [selectedPackageForPurchase, setSelectedPackageForPurchase] = useState<AdvertisingPackage | null>(null);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Campaign state
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

  const [overallStats, setOverallStats] = useState({
    totalBudget: 15000,
    totalSpent: 8765,
    totalImpressions: 123456,
    totalClicks: 6789,
    totalConversions: 345,
    averageCTR: 5.5,
    averageConversionRate: 5.1
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load available packages
      const packages = await packageService.getAvailablePackages();
      setAvailablePackages(packages);

      // Load user's active package
      const activePackage = await packageService.getUserActivePackage(user.id);
      setUserPackage(activePackage);

      setError(null);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePackagePurchase = (pkg: AdvertisingPackage) => {
    setSelectedPackageForPurchase(pkg);
    setShowPaymentGateway(true);
  };

  const handlePaymentSuccess = async (data: any) => {
    console.log('Payment successful:', data);
    setShowPaymentGateway(false);
    setSelectedPackageForPurchase(null);
    // Reload user package data
    await loadData();
    // Show success message
    alert('Package purchased successfully!');
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    setError(error);
  };

  const handlePaymentCancel = () => {
    setShowPaymentGateway(false);
    setSelectedPackageForPurchase(null);
  };

  const handleCreateCampaign = async () => {
    if (!user) return;

    // Check if user can create campaign
    const canCreate = await packageService.canCreateCampaign(user.id);
    
    if (!canCreate.allowed) {
      alert(canCreate.reason);
      setActiveTab('packages'); // Redirect to packages tab
      return;
    }

    // Consume campaign quota
    const quotaConsumed = await packageService.consumeCampaignQuota(user.id);
    
    if (!quotaConsumed) {
      alert('Failed to create campaign. Please try again.');
      return;
    }

    // Create campaign
    const campaign: Campaign = {
      ...newCampaign,
      id: Date.now().toString(),
      createdAt: new Date()
    } as Campaign;

    setCampaigns([...campaigns, campaign]);
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

    // Reload user package to update remaining quotas
    await loadData();
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'packages', label: 'Packages', icon: Package },
    { id: 'campaigns', label: 'My Campaigns', icon: Megaphone },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'targeting', label: 'Targeting', icon: Target },
    { id: 'optimization', label: 'AI Optimization', icon: BrainCircuit },
    { id: 'ab-testing', label: 'A/B Testing', icon: TestTube },
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

  const buttonClass = theme === 'professional'
    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700';

  if (showPaymentGateway && selectedPackageForPurchase) {
    return (
      <PaymentGateway
        type="package_purchase"
        packageDetails={selectedPackageForPurchase}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        onCancel={handlePaymentCancel}
      />
    );
  }

  if (loading) {
    return (
      <div className={`${bgClass} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

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

        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* Package Status Banner */}
        {userPackage && (
          <div className={`${cardClass} p-6 mb-8`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${userPackage.package.popular ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-purple-500'}`}>
                  {userPackage.package.popular ? <Crown className="w-6 h-6 text-white" /> : <Package className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{userPackage.package.name} Package</h3>
                  <p className="text-white/70">
                    {userPackage.remainingCampaigns === 999999 ? 'Unlimited' : userPackage.remainingCampaigns} campaigns remaining • 
                    Expires {userPackage.expiryDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-white font-bold">{userPackage.remainingImpressions.toLocaleString()}</p>
                    <p className="text-white/60 text-xs">Impressions Left</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold">{formatCurrency(userPackage.remainingBudget, userPackage.package.currency)}</p>
                    <p className="text-white/60 text-xs">Budget Left</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-green-300" />
              <span className="text-2xl font-bold text-white">{formatCurrency(overallStats.totalBudget, user?.currency || 'NGN')}</span>
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
                  className={`flex items-center px-6 py-4 min-w-fit whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id ? tabActiveClass : tabInactiveClass
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6 mt-8">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <BarChart3 className="mr-2" /> Dashboard Overview
                </h2>
                
                {!userPackage && (
                  <div className={`${theme === 'professional' ? 'bg-yellow-500/20' : 'bg-yellow-500/20'} border border-yellow-500/50 rounded-lg p-6`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertCircle className="w-6 h-6 text-yellow-400 mr-3" />
                        <div>
                          <h3 className="text-yellow-400 font-semibold">No Active Package</h3>
                          <p className="text-yellow-300/80">Purchase a package to start creating campaigns</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('packages')}
                        className={`px-6 py-2 rounded-lg text-white font-medium ${buttonClass} flex items-center`}
                      >
                        View Packages
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button
                    onClick={() => setActiveTab('campaigns')}
                    className={`${cardClass} p-6 text-left hover:scale-105 transition-transform`}
                  >
                    <Megaphone className="w-12 h-12 text-blue-400 mb-4" />
                    <h3 className="text-white font-semibold mb-2">Manage Campaigns</h3>
                    <p className="text-white/70 text-sm">Create and manage your advertising campaigns</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`${cardClass} p-6 text-left hover:scale-105 transition-transform`}
                  >
                    <TrendingUp className="w-12 h-12 text-green-400 mb-4" />
                    <h3 className="text-white font-semibold mb-2">View Analytics</h3>
                    <p className="text-white/70 text-sm">Track performance and optimize your campaigns</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('packages')}
                    className={`${cardClass} p-6 text-left hover:scale-105 transition-transform`}
                  >
                    <Package className="w-12 h-12 text-purple-400 mb-4" />
                    <h3 className="text-white font-semibold mb-2">Upgrade Package</h3>
                    <p className="text-white/70 text-sm">Unlock more features and higher limits</p>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'packages' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <Package className="mr-2" /> Advertisement Packages
                  </h2>
                  {userPackage && (
                    <div className="text-right">
                      <p className="text-white/70">Current Package:</p>
                      <p className="text-white font-semibold">{userPackage.package.name}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {availablePackages.map((pkg) => (
                    <div 
                      key={pkg.id}
                      className={`${cardClass} p-6 relative ${pkg.popular ? 'ring-2 ring-yellow-500' : ''}`}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                            <Crown className="w-4 h-4 mr-1" />
                            Most Popular
                          </div>
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                        <div className="text-4xl font-bold text-white mb-2">
                          {formatCurrency(pkg.price, pkg.currency)}
                        </div>
                        <p className="text-white/70">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {pkg.duration} days
                        </p>
                      </div>

                      <p className="text-white/80 text-sm mb-6 text-center">{pkg.description}</p>

                      <div className="space-y-3 mb-8">
                        {pkg.features.map((feature, index) => (
                          <div key={index} className="flex items-center">
                            <CheckCircle className={`w-5 h-5 mr-3 ${feature.included ? 'text-green-400' : 'text-gray-500'}`} />
                            <span className={`text-sm ${feature.included ? 'text-white' : 'text-white/50'}`}>
                              {feature.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 mb-6 text-sm">
                        <div className="flex justify-between text-white/70">
                          <span>Max Campaigns:</span>
                          <span>{pkg.limits.maxCampaigns === -1 ? 'Unlimited' : pkg.limits.maxCampaigns}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Impressions:</span>
                          <span>{pkg.limits.maxImpressions.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Budget Limit:</span>
                          <span>{formatCurrency(pkg.limits.maxBudget, pkg.currency)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePackagePurchase(pkg)}
                        disabled={userPackage?.packageId === pkg.id}
                        className={`w-full py-3 px-6 rounded-lg text-white font-medium transition-all duration-200 ${
                          userPackage?.packageId === pkg.id
                            ? 'bg-gray-600 cursor-not-allowed'
                            : buttonClass
                        }`}
                      >
                        {userPackage?.packageId === pkg.id ? 'Current Package' : 'Purchase Package'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'campaigns' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <Megaphone className="mr-2" /> My Campaigns
                  </h2>
                  <button
                    onClick={() => setShowCreateCampaign(true)}
                    className={`px-6 py-2 rounded-lg text-white font-medium ${buttonClass} flex items-center`}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Campaign
                  </button>
                </div>

                {!userPackage && (
                  <div className={`${theme === 'professional' ? 'bg-red-500/20' : 'bg-red-500/20'} border border-red-500/50 rounded-lg p-6`}>
                    <div className="flex items-center">
                      <AlertCircle className="w-6 h-6 text-red-400 mr-3" />
                      <div>
                        <h3 className="text-red-400 font-semibold">Package Required</h3>
                        <p className="text-red-300/80">You need to purchase a package before creating campaigns.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Campaign Creation Modal */}
                {showCreateCampaign && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className={`${cardClass} w-full max-w-2xl p-6`}>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Create New Campaign</h3>
                        <button
                          onClick={() => setShowCreateCampaign(false)}
                          className="text-white/70 hover:text-white"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/70 text-sm mb-2">Campaign Title</label>
                          <input
                            type="text"
                            value={newCampaign.title}
                            onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                            className={`w-full px-4 py-2 rounded-lg border ${theme === 'professional' ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/10 border-white/20 text-white'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter campaign title"
                          />
                        </div>

                        <div>
                          <label className="block text-white/70 text-sm mb-2">Description</label>
                          <textarea
                            value={newCampaign.description}
                            onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                            className={`w-full px-4 py-2 rounded-lg border ${theme === 'professional' ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/10 border-white/20 text-white'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            rows={3}
                            placeholder="Describe your campaign..."
                          />
                        </div>

                        <div>
                          <label className="block text-white/70 text-sm mb-2">Budget ({user?.currency || 'NGN'})</label>
                          <input
                            type="number"
                            value={newCampaign.budget}
                            onChange={(e) => setNewCampaign({ ...newCampaign, budget: Number(e.target.value) })}
                            className={`w-full px-4 py-2 rounded-lg border ${theme === 'professional' ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white/10 border-white/20 text-white'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter budget amount"
                            min="0"
                          />
                        </div>

                        <div className="flex space-x-4 pt-4">
                          <button
                            onClick={() => setShowCreateCampaign(false)}
                            className="flex-1 py-2 px-4 border border-gray-600 rounded-lg text-white hover:bg-gray-700/50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleCreateCampaign}
                            disabled={!newCampaign.title || !newCampaign.description || !newCampaign.budget}
                            className={`flex-1 py-2 px-4 rounded-lg text-white font-medium ${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            Create Campaign
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Campaigns List */}
                <div className="grid gap-6">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className={`${cardClass} p-6`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white">{campaign.title}</h3>
                          <p className="text-white/70">{campaign.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            campaign.status === 'active' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {campaign.status}
                          </span>
                          <button className="text-white/70 hover:text-white">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">{formatCurrency(campaign.budget, user?.currency || 'NGN')}</p>
                          <p className="text-white/60 text-sm">Budget</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">{campaign.impressions.toLocaleString()}</p>
                          <p className="text-white/60 text-sm">Impressions</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">{campaign.clicks.toLocaleString()}</p>
                          <p className="text-white/60 text-sm">Clicks</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">{campaign.conversions}</p>
                          <p className="text-white/60 text-sm">Conversions</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {campaigns.length === 0 && (
                    <div className="text-center py-12">
                      <Megaphone className="w-16 h-16 text-white/30 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Campaigns Yet</h3>
                      <p className="text-white/70 mb-6">Create your first campaign to start reaching your audience</p>
                      <button
                        onClick={() => setShowCreateCampaign(true)}
                        className={`px-6 py-3 rounded-lg text-white font-medium ${buttonClass}`}
                      >
                        Create Your First Campaign
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <TrendingUp className="mr-2" /> Analytics & Reports
                </h2>
                <p className="text-white/70">Detailed performance metrics and insights for your campaigns</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className={`${cardClass} p-6`}>
                    <h3 className="text-lg font-semibold text-white mb-4">Campaign Performance</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={campaigns}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="title" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="impressions" fill="#8B5CF6" />
                        <Bar dataKey="clicks" fill="#06B6D4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={`${cardClass} p-6`}>
                    <h3 className="text-lg font-semibold text-white mb-4">Conversion Rates</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={campaigns}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="title" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Line type="monotone" dataKey="conversions" stroke="#10B981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'targeting' && <AudienceTargeting />}

            {activeTab === 'optimization' && <AIOptimization />}
            {activeTab === 'ab-testing' && <ABTesting />}
            {activeTab === 'audience' && <AudienceInsights />}
            {activeTab === 'billing' && <Billing />}

            {activeTab === 'settings' && <AdvertiserSettings />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAdvertiserPortal;
