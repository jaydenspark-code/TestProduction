import React from 'react';
import { Play, PauseCircle, Edit, Trash2, TrendingUp, Users, Clock } from 'lucide-react';

const ActiveCampaigns = ({ campaigns }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Active Campaigns</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.filter(c => c.status === 'active').map(campaign => (
          <div key={campaign.id} className="bg-gray-800/50 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-white mb-2">{campaign.name}</h3>
              <div className="flex space-x-2">
                <button className="text-gray-400 hover:text-white"><Edit size={18} /></button>
                <button className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
              </div>
            </div>
            <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center text-sm text-gray-400">
                    <Play size={16} className="mr-2 text-green-400" />
                    <span>{campaign.type}</span>
                </div>
                <div className="flex items-center text-sm text-gray-400">
                    <Clock size={16} className="mr-2 text-blue-400" />
                    <span>{campaign.duration} days</span>
                </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Progress</span>
                <span className="text-white font-medium">{campaign.completion.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${campaign.completion}%` }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Spent: ${campaign.spent.toLocaleString()}</span>
                <span className="text-gray-400">Budget: ${campaign.budget.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-6 border-t border-gray-700 pt-4 flex justify-between items-center">
                <div className="flex items-center">
                    <Users size={16} className="mr-2 text-gray-400"/>
                    <span className="text-white">{campaign.reach.toLocaleString()}</span>
                    <span className="text-gray-400 ml-1">Reached</span>
                </div>
                <button className="bg-red-600/50 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all">
                    <PauseCircle size={18} />
                    <span>Pause</span>
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveCampaigns;
