import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Clock, 
  DollarSign, 
  Wallet, 
  AlertTriangle, 
  CheckCircle, 
  Send, 
  Shield,
  Download,
  RefreshCw,
  Users,
  MapPin,
  Calendar,
  TrendingUp,
  Lock,
  Unlock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BatchSummary {
  paypal: {
    total_requests: number;
    total_amount_usd: number;
    total_fees: number;
    countries: string[];
    users: string[];
  };
  paystack: {
    total_requests: number;
    total_amount_usd: number;
    total_fees: number;
    countries: string[];
    users: string[];
  };
}

interface WeeklyBatch {
  id: string;
  batch_date: string;
  cutoff_time: string;
  total_requests: number;
  total_amount_usd: number;
  paypal_amount: number;
  paystack_amount: number;
  status: 'collecting' | 'locked' | 'approved' | 'processing' | 'completed';
  created_at: string;
  locked_at?: string;
  approved_at?: string;
  processed_at?: string;
}

const BatchPayoutProcessor: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [currentBatch, setCurrentBatch] = useState<WeeklyBatch | null>(null);
  const [batchSummary, setBatchSummary] = useState<BatchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCutoff, setNextCutoff] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isWithdrawalBlocked, setIsWithdrawalBlocked] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Theme-based colors
  const colors = {
    background: theme === 'professional' ? 'bg-gray-800/50' : 'bg-white/10',
    card: theme === 'professional' ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/10 border-white/20',
    cardInner: theme === 'professional' ? 'bg-gray-700/30 border-gray-600/30' : 'bg-white/5 border-white/10',
    buttonPrimary: theme === 'professional' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-purple-600 hover:bg-purple-700',
    buttonDanger: 'bg-red-600 hover:bg-red-700',
    buttonSuccess: 'bg-green-600 hover:bg-green-700',
    textPrimary: 'text-white',
    textSecondary: 'text-white/70',
  };

  // Calculate next Tuesday 14:00 GMT cutoff
  const calculateNextCutoff = () => {
    const now = new Date();
    const gmtNow = new Date(now.toUTCString());
    const currentDay = gmtNow.getUTCDay();
    const currentHour = gmtNow.getUTCHours();
    
    let daysUntilTuesday = 2 - currentDay; // Tuesday is day 2
    if (daysUntilTuesday <= 0) daysUntilTuesday += 7;
    if (daysUntilTuesday === 0 && currentHour >= 14) daysUntilTuesday = 7;

    const nextTuesday = new Date(gmtNow);
    nextTuesday.setUTCDate(gmtNow.getUTCDate() + daysUntilTuesday);
    nextTuesday.setUTCHours(14, 0, 0, 0);
    
    return nextTuesday;
  };

  // Check if we should show withdrawal deadline notification
  const shouldShowWithdrawalNotification = () => {
    if (!nextCutoff) return false;
    
    const now = new Date();
    const gmtNow = new Date(now.toUTCString());
    const currentDay = gmtNow.getUTCDay();
    const currentHour = gmtNow.getUTCHours();
    
    // Show from Monday 19:00 GMT until Tuesday 14:00 GMT
    if (currentDay === 1 && currentHour >= 19) return true; // Monday from 7 PM
    if (currentDay === 2 && currentHour < 14) return true; // Tuesday until 2 PM
    
    return false;
  };

  // Check if withdrawals should be blocked
  const checkWithdrawalBlocked = () => {
    if (!nextCutoff) return false;
    
    const now = new Date();
    const gmtNow = new Date(now.toUTCString());
    const currentDay = gmtNow.getUTCDay();
    const currentHour = gmtNow.getUTCHours();
    
    // Block withdrawals from Tuesday 14:00 GMT onwards
    if (currentDay === 2 && currentHour >= 14) return true;
    if (currentDay > 2) return true; // Wednesday onwards
    
    return false;
  };

  // Update time remaining display
  const updateTimeRemaining = () => {
    if (!nextCutoff) return;

    const now = new Date();
    const diff = nextCutoff.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining('Cutoff passed');
      setIsWithdrawalBlocked(true);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    setIsWithdrawalBlocked(checkWithdrawalBlocked());
  };

  // Fetch current batch data
  const fetchCurrentBatch = async () => {
    try {
      setError(null);
      
      // Get current week's batch
      const { data: batch, error: batchError } = await supabase
        .from('weekly_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (batchError && batchError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch current batch: ${batchError.message}`);
      }

      setCurrentBatch(batch);

      // Get batch summary grouped by payment method
      const { data: summary, error: summaryError } = await supabase.rpc('get_batch_summary_by_payment_method');
      
      if (summaryError) {
        throw new Error(`Failed to fetch batch summary: ${summaryError.message}`);
      }

      setBatchSummary(summary);
      
    } catch (error) {
      console.error('Error fetching batch data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch batch data');
    }
  };

  // Lock current batch (called at Tuesday 14:00 GMT)
  const lockCurrentBatch = async () => {
    try {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase.rpc('lock_current_batch');
      
      if (error) {
        throw new Error(`Failed to lock batch: ${error.message}`);
      }

      await fetchCurrentBatch();
      setLoading(false);
      
    } catch (error) {
      console.error('Error locking batch:', error);
      setError(error instanceof Error ? error.message : 'Failed to lock batch');
      setLoading(false);
    }
  };

  // Approve batch for processing
  const approveBatch = async () => {
    if (!currentBatch) return;

    try {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase
        .from('weekly_batches')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        })
        .eq('id', currentBatch.id);

      if (error) {
        throw new Error(`Failed to approve batch: ${error.message}`);
      }

      await fetchCurrentBatch();
      setShowApprovalModal(false);
      setLoading(false);
      
    } catch (error) {
      console.error('Error approving batch:', error);
      setError(error instanceof Error ? error.message : 'Failed to approve batch');
      setLoading(false);
    }
  };

  // Mark batch as processing
  const startProcessing = async () => {
    if (!currentBatch) return;

    try {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase
        .from('weekly_batches')
        .update({
          status: 'processing',
          processed_at: new Date().toISOString(),
          processed_by: user?.id
        })
        .eq('id', currentBatch.id);

      if (error) {
        throw new Error(`Failed to start processing: ${error.message}`);
      }

      await fetchCurrentBatch();
      setLoading(false);
      
    } catch (error) {
      console.error('Error starting processing:', error);
      setError(error instanceof Error ? error.message : 'Failed to start processing');
      setLoading(false);
    }
  };

  // Initialize data and timers
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchCurrentBatch();
      setLoading(false);
    };

    init();
    
    const nextCutoffDate = calculateNextCutoff();
    setNextCutoff(nextCutoffDate);

    // Update every minute
    const interval = setInterval(() => {
      updateTimeRemaining();
    }, 60000);

    // Initial update
    updateTimeRemaining();

    return () => clearInterval(interval);
  }, []);

  const getBatchStatusColor = (status: string) => {
    switch (status) {
      case 'collecting': return 'text-blue-400';
      case 'locked': return 'text-yellow-400';
      case 'approved': return 'text-green-400';
      case 'processing': return 'text-orange-400';
      case 'completed': return 'text-emerald-400';
      default: return colors.textSecondary;
    }
  };

  const getBatchStatusIcon = (status: string) => {
    switch (status) {
      case 'collecting': return <Clock className="h-5 w-5" />;
      case 'locked': return <Lock className="h-5 w-5" />;
      case 'approved': return <CheckCircle className="h-5 w-5" />;
      case 'processing': return <Send className="h-5 w-5" />;
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  if (loading && !currentBatch) {
    return (
      <div className={`${colors.card} rounded-2xl p-6`}>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Withdrawal Deadline Notification */}
      {shouldShowWithdrawalNotification() && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-yellow-300 font-semibold text-lg">Withdrawal Deadline Approaching</h3>
              <p className="text-yellow-100 mt-1">
                Users have until <strong>Tuesday 14:00 GMT</strong> to submit withdrawal requests. 
                Time remaining: <strong>{timeRemaining}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Blocked Notification */}
      {isWithdrawalBlocked && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <Lock className="h-6 w-6 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-red-300 font-semibold text-lg">Withdrawals Blocked</h3>
              <p className="text-red-100 mt-1">
                New withdrawal requests are blocked until next Monday 19:00 GMT. 
                Current batch is being processed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Batch Status */}
      <div className={`${colors.card} rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${colors.textPrimary}`}>Weekly Batch Processor</h2>
          <button
            onClick={fetchCurrentBatch}
            className={`${colors.buttonPrimary} px-4 py-2 rounded-lg flex items-center space-x-2`}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {currentBatch ? (
          <div className="space-y-6">
            {/* Batch Overview */}
            <div className={`${colors.cardInner} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${colors.textPrimary}`}>
                  Batch #{currentBatch.id.slice(-8)}
                </h3>
                <div className={`flex items-center space-x-2 ${getBatchStatusColor(currentBatch.status)}`}>
                  {getBatchStatusIcon(currentBatch.status)}
                  <span className="font-medium capitalize">{currentBatch.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span className={`text-sm ${colors.textSecondary}`}>Total Requests</span>
                  </div>
                  <div className={`text-xl font-bold ${colors.textPrimary}`}>
                    {currentBatch.total_requests}
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    <span className={`text-sm ${colors.textSecondary}`}>Total Amount</span>
                  </div>
                  <div className={`text-xl font-bold ${colors.textPrimary}`}>
                    ${currentBatch.total_amount_usd.toFixed(2)}
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="h-4 w-4 text-blue-400" />
                    <span className={`text-sm ${colors.textSecondary}`}>PayPal</span>
                  </div>
                  <div className={`text-xl font-bold ${colors.textPrimary}`}>
                    ${currentBatch.paypal_amount.toFixed(2)}
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Wallet className="h-4 w-4 text-green-400" />
                    <span className={`text-sm ${colors.textSecondary}`}>Paystack</span>
                  </div>
                  <div className={`text-xl font-bold ${colors.textPrimary}`}>
                    ${currentBatch.paystack_amount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className={colors.textSecondary}>
                  Next cutoff: {nextCutoff?.toLocaleDateString()} at 14:00 GMT
                </span>
              </div>

              <div className="flex space-x-3">
                {currentBatch.status === 'collecting' && (
                  <button
                    onClick={lockCurrentBatch}
                    className={`${colors.buttonDanger} px-6 py-2 rounded-lg flex items-center space-x-2`}
                    disabled={loading}
                  >
                    <Lock className="h-4 w-4" />
                    <span>Lock Batch</span>
                  </button>
                )}

                {currentBatch.status === 'locked' && (
                  <button
                    onClick={() => setShowApprovalModal(true)}
                    className={`${colors.buttonSuccess} px-6 py-2 rounded-lg flex items-center space-x-2`}
                    disabled={loading}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Approve Transfer</span>
                  </button>
                )}

                {currentBatch.status === 'approved' && (
                  <button
                    onClick={startProcessing}
                    className={`${colors.buttonPrimary} px-6 py-2 rounded-lg flex items-center space-x-2`}
                    disabled={loading}
                  >
                    <Send className="h-4 w-4" />
                    <span>Start Processing</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className={colors.textSecondary}>No active batch found</p>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && currentBatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${colors.card} rounded-2xl p-6 max-w-md w-full`}>
            <h3 className={`text-xl font-bold ${colors.textPrimary} mb-4`}>
              Approve Batch Transfer
            </h3>
            <p className={`${colors.textSecondary} mb-6`}>
              This will approve the transfer of <strong>${currentBatch.total_amount_usd.toFixed(2)}</strong> 
              to payment providers. Are you sure you want to proceed?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-white hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={approveBatch}
                className={`flex-1 ${colors.buttonSuccess} px-4 py-2 rounded-lg text-white`}
                disabled={loading}
              >
                {loading ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchPayoutProcessor;
