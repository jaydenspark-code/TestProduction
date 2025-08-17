import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Trophy, Crown, Medal, Award, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { leaderboardService } from '../../services/leaderboardService';
import { UserRanking } from '../../types/leaderboard';

interface LeaderboardWidgetProps {
  className?: string;
}

const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [regularRanking, setRegularRanking] = useState<UserRanking | null>(null);
  const [agentRanking, setAgentRanking] = useState<UserRanking | null>(null);
  const [loading, setLoading] = useState(true);

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg border border-white/20';

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [regular, agent] = await Promise.all([
        leaderboardService.getUserRanking(user.id, 'regular'),
        user.isAgent ? leaderboardService.getUserRanking(user.id, 'agent') : null
      ]);

      setRegularRanking(regular);
      setAgentRanking(agent);
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <Trophy className="w-6 h-6 text-purple-400" />;
    }
  };

  if (loading) {
    return (
      <div className={`${cardClass} rounded-xl p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700/50 rounded w-1/3" />
          <div className="h-20 bg-gray-700/50 rounded" />
          {user?.isAgent && <div className="h-20 bg-gray-700/50 rounded" />}
        </div>
      </div>
    );
  }

  return (
    <div className={`${cardClass} rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold text-white">Your Rankings</h3>
        </div>
        <Link
          to="/settings/leaderboard"
          className="p-1.5 hover:bg-gray-700/30 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-400" />
        </Link>
      </div>

      <div className="space-y-6">
        {/* Regular User Ranking */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Regular Leaderboard</span>
            {regularRanking?.optIn ? (
              <span className="text-xs text-emerald-400">Visible</span>
            ) : (
              <span className="text-xs text-gray-500">Hidden</span>
            )}
          </div>
          
          {regularRanking ? (
            <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                {getRankIcon(regularRanking.rank)}
                <div>
                  <div className="text-xl font-bold text-white">#{regularRanking.rank}</div>
                  <div className="text-xs text-gray-400">{regularRanking.points.toLocaleString()} points</div>
                </div>
              </div>
              {regularRanking.rank <= 500 ? (
                <div className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                  Top 500
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400">
              Start earning to get ranked!
            </div>
          )}
        </div>

        {/* Agent Ranking (if applicable) */}
        {user?.isAgent && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Agent Leaderboard</span>
              {agentRanking?.optIn ? (
                <span className="text-xs text-emerald-400">Visible</span>
              ) : (
                <span className="text-xs text-gray-500">Hidden</span>
              )}
            </div>
            
            {agentRanking ? (
              <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  {getRankIcon(agentRanking.rank)}
                  <div>
                    <div className="text-xl font-bold text-white">#{agentRanking.rank}</div>
                    <div className="text-xs text-gray-400">{agentRanking.points.toLocaleString()} points</div>
                  </div>
                </div>
                {agentRanking.rank <= 500 ? (
                  <div className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                    Top 500
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                Complete agent tasks to get ranked!
              </div>
            )}
          </div>
        )}

        <Link
          to="/leaderboard"
          className="block text-center text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          View Full Leaderboard →
        </Link>
      </div>
    </div>
  );
};

export default LeaderboardWidget;