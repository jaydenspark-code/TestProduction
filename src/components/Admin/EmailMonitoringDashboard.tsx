import React, { useState, useEffect } from 'react';
import { hybridEmailService } from '../../services/hybridEmailService';
import { Mail, AlertTriangle, CheckCircle, BarChart3, RefreshCw } from 'lucide-react';

const EmailMonitoringDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = () => {
    setLoading(true);
    const emailStats = hybridEmailService.getEmailStats();
    setStats(emailStats);
    setLoading(false);
  };

  const handleResetCounters = () => {
    if (confirm('Are you sure you want to reset email counters? This action cannot be undone.')) {
      hybridEmailService.resetCounters();
      loadStats();
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2">Loading email statistics...</span>
      </div>
    );
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500 bg-red-50 border-red-200';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Mail className="w-6 h-6 text-blue-500 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">Email Service Monitor</h2>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadStats}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={handleResetCounters}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Reset Counters
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* SendGrid Stats */}
        <div className={`p-6 rounded-lg border-2 ${getStatusColor(stats.sendgrid.percentage)}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">SendGrid</h3>
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Used Today:</span>
              <span className="font-bold">{stats.sendgrid.used.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Daily Limit:</span>
              <span>{stats.sendgrid.limit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Usage:</span>
              <span className="font-bold">{stats.sendgrid.percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(stats.sendgrid.percentage, 100)}%`,
                  backgroundColor: stats.sendgrid.percentage >= 90 ? '#ef4444' : 
                                 stats.sendgrid.percentage >= 70 ? '#f59e0b' : '#10b981'
                }}
              />
            </div>
          </div>
        </div>

        {/* Supabase Stats */}
        <div className={`p-6 rounded-lg border-2 ${getStatusColor(stats.supabase.percentage)}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Supabase</h3>
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Used Today:</span>
              <span className="font-bold">{stats.supabase.used.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Daily Limit:</span>
              <span>{stats.supabase.limit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Usage:</span>
              <span className="font-bold">{stats.supabase.percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(stats.supabase.percentage, 100)}%`,
                  backgroundColor: stats.supabase.percentage >= 90 ? '#ef4444' : 
                                 stats.supabase.percentage >= 70 ? '#f59e0b' : '#10b981'
                }}
              />
            </div>
          </div>
        </div>

        {/* Total Stats */}
        <div className="p-6 rounded-lg border-2 border-blue-200 bg-blue-50 text-blue-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Combined Total</h3>
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Sent:</span>
              <span className="font-bold text-2xl">{stats.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Capacity:</span>
              <span>{(stats.sendgrid.limit + stats.supabase.limit).toLocaleString()}/day</span>
            </div>
            <div className="flex justify-between">
              <span>Overall Usage:</span>
              <span className="font-bold">
                {((stats.total / (stats.sendgrid.limit + stats.supabase.limit)) * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Failure Statistics */}
      {(stats.failures.sendgrid > 0 || stats.failures.supabase > 0) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-red-700">Recent Failures</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-red-600">SendGrid Failures:</span>
              <span className="ml-2 font-bold text-red-700">{stats.failures.sendgrid}</span>
            </div>
            <div>
              <span className="text-red-600">Supabase Failures:</span>
              <span className="ml-2 font-bold text-red-700">{stats.failures.supabase}</span>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Current Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Automatic Load Balancing:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• SendGrid primary (40K/day capacity)</li>
              <li>• Supabase backup (100/day capacity)</li>
              <li>• Smart failover on errors</li>
              <li>• Simultaneous sending under high load</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Benefits:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• 99.9% email delivery reliability</li>
              <li>• Automatic capacity scaling</li>
              <li>• Zero downtime failover</li>
              <li>• Cost-effective resource usage</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Hybrid Email System Active
        </div>
        <div>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default EmailMonitoringDashboard;
