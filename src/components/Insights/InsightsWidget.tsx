import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Users, Target } from 'lucide-react';

interface Insight {
  id: string;
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export const InsightsWidget: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading insights
    setTimeout(() => {
      setInsights([
        {
          id: '1',
          title: 'Conversion Rate',
          value: '2.4%',
          change: 12,
          trend: 'up'
        },
        {
          id: '2',
          title: 'Active Referrals',
          value: '24',
          change: -5,
          trend: 'down'
        },
        {
          id: '3',
          title: 'Revenue Growth',
          value: '$1,234',
          change: 18,
          trend: 'up'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-400';
      case 'down': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-700 rounded w-5/6"></div>
            <div className="h-3 bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Performance Insights</h3>
      </div>
      
      <div className="space-y-4">
        {insights.map((insight) => (
          <div key={insight.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
            <div className="flex items-center gap-3">
              {getTrendIcon(insight.trend)}
              <div>
                <p className="text-white font-medium">{insight.title}</p>
                <p className="text-2xl font-bold text-white">{insight.value}</p>
              </div>
            </div>
            <div className={`text-sm font-medium ${getTrendColor(insight.trend)}`}>
              {insight.change > 0 ? '+' : ''}{insight.change}%
            </div>
          </div>
        ))}
      </div>
      
      {insights.length === 0 && (
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No insights available yet</p>
          <p className="text-sm text-gray-500">Start referring to see analytics</p>
        </div>
      )}
    </div>
  );
};

export default InsightsWidget;
