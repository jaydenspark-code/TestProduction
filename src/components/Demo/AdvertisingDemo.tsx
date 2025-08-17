import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Target, 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer, 
  Share2, 
  Award,
  Zap,
  Gift,
  BarChart3
} from 'lucide-react';

// Import all the advertising components
import AdvertisingPlatform from '../Platform/AdvertisingPlatform';
import AdWidget from '../AIWidgets/AdWidget';
import MonetizationDashboard from '../Dashboard/MonetizationDashboard';
import { adDisplayService } from '../../services/adDisplayService';

interface AdvertisingDemoProps {
  userId: string;
  className?: string;
  isModal?: boolean;
}

const AdvertisingDemo: React.FC<AdvertisingDemoProps> = ({ userId, className = '', isModal = false }) => {
  const [activeDemo, setActiveDemo] = useState<'overview' | 'campaigns' | 'widgets' | 'earnings'>('overview');
  const [userProfile] = useState({
    id: userId,
    location: 'United States',
    age: 28,
    interests: ['technology', 'gaming', 'fitness', 'travel'],
    deviceType: 'desktop',
    language: 'en',
    timezone: 'UTC'
  });

  const [stats] = useState({
    totalUsers: 12450,
    activeCampaigns: 47,
    totalEarned: 15670.50,
    dailyInteractions: 8340
  });

  useEffect(() => {
    // Initialize ad service with mock campaigns
    const initializeDemo = async () => {
      const mockCampaigns = [
        {
          id: 'camp-tech-1',
          title: 'TechStart Pro - Developer Tools',
          description: 'Discover the latest development tools and boost your productivity. Sign up for a free trial and earn rewards!',
          advertiser: {
            id: 'adv-techstart',
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
        },
        {
          id: 'camp-fitness-1',
          title: 'FitLife Premium - Health & Wellness',
          description: 'Transform your fitness journey with personalized workout plans and nutrition guidance.',
          advertiser: {
            id: 'adv-fitlife',
            name: 'FitLife Premium',
            logo: '/images/advertisers/fitlife.png'
          },
          targeting: {
            countries: ['United States', 'Canada'],
            ageRange: [18, 55] as [number, number],
            interests: ['fitness', 'health', 'wellness'],
            languages: ['en']
          },
          budget: {
            total: 3500,
            spent: 890,
            dailyLimit: 150
          },
          reward: {
            type: 'per_click' as const,
            amount: 0.75
          },
          schedule: {
            startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
            timezone: 'UTC'
          },
          metrics: {
            impressions: 9840,
            clicks: 524,
            conversions: 89,
            engagement: 5.3
          },
          status: 'active' as const,
          priority: 6,
          category: 'Health & Fitness',
          imageUrl: '/images/campaigns/fitlife-banner.jpg',
          callToAction: 'Join Now',
          estimatedDuration: 3
        }
      ];

      await adDisplayService.initializeService(mockCampaigns);
    };

    initializeDemo();
  }, []);

  const demoSections = [
    {
      id: 'overview',
      title: 'How You Earn',
      description: 'See how you can start earning money from advertisements',
      icon: BarChart3,
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'campaigns',
      title: 'Find Campaigns',
      description: 'Discover ads that match your interests and start earning',
      icon: Target,
      color: 'from-green-500 to-teal-600'
    },
    {
      id: 'widgets',
      title: 'Earn Everywhere',
      description: 'Find earning opportunities throughout the platform',
      icon: Zap,
      color: 'from-orange-500 to-red-600'
    },
    {
      id: 'earnings',
      title: 'Track Your Earnings',
      description: 'Monitor your daily income and withdraw your money',
      icon: DollarSign,
      color: 'from-yellow-500 to-green-600'
    }
  ];

  return (
    <div className={`${isModal ? '' : 'min-h-screen'} bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 ${className}`}>
      <div className={`container mx-auto ${isModal ? 'px-2 py-4' : 'px-4 py-8'}`}>
        {/* Header */}
        <div className={`text-center ${isModal ? 'mb-6' : 'mb-12'}`}>
          <h1 className={`${isModal ? 'text-2xl' : 'text-4xl'} font-bold text-white mb-4`}>
            🎯 Start Earning Today
          </h1>
          <p className={`${isModal ? 'text-lg' : 'text-xl'} text-white/70 mb-6`}>
            Join thousands of users earning money every day by watching ads and completing simple tasks
          </p>
          
          {/* Live Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <Users className="w-8 h-8 text-blue-400" />
                <span className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</span>
              </div>
              <p className="text-white/70 text-sm">Active Users</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <Target className="w-8 h-8 text-green-400" />
                <span className="text-2xl font-bold text-white">{stats.activeCampaigns}</span>
              </div>
              <p className="text-white/70 text-sm">Live Campaigns</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <DollarSign className="w-8 h-8 text-yellow-400" />
                <span className="text-2xl font-bold text-white">${stats.totalEarned.toLocaleString()}</span>
              </div>
              <p className="text-white/70 text-sm">User Earnings</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <TrendingUp className="w-8 h-8 text-purple-400" />
                <span className="text-2xl font-bold text-white">{stats.dailyInteractions.toLocaleString()}</span>
              </div>
              <p className="text-white/70 text-sm">Daily Interactions</p>
            </div>
          </div>
        </div>

        {/* Demo Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {demoSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveDemo(section.id as any)}
                className={`flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 ${
                  activeDemo === section.id
                    ? `bg-gradient-to-r ${section.color} text-white shadow-lg scale-105`
                    : 'bg-white/10 backdrop-blur-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/20'
                }`}
              >
                <Icon className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-semibold">{section.title}</div>
                  <div className="text-xs opacity-80">{section.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Demo Content */}
        <div className="max-w-7xl mx-auto">
          {activeDemo === 'overview' && (
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
                <h2 className="text-2xl font-bold text-white mb-6">💰 How You Earn Money</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Quick Earnings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                        <div className="flex items-center space-x-3">
                          <Eye className="w-5 h-5 text-green-400" />
                          <span className="text-white text-sm font-medium">View Ads</span>
                        </div>
                        <span className="text-green-400 font-bold">$0.05 - $0.25</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                        <div className="flex items-center space-x-3">
                          <MousePointer className="w-5 h-5 text-blue-400" />
                          <span className="text-white text-sm font-medium">Click Campaigns</span>
                        </div>
                        <span className="text-blue-400 font-bold">$0.25 - $1.00</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Higher Rewards</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                        <div className="flex items-center space-x-3">
                          <Award className="w-5 h-5 text-purple-400" />
                          <span className="text-white text-sm font-medium">Complete Tasks</span>
                        </div>
                        <span className="text-purple-400 font-bold">$1.00 - $5.00</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg border border-orange-500/30">
                        <div className="flex items-center space-x-3">
                          <Share2 className="w-5 h-5 text-orange-400" />
                          <span className="text-white text-sm font-medium">Share Content</span>
                        </div>
                        <span className="text-orange-400 font-bold">$0.50 - $2.00</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/10 to-green-500/10 border border-yellow-500/30 rounded-lg text-center">
                  <h4 className="text-lg font-bold text-yellow-400 mb-2">💎 Daily Earning Potential: $10 - $50+</h4>
                  <p className="text-white/80 text-sm">The more you engage, the more you earn. Start with simple views and work your way up to higher-paying tasks!</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
                <h2 className="text-2xl font-bold text-white mb-6">💡 How It Works</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-500/30">
                      <h4 className="font-semibold text-white mb-2 flex items-center">
                        <Eye className="w-5 h-5 mr-2 text-blue-400" />
                        View Campaigns
                      </h4>
                      <p className="text-gray-300 text-sm">Browse and discover advertising campaigns that match your interests and earn money for each interaction.</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-lg p-4 border border-green-500/30">
                      <h4 className="font-semibold text-white mb-2 flex items-center">
                        <MousePointer className="w-5 h-5 mr-2 text-green-400" />
                        Complete Tasks
                      </h4>
                      <p className="text-gray-300 text-sm">Click, watch, share, or complete simple tasks to earn rewards instantly to your account balance.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
                      <h4 className="font-semibold text-white mb-2 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-yellow-400" />
                        Earn Money
                      </h4>
                      <p className="text-gray-300 text-sm">Get paid instantly for your engagement. Track your earnings and withdraw anytime.</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30">
                      <h4 className="font-semibold text-white mb-2 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
                        Track Progress
                      </h4>
                      <p className="text-gray-300 text-sm">Monitor your daily earnings, view detailed analytics, and optimize your earning potential.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeDemo === 'campaigns' && (
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">🎯 Find Ads to Watch</h2>
                  <div className="text-white/70 text-sm flex items-center">
                    <Target className="w-4 h-4 mr-1" />
                    <span>Interactive Campaign Hub</span>
                  </div>
                </div>
                <p className="text-white/70 mb-6">
                  This is where you discover ads, watch them to earn money, and track your progress.
                </p>
              </div>
              
              <AdvertisingPlatform />
            </div>
          )}

          {activeDemo === 'widgets' && (
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">⚡ Earn Money Everywhere</h2>
                  <div className="text-white/70 text-sm flex items-center">
                    <Zap className="w-4 h-4 mr-1" />
                    <span>Multiple Ways to Earn</span>
                  </div>
                </div>
                <p className="text-white/70 mb-6">
                  Find earning opportunities throughout the app - in different sections where you can watch ads and earn money.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Quick Earn Section</h3>
                  <AdWidget
                    placement="sidebar-ad"
                    userId={userId}
                    userProfile={userProfile}
                    maxAds={1}
                    autoRotate={true}
                    rotationInterval={30}
                  />
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Featured Earning Opportunities</h3>
                  <AdWidget
                    placement="homepage-banner"
                    userId={userId}
                    userProfile={userProfile}
                    maxAds={1}
                  />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">More Ways to Earn</h3>
                <AdWidget
                  placement="dashboard-native"
                  userId={userId}
                  userProfile={userProfile}
                  maxAds={2}
                />
              </div>
            </div>
          )}

          {activeDemo === 'earnings' && (
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">💰 User Monetization Dashboard</h2>
                  <div className="text-white/70 text-sm flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span>Earnings Hub</span>
                  </div>
                </div>
                <p className="text-white/70 mb-6">
                  Track your daily earnings, see your activity, and easily withdraw your money when you're ready.
                </p>
              </div>
              
              <MonetizationDashboard userId={userId} />
            </div>
          )}
        </div>

        {/* Earning Potential Section */}
        <div className="mt-16 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-lg rounded-2xl border border-purple-500/30 p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Gift className="w-8 h-8 mr-3" />
            Your Earning Potential
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">� Daily Earning Opportunities</h3>
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-6 border border-green-500/30">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white">View Campaigns:</span>
                    <span className="text-green-400 font-bold">$0.05 - $0.25</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">Click Campaigns:</span>
                    <span className="text-green-400 font-bold">$0.25 - $1.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">Complete Tasks:</span>
                    <span className="text-green-400 font-bold">$1.00 - $5.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">Share Content:</span>
                    <span className="text-green-400 font-bold">$0.50 - $2.00</span>
                  </div>
                  <hr className="border-green-500/30" />
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-white">Daily Potential:</span>
                    <span className="text-green-400">$10 - $50+</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">🎯 Getting Started Tips</h3>
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg p-6 border border-blue-500/30">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                    <div>
                      <p className="text-white font-semibold">Complete Your Profile</p>
                      <p className="text-gray-300 text-sm">Better targeting = higher rewards</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                    <div>
                      <p className="text-white font-semibold">Daily Check-ins</p>
                      <p className="text-gray-300 text-sm">New campaigns added daily</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                    <div>
                      <p className="text-white font-semibold">Refer Friends</p>
                      <p className="text-gray-300 text-sm">Earn 10% of their earnings forever</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-green-500/10 border border-green-500/30 rounded-lg">
            <h4 className="text-lg font-semibold text-green-400 mb-2">✅ Ready to Start Earning!</h4>
            <p className="text-white/80">
              Join thousands of users already earning money through our advertising platform. 
              Complete your profile and start discovering campaigns that match your interests today!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvertisingDemo;
