import React from 'react';
import { Users, MapPin, BarChart2, TrendingUp, Clock, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const AudienceInsights = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  // Enhanced placeholder data with more insights
  const demographics = {
    age: { '18-24': 40, '25-34': 35, '35-44': 15, '45+': 10 },
    gender: { 'Male': 55, 'Female': 45 },
  };

  const geo = {
    'Ghana': 35.2,
    'Nigeria': 28.7,
    'Kenya': 22.1,
    'South Africa': 8.0,
    'Other': 6.0,
  };

  const interests = {
    'Technology': 45,
    'Finance': 38,
    'Education': 32,
    'Health': 28,
    'Entertainment': 25,
    'Sports': 22
  };

  const behaviorData = {
    'Active Users': 8945,
    'Returning Users': 6234,
    'New Users': 2711,
    'Avg. Session Duration': '4m 32s',
    'Pages per Session': 3.2,
    'Bounce Rate': '24%'
  };

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-xl border border-white/20';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white flex items-center">
          <Users className="mr-3 text-blue-400" />
          Audience Insights
        </h2>
        <div className="text-white/70 text-sm">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(behaviorData).map(([metric, value]) => (
          <div key={metric} className={`${cardClass} p-4`}>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-white/70 text-sm">{metric}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Demographics */}
        <div className={`${cardClass} p-6`}>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <BarChart2 className="mr-2 text-green-400" /> 
            Demographics
          </h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-white mb-4">Age Distribution</h4>
              <div className="space-y-3">
                {Object.entries(demographics.age).map(([range, percent]) => (
                  <div key={range} className="flex items-center">
                    <span className="w-20 text-white/70 text-sm">{range}</span>
                    <div className="flex-1 mx-3">
                      <div className="w-full bg-gray-700/50 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-12 text-right text-white font-medium">{percent}%</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-white mb-4">Gender Distribution</h4>
              <div className="flex items-center justify-center space-x-8">
                {Object.entries(demographics.gender).map(([gender, percent]) => (
                  <div key={gender} className="text-center">
                    <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center ${
                      gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'
                    }`}>
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-white font-medium">{gender}</div>
                    <div className={`text-lg font-bold ${gender === 'Male' ? 'text-blue-400' : 'text-pink-400'}`}>
                      {percent}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className={`${cardClass} p-6`}>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <MapPin className="mr-2 text-orange-400" /> 
            Geographic Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(geo).map(([country, percent]) => (
              <div key={country} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-400 mr-3" />
                  <span className="text-white">{country}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-700/50 rounded-full h-2 mr-3">
                    <div 
                      className="bg-orange-400 h-2 rounded-full" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-white font-medium w-12 text-right">{percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interests & Behaviors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`${cardClass} p-6`}>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <Target className="mr-2 text-purple-400" /> 
            Interest Categories
          </h3>
          <div className="space-y-3">
            {Object.entries(interests).map(([interest, percent]) => (
              <div key={interest} className="flex items-center justify-between">
                <span className="text-white">{interest}</span>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-700/50 rounded-full h-2 mr-3">
                    <div 
                      className="bg-purple-400 h-2 rounded-full" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-white font-medium w-10 text-right">{percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${cardClass} p-6`}>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <TrendingUp className="mr-2 text-green-400" /> 
            Engagement Trends
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 text-green-400 mr-2" />
                <span className="text-white">Weekly Growth</span>
              </div>
              <span className="text-green-400 font-bold">+12.3%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-blue-400 mr-2" />
                <span className="text-white">Peak Activity</span>
              </div>
              <span className="text-blue-400 font-bold">2-4 PM GMT</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-purple-400 mr-2" />
                <span className="text-white">Most Active Device</span>
              </div>
              <span className="text-purple-400 font-bold">Mobile (78%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudienceInsights;
