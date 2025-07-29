import React from 'react';
import { FileText, DollarSign, Calendar } from 'lucide-react';

interface CampaignBasicInfoProps {
  campaign: any;
  onChange: (campaign: any) => void;
  onNext: () => void;
}

export const CampaignBasicInfo: React.FC<CampaignBasicInfoProps> = ({
  campaign,
  onChange,
  onNext
}) => {
  const handleInputChange = (field: string, value: any) => {
    onChange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isValid = campaign.name && campaign.description && campaign.budget > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-5 h-5 text-purple-400" />
        <h2 className="text-xl font-semibold text-white">Campaign Basic Information</h2>
      </div>

      {/* Campaign Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Campaign Name *
        </label>
        <input
          type="text"
          value={campaign.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter campaign name..."
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Campaign Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description *
        </label>
        <textarea
          value={campaign.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe your campaign goals and strategy..."
          rows={4}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Budget and Duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Budget ($) *
          </label>
          <input
            type="number"
            value={campaign.budget}
            onChange={(e) => handleInputChange('budget', parseFloat(e.target.value))}
            min="100"
            step="50"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Duration (days) *
          </label>
          <select
            value={campaign.duration}
            onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value={7}>1 Week</option>
            <option value={14}>2 Weeks</option>
            <option value={30}>1 Month</option>
            <option value={60}>2 Months</option>
            <option value={90}>3 Months</option>
          </select>
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-6">
        <button
          onClick={onNext}
          disabled={!isValid}
          className={`px-6 py-3 rounded-lg font-medium ${
            isValid
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next: Audience Targeting
        </button>
      </div>
    </div>
  );
};
