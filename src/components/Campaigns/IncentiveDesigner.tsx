import React, { useState } from 'react';
import { DollarSign, Gift, TrendingUp, Zap, Plus, Trash2 } from 'lucide-react';

interface IncentiveDesignerProps {
  campaign: any;
  onChange: (campaign: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export const IncentiveDesigner: React.FC<IncentiveDesignerProps> = ({
  campaign,
  onChange,
  onNext,
  onBack
}) => {
  const [customIncentive, setCustomIncentive] = useState({
    type: 'fixed',
    amount: 0,
    condition: '',
    description: ''
  });

  const incentiveTemplates = [
    {
      id: 'standard',
      name: 'Standard Referral',
      description: 'Fixed reward for each successful referral',
      structure: { type: 'fixed', amount: 5, commission: 0 },
      estimatedCost: '$5 per referral',
      expectedConversion: '8-12%'
    },
    {
      id: 'tiered',
      name: 'Tiered Rewards',
      description: 'Increasing rewards based on referral count',
      structure: { 
        type: 'tiered', 
        tiers: [
          { min: 1, max: 5, amount: 5 },
          { min: 6, max: 15, amount: 7 },
          { min: 16, max: 999, amount: 10 }
        ]
      },
      estimatedCost: '$5-10 per referral',
      expectedConversion: '12-18%'
    },
    {
      id: 'performance',
      name: 'Performance Based',
      description: 'Rewards based on referral quality and activity',
      structure: { type: 'performance', baseAmount: 3, bonusMultiplier: 2 },
      estimatedCost: '$3-15 per referral',
      expectedConversion: '15-25%'
    },
    {
      id: 'hybrid',
      name: 'Hybrid Model',
      description: 'Combination of fixed reward + commission',
      structure: { type: 'hybrid', fixedAmount: 3, commission: 0.1 },
      estimatedCost: '$3 + 10% commission',
      expectedConversion: '18-28%'
    }
  ];

  const handleIncentiveSelect = (template: any) => {
    onChange(prev => ({
      ...prev,
      incentiveStructure: template.id,
      incentiveDetails: template.structure
    }));
  };

  const addCustomIncentive = () => {
    const newIncentive = { ...customIncentive, id: Date.now() };
    onChange(prev => ({
      ...prev,
      customIncentives: [...(prev.customIncentives || []), newIncentive]
    }));
    setCustomIncentive({ type: 'fixed', amount: 0, condition: '', description: '' });
  };

  const removeCustomIncentive = (id: number) => {
    onChange(prev => ({
      ...prev,
      customIncentives: prev.customIncentives?.filter(inc => inc.id !== id) || []
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Gift className="w-5 h-5 text-green-400" />
        <h2 className="text-xl font-semibold text-white">Incentive Design</h2>
      </div>

      {/* Incentive Templates */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Choose Incentive Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incentiveTemplates.map((template) => (
            <div
              key={template.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                campaign.incentiveStructure === template.id
                  ? 'border-green-500 bg-green-900/20'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
              }`}
              onClick={() => handleIncentiveSelect(template)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">{template.name}</h4>
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-sm text-gray-400 mb-3">{template.description}</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Cost:</span>
                  <span className="text-green-400">{template.estimatedCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Conversion:</span>
                  <span className="text-blue-400">{template.expectedConversion}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incentive Details */}
      {campaign.incentiveStructure && (
        <div className="bg-gray-700/50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Incentive Configuration</h3>
          
          {campaign.incentiveStructure === 'tiered' && (
            <div className="space-y-4">
              <h4 className="font-medium text-white">Tier Structure</h4>
              {campaign.incentiveDetails?.tiers?.map((tier: any, index: number) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <span className="text-white">Referrals {tier.min}-{tier.max === 999 ? '∞' : tier.max}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <input
                      type="number"
                      value={tier.amount}
                      onChange={(e) => {
                        const newTiers = [...campaign.incentiveDetails.tiers];
                        newTiers[index].amount = parseFloat(e.target.value);
                        onChange(prev => ({
                          ...prev,
                          incentiveDetails: { ...prev.incentiveDetails, tiers: newTiers }
                        }));
                      }}
                      className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {campaign.incentiveStructure === 'hybrid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fixed Amount ($)
                </label>
                <input
                  type="number"
                  value={campaign.incentiveDetails?.fixedAmount || 0}
                  onChange={(e) => onChange(prev => ({
                    ...prev,
                    incentiveDetails: {
                      ...prev.incentiveDetails,
                      fixedAmount: parseFloat(e.target.value)
                    }
                  }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Commission (%)
                </label>
                <input
                  type="number"
                  value={(campaign.incentiveDetails?.commission || 0) * 100}
                  onChange={(e) => onChange(prev => ({
                    ...prev,
                    incentiveDetails: {
                      ...prev.incentiveDetails,
                      commission: parseFloat(e.target.value) / 100
                    }
                  }))}
                  min="0"
                  max="50"
                  step="0.5"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Incentives */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Custom Incentives</h3>
        
        {/* Add Custom Incentive */}
        <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <select
              value={customIncentive.type}
              onChange={(e) => setCustomIncentive(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="fixed">Fixed Amount</option>
              <option value="percentage">Percentage</option>
              <option value="bonus">Bonus</option>
            </select>
            <input
              type="number"
              placeholder="Amount"
              value={customIncentive.amount}
              onChange={(e) => setCustomIncentive(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
            <input
              type="text"
              placeholder="Condition"
              value={customIncentive.condition}
              onChange={(e) => setCustomIncentive(prev => ({ ...prev, condition: e.target.value }))}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
            <button
              onClick={addCustomIncentive}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Custom Incentives List */}
        {campaign.customIncentives?.length > 0 && (
          <div className="space-y-2">
            {campaign.customIncentives.map((incentive: any) => (
              <div key={incentive.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div>
                  <span className="text-white font-medium">
                    {incentive.type === 'fixed' ? '$' : ''}{incentive.amount}{incentive.type === 'percentage' ? '%' : ''}
                  </span>
                  <span className="text-gray-400 ml-2">{incentive.condition}</span>
                </div>
                <button
                  onClick={() => removeCustomIncentive(incentive.id)}
                  className="p-1 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cost Estimation */}
      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg p-6 border border-green-500/20">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Cost Estimation</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              ${Math.round((campaign.budget || 0) * 0.6)}
            </div>
            <div className="text-sm text-gray-400">Estimated Incentive Cost</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {Math.round((campaign.budget || 0) / 7)}
            </div>
            <div className="text-sm text-gray-400">Expected Referrals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              ${Math.round(((campaign.budget || 0) / 7) * 15)}
            </div>
            <div className="text-sm text-gray-400">Projected Revenue</div>
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
          disabled={!campaign.incentiveStructure}
          className={`px-6 py-3 rounded-lg font-medium ${
            campaign.incentiveStructure
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next: AI Optimization
        </button>
      </div>
    </div>
  );
};
