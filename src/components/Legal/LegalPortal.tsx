import React, { useState } from 'react';
import { MessageCircle, FileText, Shield, Users, HelpCircle } from 'lucide-react';
import LiveSupportChat from '../Support/LiveSupportChat';

const LegalPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('terms');
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [darkMode] = useState(false); // You can connect this to your theme context

  const tabs = [
    { id: 'terms', label: 'Terms of Service', icon: FileText },
    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
    { id: 'community', label: 'Community Guidelines', icon: Users },
    { id: 'support', label: 'Support', icon: HelpCircle }
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#181c23] pt-8' : 'bg-gradient-to-br from-[#6a4bff] to-[#2563eb] pt-0'} pb-8`}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className={`text-3xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-white'}`}>
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
                      ? darkMode 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-white text-purple-600'
                      : darkMode
                        ? 'bg-gray-700/40 text-white/70 hover:bg-gray-600/40'
                        : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className={`${darkMode ? 'bg-gray-800/40 backdrop-blur-sm border-gray-600/40' : 'bg-white/10 backdrop-blur-sm border-white/20'} rounded-lg p-8 border`}>
            {activeTab === 'terms' && (
              <div className="space-y-6">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Terms of Service</h2>
                <div className={`${darkMode ? 'text-white/80' : 'text-gray-700'} space-y-4`}>
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
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Privacy Policy</h2>
                <div className={`${darkMode ? 'text-white/80' : 'text-gray-700'} space-y-4`}>
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
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Community Guidelines</h2>
                <div className={`${darkMode ? 'text-white/80' : 'text-gray-700'} space-y-4`}>
                  <p>Our community guidelines help create a safe and welcoming environment for all users.</p>
                  <h3 className="text-lg font-semibold">Be Respectful</h3>
                  <p>Treat all community members with respect and kindness.</p>
                  <h3 className="text-lg font-semibold">No Spam or Fraud</h3>
                  <p>Do not engage in spamming or fraudulent activities.</p>
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="space-y-6">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Support</h2>
                
                <div className={`${darkMode ? 'bg-gray-700/40 backdrop-blur-sm border-gray-600/40' : 'bg-white/10 backdrop-blur-sm border-white/20'} rounded-lg p-6 border`}>
                  <div className="flex items-center mb-4">
                    <MessageCircle className="w-6 h-6 text-purple-400 mr-3" />
                    <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI Live Support</h4>
                  </div>
                  <p className={`${darkMode ? 'text-white/70' : 'text-gray-700'} mb-3`}>Get instant help from our AI assistant or connect with human agents</p>
                  <button 
                    onClick={() => setShowLiveChat(true)}
                    className={`${darkMode ? 'bg-cyan-600 text-white hover:bg-cyan-700' : 'bg-blue-600 text-white hover:bg-blue-700'} px-4 py-2 rounded-lg transition-all duration-200`}
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
