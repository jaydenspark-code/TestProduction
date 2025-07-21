import React from 'react';
import { Users, MapPin, BarChart2, PieChart } from 'lucide-react';

const AudienceInsights = () => {
  // Placeholder data
  const demographics = {
    age: { '18-24': 40, '25-34': 35, '35-44': 15, '45+': 10 },
    gender: { 'Male': 55, 'Female': 45 },
  };

  const geo = {
    'United States': 60,
    'Canada': 15,
    'United Kingdom': 10,
    'Australia': 5,
    'Other': 10,
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Audience Insights</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center"><Users className="mr-2" /> Demographics</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-medium text-white mb-2">Age Distribution</h4>
              <div className="space-y-2">
                {Object.entries(demographics.age).map(([range, percent]) => (
                  <div key={range} className="flex items-center">
                    <span className="w-20 text-gray-400">{range}</span>
                    <div className="w-full bg-gray-700 rounded-full h-4">
                      <div className="bg-green-500 h-4 rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                    <span className="w-12 text-right text-white">{percent}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-medium text-white mb-2">Gender</h4>
               <div className="flex items-center space-x-4">
                {Object.entries(demographics.gender).map(([gender, percent]) => (
                    <div key={gender} className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'}`}></div>
                        <span className="text-white">{gender}: {percent}%</span>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center"><MapPin className="mr-2" /> Geographic Distribution</h3>
          <div className="space-y-2">
            {Object.entries(geo).map(([country, percent]) => (
              <div key={country} className="flex items-center">
                <span className="w-40 text-gray-400">{country}</span>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div className="bg-purple-500 h-4 rounded-full" style={{ width: `${percent}%` }}></div>
                </div>
                <span className="w-12 text-right text-white">{percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudienceInsights;