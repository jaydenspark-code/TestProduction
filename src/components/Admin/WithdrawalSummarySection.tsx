import React, { useState, useEffect } from 'react';
import { supabase } from "../../lib/supabase";
// Using Tailwind classes instead of shadcn/ui components
import { Clock, Download, DollarSign, Wallet, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';

interface WithdrawalRequest {
  id: string;
  user_email: string;
  amount: number;
  payment_method: 'paypal' | 'paystack';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  local_currency: string;
  local_amount: number;
  usd_amount: number;
  fee: number;
  net_amount: number;
}

interface BatchSummary {
  payment_method: string;
  total_requests: number;
  total_amount: number;
  total_fees: number;
  net_amount: number;
}

const WithdrawalSummarySection: React.FC = () => {
  const { theme } = useTheme();
  const [pendingRequests, setPendingRequests] = useState<WithdrawalRequest[]>([]);
  const [batchSummary, setBatchSummary] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCutoff, setNextCutoff] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Currency conversion utilities
  const convertToUSD = (localAmount: number, exchangeRate: number): number => {
    return localAmount * exchangeRate;
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  // Theme-based colors
  const colors = {
    background: theme === 'professional' ? 'bg-gray-800/50' : 'bg-white/10',
    card: theme === 'professional' ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/10 border-white/20',
    cardInner: theme === 'professional' ? 'bg-gray-700/30 border-gray-600/30' : 'bg-white/5 border-white/10',
    buttonPrimary: theme === 'professional' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-purple-600 hover:bg-purple-700',
    textPrimary: 'text-white',
    textSecondary: 'text-white/70',
  };

  // Calculate next Tuesday 14:00 cutoff
  const calculateNextCutoff = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    
    let daysUntilTuesday = 2 - currentDay;
    if (daysUntilTuesday <= 0) daysUntilTuesday += 7;
    if (daysUntilTuesday === 0 && currentHour >= 14) daysUntilTuesday = 7;

    const nextTuesday = new Date(now);
    nextTuesday.setDate(now.getDate() + daysUntilTuesday);
    nextTuesday.setHours(14, 0, 0, 0);
    
    return nextTuesday;
  };

  // Update time remaining
  const updateTimeRemaining = () => {
    if (!nextCutoff) return;

    const now = new Date();
    const diff = nextCutoff.getTime() - now.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
  };

  // Fetch pending withdrawal requests
  const fetchPendingRequests = async () => {
    try {
      setError(null);
      const { data: requests, error } = await supabase
        .from('withdrawal_requests')
        .select(`
          id,
          amount,
          payment_method,
          status,
          created_at,
          fee,
          net_amount,
          reference,
          local_amount,
          local_currency,
          exchange_rate,
          batch_id,
          batch_date,
          user_email
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error fetching pending requests:', error);
        throw new Error(`Failed to fetch pending requests: ${error.message}`);
      }
      
      console.log(`Successfully fetched ${requests?.length || 0} pending withdrawal requests`);
      setPendingRequests(requests || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch pending requests');
    }
  };

  // Fetch current batch summary
  const fetchCurrentBatchSummary = async () => {
    try {
      const { data: summary, error } = await supabase.rpc('group_pending_withdrawals');
      
      if (error) {
        console.error('Database error fetching batch summary:', error);
        throw new Error(`Failed to fetch batch summary: ${error.message}`);
      }
      
      console.log(`Successfully fetched batch summary with ${summary?.length || 0} payment methods`);
      setBatchSummary(summary || []);
    } catch (error) {
      console.error('Error fetching batch summary:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch batch summary');
    }
  };

  // Manual refresh function
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([
      fetchPendingRequests(),
      fetchCurrentBatchSummary()
    ]);
    setLoading(false);
  };

  // Initialize data and start timer
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPendingRequests(),
        fetchCurrentBatchSummary()
      ]);
      setLoading(false);
    };

    loadData();
    const nextCutoffDate = calculateNextCutoff();
    setNextCutoff(nextCutoffDate);

    // Set up intervals for updates
    const requestInterval = setInterval(loadData, 30000); // Update every 30 seconds
    const timerInterval = setInterval(updateTimeRemaining, 60000); // Update timer every minute

    return () => {
      clearInterval(requestInterval);
      clearInterval(timerInterval);
    };
  }, []);

  // Initial time remaining calculation
  useEffect(() => {
    if (nextCutoff) {
      updateTimeRemaining();
    }
  }, [nextCutoff]);

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'paypal':
        return <DollarSign className="h-5 w-5 text-blue-400" />;
      case 'paystack':
        return <Wallet className="h-5 w-5 text-green-400" />;
      default:
        return <DollarSign className="h-5 w-5 text-gray-400" />;
    }
  };

  // Export functionality
  const handleExportReport = () => {
    try {
      const csvData = [
        ['User Email', 'Amount (USD)', 'Payment Method', 'Local Amount', 'Local Currency', 'Status', 'Requested At'],
        ...pendingRequests.map(request => [
          request.user_email,
          request.amount.toFixed(2),
          request.payment_method,
          request.local_amount?.toFixed(2) || 'N/A',
          request.local_currency || 'N/A',
          request.status,
          new Date(request.created_at).toLocaleString()
        ])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `withdrawal-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      setError('Failed to export report. Please try again.');
    }
  };

  return (
    <div className={`${colors.card} rounded-2xl p-6 space-y-6`}>
      {/* Header with next cutoff time */}
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${colors.textPrimary}`}>Withdrawal Summary</h2>
        <div className="flex items-center space-x-3">
          {error && (
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </button>
          )}
          <div className="flex items-center space-x-2 bg-yellow-500/20 px-4 py-2 rounded-lg">
            <Clock className="h-5 w-5 text-yellow-500" />
            <span className="text-yellow-500">Next cutoff: {timeRemaining}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-200 font-medium">Error Loading Data</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Batch Summary */}
          <div className={`${colors.cardInner} rounded-xl p-4`}>
            <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-4`}>Current Batch Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batchSummary.map((summary) => (
                <div key={summary.payment_method} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon(summary.payment_method)}
                      <span className={colors.textPrimary}>{summary.payment_method}</span>
                    </div>
                    <span className={`${colors.textPrimary} font-semibold`}>
                      ${summary.net_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className={colors.textSecondary}>Requests: {summary.total_requests}</div>
                    <div className={colors.textSecondary}>Fees: ${summary.total_fees.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Requests */}
          <div className={`${colors.cardInner} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${colors.textPrimary}`}>Pending Requests</h3>
              <button className={`${colors.buttonPrimary} px-4 py-2 rounded-lg flex items-center space-x-2`}>
                <Download className="h-4 w-4" />
                <span>Export Report</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={`${colors.textSecondary} text-left py-3 px-4`}>User</th>
                    <th className={`${colors.textSecondary} text-left py-3 px-4`}>Amount</th>
                    <th className={`${colors.textSecondary} text-left py-3 px-4`}>Method</th>
                    <th className={`${colors.textSecondary} text-left py-3 px-4`}>Local Amount</th>
                    <th className={`${colors.textSecondary} text-left py-3 px-4`}>Requested At</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((request) => (
                    <tr key={request.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className={`${colors.textPrimary} py-3 px-4`}>{request.user_email}</td>
                      <td className={`${colors.textPrimary} py-3 px-4`}>${request.amount.toFixed(2)}</td>
                      <td className={`${colors.textPrimary} py-3 px-4`}>
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(request.payment_method)}
                          <span>{request.payment_method}</span>
                        </div>
                      </td>
                      <td className={`${colors.textPrimary} py-3 px-4`}>
                        {request.local_amount
                          ? `${request.local_amount.toFixed(2)} ${request.local_currency}`
                          : '-'}
                      </td>
                      <td className={`${colors.textPrimary} py-3 px-4`}>
                        {new Date(request.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalSummarySection;
