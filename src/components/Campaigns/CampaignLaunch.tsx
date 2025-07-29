import React, { useState } from 'react';
import { Rocket, CheckCircle, AlertCircle, Calendar, Share2, Eye } from 'lucide-react';

interface CampaignLaunchProps {
  campaign: any;
  onSave: () => void;
  onBack: () => void;
  loading: boolean;
}

export const CampaignLaunch: React.FC<CampaignLaunchProps> = ({
  campaign,
  onSave,
  onBack,
  loading
}) => {
  const [launchSettings, setLaunchSettings] = useState({
    startDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    autoStart: true,
    notifications: true,
    tracking: true,
    socialSharing: false
  });

  const [previewMode, setPreviewMode] = useState(false);

  const campaignSummary = {
    totalBudget: campaign.budget || 0,
    estimatedReach: (campaign.targetAudience?.segments?.length || 0) * 500,
    expectedReferrals: Math.round((campaign.budget || 0) / 7),
    projectedROI: Math.round(((campaign.budget || 0) / 7) * 15 / (campaign.budget || 1) * 100),
    duration: campaign.duration || 30
  };

  const readinessChecks = [
    {
      id: 'basic_info',
      label: 'Basic Information',
      status: campaign.name && campaign.description ? 'complete' : 'incomplete',
      details: campaign.name ? 'Campaign name and description set' : 'Missing campaign details'
    },
    {
      id: 'audience',
      label: 'Target Audience',
      status: campaign.targetAudience?.segments?.length > 0 ? 'complete' : 'incomplete',
      details: campaign.targetAudience?.segments?.length > 0 
        ? `${campaign.targetAudience.segments.length} segments selected`
        : 'No audience segments selected'
    },
    {
      id: 'incentives',
      label: 'Incentive Structure',
      status: campaign.incentiveStructure ? 'complete' : 'incomplete',
      details: campaign.incentiveStructure 
        ? `${campaign.incentiveStructure} structure configured`
        : 'No incentive structure selected'
    },
    {
      id: 'budget',
      label: 'Budget & Duration',
      status: campaign.budget > 0 && campaign.duration > 0 ? 'complete' : 'incomplete',
      details: campaign.budget > 0 
        ? `$${campaign.budget} for ${campaign.duration} days`
        : 'Budget or duration not set'
    }
  ];

  const allChecksComplete = readinessChecks.every(check => check.status === 'complete');

  const handleLaunch = async () => {
    if (!allChecksComplete) return;
    
    // Add launch settings to campaign
    const finalCampaign = {
      ...campaign,
      launchSettings,
      status: launchSettings.autoStart ? 'active' : 'scheduled',
      launchedAt: launchSettings.autoStart ? new Date().toISOString() : null,
      scheduledFor: !launchSettings.autoStart 
        ? new Date(`${launchSettings.startDate}T${launchSettings.startTime}`).toISOString()
        : null
    };

    await onSave();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Rocket className="w-5 h-5 text-orange-400" />
        <h2 className="text-xl font-semibold text-white">Launch Campaign</h2>
      </div>

      {/* Campaign Summary */}
      <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-lg p-6 border border-orange-500/20">
        <h3 className="text-lg font-semibold text-white mb-4">Campaign Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">
              ${campaignSummary.totalBudget.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Total Budget</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {campaignSummary.estimatedReach.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Est. Reach</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {campaignSummary.expectedReferrals}
            </div>
            <div className="text-sm text-gray-400">Expected Referrals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {campaignSummary.projectedROI}%
            </div>
            <div className="text-sm text-gray-400">Projected ROI</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">
              {campaignSummary.duration}
            </div>
            <div className="text-sm text-gray-400">Days</div>
          </div>
        </div>
      </div>

      {/* Readiness Checklist */}
      <div className="bg-gray-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Launch Readiness</h3>
        <div className="space-y-3">
          {readinessChecks.map((check) => (
            <div key={check.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              {check.status === 'complete' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <div className="flex-1">
                <div className="font-medium text-white">{check.label}</div>
                <div className="text-sm text-gray-400">{check.details}</div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                check.status === 'complete' 
                  ? 'bg-green-900/50 text-green-400' 
                  : 'bg-red-900/50 text-red-400'
              }`}>
                {check.status === 'complete' ? 'Ready' : 'Incomplete'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Launch Settings */}
      <div className="bg-gray-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Launch Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Date & Time */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Date & Time
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={launchSettings.startDate}
                onChange={(e) => setLaunchSettings(prev => ({ ...prev, startDate: e.target.value }))}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
              <input
                type="time"
                value={launchSettings.startTime}
                onChange={(e) => setLaunchSettings(prev => ({ ...prev, startTime: e.target.value }))}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
          </div>

          {/* Launch Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={launchSettings.autoStart}
                onChange={(e) => setLaunchSettings(prev => ({ ...prev, autoStart: e.target.checked }))}
                className="w-4 h-4 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
              />
              <span className="text-white">Auto-start campaign</span>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={launchSettings.notifications}
                onChange={(e) => setLaunchSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                className="w-4 h-4 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
              />
              <span className="text-white">Enable notifications</span>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={launchSettings.tracking}
                onChange={(e) => setLaunchSettings(prev => ({ ...prev, tracking: e.target.checked }))}
                className="w-4 h-4 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
              />
              <span className="text-white">Advanced tracking</span>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={launchSettings.socialSharing}
                onChange={(e) => setLaunchSettings(prev => ({ ...prev, socialSharing: e.target.checked }))}
                className="w-4 h-4 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
              />
              <span className="text-white">Enable social sharing</span>
            </label>
          </div>
        </div>
      </div>

      {/* Campaign Preview */}
      <div className="bg-gray-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Campaign Preview</h3>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            <Eye className="w-4 h-4" />
            {previewMode ? 'Hide' : 'Show'} Preview
          </button>
        </div>
        
        {previewMode && (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
            <div className="text-center mb-4">
              <h4 className="text-xl font-bold text-white mb-2">{campaign.name}</h4>
              <p className="text-gray-400">{campaign.description}</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4 text-center">
              <div className="text-white font-semibold mb-2">
                {campaign.incentiveStructure === 'standard' && `Earn $${campaign.incentiveDetails?.amount || 5} per referral!`}
                {campaign.incentiveStructure === 'tiered' && 'Earn more with each referral!'}
                {campaign.incentiveStructure === 'hybrid' && `$${campaign.incentiveDetails?.fixedAmount || 3} + ${(campaign.incentiveDetails?.commission || 0.1) * 100}% commission`}
              </div>
              <button className="px-6 py-2 bg-white text-purple-600 rounded-lg font-medium">
                Join Campaign
              </button>
            </div>
          </div>
        )}
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
          onClick={handleLaunch}
          disabled={!allChecksComplete || loading}
          className={`px-8 py-3 rounded-lg font-medium flex items-center gap-2 ${
            allChecksComplete && !loading
              ? 'bg-orange-600 hover:bg-orange-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Rocket className="w-4 h-4" />
          {loading ? 'Launching...' : launchSettings.autoStart ? 'Launch Campaign' : 'Schedule Campaign'}
        </button>
      </div>
    </div>
  );
};
