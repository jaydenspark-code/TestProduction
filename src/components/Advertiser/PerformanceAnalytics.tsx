import React from 'react';
import { TrendingUp, DollarSign, Target, BarChart2, PieChart, Activity } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface PerformanceAnalyticsProps {
  stats: {
    totalSpent: number;
    totalReach: number;
    avgCompletion: number;
    monthlyGrowth: number;
  };
}

const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ stats }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold flex items-center">
        <TrendingUp className="mr-2" /> Performance Analytics
      </h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">Total Spent</h3>
          <p className="text-3xl font-bold text-green-400">{formatCurrency(stats.totalSpent)}</p>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">Total Reach</h3>
          <p className="text-3xl font-bold">{stats.totalReach.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">Avg. Completion</h3>
          <p className="text-3xl font-bold">{stats.avgCompletion.toFixed(1)}%</p>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">Monthly Growth</h3>
          <p className="text-3xl font-bold text-blue-400">+{stats.monthlyGrowth}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800/50 p-6 rounded-lg">
          <h3 className="font-bold mb-4 flex items-center"><BarChart2 className="mr-2" /> Spending Over Time</h3>
          <div className="h-64 bg-gray-700/50 rounded flex items-center justify-center">
            <p className="text-gray-500">[Chart Placeholder]</p>
          </div>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-lg">
          <h3 className="font-bold mb-4 flex items-center"><PieChart className="mr-2" /> Campaign Type Distribution</h3>
          <div className="h-64 bg-gray-700/50 rounded flex items-center justify-center">
            <p className="text-gray-500">[Chart Placeholder]</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
