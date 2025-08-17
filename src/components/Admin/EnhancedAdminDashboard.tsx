import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import CampaignManagement from './CampaignManagement';
import AICampaignOrchestrator from './AICampaignOrchestrator';
import { 
  Settings,
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Brain,
  Target,
  Award,
  Activity,
  Command,
  Plus,
  Eye,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface DashboardStats {
  totalRevenue: number;
  activeAdvertisers: number;
  runningCampaigns: number;
  pendingApprovals: number;
  monthlyGrowth: number;
  aiOptimizations: number;
  avgROAS: number;
  budgetUtilization: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  action: () => void;
}

const EnhancedAdminDashboard: React.FC = () => {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [quickActions] = useState<QuickAction[]>([
    {
      id: 'new-campaign',
      title: 'New Campaign Review',
      description: 'Review pending campaign submissions',
      icon: Eye,
      color: 'blue',
      action: () => setActiveSection('campaigns')
    },
    {
      id: 'ai-optimization',
      title: 'AI Optimization',
      description: 'Run AI campaign optimization',
      icon: Brain,
      color: 'purple',
      action: () => setActiveSection('ai-orchestrator')
    },
    {
      id: 'revenue-report',
      title: 'Revenue Report',
      description: 'Generate monthly revenue report',
      icon: BarChart3,
      color: 'green',
      action: () => {}
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Manage advertiser accounts',
      icon: Users,
      color: 'orange',
      action: () => {}
    }
  ]);

  const isDark = theme === 'professional';

  useEffect(() => {
    // Simulate loading dashboard stats
    setTimeout(() => {
      setStats({
        totalRevenue: 247650,
        activeAdvertisers: 186,
        runningCampaigns: 342,
        pendingApprovals: 12,
        monthlyGrowth: 23.5,
        aiOptimizations: 47,
        avgROAS: 4.2,
        budgetUtilization: 78.9
      });
    }, 1000);
  }, []);

  const cardClass = isDark 
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-xl border border-white/20';

  const bgClass = isDark 
    ? 'bg-[#181c23]' 
    : 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900';

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'campaigns', label: 'Campaign Management', icon: Target },
    { id: 'ai-orchestrator', label: 'AI Orchestrator', icon: Brain },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const getStatIcon = (type: string) => {
    switch (type) {
      case 'revenue': return DollarSign;
      case 'advertisers': return Users;
      case 'campaigns': return Target;
      case 'approvals': return Clock;
      case 'growth': return TrendingUp;
      case 'ai': return Brain;
      case 'roas': return Award;
      case 'budget': return BarChart3;
      default: return Activity;
    }
  };

  const getStatColor = (type: string) => {
    switch (type) {
      case 'revenue': return 'text-green-400 bg-green-500/20';
      case 'advertisers': return 'text-blue-400 bg-blue-500/20';
      case 'campaigns': return 'text-purple-400 bg-purple-500/20';
      case 'approvals': return 'text-yellow-400 bg-yellow-500/20';
      case 'growth': return 'text-emerald-400 bg-emerald-500/20';
      case 'ai': return 'text-indigo-400 bg-indigo-500/20';
      case 'roas': return 'text-orange-400 bg-orange-500/20';
      case 'budget': return 'text-cyan-400 bg-cyan-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* Navigation Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900/90 backdrop-blur-lg border-r border-gray-700/50 z-50">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Command className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Admin Portal</h2>
              <p className="text-gray-400 text-sm">Campaign Management</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navigationItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeSection === item.id
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {activeSection === 'overview' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
                <p className="text-gray-400">Campaign management and analytics overview</p>
              </div>
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all">
                  <Plus className="w-4 h-4" />
                  <span>New Campaign</span>
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { type: 'revenue', label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, change: `+${stats.monthlyGrowth}%` },
                  { type: 'advertisers', label: 'Active Advertisers', value: stats.activeAdvertisers.toString(), change: '+12' },
                  { type: 'campaigns', label: 'Running Campaigns', value: stats.runningCampaigns.toString(), change: '+8' },
                  { type: 'approvals', label: 'Pending Approvals', value: stats.pendingApprovals.toString(), change: '-3' },
                  { type: 'growth', label: 'Monthly Growth', value: `${stats.monthlyGrowth}%`, change: '+2.1%' },
                  { type: 'ai', label: 'AI Optimizations', value: stats.aiOptimizations.toString(), change: '+15' },
                  { type: 'roas', label: 'Average ROAS', value: `${stats.avgROAS}x`, change: '+0.3x' },
                  { type: 'budget', label: 'Budget Utilization', value: `${stats.budgetUtilization}%`, change: '+5.2%' }
                ].map((stat, index) => {
                  const Icon = getStatIcon(stat.type);
                  return (
                    <div key={index} className={`${cardClass} p-6`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl ${getStatColor(stat.type)} flex items-center justify-center`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className={`text-sm px-2 py-1 rounded-full ${
                          stat.change.startsWith('+') ? 'text-green-400 bg-green-500/20' : 'text-red-400 bg-red-500/20'
                        }`}>
                          {stat.change}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-gray-400 text-sm">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Actions */}
            <div className={`${cardClass} p-6`}>
              <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className="p-4 bg-gray-700/30 hover:bg-gray-600/30 rounded-lg transition-all duration-200 text-left group"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-${action.color}-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-5 h-5 text-${action.color}-400`} />
                      </div>
                      <div className="text-white font-medium mb-1">{action.title}</div>
                      <div className="text-gray-400 text-sm">{action.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className={`${cardClass} p-6`}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Activity className="w-6 h-6 text-blue-400 mr-2" />
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {[
                    { icon: CheckCircle, color: 'text-green-400', text: 'Campaign "TechStart Inc" approved and launched', time: '2 minutes ago' },
                    { icon: AlertCircle, color: 'text-yellow-400', text: 'Budget alert: E-Commerce campaign reaching limit', time: '15 minutes ago' },
                    { icon: Brain, color: 'text-purple-400', text: 'AI optimization completed for 5 campaigns', time: '1 hour ago' },
                    { icon: Users, color: 'text-blue-400', text: 'New advertiser registration: Digital Marketing Pro', time: '2 hours ago' },
                    { icon: XCircle, color: 'text-red-400', text: 'Campaign "Fashion Trends" paused due to low performance', time: '3 hours ago' }
                  ].map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-700/20 rounded-lg">
                        <Icon className={`w-5 h-5 ${activity.color} mt-0.5`} />
                        <div className="flex-1">
                          <div className="text-white text-sm">{activity.text}</div>
                          <div className="text-gray-400 text-xs mt-1">{activity.time}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`${cardClass} p-6`}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <TrendingUp className="w-6 h-6 text-green-400 mr-2" />
                  Performance Overview
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Today's Revenue</span>
                      <span className="text-green-400 text-sm">+18.5%</span>
                    </div>
                    <div className="text-2xl font-bold text-white">$8,450</div>
                    <div className="w-full bg-gray-600 rounded-full h-2 mt-3">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full w-3/4"></div>
                    </div>
                  </div>

                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Campaign Performance</span>
                      <span className="text-blue-400 text-sm">342 active</span>
                    </div>
                    <div className="text-2xl font-bold text-white">4.2x</div>
                    <div className="text-gray-400 text-sm">Average ROAS</div>
                  </div>

                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">AI Optimizations</span>
                      <span className="text-purple-400 text-sm">+23% efficiency</span>
                    </div>
                    <div className="text-2xl font-bold text-white">47</div>
                    <div className="text-gray-400 text-sm">This month</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'campaigns' && <CampaignManagement />}
        {activeSection === 'ai-orchestrator' && <AICampaignOrchestrator />}

        {activeSection === 'analytics' && (
          <div className="text-center py-20">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Analytics Dashboard</h3>
            <p className="text-gray-400">Detailed analytics and reporting coming soon</p>
          </div>
        )}

        {activeSection === 'users' && (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">User Management</h3>
            <p className="text-gray-400">User management interface coming soon</p>
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="text-center py-20">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Settings</h3>
            <p className="text-gray-400">System settings and configuration coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAdminDashboard;
