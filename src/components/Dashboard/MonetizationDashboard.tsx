import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  Share2, 
  Heart,
  Calendar,
  Target,
  Award,
  Clock,
  BarChart3,
  PieChart,
  Download,
  Wallet,
  Settings
} from 'lucide-react';
import { adDisplayService } from '../../services/adDisplayService';
import { UserActivity, UserEarnings } from '../../types/advertising';

interface MonetizationDashboardProps {
  userId: string;
  className?: string;
}

interface EarningsStats {
  totalEarned: number;
  todayEarned: number;
  weekEarned: number;
  monthEarned: number;
  pendingAmount: number;
  activitiesCount: number;
  averagePerActivity: number;
  topCategory: string;
}

interface ActivityBreakdown {
  views: number;
  clicks: number;
  completions: number;
  shares: number;
  likes: number;
}

const MonetizationDashboard: React.FC<MonetizationDashboardProps> = ({ userId, className = '' }) => {
  const [earnings, setEarnings] = useState<EarningsStats>({
    totalEarned: 0,
    todayEarned: 0,
    weekEarned: 0,
    monthEarned: 0,
    pendingAmount: 0,
    activitiesCount: 0,
    averagePerActivity: 0,
    topCategory: 'General'
  });

  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [activityBreakdown, setActivityBreakdown] = useState<ActivityBreakdown>({
    views: 0,
    clicks: 0,
    completions: 0,
    shares: 0,
    likes: 0
  });

  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('month');

  useEffect(() => {
    loadEarningsData();
  }, [userId, timeRange]);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      
      // Mock data - in real app this would come from API
      const mockActivities: UserActivity[] = [
        {
          id: '1',
          userId,
          campaignId: 'camp-1',
          action: 'view',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          reward: 0.05,
          device: 'web'
        },
        {
          id: '2',
          userId,
          campaignId: 'camp-2',
          action: 'click',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          reward: 0.25,
          device: 'web'
        },
        {
          id: '3',
          userId,
          campaignId: 'camp-1',
          action: 'complete',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
          reward: 1.00,
          device: 'web'
        },
        {
          id: '4',
          userId,
          campaignId: 'camp-3',
          action: 'share',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          reward: 0.50,
          device: 'web'
        }
      ];

      setActivities(mockActivities);

      // Calculate earnings stats
      const totalEarned = mockActivities.reduce((sum, activity) => sum + activity.reward, 0);
      const todayActivities = mockActivities.filter(a => 
        a.timestamp.toDateString() === new Date().toDateString()
      );
      const todayEarned = todayActivities.reduce((sum, activity) => sum + activity.reward, 0);

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekActivities = mockActivities.filter(a => a.timestamp >= weekStart);
      const weekEarned = weekActivities.reduce((sum, activity) => sum + activity.reward, 0);

      const monthStart = new Date();
      monthStart.setDate(monthStart.getDate() - 30);
      const monthActivities = mockActivities.filter(a => a.timestamp >= monthStart);
      const monthEarned = monthActivities.reduce((sum, activity) => sum + activity.reward, 0);

      setEarnings({
        totalEarned,
        todayEarned,
        weekEarned,
        monthEarned,
        pendingAmount: totalEarned * 0.1, // 10% pending
        activitiesCount: mockActivities.length,
        averagePerActivity: totalEarned / mockActivities.length,
        topCategory: 'Gaming'
      });

      // Calculate activity breakdown
      const breakdown: ActivityBreakdown = {
        views: mockActivities.filter(a => a.action === 'view').length,
        clicks: mockActivities.filter(a => a.action === 'click').length,
        completions: mockActivities.filter(a => a.action === 'complete').length,
        shares: mockActivities.filter(a => a.action === 'share').length,
        likes: mockActivities.filter(a => a.action === 'like').length
      };

      setActivityBreakdown(breakdown);

    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getActivityIcon = (action: UserActivity['action']) => {
    switch (action) {
      case 'view': return <Eye className="w-4 h-4" />;
      case 'click': return <MousePointer className="w-4 h-4" />;
      case 'complete': return <Award className="w-4 h-4" />;
      case 'share': return <Share2 className="w-4 h-4" />;
      case 'like': return <Heart className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getActivityColor = (action: UserActivity['action']) => {
    switch (action) {
      case 'view': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'click': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'complete': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'share': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'like': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-gray-100 dark:bg-gray-800 rounded-lg h-32 animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Monetization Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your earnings from advertising interactions
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          
          <button className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Earnings Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Earned</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(earnings.totalEarned)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {timeRange === 'today' ? 'Today' : 
                 timeRange === 'week' ? 'This Week' : 
                 timeRange === 'month' ? 'This Month' : 'All Time'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(
                  timeRange === 'today' ? earnings.todayEarned :
                  timeRange === 'week' ? earnings.weekEarned :
                  timeRange === 'month' ? earnings.monthEarned :
                  earnings.totalEarned
                )}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(earnings.pendingAmount)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Activities</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {earnings.activitiesCount}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
              <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Activity Breakdown
          </h3>
          
          <div className="space-y-4">
            {Object.entries(activityBreakdown).map(([action, count]) => {
              const percentage = earnings.activitiesCount > 0 ? (count / earnings.activitiesCount) * 100 : 0;
              return (
                <div key={action} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getActivityColor(action as UserActivity['action'])}`}>
                      {getActivityIcon(action as UserActivity['action'])}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {action}s
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {count}
                    </span>
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-8">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activities
          </h3>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${getActivityColor(activity.action)}`}>
                    {getActivityIcon(activity.action)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  +{formatCurrency(activity.reward)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Withdrawal Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Withdraw Earnings
          </h3>
          <Wallet className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Available Balance</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(earnings.totalEarned - earnings.pendingAmount)}
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Minimum Withdrawal</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(5.00)}
            </p>
          </div>
          
          <div className="flex items-center justify-center">
            <button
              disabled={earnings.totalEarned - earnings.pendingAmount < 5.00}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Request Withdrawal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonetizationDashboard;
