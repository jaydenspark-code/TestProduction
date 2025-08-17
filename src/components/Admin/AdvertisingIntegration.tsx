import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  Target, 
  DollarSign, 
  Users, 
  TrendingUp,
  BarChart3,
  Settings,
  Monitor,
  Zap,
  Eye,
  MousePointer,
  Award,
  Share2,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

// Import advertising components
import AdWidget from '../AIWidgets/AdWidget';
import { adDisplayService } from '../../services/adDisplayService';

interface AdvertisingIntegrationProps {
  userId: string;
  className?: string;
}

const AdvertisingIntegration: React.FC<AdvertisingIntegrationProps> = ({ userId, className = '' }) => {
  const { theme } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);
  const [adStats, setAdStats] = useState({
    totalRevenue: 15670.50,
    userEarnings: 8340.25,
    platformRevenue: 7330.25,
    activeCampaigns: 47,
    dailyInteractions: 1247
  });

  const isDark = theme === 'professional';

  const cardClass = isDark 
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-xl border border-white/20';

  const bgClass = isDark 
    ? 'bg-[#181c23]' 
    : 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

  useEffect(() => {
    const initializeAdvertising = async () => {
      try {
        // Initialize advertising service with campaigns from your existing system
        const mockCampaigns = [
          {
            id: 'integrated-camp-1',
            title: 'Premium Software Trial - TechStart',
            description: 'Advanced development tools for modern teams. Complete signup and earn rewards!',
            advertiser: {
              id: 'techstart-inc',
              name: 'TechStart Inc.',
              logo: '/images/advertisers/techstart.png'
            },
            targeting: {
              countries: ['United States', 'Canada', 'United Kingdom'],
              ageRange: [22, 45] as [number, number],
              interests: ['technology', 'programming', 'software'],
              languages: ['en']
            },
            budget: {
              total: 5000,
              spent: 1250,
              dailyLimit: 200
            },
            reward: {
              type: 'per_completion' as const,
              amount: 2.50
            },
            schedule: {
              startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              timezone: 'UTC'
            },
            metrics: {
              impressions: 15420,
              clicks: 847,
              conversions: 156,
              engagement: 5.8
            },
            status: 'active' as const,
            priority: 8,
            category: 'Technology',
            imageUrl: '/images/campaigns/techstart-banner.jpg',
            callToAction: 'Start Free Trial',
            requirements: [
              'Complete signup process',
              'Verify email address',
              'Complete profile setup'
            ],
            estimatedDuration: 5
          }
        ];

        await adDisplayService.initializeService(mockCampaigns);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize advertising:', error);
      }
    };

    initializeAdvertising();
  }, []);

  const navigationLinks = [
    {
      title: 'Campaign Discovery',
      description: 'Users browse and interact with campaigns',
      path: '/advertising',
      icon: Target,
      color: 'from-green-500 to-teal-600'
    },
    {
      title: 'Earnings Dashboard',
      description: 'Real-time earnings and withdrawals',
      path: '/earnings',
      icon: DollarSign,
      color: 'from-yellow-500 to-green-600'
    },
    {
      title: 'Admin Panel',
      description: 'Manage campaigns and advertisers',
      path: '/admin',
      icon: Settings,
      color: 'from-blue-500 to-purple-600'
    }
  ];

  const earningMethods = [
    {
      action: 'View Ads',
      reward: '$0.05',
      icon: Eye,
      description: 'Automatic when ad becomes visible',
      color: 'text-blue-400 bg-blue-500/20'
    },
    {
      action: 'Click Campaigns',
      reward: '$0.25',
      icon: MousePointer,
      description: 'Click call-to-action buttons',
      color: 'text-green-400 bg-green-500/20'
    },
    {
      action: 'Complete Tasks',
      reward: '$1.00+',
      icon: Award,
      description: 'Fulfill campaign requirements',
      color: 'text-purple-400 bg-purple-500/20'
    },
    {
      action: 'Share Content',
      reward: '$0.50',
      icon: Share2,
      description: 'Share campaigns on social media',
      color: 'text-orange-400 bg-orange-500/20'
    }
  ];

  return (
    <div className={`min-h-screen ${bgClass} py-8 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Advertising Platform Integration</h1>
            </div>
            <p className="text-white/70 text-lg mb-8">
              Complete monetization system integrated with your AI Campaign Orchestrator
            </p>

            {/* Revenue Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
              <div className={`${cardClass} p-6`}>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <DollarSign className="w-6 h-6 text-green-400" />
                  <span className="text-2xl font-bold text-white">${adStats.totalRevenue.toLocaleString()}</span>
                </div>
                <p className="text-white/70 text-sm">Total Revenue</p>
              </div>

              <div className={`${cardClass} p-6`}>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Users className="w-6 h-6 text-blue-400" />
                  <span className="text-2xl font-bold text-white">${adStats.userEarnings.toLocaleString()}</span>
                </div>
                <p className="text-white/70 text-sm">User Earnings</p>
              </div>

              <div className={`${cardClass} p-6`}>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                  <span className="text-2xl font-bold text-white">${adStats.platformRevenue.toLocaleString()}</span>
                </div>
                <p className="text-white/70 text-sm">Platform Revenue</p>
              </div>

              <div className={`${cardClass} p-6`}>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Target className="w-6 h-6 text-yellow-400" />
                  <span className="text-2xl font-bold text-white">{adStats.activeCampaigns}</span>
                </div>
                <p className="text-white/70 text-sm">Active Campaigns</p>
              </div>

              <div className={`${cardClass} p-6`}>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <TrendingUp className="w-6 h-6 text-red-400" />
                  <span className="text-2xl font-bold text-white">{adStats.dailyInteractions.toLocaleString()}</span>
                </div>
                <p className="text-white/70 text-sm">Daily Interactions</p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            {/* Left Column - Navigation & How it Works */}
            <div className="space-y-6">
              
              {/* Quick Navigation */}
              <div className={`${cardClass} p-6`}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Monitor className="w-6 h-6 text-blue-400 mr-2" />
                  Platform Access
                </h3>
                
                <div className="space-y-4">
                  {navigationLinks.map((link, index) => {
                    const Icon = link.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => window.open(link.path, '_blank')}
                        className={`w-full flex items-center justify-between p-4 rounded-lg bg-gradient-to-r ${link.color} hover:scale-105 transition-all duration-200 group`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5 text-white" />
                          <div className="text-left">
                            <div className="text-white font-medium">{link.title}</div>
                            <div className="text-white/80 text-xs">{link.description}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* How Users Earn Money */}
              <div className={`${cardClass} p-6`}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <DollarSign className="w-6 h-6 text-green-400 mr-2" />
                  How Users Earn
                </h3>
                
                <div className="space-y-4">
                  {earningMethods.map((method, index) => {
                    const Icon = method.icon;
                    return (
                      <div key={index} className={`p-4 rounded-lg border ${method.color}`}>
                        <div className="flex items-center space-x-3 mb-2">
                          <Icon className="w-5 h-5" />
                          <span className="font-medium text-white">{method.action}</span>
                          <span className="font-bold text-green-400">{method.reward}</span>
                        </div>
                        <p className="text-sm opacity-80">{method.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Center Column - Live Ad Widget Demo */}
            <div className="space-y-6">
              <div className={`${cardClass} p-6`}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Zap className="w-6 h-6 text-yellow-400 mr-2" />
                  Live Ad Widget Demo
                </h3>
                
                {isInitialized ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Homepage Banner Style</h4>
                      <AdWidget
                        placement="homepage-banner"
                        userId={userId}
                        userProfile={{
                          id: userId,
                          location: 'United States',
                          age: 28,
                          interests: ['technology', 'programming'],
                          deviceType: 'desktop',
                          language: 'en',
                          timezone: 'UTC'
                        }}
                        maxAds={1}
                      />
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Sidebar Compact Style</h4>
                      <AdWidget
                        placement="sidebar-ad"
                        userId={userId}
                        userProfile={{
                          id: userId,
                          location: 'United States',
                          age: 28,
                          interests: ['technology', 'programming'],
                          deviceType: 'desktop',
                          language: 'en',
                          timezone: 'UTC'
                        }}
                        maxAds={1}
                        autoRotate={true}
                        rotationInterval={30}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-700/30 rounded-lg p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-white/70">Initializing advertising system...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Integration Status & File Locations */}
            <div className="space-y-6">
              
              {/* Component Status */}
              <div className={`${cardClass} p-6`}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Settings className="w-6 h-6 text-purple-400 mr-2" />
                  Integration Status
                </h3>
                
                <div className="space-y-3">
                  {[
                    { name: 'AdvertisingPlatform.tsx', status: 'ready', location: 'src/components/Platform/' },
                    { name: 'AdDisplayService.ts', status: 'ready', location: 'src/services/' },
                    { name: 'AdWidget.tsx', status: 'ready', location: 'src/components/AIWidgets/' },
                    { name: 'MonetizationDashboard.tsx', status: 'ready', location: 'src/components/Dashboard/' },
                    { name: 'advertising.ts (types)', status: 'ready', location: 'src/types/' }
                  ].map((component, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <div className="text-white font-medium text-sm">{component.name}</div>
                        <div className="text-gray-400 text-xs">{component.location}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-400 text-xs font-medium">{component.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Setup */}
              <div className={`${cardClass} p-6`}>
                <h3 className="text-xl font-bold text-white mb-6">Quick Setup</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <h4 className="text-blue-400 font-medium mb-2">1. Add to Router</h4>
                    <div className="bg-gray-900/50 rounded p-2 text-xs text-gray-300 font-mono">
                      {`<Route path="/advertising" element={<AdvertisingPlatform userId={user.id} />} />`}
                    </div>
                  </div>

                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <h4 className="text-green-400 font-medium mb-2">2. Embed Widgets</h4>
                    <div className="bg-gray-900/50 rounded p-2 text-xs text-gray-300 font-mono">
                      {`<AdWidget placement="sidebar" userId={user.id} />`}
                    </div>
                  </div>

                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <h4 className="text-purple-400 font-medium mb-2">3. Connect Campaign Data</h4>
                    <div className="bg-gray-900/50 rounded p-2 text-xs text-gray-300 font-mono">
                      {`adDisplayService.initializeService(campaigns)`}
                    </div>
                  </div>
                </div>

                <button className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2">
                  <ExternalLink className="w-5 h-5" />
                  <span>View Full Integration Guide</span>
                </button>
              </div>
            </div>
          </div>

          {/* Connection to AI Campaign Orchestrator */}
          <div className={`${cardClass} p-8 mb-8`}>
            <h2 className="text-2xl font-bold text-white mb-6">🔗 Integration with AI Campaign Orchestrator</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Advertiser Flow</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                    <span className="text-white">Advertiser creates campaign in Admin Panel</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                    <span className="text-white">AI Orchestrator optimizes targeting & budget</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                    <span className="text-white">Campaign goes live on Advertising Platform</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">User Flow</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                    <span className="text-white">Users discover campaigns via widgets or platform</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                    <span className="text-white">Users interact and earn money automatically</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                    <span className="text-white">Track earnings and withdraw via dashboard</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvertisingIntegration;
