import React from 'react';
import { FileText, Calendar, CheckCircle, DollarSign, Target } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface Campaign {
  id: string;
  name: string;
  type: 'video' | 'survey' | 'social';
  status: 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  reach: number;
  completion: number;
  createdAt: Date;
  duration: number;
}

interface CampaignHistoryProps {
  campaigns: Campaign[];
}

const CampaignHistory: React.FC<CampaignHistoryProps> = ({ campaigns }) => {
  const completedCampaigns = campaigns.filter(c => c.status === 'completed');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center">
        <FileText className="mr-2" /> Campaign History
      </h2>
      
      <div className="bg-gray-800/50 rounded-lg p-6">
        {completedCampaigns.length > 0 ? (
          <ul className="space-y-4">
            {completedCampaigns.map(campaign => (
              <li key={campaign.id} className="bg-gray-700/50 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">{campaign.name}</p>
                  <div className="flex items-center text-sm text-gray-400 mt-1">
                    <Calendar size={16} className="mr-2" />
                    <span>Completed on: {campaign.createdAt.toLocaleDateString()}</span>
                    <span className="mx-2">|</span>
                    <CheckCircle size={16} className="mr-2" />
                    <span>{campaign.completion}% Completion</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-400 text-xl">{formatCurrency(campaign.spent)}</p>
                  <p className="text-sm text-gray-400">Budget: {formatCurrency(campaign.budget)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-400">No completed campaigns yet.</p>
        )}
      </div>
    </div>
  );
};

export default CampaignHistory;