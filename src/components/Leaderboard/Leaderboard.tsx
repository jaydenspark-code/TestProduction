import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LeaderboardEntry, LeaderboardFilters, LeaderboardStats } from '../../types/leaderboard';
import { leaderboardService } from '../../services/leaderboardService';
import { Crown, Medal, Award, Trophy, Users, Globe, TrendingUp, ChevronUp, ChevronDown, Shield, Eye, EyeOff } from 'lucide-react';
import { formatDualCurrency } from '../../utils/currency';
import ProfileModal from './ProfileModal';

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [timeframe, setTimeframe] = useState<'all-time' | 'monthly' | 'weekly'>('all-time');
  const category = user?.isAgent ? 'agent' : 'regular';
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOptedOut, setIsOptedOut] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Define number of items per page
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    loadLeaderboardData();
    if (user) {
      loadOptOutStatus();
    }
  }, [timeframe, category, user]);

  const loadOptOutStatus = async () => {
    if (!user) return;
    try {
      const userRankData = await leaderboardService.getUserRanking(user.id, category);
      setIsOptedOut(!userRankData?.optIn);
    } catch (error) {
      console.error('Error loading opt-out status:', error);
    }
  };

  const handleOptOutToggle = async () => {
    if (!user) return;
    try {
      const success = await leaderboardService.updateOptInStatus(user.id, category, isOptedOut);
      if (success) {
        setIsOptedOut(!isOptedOut);
        loadLeaderboardData();
      }
    } catch (error) {
      console.error('Error updating opt-out status:', error);
    }
  };

  const loadLeaderboardData = async () => {
    try {
      setLoading(true);
      
      const [leaderboardData, statsData] = await Promise.all([
        leaderboardService.getLeaderboard({ category, timeframe }),
        leaderboardService.getLeaderboardStats(category)
      ]);
      
      if (!leaderboardData || !Array.isArray(leaderboardData)) {
        throw new Error('Invalid leaderboard data received');
      }

      // Only show top 500 users
      setEntries(leaderboardData.slice(0, 500));
      setStats(statsData);

      if (user) {
        const userRankData = await leaderboardService.getUserRanking(user.id, category);
        setUserRank(userRankData?.rank || null);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setEntries([]);
      setStats(null);
      throw error; // Let ErrorBoundary handle the error
    } finally {
      setLoading(false);
    }
  };

  const isAgent = user?.isAgent;
  const isClassic = theme === 'classic';
  
  // Theme-based styling
  const accentColor = isClassic ? (isAgent ? 'text-purple-400' : 'text-purple-400') : 'text-cyan-400';
  const accentBg = isClassic ? (isAgent ? 'bg-purple-500' : 'bg-purple-500') : 'bg-cyan-500';
  const cardClass = isClassic 
    ? 'bg-white/10 backdrop-blur-lg border-white/20 shadow-lg' 
    : 'bg-gray-800/50 backdrop-blur-lg border-gray-700/50 shadow-lg';
  const buttonClass = isClassic
    ? 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20'
    : 'bg-gray-700/50 backdrop-blur-sm border border-gray-600/50 text-white hover:bg-gray-600/50';
  const backgroundClass = isClassic 
    ? 'bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900'
    : 'bg-gradient-to-br from-gray-900 via-black to-gray-800';

  const getRankIcon = (rank: number) => {
    const iconClass = isAgent ? 'text-[#00FFB0]' : 'text-[#8B5CF6]';
    switch (rank) {
      case 1:
        return <Crown className={`w-5 h-5 text-yellow-400`} />;
      case 2:
        return <Medal className={`w-5 h-5 text-gray-400`} />;
      case 3:
        return <Award className={`w-5 h-5 text-amber-600`} />;
      default:
        return null;
    }
  };

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEntries = entries.slice(startIndex, endIndex);
  const totalPages = Math.ceil(entries.length / itemsPerPage);

  return (
    <div className={`min-h-screen p-6 space-y-6 ${backgroundClass}`}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className={`text-4xl font-bold ${accentColor} mb-2`}>Global Leaderboard</h1>
          <p className="text-gray-400">Compete with the best and climb the ranks</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleOptOutToggle}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${buttonClass} hover:opacity-80 transition-colors`}
          >
            {isOptedOut ? (
              <>
                <EyeOff className="w-4 h-4" />
                <span>Opted Out</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span>Visible</span>
              </>
            )}
          </button>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg ${buttonClass} hover:opacity-80 transition-colors disabled:opacity-50`}
          >
            Previous
          </button>
          <span className="text-white text-sm">
            Page {currentPage} of {totalPages} ({entries.length} users)
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className={`px-4 py-2 rounded-lg ${buttonClass} hover:opacity-80 transition-colors disabled:opacity-50`}
          >
            Next
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as 'all-time' | 'monthly' | 'weekly')}
            className={`${buttonClass} px-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${isAgent ? 'focus:ring-[#00FFB0]' : 'focus:ring-[#8B5CF6]'}`}
          >
            <option value="all-time">All Time</option>
            <option value="monthly">This Month</option>
            <option value="weekly">This Week</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${cardClass} rounded-xl p-6 border hover:border-opacity-30 transition-colors`}>
            <div className="flex items-center space-x-4">
              <Users className={`w-8 h-8 ${accentColor}`} />
              <div>
                <p className="text-gray-400">Total Participants</p>
                <h3 className={`text-2xl font-bold ${accentColor}`}>{stats.totalParticipants.toLocaleString()}</h3>
              </div>
            </div>
          </div>

          <div className={`${cardClass} rounded-xl p-6 border`}>
            <div className="flex items-center space-x-4">
              <Globe className={`w-8 h-8 ${accentColor}`} />
              <div>
                <p className="text-gray-400">Top Country</p>
                <h3 className={`text-2xl font-bold ${accentColor}`}>
                  {stats.topCountries[0]?.country || 'N/A'}
                </h3>
              </div>
            </div>
          </div>

          <div className={`${cardClass} rounded-xl p-6 border`}>
            <div className="flex items-center space-x-4">
              <TrendingUp className={`w-8 h-8 ${accentColor}`} />
              <div>
                <p className="text-gray-400">Average Points</p>
                <h3 className={`text-2xl font-bold ${accentColor}`}>
                  {Math.round(stats.averagePoints).toLocaleString()}
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className={`${cardClass} rounded-xl overflow-hidden border p-4`}>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B5CF6]"></div>
            <span className="ml-2 text-gray-400">Loading leaderboard...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Trophy className="w-12 h-12 text-gray-600" />
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-400 mb-2">No leaderboard data available</h3>
              <p className="text-gray-500">Check back later or try refreshing the page.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedEntries.map((entry, index) => (
              <div key={entry.userId} className={`${cardClass} rounded-xl p-4 flex items-center justify-between ${entry.userId === user?.id ? (isAgent ? 'bg-[#00FFB0]/5' : 'bg-[#8B5CF6]/5') : ''}`}>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getRankIcon(entry.rank)}
                    <span className={`font-medium ${isAgent ? 'text-[#00FFB0]' : 'text-[#8B5CF6]'}`}>#{entry.rank}</span>
                  </div>
                  <div 
                    className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity" 
                    onClick={() => setSelectedProfile(entry)}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAgent ? 'bg-gradient-to-br from-[#00FFB0]/20 to-[#00FFB0]/10 border border-[#00FFB0]/30' : 'bg-gradient-to-br from-[#8B5CF6]/20 to-[#8B5CF6]/10 border border-[#8B5CF6]/30'} hover:scale-105 transition-transform`}>
                      <span className={isAgent ? 'text-[#00FFB0]' : 'text-[#8B5CF6]'}>{entry.user.username?.[0] || entry.user.fullName[0]}</span>
                    </div>
                    <div>
                      <p className={`font-medium ${isAgent ? 'text-[#00FFB0]' : 'text-[#8B5CF6]'} hover:underline`}>{entry.user.username || entry.user.fullName}</p>
                      <p className="text-sm text-gray-400">{entry.user.country}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${isAgent ? 'text-[#00FFB0]' : 'text-[#8B5CF6]'}`}>{entry.points.toLocaleString()}</span>
                    {entry.rank < (entry.lastUpdated ? entry.rank + 1 : entry.rank) && (
                      <ChevronUp className={`w-4 h-4 ${isAgent ? 'text-[#00FFB0]' : 'text-[#8B5CF6]'}`} />
                    )}
                    {entry.rank > (entry.lastUpdated ? entry.rank - 1 : entry.rank) && (
                      <ChevronDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="hidden md:block">
                    <p className={`font-medium ${isAgent ? 'text-[#00FFB0]' : 'text-[#8B5CF6]'}`}>{formatDualCurrency(entry.stats.totalEarnings)}</p>
                    <p className="text-sm text-gray-400">Total Earnings</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User's Current Rank */}
      <div className={`${cardClass} rounded-xl p-6 mt-6 border`}>
        {isOptedOut ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Shield className="w-12 h-12 text-[#00FFB0]" />
            <div className="text-center">
              <h3 className="text-xl font-bold text-[#00FFB0] mb-2">Your privacy is important.</h3>
              <p className="text-gray-400">You have opted out of the public leaderboard. Your rank and progress are still tracked privately.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00FFB0]/20 to-[#00FFB0]/10 border border-[#00FFB0]/30 flex items-center justify-center text-[#00FFB0] text-xl font-bold">
                {user?.username?.[0] || user?.fullName[0]}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold text-[#00FFB0]">You</h3>
                  {isOptedOut && <span className="text-sm text-red-400">(Opted Out)</span>}
                </div>
                <p className="text-gray-400">Your Current Rank</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#00FFB0]">
                {userRank ? `#${userRank}` : 'N/A'}
              </div>
              <p className="text-gray-400">{formatDualCurrency(0)}</p>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => loadLeaderboardData()}
        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
      >
        Refresh
      </button>

      {/* Profile Modal */}
      {selectedProfile && (
        <ProfileModal
          userId={selectedProfile.userId}
          username={selectedProfile.user.username}
          fullName={selectedProfile.user.fullName}
          currentRank={selectedProfile.rank}
          points={selectedProfile.points}
          isAgent={selectedProfile.rankCategory === 'agent'}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
};

export default Leaderboard;