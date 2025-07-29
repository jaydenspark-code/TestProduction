import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { 
  Plus, 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Play, 
  Pause, 
  Edit, 
  Trash2,
  Eye,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CampaignDashboard: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
    if (user?.id) {
      loadCampaigns();
    }
  }, [user?.id, filter, sortBy]);

  const loadCampaigns = async () => {
    try {
      let query = supabase
        .from('ai_campaigns')
        .select(`
          *,
          campaign_performance (
            impressions,
            clicks,
            conversions,
            referrals,
            revenue,
            cost
          ),
          campaign_participants (
            id,
            user_id,
            referrals_count,
            earnings
          )
        `)
        .eq('user_id', user?.id);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      query = query.order(sortBy, { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Process campaign data with aggregated metrics
      const processedCampaigns = data?.map(campaign => ({
        ...campaign,
        metrics: {
          totalImpressions: campaign.campaign_performance?.reduce((sum, p) => sum + (p.impressions || 0), 0) || 0,
          totalClicks: campaign.campaign_performance?.reduce((sum, p) => sum + (p.clicks || 0), 0) || 0,
          totalConversions: campaign.campaign_performance?.reduce((sum, p) => sum + (p.conversions || 0), 0) || 0,
          totalReferrals: campaign.campaign_performance?.reduce((sum, p) => sum + (p.referrals || 0), 0) || 0,
          totalRevenue: campaign.campaign_performance?.reduce((sum, p) => sum + (p.revenue || 0), 0) || 0,
          totalCost: campaign.campaign_performance?.reduce((sum, p) => sum + (p.cost || 0), 0) || 0,
          participantCount: campaign.campaign_participants?.length || 0,
          ctr: 0,
          roi: 0
        }
      })) || [];

      // Calculate CTR and ROI
      processedCampaigns.forEach(campaign => {
        campaign.metrics.ctr = campaign.metrics.totalImpressions > 0 
          ? (campaign.metrics.totalClicks / campaign.metrics.totalImpressions * 100) 
          : 0;
        campaign.metrics.roi = campaign.metrics.totalCost > 0 
          ? ((campaign.metrics.totalRevenue - campaign.metrics.totalCost) / campaign.metrics.totalCost * 100) 
          : 0;
      });

      setCampaigns(processedCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCampaignStatus = async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const { error } = await supabase
        .from('ai_campaigns')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      if (error) throw error;
      
      await loadCampaigns();
    } catch (error) {
      console.error('Error updating campaign status:', error);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      const { error } = await supabase
        .from('ai_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
      
      await loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900/20';
      case 'paused': return 'text-yellow-400 bg-yellow-900/20';
      case 'completed': return 'text-blue-400 bg-blue-900/20';
      case 'draft': return 'text-gray-400 bg-gray-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Campaign Management</h1>
          <p className="text-gray-400">Manage and monitor your AI-powered referral campaigns</p>
        </div>
        <Link
          to="/campaigns/builder"
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </Link>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="all">All Campaigns</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="created_at">Created Date</option>
            <option value="name">Name</option>
            <option value="budget">Budget</option>
            <option value="status">Status</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-400">
          {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No campaigns yet</h3>
          <p className="text-gray-400 mb-6">Create your first AI-powered referral campaign to get started</p>
          <Link
            to="/campaigns/builder"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Your First Campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              {/* Campaign Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{campaign.name}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{campaign.description}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </div>
              </div>

              {/* Campaign Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-400">Budget</span>
                  </div>
                  <div className="text-lg font-bold text-white">${campaign.budget?.toLocaleString()}</div>
                </div>
                
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-gray-400">Participants</span>
                  </div>
                  <div className="text-lg font-bold text-white">{campaign.metrics.participantCount}</div>
                </div>
                
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-400">Referrals</span>
                  </div>
                  <div className="text-lg font-bold text-white">{campaign.metrics.totalReferrals}</div>
                </div>
                
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-gray-400">ROI</span>
                  </div>
                  <div className="text-lg font-bold text-white">{campaign.metrics.roi.toFixed(1)}%</div>
                </div>
              </div>

              {/* Campaign Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCampaignStatus(campaign.id, campaign.status)}
                    className={`p-2 rounded-lg ${
                      campaign.status === 'active' 
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                    title={campaign.status === 'active' ? 'Pause Campaign' : 'Start Campaign'}
                  >
                    {campaign.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  
                  <Link
                    to={`/campaigns/${campaign.id}/edit`}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    title="Edit Campaign"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  
                  <Link
                    to={`/campaigns/${campaign.id}/analytics`}
                    className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                    title="View Analytics"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
                
                <button
                  onClick={() => deleteCampaign(campaign.id)}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  title="Delete Campaign"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Campaign Timeline */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                  {campaign.launched_at && (
                    <span>• Launched: {new Date(campaign.launched_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
