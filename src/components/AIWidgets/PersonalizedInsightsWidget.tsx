import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Users, Target, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { aiAnalyticsAPI } from '../../api/ai';

interface PersonalizedInsight {
  id: string;
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

const PersonalizedInsightsWidget: React.FC = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<PersonalizedInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPersonalizedInsights();
    }
  }, [user]);

  const loadPersonalizedInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const mockInsights: PersonalizedInsight[] = [
        {
          id: '1',
          title: 'Conversion Rate',
          value: '3.2%',
          change: 15,
          trend: 'up',
          description: 'Your conversion rate improved this week'
        },
        {
          id: '2',
          title: 'Active Referrals',
          value: '12',
          change: -8,
          trend: 'down',
          description: 'Referral activity decreased slightly'
        },
        {
          id: '3',
          title: 'Revenue Growth',
          value: '$2,450',
          change: 22,
          trend: 'up',
          description: 'Strong revenue growth this month'
        }
      ];

      setTimeout(() => {
        setInsights(mockInsights);
        setLoading(false);
        toast.success('Insights loaded successfully!');
      }, 1000);

    } catch (err) {
      const errorMessage = 'Failed to load insights';
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />;
      default: return <Target className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string, change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">AI Insights</h3>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">AI Insights</h3>
        </div>
        <div className="text-center py-8">
          <Zap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-red-400">{error}</p>
          <button 
            onClick={loadPersonalizedInsights}
            className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Personalized AI Insights</h3>
      </div>
      
      <div className="space-y-4">
        {insights.map((insight) => (
          <div key={insight.id} className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getTrendIcon(insight.trend)}
                <h4 className="text-white font-medium">{insight.title}</h4>
              </div>
              <div className={`text-sm font-medium ${getTrendColor(insight.trend, insight.change)}`}>
                {insight.change > 0 ? '+' : ''}{insight.change}%
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-white">{insight.value}</p>
            </div>
            <p className="text-sm text-gray-400 mt-2">{insight.description}</p>
          </div>
        ))}
      </div>
      
      {insights.length === 0 && (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No personalized insights available</p>
          <p className="text-sm text-gray-500">Complete more activities to generate insights</p>
        </div>
      )}
    </div>
  );
};

export default PersonalizedInsightsWidget;
export { PersonalizedInsightsWidget };
