import React, { useState } from 'react';
import { MessageCircle, FileText, Shield, Users, HelpCircle } from 'lucide-react';
import LiveSupportChat from '../Support/LiveSupportChat';
import { useTheme } from '../../context/ThemeContext';

type Tab = 'terms' | 'privacy' | 'community' | 'faq' | 'support';

const LegalPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('terms');
  const [showLiveChat, setShowLiveChat] = useState(false);
  const { theme: currentTheme } = useTheme();
  const isProfessional = currentTheme === 'professional';

  const tabs = [
    { id: 'terms', label: 'Terms of Service', icon: FileText },
    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
    { id: 'community', label: 'Community Guidelines', icon: Users },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'support', label: 'Support', icon: MessageCircle }
  ];

  return (
    <div className={`min-h-screen ${isProfessional ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900' : 'bg-gradient-to-br from-purple-800 via-indigo-900 to-blue-900'} pb-8`}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className={`text-3xl font-bold mb-8 text-white`}>
            Legal Portal
          </h1>
          
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? isProfessional 
                        ? 'bg-cyan-600 text-white shadow-xl ring-2 ring-cyan-500/30' 
                        : 'bg-purple-600 text-white shadow-xl ring-2 ring-purple-500/30'
                      : isProfessional
                        ? 'bg-gray-800/70 text-gray-300 hover:bg-gray-700 hover:text-white transition-all shadow-lg'
                        : 'bg-purple-900/40 backdrop-blur-lg text-blue-200 hover:bg-purple-800/60 hover:text-white transition-all shadow-lg border border-purple-400/20'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className={`${isProfessional ? 'bg-gray-800/70 backdrop-blur-lg border-gray-700/50' : 'bg-indigo-900/30 backdrop-blur-lg border-purple-400/30'} rounded-lg p-8 border shadow-2xl`}>
            {activeTab === 'terms' && (
              <div className="space-y-6">
                <h2 className={`text-2xl font-bold text-white`}>Terms of Service</h2>
                <div className={`${isProfessional ? 'text-gray-300' : 'text-blue-100'} space-y-4`}>
                  <p>Welcome to EarnPro. By using our platform, you agree to these terms.</p>
                  <h3 className="text-lg font-semibold">1. Acceptance of Terms</h3>
                  <p>By accessing and using EarnPro, you accept and agree to be bound by the terms and provision of this agreement.</p>
                  <h3 className="text-lg font-semibold">2. Use License</h3>
                  <p>Permission is granted to temporarily use EarnPro for personal, non-commercial transitory viewing only.</p>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h2 className={`text-2xl font-bold text-white`}>Privacy Policy</h2>
                <div className={`${isProfessional ? 'text-gray-300' : 'text-blue-100'} space-y-4`}>
                  <p>Your privacy is important to us. This policy explains how we collect and use your information.</p>
                  <h3 className="text-lg font-semibold">Information We Collect</h3>
                  <p>We collect information you provide directly to us, such as when you create an account or contact us.</p>
                  <h3 className="text-lg font-semibold">How We Use Your Information</h3>
                  <p>We use the information we collect to provide, maintain, and improve our services.</p>
                </div>
              </div>
            )}

            {activeTab === 'community' && (
              <div className="space-y-6">
                <h2 className={`text-2xl font-bold text-white`}>Community Guidelines</h2>
                <div className={`${isProfessional ? 'text-gray-300' : 'text-blue-100'} space-y-4`}>
                  <p>Our community guidelines help create a safe and welcoming environment for all users.</p>
                  <h3 className="text-lg font-semibold">Be Respectful</h3>
                  <p>Treat all community members with respect and kindness.</p>
                  <h3 className="text-lg font-semibold">No Spam or Fraud</h3>
                  <p>Do not engage in spamming or fraudulent activities.</p>
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="space-y-6">
                <h2 className={`text-2xl font-bold text-white`}>Frequently Asked Questions</h2>
                <div className={`${isProfessional ? 'text-gray-300' : 'text-blue-100'} space-y-6`}>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">When do I get paid?</h3>
                    <p>We process all payments on a daily basis. Once you've earned the minimum withdrawal amount, you can request a payout and receive your earnings within 24 hours. This applies to all verified users with completed tasks and referral earnings.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">What are the payment methods?</h3>
                    <p>We support PayPal, bank transfer, and cryptocurrency as payment methods. All payments are processed within 24 hours through our verified payment partners.</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">What is the minimum withdrawal amount?</h3>
                    <p>The minimum withdrawal amount varies by payment method and country. Generally, it ranges from $10 to $50 USD equivalent. Check your dashboard for specific limits based on your location and chosen payment method.</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">How does the referral system work?</h3>
                    <p>Our multi-level referral system allows you to earn from both direct and indirect referrals. You earn a percentage of your referrals' earnings without any deduction from their rewards. The commission rates vary based on your agent level and performance.</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">What is the Agent Program?</h3>
                    <p>The Agent Program is our premium membership tier that offers higher earning potential, faster withdrawals, and exclusive benefits. Agents can earn increased referral commissions and unlock special tasks and bonuses.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="space-y-6">
                <h2 className={`text-2xl font-bold text-white`}>Support</h2>
                
                <div className={`${isProfessional ? 'bg-gray-700/30 border-gray-600/30' : 'bg-purple-800/30 border-purple-400/30'} rounded-lg p-6 border shadow-lg backdrop-blur-sm`}>
                  <div className="flex items-center mb-4">
                    <MessageCircle className={`w-6 h-6 ${isProfessional ? 'text-cyan-400' : 'text-purple-400'} mr-3`} />
                    <h4 className={`font-medium text-white`}>AI Live Support</h4>
                  </div>
                  <p className={`${isProfessional ? 'text-gray-300' : 'text-blue-100'} mb-3`}>Get instant help from our AI assistant or connect with human agents</p>
                  <button 
                    onClick={() => setShowLiveChat(true)}
                    className={`${isProfessional ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-purple-600 hover:bg-purple-500'} text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg`}
                  >
                    Start Live Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Live Support Chat */}
      <LiveSupportChat 
        isOpen={showLiveChat} 
        onClose={() => setShowLiveChat(false)} 
      />
    </div>
  );
};

export default LegalPortal;
