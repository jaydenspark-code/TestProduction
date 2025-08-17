import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Lock, CreditCard, Star, DollarSign, CheckCircle } from 'lucide-react';

const PaymentRequired: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const bgClass = theme === 'professional'
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800'
    : 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20';

  const buttonClass = theme === 'professional'
    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700';

  return (
    <div className={bgClass}>
      <div className="flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-2xl">
          <div className={cardClass}>
            <div className="text-center">
              {/* Icon */}
              <div className={`w-20 h-20 ${theme === 'professional' ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-gradient-to-br from-purple-500 to-blue-500'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <Lock className="w-10 h-10 text-white" />
              </div>

              {/* Header */}
              <h1 className="text-3xl font-bold text-white mb-4">Payment Required</h1>
              <p className="text-white/70 text-lg mb-8">
                Hello {user?.fullName}! 👋 You need to activate your account to access EarnPro features.
              </p>

              {/* Features List */}
              <div className="bg-white/5 rounded-xl p-6 mb-8 text-left">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-center">
                  <Star className="w-6 h-6 mr-2 text-yellow-400" />
                  What You'll Get
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-white">$3.00 Welcome Bonus</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-white">Referral System Access</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-white">Task Completion Rewards</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-white">Withdrawal System</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-white">Leaderboard Participation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-white">Agent & Advertiser Opportunities</span>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-6 mb-8 border border-green-500/30">
                <div className="flex items-center justify-center mb-4">
                  <DollarSign className="w-8 h-8 text-green-400 mr-2" />
                  <span className="text-3xl font-bold text-white">$15.00</span>
                  <span className="text-white/70 ml-2">one-time activation</span>
                </div>
                <p className="text-green-300 text-sm">
                  💰 Get $3.00 back immediately as welcome bonus!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Link
                  to="/payment"
                  className={`w-full ${buttonClass} text-white py-4 px-8 rounded-lg font-bold text-lg transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center space-x-3`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span>Activate Account Now</span>
                </Link>
                
                <Link
                  to="/login"
                  className="block w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200"
                >
                  Back to Login
                </Link>
              </div>

              {/* Support Info */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-white/50 text-sm">
                  Need help? Contact our support team for assistance with account activation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentRequired;
