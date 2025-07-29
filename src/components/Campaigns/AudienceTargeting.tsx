import React, { useState, useEffect } from 'react';
import { Users, Target, MapPin, Calendar, TrendingUp } from 'lucide-react';

interface AudienceTargetingProps {
  campaign: any;
  onChange: (campaign: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const AudienceTargeting: React.FC<AudienceTargetingProps> = ({
  campaign,
  onChange,
  onNext,
  onBack
}) => {
  const [audienceInsights, setAudienceInsights] = useState<any>(null);

  const handleAudienceChange = (field: string, value: any) => {
    const updatedAudience = { ...campaign.targetAudience, [field]: value };
    onChange(prev => ({
      ...prev,
      targetAudience: updatedAudience
    }));
  };

  const audienceSegments = [
    { id: 'new_users', label: 'New Users', description: 'Users registered in last 30 days', count: 1250 },
    { id: 'active_referrers', label: 'Active Referrers', description: 'Users with 3+ successful referrals', count: 890 },
    { id: 'high_value', label: 'High Value Users', description: 'Users with $500+ lifetime earnings', count: 456 },
    { id: 'dormant_users', label: 'Dormant Users', description: 'Inactive for 30+ days', count: 2100 },
    { id: 'social_influencers', label: 'Social Influencers', description: 'Users with large social networks', count: 234 }
  ];

  const demographics = [
    { id: '18-24', label: '18-24 years', percentage: 25 },
    { id: '25-34', label: '25-34 years', percentage: 35 },
    { id: '35-44', label: '35-44 years', percentage: 28 },
    { id: '45+', label: '45+ years', percentage: 12 }
  ];

  const locations = [
    { id: 'us', label: 'United States', count: 3200 },
    { id: 'ca', label: 'Canada', count: 890 },
    { id: 'uk', label: 'United Kingdom', count: 650 },
    { id: 'au', label: 'Australia', count: 420 },
    { id: 'other', label: 'Other Countries', count: 1840 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">Audience Targeting</h2>
      </div>

      {/* Audience Segments */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Target Segments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {audienceSegments.map((segment) => (
            <div
              key={segment.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                campaign.targetAudience?.segments?.includes(segment.id)
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
              }`}
              onClick={() => {
                const currentSegments = campaign.targetAudience?.segments || [];
                const newSegments = currentSegments.includes(segment.id)
                  ? currentSegments.filter(s => s !== segment.id)
                  : [...currentSegments, segment.id];
                handleAudienceChange('segments', newSegments);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">{segment.label}</h4>
                <span className="text-sm text-blue-400">{segment.count.toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-400">{segment.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Demographics */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Age Demographics</h3>
        <div className="bg-gray-700/50 rounded-lg p-4">
          {demographics.map((demo) => (
            <div key={demo.id} className="flex items-center justify-between py-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={campaign.targetAudience?.demographics?.includes(demo.id) || false}
                  onChange={(e) => {
                    const currentDemo = campaign.targetAudience?.demographics || [];
                    const newDemo = e.target.checked
                      ? [...currentDemo, demo.id]
                      : currentDemo.filter(d => d !== demo.id);
                    handleAudienceChange('demographics', newDemo);
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-white">{demo.label}</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${demo.percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-400">{demo.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Geographic Targeting */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Geographic Targeting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {locations.map((location) => (
            <label key={location.id} className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700">
              <input
                type="checkbox"
                checked={campaign.targetAudience?.locations?.includes(location.id) || false}
                onChange={(e) => {
                  const currentLocations = campaign.targetAudience?.locations || [];
                  const newLocations = e.target.checked
                    ? [...currentLocations, location.id]
                    : currentLocations.filter(l => l !== location.id);
                  handleAudienceChange('locations', newLocations);
                }}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-white">{location.label}</span>
                <div className="text-sm text-gray-400">{location.count.toLocaleString()} users</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Audience Size Estimate */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-6 border border-blue-500/20">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Estimated Audience</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {(campaign.targetAudience?.segments?.length * 500 + 
                campaign.targetAudience?.demographics?.length * 300 + 
                campaign.targetAudience?.locations?.length * 400) || 0}
            </div>
            <div className="text-sm text-gray-400">Total Reach</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {Math.round(((campaign.targetAudience?.segments?.length || 0) * 0.15 + 0.05) * 100)}%
            </div>
            <div className="text-sm text-gray-400">Expected CTR</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              ${Math.round((campaign.budget || 0) * 0.8)}
            </div>
            <div className="text-sm text-gray-400">Effective Spend</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!campaign.targetAudience?.segments?.length}
          className={`px-6 py-3 rounded-lg font-medium ${
            campaign.targetAudience?.segments?.length
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next: Design Incentives
        </button>
      </div>
    </div>
  );
};
