import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Bell, X, TrendingUp, Users, DollarSign, Brain, CheckCircle, AlertTriangle, Info, Gift, Target, Zap, RefreshCw } from 'lucide-react';
import { DualCurrencyDisplay } from '../../utils/currency';
import { aiAnalyticsService } from '../../services/aiAnalyticsService';

interface AINotification {
  id: string;
  type: 'insight' | 'opportunity' | 'achievement' | 'alert' | 'recommendation' | 'reward';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  actionable?: boolean;
  actionText?: string;
  actionUrl?: string;
  data?: any;
  read?: boolean;
  aiConfidence?: number;
}

interface AINotificationSystemProps {
  userId: string;
  className?: string;
}

const AINotificationSystem: React.FC<AINotificationSystemProps> = ({
  userId,
  className = ''
}) => {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<AINotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Environment flag to control data source
  const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_NOTIFICATIONS === 'true';

  // Mock AI-generated notifications for testing/development
  const getMockNotifications = (): AINotification[] => [
    {
      id: '1',
      type: 'opportunity',
      title: 'High-Value Referral Opportunity',
      message: 'AI detected 3 potential high-converting leads in your network. Contact them now for 40% higher conversion rate.',
      priority: 'high',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      actionable: true,
      actionText: 'View Leads',
      actionUrl: '/smart-matching',
      aiConfidence: 0.87,
      read: false
    },
    {
      id: '2',
      type: 'insight',
      title: 'Optimal Sharing Time',
      message: 'Your referral links get 65% more clicks when shared between 7-9 PM. Schedule your next share accordingly.',
      priority: 'medium',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      actionable: true,
      actionText: 'Set Reminder',
      aiConfidence: 0.92,
      read: false
    },
    {
      id: '3',
      type: 'achievement',
      title: 'Conversion Rate Milestone',
      message: 'Congratulations! Your referral conversion rate increased to 23% - above the top 10% of users.',
      priority: 'medium',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      data: { conversionRate: 23, percentile: 90 },
      read: false
    },
    {
      id: '4',
      type: 'recommendation',
      title: 'Content Strategy Suggestion',
      message: 'AI suggests focusing on "earning tips" content. Users who share educational content see 45% more engagement.',
      priority: 'medium',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      actionable: true,
      actionText: 'Get Templates',
      actionUrl: '/templates',
      aiConfidence: 0.78,
      read: true
    },
    {
      id: '5',
      type: 'alert',
      title: 'Engagement Drop Detected',
      message: 'Your referral activity decreased by 30% this week. AI recommends increasing social media presence.',
      priority: 'high',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      actionable: true,
      actionText: 'View Strategy',
      aiConfidence: 0.85,
      read: true
    },
    {
      id: '6',
      type: 'reward',
      title: 'Smart Bonus Unlocked',
      message: 'AI detected consistent quality referrals. You\'ve earned a $5.00 smart bonus!',
      priority: 'high',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      data: { bonusAmount: 5.00 },
      actionable: true,
      actionText: 'Claim Bonus',
      read: true
    }
  ];

  // Fetch notifications from API
  const fetchNotificationsFromAPI = async (): Promise<AINotification[]> => {
    try {
      const response = await fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();
      return data.notifications || [];
    } catch (error) {
      console.error('Error fetching notifications from API:', error);
      throw error;
    }
  };

  // Mark notification as read via API
  const markNotificationReadAPI = async (notificationId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Continue with local state update even if API call fails
    }
  };

  // Clear all notifications via API
  const clearAllNotificationsAPI = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/notifications/clear`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to clear notifications: ${response.status}`);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchAINotifications = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let fetchedNotifications: AINotification[];
        
        if (useMockData) {
          // Use mock data for testing/development
          setIsMockMode(true);
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
          fetchedNotifications = getMockNotifications();
        } else {
          // Fetch from real API
          setIsMockMode(false);
          try {
            fetchedNotifications = await fetchNotificationsFromAPI();
          } catch (apiError) {
            console.warn('API fetch failed, falling back to mock data:', apiError);
            setIsMockMode(true);
            fetchedNotifications = getMockNotifications();
            setError('Using offline mode - some features may be limited');
          }
        }

        setNotifications(fetchedNotifications);
        setUnreadCount(fetchedNotifications.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setError('Failed to load notifications');
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAINotifications();
  }, [userId, useMockData]);

  const handleNotificationClick = async (notification: AINotification) => {
    if (!notification.read) {
      // Update local state immediately for better UX
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Update backend if not in mock mode
      if (!isMockMode) {
        await markNotificationReadAPI(notification.id);
      }
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const refreshNotifications = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setError(null);
    
    try {
      let fetchedNotifications: AINotification[];
      
      if (useMockData) {
        setIsMockMode(true);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
        fetchedNotifications = getMockNotifications();
      } else {
        setIsMockMode(false);
        try {
          fetchedNotifications = await fetchNotificationsFromAPI();
        } catch (apiError) {
          console.warn('API fetch failed, falling back to mock data:', apiError);
          setIsMockMode(true);
          fetchedNotifications = getMockNotifications();
          setError('Using offline mode - some features may be limited');
        }
      }

      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      setError('Failed to refresh notifications');
    } finally {
      setIsRefreshing(false);
    }
  }, [userId, useMockData, isRefreshing]);

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    
    // Update local state immediately
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    // Update backend if not in mock mode
    if (!isMockMode && unreadNotifications.length > 0) {
      try {
        // Mark each unread notification as read
        await Promise.all(
          unreadNotifications.map(notification => 
            markNotificationReadAPI(notification.id)
          )
        );
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    }
  };

  const handleActionClick = async (notification: AINotification, event: React.MouseEvent) => {
    event.stopPropagation();
    setActionLoading(notification.id);
    
    try {
      // Simulate action processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
    } finally {
      setActionLoading(null);
    }
  };

  const getNotificationIcon = (type: AINotification['type']) => {
    switch (type) {
      case 'insight':
        return <Brain className="w-5 h-5" />;
      case 'opportunity':
        return <Target className="w-5 h-5" />;
      case 'achievement':
        return <CheckCircle className="w-5 h-5" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5" />;
      case 'recommendation':
        return <Zap className="w-5 h-5" />;
      case 'reward':
        return <Gift className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: AINotification['type'], priority: AINotification['priority']) => {
    if (priority === 'urgent') return 'text-red-400 bg-red-500/20';
    if (priority === 'high') return 'text-orange-400 bg-orange-500/20';
    
    switch (type) {
      case 'insight':
        return theme === 'professional' ? 'text-cyan-400 bg-cyan-500/20' : 'text-purple-400 bg-purple-500/20';
      case 'opportunity':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'achievement':
        return 'text-green-400 bg-green-500/20';
      case 'alert':
        return 'text-red-400 bg-red-500/20';
      case 'recommendation':
        return 'text-blue-400 bg-blue-500/20';
      case 'reward':
        return 'text-emerald-400 bg-emerald-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20';

  const buttonClass = theme === 'professional'
    ? 'bg-cyan-600 hover:bg-cyan-700'
    : 'bg-purple-600 hover:bg-purple-700';

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-3 rounded-full ${cardClass} text-white hover:scale-105 transition-all duration-200`}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 z-50">
          <div className={`${cardClass} p-0 max-h-96 overflow-hidden`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-600/30">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Brain className={`w-5 h-5 ${theme === 'professional' ? 'text-cyan-400' : 'text-purple-400'}`} />
                  AI Notifications
                  {isMockMode && (
                    <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded-full">
                      Demo
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={refreshNotifications}
                    disabled={isRefreshing}
                    className={`p-1.5 rounded-md transition-all duration-200 ${isRefreshing ? 'animate-spin' : 'hover:bg-gray-600/30'} text-white/70 hover:text-white`}
                    title="Refresh notifications"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-white/70 hover:text-white transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/50 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {error && (
                <div className="mt-2 p-2 bg-yellow-600/20 border border-yellow-500/30 rounded-md">
                  <p className="text-xs text-yellow-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {error}
                  </p>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-white/70">
                  <Brain className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                  AI is analyzing your data...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-white/70">
                  <Bell className="w-8 h-8 mx-auto mb-2" />
                  No notifications yet
                </div>
              ) : (
                <div className="divide-y divide-gray-600/30">
                  {notifications.map((notification) => {
                    const iconColor = getNotificationColor(notification.type, notification.priority);
                    
                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 hover:bg-gray-700/30 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-gray-700/20' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${iconColor} flex-shrink-0`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-white text-sm">
                                {notification.title}
                                {!notification.read && (
                                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-2"></span>
                                )}
                              </h4>
                              <span className="text-xs text-white/50 ml-2">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                            </div>
                            
                            <p className="text-white/70 text-sm mt-1">
                              {notification.message}
                            </p>
                            
                            {notification.aiConfidence && (
                              <div className="flex items-center gap-1 mt-2">
                                <Brain className="w-3 h-3 text-white/50" />
                                <span className="text-xs text-white/50">
                                  AI Confidence: {Math.round(notification.aiConfidence * 100)}%
                                </span>
                              </div>
                            )}
                            
                            {notification.data?.bonusAmount && (
                              <div className="mt-2">
                                <DualCurrencyDisplay
                                  usdAmount={notification.data.bonusAmount}
                                  userCurrency="USD"
                                  className="text-green-400 font-bold text-sm"
                                />
                              </div>
                            )}
                            
                            {notification.actionable && (
                              <button
                                className={`mt-2 px-3 py-1 ${buttonClass} text-white text-xs rounded-md transition-colors`}
                              >
                                {notification.actionText || 'Take Action'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-600/30 text-center">
              <button className="text-xs text-white/50 hover:text-white">
                View All Notifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AINotificationSystem;
