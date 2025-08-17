import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { DollarSign, TrendingUp, Users, Gift } from 'lucide-react';

const EarningsDashboard: React.FC = () => {
  const { theme } = useTheme();

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Earnings Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Total Earnings</p>
                <p className="text-2xl font-bold text-white">$0.00</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Referral Earnings</p>
                <p className="text-2xl font-bold text-white">$0.00</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Task Earnings</p>
                <p className="text-2xl font-bold text-white">$0.00</p>
              </div>
              <Gift className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          
          <div className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">Growth Rate</p>
                <p className="text-2xl font-bold text-white">0%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className={`${cardClass} p-6`}>
          <h2 className="text-xl font-bold text-white mb-4">Earnings Overview</h2>
          <p className="text-white/70">
            Your comprehensive earnings dashboard. Track your referral commissions, task rewards, 
            and overall performance here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EarningsDashboard;