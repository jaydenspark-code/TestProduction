import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Trophy, Crown, Medal, Award, Users, Star, MapPin, Calendar, Filter, Search, RefreshCw } from 'lucide-react';
import { leaderboardService } from '../../services/leaderboardService';
import { LeaderboardEntry, LeaderboardFilters } from '../../types/leaderboard';

interface AdminLeaderboardProps {
  category: 'regular' | 'agent';
  className?: string;
}

const AdminLeaderboard: React.FC<AdminLeaderboardProps> = ({ category, className = '' }) => {
  const { theme } = useTheme();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [sortBy, setSortBy] = useState<'points' | 'earnings' | 'referrals'>('points');
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const colors = {
    background: theme === 'professional' 
      ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800'
      : 'bg-gradient-to-br from-purple-900 to-indigo-900',
    card: theme === 'professional'
      ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50'
      : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20',
    cardInner: theme === 'professional'
      ? 'bg-gray-700/30 rounded-lg p-4 border border-gray-600/30'
      : 'bg-white/5 rounded-lg p-4 border border-white/10',
    accentColor: theme === 'professional' ? 'text-cyan-400' : 'text-purple-400',
    textPrimary: 'text-white',
    textSecondary: 'text-white/70',
    textMuted: 'text-white/50',
    buttonPrimary: theme === 'professional'
      ? 'bg-cyan-600 hover:bg-cyan-700'
      : 'bg-purple-600 hover:bg-purple-700',
    buttonSecondary: theme === 'professional'
      ? 'bg-gray-700/50 hover:bg-gray-600/60'
      : 'bg-white/10 hover:bg-white/20',
    inputBg: theme === 'professional'
      ? 'bg-gray-700/50 border-gray-600/50'
      : 'bg-white/5 border-white/20'
  };

  useEffect(() => {
    loadLeaderboard();
  }, [category, sortBy]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const filters: LeaderboardFilters = {
        category,
        limit: 500, // Load more entries for admin view
        sortBy
      };
      
      const data = await leaderboardService.getLeaderboard(filters);
      setEntries(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    const iconClass = `w-6 h-6`;
    switch (rank) {
      case 1:
        return <Crown className={`${iconClass} ${colors.accentColor}`} />;
      case 2:
        return <Medal className={`${iconClass} text-gray-400`} />;
      case 3:
        return <Award className={`${iconClass} text-amber-600`} />;
      default:
        return <Trophy className={`${iconClass} ${colors.accentColor}`} />;
    }
  };

  const filteredEntries = entries
    .filter(entry => {
      const matchesSearch = searchTerm === '' || 
        entry.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.user.username.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCountry = countryFilter === '' || entry.user.country === countryFilter;
      
      return matchesSearch && matchesCountry;
    })
    .slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalPages = Math.ceil(entries.length / pageSize);
  const uniqueCountries = Array.from(new Set(entries.map(e => e.user.country).filter(Boolean)));

  if (loading) {
    return (
      <div className={`${colors.card} ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className={`h-8 ${colors.cardInner} rounded w-1/3`} />
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className={`h-16 ${colors.cardInner} rounded`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${colors.card} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Trophy className={`w-8 h-8 ${colors.accentColor}`} />
          <div>
            <h2 className={`text-2xl font-bold ${colors.textPrimary}`}>
              {category === 'regular' ? 'Regular Users' : 'Agent'} Leaderboard
            </h2>
            <p className={colors.textSecondary}>
              Top performers - {entries.length} total participants
            </p>
          </div>
        </div>
        <button
          onClick={loadLeaderboard}
          className={`${colors.buttonSecondary} text-white p-2 rounded-lg transition-colors`}
          disabled={loading}
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className={`absolute left-3 top-3 w-4 h-4 ${colors.textMuted}`} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 ${colors.inputBg} border rounded-lg ${colors.textPrimary} placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-${theme === 'professional' ? 'cyan' : 'purple'}-500`}
          />
        </div>

        {/* Country Filter */}
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className={`px-4 py-2 ${colors.inputBg} border rounded-lg ${colors.textPrimary} focus:outline-none focus:ring-2 focus:ring-${theme === 'professional' ? 'cyan' : 'purple'}-500`}
        >
          <option value="">All Countries</option>
          {uniqueCountries.map(country => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'points' | 'earnings' | 'referrals')}
          className={`px-4 py-2 ${colors.inputBg} border rounded-lg ${colors.textPrimary} focus:outline-none focus:ring-2 focus:ring-${theme === 'professional' ? 'cyan' : 'purple'}-500`}
        >
          <option value="points">Sort by Points</option>
          <option value="earnings">Sort by Earnings</option>
          <option value="referrals">Sort by Referrals</option>
        </select>

        {/* Page Size */}
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className={`px-4 py-2 ${colors.inputBg} border rounded-lg ${colors.textPrimary} focus:outline-none focus:ring-2 focus:ring-${theme === 'professional' ? 'cyan' : 'purple'}-500`}
        >
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={colors.cardInner}>
          <div className="text-center">
            <div className={`text-2xl font-bold ${colors.accentColor}`}>
              {entries.length}
            </div>
            <div className={`${colors.textSecondary} text-sm`}>Total Users</div>
          </div>
        </div>
        <div className={colors.cardInner}>
          <div className="text-center">
            <div className={`text-2xl font-bold ${colors.accentColor}`}>
              {entries.length > 0 ? Math.round(entries.reduce((sum, e) => sum + e.points, 0) / entries.length) : 0}
            </div>
            <div className={`${colors.textSecondary} text-sm`}>Avg Points</div>
          </div>
        </div>
        <div className={colors.cardInner}>
          <div className="text-center">
            <div className={`text-2xl font-bold ${colors.accentColor}`}>
              {entries.length > 0 ? Math.round(entries.reduce((sum, e) => sum + (e.stats?.totalEarnings || 0), 0) / entries.length) : 0}
            </div>
            <div className={`${colors.textSecondary} text-sm`}>Avg Earnings</div>
          </div>
        </div>
        <div className={colors.cardInner}>
          <div className="text-center">
            <div className={`text-2xl font-bold ${colors.accentColor}`}>
              {uniqueCountries.length}
            </div>
            <div className={`${colors.textSecondary} text-sm`}>Countries</div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="space-y-3">
        {filteredEntries.map((entry, index) => (
          <div
            key={entry.id}
            className={`${colors.cardInner} transition-all duration-200 hover:scale-[1.02] ${
              entry.rank <= 3 ? 'ring-2 ring-yellow-400/30' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Rank */}
                <div className="flex items-center space-x-2">
                  {getRankIcon(entry.rank)}
                  <span className={`text-2xl font-bold ${colors.textPrimary}`}>
                    #{entry.rank}
                  </span>
                </div>

                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full ${colors.buttonSecondary} flex items-center justify-center`}>
                    <Users className={`w-6 h-6 ${colors.accentColor}`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-semibold ${colors.textPrimary}`}>
                        {entry.user.fullName}
                      </span>
                      {entry.user.isVerified && (
                        <Star className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <span className={colors.textSecondary}>
                        @{entry.user.username}
                      </span>
                      {entry.user.country && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span className={colors.textSecondary}>
                            {entry.user.country}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <div className={`text-xl font-bold ${colors.accentColor}`}>
                    {entry.points.toLocaleString()}
                  </div>
                  <div className={`${colors.textSecondary} text-sm`}>Points</div>
                </div>
                
                {entry.stats && (
                  <>
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${colors.textPrimary}`}>
                        ${entry.stats.totalEarnings.toLocaleString()}
                      </div>
                      <div className={`${colors.textSecondary} text-sm`}>Earnings</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${colors.textPrimary}`}>
                        {entry.stats.referralCount}
                      </div>
                      <div className={`${colors.textSecondary} text-sm`}>Referrals</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${colors.textPrimary}`}>
                        {entry.stats.completedTasks}
                      </div>
                      <div className={`${colors.textSecondary} text-sm`}>Tasks</div>
                    </div>
                  </>
                )}

                {/* Opt-in Status */}
                <div className="text-center">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    entry.optIn 
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {entry.optIn ? 'Visible' : 'Hidden'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <Trophy className={`w-16 h-16 ${colors.textMuted} mx-auto mb-4`} />
            <p className={colors.textSecondary}>
              {searchTerm || countryFilter ? 'No users match your filters' : 'No leaderboard data available'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-2 ${colors.buttonSecondary} text-white rounded-lg transition-colors disabled:opacity-50`}
          >
            Previous
          </button>
          
          <span className={colors.textSecondary}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 ${colors.buttonSecondary} text-white rounded-lg transition-colors disabled:opacity-50`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminLeaderboard;
