import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, Play, Pause, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CampaignStatusHistoryProps {
  campaignId: string;
}

interface StatusChange {
  id: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  feedback?: string;
}

const CampaignStatusHistory: React.FC<CampaignStatusHistoryProps> = ({ campaignId }) => {
  const { user } = useAuth();
  const [statusHistory, setStatusHistory] = useState<StatusChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatusHistory();
  }, [campaignId]);

  const loadStatusHistory = async () => {
    try {
      // Mock data - replace with actual API call
      const mockHistory: StatusChange[] = [
        {
          id: '1',
          oldStatus: 'draft',
          newStatus: 'under_review',
          changedBy: 'System',
          changedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          reason: 'Campaign submitted for review'
        },
        {
          id: '2',
          oldStatus: 'under_review',
          newStatus: 'approved',
          changedBy: 'Admin User',
          changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          reason: 'Campaign approved for launch',
          feedback: 'Great campaign concept and realistic budget allocation.'
        },
        {
          id: '3',
          oldStatus: 'approved',
          newStatus: 'active',
          changedBy: 'System',
          changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          reason: 'Campaign automatically launched'
        }
      ];

      setStatusHistory(mockHistory);
    } catch (error) {
      console.error('Failed to load status history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'under_review':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'active':
        return <Play className="w-4 h-4 text-blue-400" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-orange-400" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-400';
      case 'under_review': return 'text-yellow-400';
      case 'approved': return 'text-green-400';
      case 'active': return 'text-blue-400';
      case 'paused': return 'text-orange-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <div className="animate-pulse">
          <div className="h-4 bg-white/20 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-lg p-6 border border-white/10">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center">
        <Clock className="w-5 h-5 text-blue-400 mr-2" />
        Campaign Status History
      </h3>

      {statusHistory.length === 0 ? (
        <p className="text-white/70 text-center py-4">No status changes recorded yet.</p>
      ) : (
        <div className="space-y-4">
          {statusHistory.map((change, index) => (
            <div key={change.id} className="relative">
              {/* Timeline line */}
              {index < statusHistory.length - 1 && (
                <div className="absolute left-6 top-8 w-0.5 h-8 bg-white/20"></div>
              )}
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-2 bg-white/10 rounded-full">
                  {getStatusIcon(change.newStatus)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-white/70 text-sm">Status changed to</span>
                      <span className={`font-medium text-sm ${getStatusColor(change.newStatus)}`}>
                        {change.newStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white/50 text-xs">
                      {change.changedAt.toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-white/60 text-sm mt-1">{change.reason}</p>
                  
                  {change.feedback && (
                    <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-white/70 text-sm">
                        <span className="font-medium text-white">Admin Feedback:</span> {change.feedback}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-white/40 text-xs mt-1">by {change.changedBy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignStatusHistory;
