import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Trophy, Crown, Medal, Award, Settings, TrendingUp, ChevronDown, ChevronUp, Star, Zap, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { leaderboardService } from '../../services/leaderboardService';
import { UserRanking } from '../../types/leaderboard';

interface EnhancedLeaderboardWidgetProps {
  className?: string;
}

const EnhancedLeaderboardWidget: React.FC<EnhancedLeaderboardWidgetProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [regularRanking, setRegularRanking] = useState<UserRanking | null>(null);
  const [agentRanking, setAgentRanking] = useState<UserRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [animateRank, setAnimateRank] = useState(false);

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
      
      // Trigger rank animation
      setAnimateRank(true);
      setTimeout(() => setAnimateRank(false), 1000);
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <Trophy className="w-5 h-5 text-purple-400" />;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 10) return { text: 'Top 10', color: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' };
    if (rank <= 50) return { text: 'Top 50', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' };
    if (rank <= 100) return { text: 'Top 100', color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' };
    if (rank <= 500) return { text: 'Top 500', color: 'bg-purple-500/20 text-purple-300' };
    return null;
  };

  const getProgressToNextTier = (rank: number) => {
    if (rank <= 10) return { current: rank, target: 1, progress: ((11 - rank) / 10) * 100 };
    if (rank <= 50) return { current: rank, target: 10, progress: ((51 - rank) / 40) * 100 };
    if (rank <= 100) return { current: rank, target: 50, progress: ((101 - rank) / 50) * 100 };
    if (rank <= 500) return { current: rank, target: 100, progress: ((501 - rank) / 400) * 100 };
    return { current: rank, target: 500, progress: 0 };
  };

  if (loading) {
    return (
      <div className={`${cardClass} rounded-xl p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700/50 rounded w-1/2" />
          <div className="h-16 bg-gray-700/50 rounded" />
          {user?.isAgent && <div className="h-16 bg-gray-700/50 rounded" />}
        </div>
      </div>
    );
  }

  const activeRanking = regularRanking || agentRanking;
  const progress = activeRanking ? getProgressToNextTier(activeRanking.rank) : null;
  const badge = activeRanking ? getRankBadge(activeRanking.rank) : null;

  return (
    <div className={`${cardClass} rounded-xl p-4 ${className} relative overflow-hidden`}>
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-cyan-500/5 animate-pulse" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Trophy className={`w-5 h-5 ${theme === 'professional' ? 'text-cyan-400' : 'text-purple-400'} ${animateRank ? 'animate-bounce' : ''}`} />
              {activeRanking && activeRanking.rank <= 10 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
              )}
            </div>
            <h3 className="text-lg font-bold text-white">Global Rank</h3>
          </div>
          <Link
            to="/leaderboard"
            className="p-1.5 hover:bg-gray-700/30 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </Link>
        </div>

        <div className="space-y-3">
          {/* Main Ranking Display */}
          {activeRanking ? (
            <div className="relative">
              <div className="flex items-center justify-between bg-gradient-to-r from-gray-800/40 to-gray-700/40 rounded-lg p-4 border border-gray-600/30">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {getRankIcon(activeRanking.rank)}
                    {activeRanking.rank <= 3 && (
                      <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full animate-pulse" />
                    )}
                  </div>
                  <div>
                    <div className={`text-2xl font-bold text-white ${animateRank ? 'animate-pulse' : ''}`}>
                      #{activeRanking.rank.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {activeRanking.points.toLocaleString()} points
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {badge && (
                    <div className={`px-3 py-1 ${badge.color} text-xs font-bold rounded-full mb-1`}>
                      {badge.text}
                    </div>
                  )}
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <TrendingUp className="w-3 h-3" />
                    <span>Rising</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar to Next Tier */}
              {progress && progress.progress > 0 && (
                <div className="mt-2 p-2 bg-gray-800/30 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400">Progress to Top {progress.target}</span>
                    <span className="text-xs text-white font-medium">{Math.round(progress.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        theme === 'professional' 
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Start earning to get ranked!</p>
              <Link 
                to="/tasks" 
                className={`inline-block mt-2 px-4 py-2 ${theme === 'professional' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-lg text-xs transition-colors`}
              >
                Complete Tasks
              </Link>
            </div>
          )}

          {/* Quick Stats */}
          {activeRanking && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center p-2 bg-gray-800/30 rounded-lg">
                <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                <div className="text-xs text-gray-400">Level</div>
                <div className="text-sm font-bold text-white">
                  {activeRanking.rank <= 10 ? 'Elite' : activeRanking.rank <= 100 ? 'Pro' : 'Rising'}
                </div>
              </div>
              <div className="text-center p-2 bg-gray-800/30 rounded-lg">
                <Target className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <div className="text-xs text-gray-400">Points</div>
                <div className="text-sm font-bold text-white">
                  {activeRanking.points > 1000 ? `${(activeRanking.points / 1000).toFixed(1)}k` : activeRanking.points}
                </div>
              </div>
              <div className="text-center p-2 bg-gray-800/30 rounded-lg">
                <Zap className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <div className="text-xs text-gray-400">Streak</div>
                <div className="text-sm font-bold text-white">7</div>
              </div>
            </div>
          )}

          {/* Expandable Details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-center space-x-1 text-sm text-purple-400 hover:text-purple-300 transition-colors py-2"
          >
            <span>{showDetails ? 'Less Details' : 'More Details'}</span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="mt-3 p-3 bg-gray-700/30 rounded-lg space-y-3 border border-gray-600/30">
              <div>
                <h4 className="text-white text-sm font-bold mb-2 flex items-center">
                  <Award className="w-4 h-4 mr-1 text-yellow-400" />
                  Recent Achievements
                </h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">🏆 Top Monthly Performer</span>
                    <span className="text-green-300">+500 pts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">🎯 Task Master (10 tasks)</span>
                    <span className="text-blue-300">+200 pts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">👥 Referral Champion</span>
                    <span className="text-purple-300">+300 pts</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-600/30 pt-3">
                <Link
                  to="/leaderboard"
                  className={`w-full ${theme === 'professional' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-purple-600 hover:bg-purple-700'} text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>View Full Leaderboard</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedLeaderboardWidget;
