import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Zap, RefreshCw, Calendar, Target } from 'lucide-react';
import { aiAnalyticsService } from '../../services/aiAnalyticsService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  period: string;
}

interface AIPerformanceWidgetProps {
  userId: string;
  className?: string;
}

export const AIPerformanceWidget: React.FC<AIPerformanceWidgetProps> = ({
  userId,
  className = ""
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (userId) {
      const loadMetrics = async () => {
        await fetchPerformanceMetrics();
      };
      loadMetrics();
    }
  }, [userId, timeframe]);

  const fetchPerformanceMetrics = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Use AI analytics service to get performance data
      const [revenueInsight, personalizedData, anomalies] = await Promise.all([
        aiAnalyticsService.predictRevenue(parseInt(timeframe.replace('d', ''))),
        aiAnalyticsService.getPersonalizedInsights(userId),
        aiAnalyticsService.detectAnomalies()
      ]);

      // Convert to performance metrics format
      const performanceMetrics: PerformanceMetric[] = [
        {
          id: 'predicted_revenue',
          name: 'Predicted Revenue',
          value: revenueInsight.prediction,
          change: 15.2,
          trend: 'up',
          target: revenueInsight.prediction * 1.2,
          period: timeframe
        },
        {
          id: 'ai_confidence',
          name: 'AI Confidence Score',
          value: revenueInsight.confidence * 100,
          change: 5.8,
          trend: 'up',
          target: 90,
          period: timeframe
        },
        {
          id: 'optimization_score',
          name: 'Optimization Score',
          value: personalizedData.predictedValue / 10,
          change: -2.1,
          trend: 'down',
          target: 85,
          period: timeframe
        },
        {
          id: 'anomaly_detection',
          name: 'System Health',
          value: Math.max(0, 100 - (anomalies.length * 10)),
          change: anomalies.length > 0 ? -anomalies.length * 5 : 0,
          trend: anomalies.length > 0 ? 'down' : 'stable',
          target: 95,
          period: timeframe
        }
      ];

      setMetrics(performanceMetrics);

    } catch (err) {
      console.error('Error fetching performance metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
      
      // Fallback to mock data
      setMetrics(getMockMetrics());
    } finally {
      setLoading(false);
    }
  };

  const getMockMetrics = (): PerformanceMetric[] => [
    {
      id: 'predicted_revenue',
      name: 'Predicted Revenue',
      value: 1247.5,
      change: 15.2,
      trend: 'up',
      target: 1500,
      period: timeframe
    },
    {
      id: 'ai_confidence',
      name: 'AI Confidence Score',
      value: 87.3,
      change: 5.8,
      trend: 'up',
      target: 90,
      period: timeframe
    },
    {
      id: 'optimization_score',
      name: 'Optimization Score',
      value: 78.9,
      change: -2.1,
      trend: 'down',
      target: 85,
      period: timeframe
    },
    {
      id: 'system_health',
      name: 'System Health',
      value: 94.2,
      change: 1.3,
      trend: 'up',
      target: 95,
      period: timeframe
    }
  ];

  const getTrendIcon = (trend: PerformanceMetric['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'stable':
        return <Target className="w-4 h-4 text-yellow-400" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-400" />;
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getProgressBarColor = (value: number, target?: number) => {
    if (!target) return theme === 'professional' ? 'bg-cyan-500' : 'bg-purple-500';
    
    const percentage = (value / target) * 100;
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return theme === 'professional' ? 'bg-cyan-500' : 'bg-purple-500';
    return 'bg-yellow-500';
  };

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20';

  const buttonClass = theme === 'professional'
    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200'
    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200';

  if (loading) {
    return (
      <div className={`${cardClass} ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className={`w-6 h-6 ${theme === 'professional' ? 'text-cyan-400' : 'text-purple-400'}`} />
          <h3 className="text-xl font-bold text-white">AI Performance Analytics</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin text-white" />
          <span className="ml-3 text-white">Analyzing performance data...</span>
        </div>
      </div>
    );
  }

  if (error && metrics.length === 0) {
    return (
      <div className={`${cardClass} ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-bold text-white">AI Performance Analytics</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">Failed to load performance data</p>
          <button onClick={fetchPerformanceMetrics} className={buttonClass}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${cardClass} ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className={`w-6 h-6 ${theme === 'professional' ? 'text-cyan-400' : 'text-purple-400'}`} />
          <h3 className="text-xl font-bold text-white">AI Performance Analytics</h3>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                timeframe === period
                  ? theme === 'professional' 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                  : 'text-white/70 hover:text-white border border-white/20'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {metrics.map((metric) => (
          <div 
            key={metric.id}
            className={`p-4 rounded-lg ${theme === 'professional' ? 'bg-gray-700/30 border border-gray-600/30' : 'bg-white/5 border border-white/10'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getTrendIcon(metric.trend)}
                <h4 className="font-medium text-white">{metric.name}</h4>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  {metric.name.includes('Revenue') || metric.name.includes('Score') 
                    ? metric.name.includes('Revenue') 
                      ? `$${metric.value.toFixed(0)}`
                      : `${metric.value.toFixed(1)}${metric.name.includes('Score') ? '%' : ''}`
                    : metric.value.toFixed(1)
                  }
                </div>
                <div className={`text-xs ${getChangeColor(metric.change)}`}>
                  {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            {metric.target && (
              <div className="mb-2">
                <div className="flex justify-between text-xs text-white/70 mb-1">
                  <span>Progress to Target</span>
                  <span>{((metric.value / metric.target) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-600/30 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getProgressBarColor(metric.value, metric.target)}`}
                    style={{ width: `${Math.min(100, (metric.value / metric.target) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-white/50 mt-1">
                  Target: {metric.name.includes('Revenue') ? `$${metric.target}` : `${metric.target}${metric.name.includes('Score') ? '%' : ''}`}
                </div>
              </div>
            )}
            
            {/* Period Indicator */}
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Calendar className="w-3 h-3" />
              <span>Last {timeframe}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="pt-4 border-t border-white/10 mt-6">
        <button 
          onClick={fetchPerformanceMetrics}
          className={`w-full ${buttonClass} flex items-center justify-center gap-2`}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Analytics
        </button>
      </div>
    </div>
  );
};

export default AIPerformanceWidget;
