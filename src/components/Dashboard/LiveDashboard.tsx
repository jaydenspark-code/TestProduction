import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useUserRealtime } from '../../hooks/useRealtime';
import { 
  Activity, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Bell, 
  Wifi, 
  WifiOff,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

const LiveDashboard: React.FC = () => {
  const { theme } = useTheme();
  const { 
    stats, 
    events, 
    notifications, 
    connectionStatus, 
    loading, 
    error,
    actions 
  } = useUserRealtime();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEvents, setShowEvents] = useState(false);

  const bgClass = theme === 'professional'
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800'
    : 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20';

  const pulseClass = theme === 'professional'
    ? 'animate-pulse bg-cyan-400'
    : 'animate-pulse bg-purple-400';

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'new_referral':
        return '🎯';
      case 'earning_update':
        return '💰';
      case 'user_joined':
        return '👋';
      case 'achievement_unlocked':
        return '🏆';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-400 bg-green-400/20 border-green-400/50';
      case 'warning':
        return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/50';
      case 'error':
        return 'text-red-400 bg-red-400/20 border-red-400/50';
      default:
        return theme === 'professional' 
          ? 'text-cyan-400 bg-cyan-400/20 border-cyan-400/50'
          : 'text-purple-400 bg-purple-400/20 border-purple-400/50';
    }
  };

  if (loading) {
    return (
      <div className={bgClass}>
        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-12 h-12 border-4 border-white/20 border-t-white rounded-full"></div>
            <span className="ml-4 text-white text-lg">Loading real-time data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={bgClass}>
      <div className="container mx-auto px-4 py-8">
        {/* Header with Connection Status */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Live Dashboard</h1>
            <p className="text-white/70">Real-time platform statistics and updates</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              connectionStatus.connected 
                ? 'bg-green-500/20 border border-green-500/50' 
                : 'bg-red-500/20 border border-red-500/50'
            }`}>
              {connectionStatus.connected ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm ${
                connectionStatus.connected ? 'text-green-400' : 'text-red-400'
              }`}>
                {connectionStatus.connected ? 'Connected' : 'Disconnected'}
              </span>
              {connectionStatus.reconnectAttempts > 0 && (
                <span className="text-xs text-yellow-400">
                  (Retry {connectionStatus.reconnectAttempts})
                </span>
              )}
            </div>

            {/* Reconnect Button */}
            {(!connectionStatus.connected || error) && (
              <button
                onClick={actions.reconnect}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reconnect</span>
              </button>
            )}

            {/* Notifications Toggle */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <Bell className="w-4 h-4" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-8 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Live Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className={`w-6 h-6 ${theme === 'professional' ? 'text-cyan-400' : 'text-purple-400'}`} />
                <h3 className="text-white font-medium">Active Users</h3>
              </div>
              <div className={`w-2 h-2 rounded-full ${pulseClass}`}></div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats?.activeUsers?.toLocaleString() || '0'}
            </div>
            <div className="text-white/70 text-sm">Currently online</div>
          </div>

          <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-6 h-6 text-green-400" />
                <h3 className="text-white font-medium">Total Earnings</h3>
              </div>
              <div className={`w-2 h-2 rounded-full ${pulseClass}`}></div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              ${stats?.totalEarnings?.toLocaleString() || '0'}
            </div>
            <div className="text-white/70 text-sm">Platform lifetime</div>
          </div>

          <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                <h3 className="text-white font-medium">New Referrals</h3>
              </div>
              <div className={`w-2 h-2 rounded-full ${pulseClass}`}></div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats?.newReferrals?.toLocaleString() || '0'}
            </div>
            <div className="text-white/70 text-sm">Today</div>
          </div>

          <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-6 h-6 text-orange-400" />
                <h3 className="text-white font-medium">Live Events</h3>
              </div>
              <div className={`w-2 h-2 rounded-full ${pulseClass}`}></div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {events.length}
            </div>
            <div className="text-white/70 text-sm">Recent activity</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
              <Zap className={`w-5 h-5 ${theme === 'professional' ? 'text-cyan-400' : 'text-purple-400'}`} />
            </div>
            
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {stats?.recentTransactions?.slice(0, 10).map((transaction, index) => (
                <div 
                  key={transaction.id || index}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div>
                    <div className="text-white font-medium">{transaction.description}</div>
                    <div className="text-white/70 text-sm">
                      {format(new Date(transaction.created_at), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                  <div className={`font-bold ${
                    transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}${transaction.amount}
                  </div>
                </div>
              )) || (
                <div className="text-center text-white/70 py-8">
                  No recent transactions
                </div>
              )}
            </div>
          </div>

          {/* Live Events Feed */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Live Events</h3>
              <button
                onClick={() => setShowEvents(!showEvents)}
                className="text-white/70 hover:text-white transition-colors"
              >
                {showEvents ? 'Hide' : 'Show All'}
              </button>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {events.slice(0, showEvents ? events.length : 5).map((event) => (
                <div 
                  key={event.id}
                  className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <span className="text-2xl">{getEventIcon(event.type)}</span>
                  <div className="flex-1">
                    <div className="text-white font-medium">
                      {event.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-white/70 text-sm">
                      {format(event.timestamp, 'MMM dd, HH:mm:ss')}
                    </div>
                  </div>
                </div>
              ))}
              
              {events.length === 0 && (
                <div className="text-center text-white/70 py-8">
                  No recent events
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications Panel */}
        {showNotifications && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${cardClass} w-full max-w-md max-h-96 overflow-hidden`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Notifications</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-3 rounded-lg border ${getNotificationColor(notification.type)} ${
                      notification.read ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-sm opacity-80">{notification.message}</div>
                        <div className="text-xs opacity-60 mt-1">
                          {format(notification.timestamp, 'MMM dd, HH:mm')}
                        </div>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => actions.markNotificationAsRead(notification.id)}
                          className="ml-2 p-1 hover:bg-white/10 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {notifications.length === 0 && (
                  <div className="text-center text-white/70 py-8">
                    No new notifications
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="flex justify-between mt-4 pt-4 border-t border-white/10">
                  <button
                    onClick={actions.clearNotifications}
                    className="text-white/70 hover:text-white transition-colors text-sm"
                  >
                    Clear All
                  </button>
                  <span className="text-white/70 text-sm">
                    {notifications.filter(n => !n.read).length} unread
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveDashboard;
