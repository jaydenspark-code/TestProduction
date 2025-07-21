
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { TrendingUp, BarChart3, PieChart, Target, Download, LineChart, Activity, Globe, Zap } from 'lucide-react';

const AdvancedPerformance: React.FC = () => {
  const { theme } = useTheme();
  const [timeRange, setTimeRange] = useState('7d');
  const [metric, setMetric] = useState('revenue');

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20';

  const performanceData = {
    revenue: {
      current: 15847.89,
      previous: 12456.78,
      growth: 27.2,
      trend: 'up'
    },
    conversions: {
      current: 234,
      previous: 189,
      growth: 23.8,
      trend: 'up'
    },
    network: {
      current: 2847,
      previous: 2456,
      growth: 15.9,
      trend: 'up'
    },
    engagement: {
      current: 78.5,
      previous: 72.3,
      growth: 8.6,
      trend: 'up'
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center">
          <TrendingUp className="w-8 h-8 mr-3 text-green-400" />
          Advanced Performance Analytics
        </h3>
        <div className="flex items-center space-x-4">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className={`px-4 py-2 ${theme === 'professional' ? 'bg-gray-700/50' : 'bg-white/10'} rounded-lg text-white border ${theme === 'professional' ? 'border-gray-600/50' : 'border-white/20'}`}
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button className={`px-4 py-2 ${theme === 'professional' ? 'bg-gray-700/50' : 'bg-white/10'} rounded-lg text-white hover:bg-white/20 transition-all duration-200 flex items-center space-x-2`}>
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(performanceData).map(([key, data]) => (
          <div key={key} className={`${cardClass} p-6 relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-16 h-16 ${
              data.trend === 'up' ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' : 'bg-gradient-to-br from-red-500/20 to-pink-500/20'
            } rounded-full -mr-8 -mt-8`}></div>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                data.trend === 'up' ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                {key === 'revenue' && <TrendingUp className="w-5 h-5 text-green-400" />}
                {key === 'conversions' && <Target className="w-5 h-5 text-blue-400" />}
                {key === 'network' && <BarChart3 className="w-5 h-5 text-purple-400" />}
                {key === 'engagement' && <PieChart className="w-5 h-5 text-yellow-400" />}
              </div>
              <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                data.trend === 'up' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
                +{data.growth.toFixed(1)}%
              </span>
            </div>
            <h4 className="text-white font-medium capitalize">{key}</h4>
            <p className="text-2xl font-bold text-white">{
              key === 'revenue' ? `$${data.current.toLocaleString()}` :
              key === 'engagement' ? `${data.current}%` :
              data.current.toLocaleString()
            }</p>
            <p className="text-white/60 text-sm">vs. {
              key === 'revenue' ? `$${data.previous.toLocaleString()}` :
              key === 'engagement' ? `${data.previous}%` :
              data.previous.toLocaleString()
            } last period</p>
          </div>
        ))}
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${cardClass} p-6`}>
          <h4 className="text-white font-medium mb-6 flex items-center">
            <LineChart className="w-5 h-5 mr-2" />
            Revenue Trend
          </h4>
          <div className="h-64 flex items-end space-x-2">
            {[65, 78, 82, 75, 88, 92, 85, 95, 89, 97, 94, 100, 96, 98].map((value, index) => (
              <div
                key={index}
                className="bg-gradient-to-t from-green-600 to-emerald-400 rounded-t-sm transition-all duration-500 flex-1"
                style={{ height: `${value}%` }}
              ></div>
            ))}
          </div>
          <div className="mt-4 flex justify-between text-white/60 text-xs">
            <span>2 weeks ago</span>
            <span>1 week ago</span>
            <span>Today</span>
          </div>
        </div>

        <div className={`${cardClass} p-6`}>
          <h4 className="text-white font-medium mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Network Activity
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Active Users</span>
              <span className="text-white font-bold">2,456</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">New Registrations</span>
              <span className="text-green-300 font-bold">+45</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">Conversion Rate</span>
              <span className="text-blue-300 font-bold">78.5%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">Retention Rate</span>
              <span className="text-purple-300 font-bold">92.3%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Metrics */}
      <div className={`${cardClass} p-6`}>
        <h4 className="text-white font-medium mb-6 flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          Global Performance Insights
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-300 mb-2">12</div>
            <div className="text-white/70 text-sm">Countries Active</div>
            <div className="text-green-300 text-xs">+2 this month</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-300 mb-2">4.8</div>
            <div className="text-white/70 text-sm">Average Rating</div>
            <div className="text-green-300 text-xs">+0.3 improvement</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-300 mb-2">24/7</div>
            <div className="text-white/70 text-sm">Network Uptime</div>
            <div className="text-green-300 text-xs">99.9% reliability</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedPerformance;
