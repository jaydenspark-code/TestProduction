import React, { useState } from 'react';
import { FileText, Shield, HelpCircle, Phone, Mail, MessageCircle, Clock, Globe, Users } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const LegalPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('terms');
  const { theme } = useTheme();
  const darkMode = theme === 'professional';

  const tabs = [
    { id: 'terms', label: 'Terms of Service', icon: FileText },
    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'support', label: 'Support', icon: Phone }
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#181c23] pt-8' : 'bg-gradient-to-br from-[#6a4bff] to-[#2563eb] pt-0'} pb-8`}>
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 flex items-center ${darkMode ? 'text-white' : 'text-white'}`}> 
            <FileText className="w-8 h-8 mr-3 text-green-400" />
            Legal & Guidance
          </h1>
          <p className={darkMode ? 'text-white/70' : 'text-white/80'}>Important information and support resources</p>
        </div>

        {/* Tab Navigation - Fixed glassmorphism */}
        <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-lg border-gray-700/50' : 'bg-white/10 backdrop-blur-lg border-white/20'} rounded-2xl border mb-8`}>
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? darkMode
                        ? 'bg-gray-700/60 text-white border-b-2 border-cyan-400'
                        : 'bg-white/20 text-white border-b-2 border-purple-400'
                      : darkMode
                        ? 'text-white/70 hover:text-white hover:bg-gray-700/40'
                        : 'text-white/70 hover:text-white hover:bg-white/15'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content - Fixed glassmorphism */}
        <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-lg border-gray-700/50' : 'bg-white/10 backdrop-blur-lg border-white/20'} rounded-2xl p-6 border ${!darkMode ? 'text-white' : ''}`}>
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <h3 className={`text-xl font-bold text-white`}>Terms of Service</h3>

              <div className={'space-y-4 text-white'}>
                <section>
                  <h4 className={`text-lg font-semibold mb-2 text-white`}>1. Acceptance of Terms</h4>
                  <p>
                    By accessing and using EngageRewards, you accept and agree to be bound by the terms and provision of this agreement. 
                    If you do not agree to abide by the above, please do not use this service.
                  </p>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 text-white`}>2. Referral Program</h4>
                  <p>
                    EngageRewards operates a multi-level referral system where users can earn rewards by referring others to the platform. 
                    Earnings are calculated based on direct referrals and multi-level indirect referrals up to 3 levels deep.
                  </p>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 text-white`}>3. Payment Terms</h4>
                  <p>
                    An activation fee is required to participate in the referral program. This fee varies by country and is clearly 
                    displayed during the registration process. All payments are processed securely through our certified payment partners.
                  </p>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 text-white`}>4. User Responsibilities</h4>
                  <p>
                    Users must provide accurate information during registration and are responsible for maintaining the confidentiality 
                    of their account credentials. Users agree not to engage in fraudulent activities or abuse the referral system.
                  </p>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 text-white`}>5. Earnings and Payouts</h4>
                  <p>
                    Earnings are calculated based on successful referrals and are subject to verification. Payouts are processed 
                    monthly and are subject to minimum payout thresholds. EngageRewards reserves the right to withhold payments 
                    for suspicious or fraudulent activity.
                  </p>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h3 className={`text-xl font-bold text-white`}>Privacy Policy</h3>

              <div className="space-y-4 text-white/80">
                <section>
                  <h4 className={`text-lg font-semibold mb-2 text-white`}>Information We Collect</h4>
                  <p>
                    We collect information you provide directly to us, such as when you create an account, make a payment, 
                    or contact us for support. This includes your name, email address, payment information, and referral activities.
                  </p>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 text-white`}>How We Use Your Information</h4>
                  <p>
                    We use your information to provide and improve our services, process payments, track referrals, 
                    communicate with you, and ensure the security of our platform.
                  </p>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 text-white`}>Data Security</h4>
                  <p>
                    We implement appropriate technical and organizational measures to protect your personal information 
                    against unauthorized access, alteration, disclosure, or destruction.
                  </p>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 text-white`}>Data Sharing</h4>
                  <p>
                    We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
                    except as described in this privacy policy or as required by law.
                  </p>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 text-white`}>Your Rights</h4>
                  <p>
                    You have the right to access, update, or delete your personal information. You can also opt-out of 
                    certain communications from us. Contact our support team to exercise these rights.
                  </p>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-6">
              <h3 className={`text-xl font-bold text-white`}>Frequently Asked Questions</h3>

              <div className="space-y-4">
                {[
                  {
                    question: "How does the referral system work?",
                    answer: "When you refer someone using your unique referral link, you earn a commission when they register and pay the activation fee. You also earn from their referrals (level 2) and their referrals' referrals (level 3)."
                  },
                  {
                    question: "What is the activation fee?",
                    answer: "The activation fee varies by country and is displayed in your local currency during registration. This one-time fee activates your account and allows you to participate in the referral program."
                  },
                  {
                    question: "How are earnings calculated?",
                    answer: "Earnings are calculated based on the activation fees paid by your referrals. Direct referrals earn you the highest commission, with decreasing percentages for level 2 and level 3 referrals."
                  },
                  {
                    question: "When do I get paid?",
                    answer: "Payments are processed monthly for verified earnings that meet the minimum payout threshold. Payments are made via bank transfer or mobile money depending on your country."
                  },
                  {
                    question: "Is this a pyramid scheme?",
                    answer: "No, EngageRewards is a legitimate referral marketing platform. We focus on providing value through our network and advertising services, not just recruitment."
                  },
                  {
                    question: "How do I become an agent?",
                    answer: "Agents are selected based on performance and network size. High-performing users may be invited to become agents with additional benefits and responsibilities."
                  }
                ].map((faq, index) => (
                  <div key={index} className={`${darkMode ? 'bg-gray-700/40 backdrop-blur-sm border-gray-600/40' : 'bg-white/10 backdrop-blur-sm border-white/20'} rounded-lg p-4 border`}>
                    <h4 className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-white'}`}>{faq.question}</h4>
                    <p className={darkMode ? 'text-white/70' : 'text-white/80'}>{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-6">
              <h3 className={`text-xl font-bold text-white`}>Support & Contact</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${darkMode ? 'bg-gray-700/40 backdrop-blur-sm border-gray-600/40' : 'bg-white/10 backdrop-blur-sm border-white/20'} rounded-lg p-6 border`}>
                  <div className="flex items-center mb-4">
                    <Mail className="w-6 h-6 text-blue-400 mr-3" />
                    <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Email Support</h4>
                  </div>
                  <p className={`${darkMode ? 'text-white/70' : 'text-gray-700'} mb-3`}>Get help via email within 24 hours</p>
                  <p className={darkMode ? 'text-white' : 'text-gray-900'}>support@engagerewards.com</p>
                </div>

                <div className={`${darkMode ? 'bg-gray-700/40 backdrop-blur-sm border-gray-600/40' : 'bg-white/10 backdrop-blur-sm border-white/20'} rounded-lg p-6 border`}>
                  <div className="flex items-center mb-4">
                    <Phone className="w-6 h-6 text-green-400 mr-3" />
                    <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Phone Support</h4>
                  </div>
                  <p className={`${darkMode ? 'text-white/70' : 'text-gray-700'} mb-3`}>Call us during business hours</p>
                  <p className={darkMode ? 'text-white' : 'text-gray-900'}>+1 (555) 123-4567</p>
                </div>

                <div className={`${darkMode ? 'bg-gray-700/40 backdrop-blur-sm border-gray-600/40' : 'bg-white/10 backdrop-blur-sm border-white/20'} rounded-lg p-6 border`}>
                  <div className="flex items-center mb-4">
                    <MessageCircle className="w-6 h-6 text-purple-400 mr-3" />
                    <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Live Chat</h4>
                  </div>
                  <p className={`${darkMode ? 'text-white/70' : 'text-gray-700'} mb-3`}>Instant help via live chat</p>
                  <button className={`${darkMode ? 'bg-cyan-600 text-white hover:bg-cyan-700' : 'bg-blue-600 text-white hover:bg-blue-700'} px-4 py-2 rounded-lg transition-all duration-200`}>
                    Start Chat
                  </button>
                </div>

                <div className={`${darkMode ? 'bg-gray-700/40 backdrop-blur-sm border-gray-600/40' : 'bg-white/10 backdrop-blur-sm border-white/20'} rounded-lg p-6 border`}>
                  <div className="flex items-center mb-4">
                    <HelpCircle className="w-6 h-6 text-yellow-400 mr-3" />
                    <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Help Center</h4>
                  </div>
                  <p className={`${darkMode ? 'text-white/70' : 'text-gray-700'} mb-3`}>Browse our knowledge base</p>
                  <button className={`${darkMode ? 'bg-gray-700/40 text-white hover:bg-gray-700/60 border-gray-600/40' : 'bg-gray-200 text-gray-900 hover:bg-gray-300 border-gray-300'} px-4 py-2 rounded-lg transition-all duration-200 border`}>
                    Visit Help Center
                  </button>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-700/40 backdrop-blur-sm border-gray-600/40' : 'bg-white/10 backdrop-blur-sm border-white/20'} rounded-lg p-6 border`}>
                <h4 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Business Hours</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={darkMode ? 'text-white/70' : 'text-gray-700'}>
                    <p><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM GMT</p>
                    <p><strong>Saturday:</strong> 10:00 AM - 4:00 PM GMT</p>
                    <p><strong>Sunday:</strong> Closed</p>
                  </div>
                  <div className={darkMode ? 'text-white/70' : 'text-gray-700'}>
                    <p><strong>Emergency Support:</strong> 24/7</p>
                    <p><strong>Response Time:</strong> Within 24 hours</p>
                    <p><strong>Languages:</strong> English, French, Spanish</p>
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

export default LegalPortal;
