import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Users, TrendingUp, DollarSign, Shield, Globe, Zap, CheckCircle, Star, Crown } from 'lucide-react';
import EarnProLogo from '../Logo/EarnProLogo';
import BackendConnectionTest from '../Backend/BackendConnectionTest';
import ConfigurationStatus from '../Config/ConfigurationStatus';

const HomePage: React.FC = () => {
  const { theme } = useTheme();

  const features = [
    {
      icon: Users,
      title: 'Global Network',
      description: 'Join millions of users earning through our worldwide referral network'
    },
    {
      icon: DollarSign,
      title: 'Multi-Level Earnings',
      description: 'Earn from direct referrals and up to 3 levels of indirect referrals'
    },
    {
      icon: Crown,
      title: 'Agent Program',
      description: 'Become an influencer agent and unlock exclusive earning opportunities'
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Bank-level security with encrypted transactions and data protection'
    },
    {
      icon: Globe,
      title: 'Multi-Currency Support',
      description: 'Local currency support across 15+ countries with real-time conversion'
    },
    {
      icon: Zap,
      title: 'Instant Tracking',
      description: 'Real-time tracking of referrals, earnings, and network performance'
    }
  ];

  const stats = [
    { number: '2M+', label: 'Active Users' },
    { number: '150+', label: 'Countries' },
    { number: '$50M+', label: 'Paid Out' },
    { number: '99.9%', label: 'Uptime' }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      location: 'Ghana',
      message: 'EarnPro changed my life! I earn more than my day job through referrals.',
      rating: 5,
      isAgent: true
    },
    {
      name: 'Michael Chen',
      location: 'Canada',
      message: 'The platform is incredibly user-friendly and payments are always on time.',
      rating: 5,
      isAgent: false
    },
    {
      name: 'Amara Okafor',
      location: 'Nigeria',
      message: 'Best referral platform I\'ve used. The agent program is amazing!',
      rating: 5,
      isAgent: true
    }
  ];

  const bgClass = theme === 'professional' 
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800'
    : 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 hover:bg-gray-700/60 transition-all duration-300'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300';

  const gradientClass = theme === 'professional'
    ? 'bg-gradient-to-r from-cyan-400 to-blue-400'
    : 'bg-gradient-to-r from-purple-400 to-blue-400';

  const buttonPrimaryClass = theme === 'professional'
    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700';

  const buttonSecondaryClass = theme === 'professional'
    ? 'bg-gray-800/50 hover:bg-gray-700/60 border-gray-600/50'
    : 'bg-white/10 hover:bg-white/20 border-white/20';

  return (
    <div className={bgClass}>
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-8">
            <EarnProLogo size={120} />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Earn More with
            <span className={`${gradientClass} bg-clip-text text-transparent`}> EarnPro</span>
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
            Join the world's most trusted referral platform. Earn money by sharing with friends, building your network, and becoming an influencer agent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className={`${buttonPrimaryClass} text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 shadow-lg text-lg`}
            >
              Start Earning Now
            </Link>
            <Link
              to="/agent"
              className={`${buttonSecondaryClass} text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 border text-lg flex items-center justify-center space-x-2`}
            >
              <Crown className="w-5 h-5" />
              <span>Join Agent Program</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Backend Status Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">🔧 Real Backend Integration</h2>
            <p className="text-white/70">Live connection to Supabase database and authentication</p>
          </div>
          <BackendConnectionTest />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose EarnPro?</h2>
            <p className="text-xl text-white/70">Everything you need to succeed in referral marketing</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className={cardClass}>
                  <div className={`w-12 h-12 ${theme === 'professional' ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-gradient-to-br from-purple-500 to-blue-500'} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/70">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Agent Program Highlight */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className={`${theme === 'professional' ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20' : 'bg-gradient-to-r from-purple-600/20 to-blue-600/20'} backdrop-blur-lg rounded-3xl p-12 border ${theme === 'professional' ? 'border-gray-700/50' : 'border-white/20'}`}>
            <div className="text-center mb-12">
              <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-4xl font-bold text-white mb-4">EarnPro Agent Program</h2>
              <p className="text-xl text-white/70">Exclusive influencer program with progressive rewards</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className={`text-3xl font-bold ${theme === 'professional' ? 'text-cyan-300' : 'text-purple-300'} mb-2`}>5-20%</div>
                <div className="text-white font-medium mb-2">Weekly Commission</div>
                <div className="text-white/70 text-sm">Progressive rates based on performance</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${theme === 'professional' ? 'text-blue-300' : 'text-blue-300'} mb-2`}>3x</div>
                <div className="text-white font-medium mb-2">Withdrawal Frequency</div>
                <div className="text-white/70 text-sm">Up to 3 times per week for Gold Agents</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-300 mb-2">1000+</div>
                <div className="text-white font-medium mb-2">Gold Agent Milestone</div>
                <div className="text-white/70 text-sm">Cumulative referrals for Gold status</div>
              </div>
            </div>
            
            <div className="text-center">
              <Link
                to="/agent"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-lg text-lg inline-flex items-center space-x-2"
              >
                <Crown className="w-5 h-5" />
                <span>Apply for Agent Program</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-white/70">Start earning in 3 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Sign Up & Verify',
                description: 'Create your account, verify your email, and complete the activation payment'
              },
              {
                step: '02',
                title: 'Share Your Link',
                description: 'Share your unique referral link or QR code with friends, family, and your network'
              },
              {
                step: '03',
                title: 'Earn & Grow',
                description: 'Earn from every referral and watch your network grow across multiple levels'
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 ${theme === 'professional' ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-gradient-to-br from-purple-500 to-blue-500'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-white font-bold text-lg">{step.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-white/70">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">What Our Users Say</h2>
            <p className="text-xl text-white/70">Join thousands of satisfied users worldwide</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={cardClass}>
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                  {testimonial.isAgent && (
                    <Crown className="w-4 h-4 text-yellow-400 ml-2" title="Agent" />
                  )}
                </div>
                <p className="text-white/80 mb-4">"{testimonial.message}"</p>
                <div className="text-white font-medium">{testimonial.name}</div>
                <div className="text-white/70 text-sm">{testimonial.location}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className={cardClass}>
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Earning?</h2>
            <p className="text-xl text-white/70 mb-8">Join millions of users building their financial future with EarnPro</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className={`${buttonPrimaryClass} text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 shadow-lg text-lg`}
              >
                Create Free Account
              </Link>
              <Link
                to="/legal"
                className={`${buttonSecondaryClass} text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 border text-lg`}
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
