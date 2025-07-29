import React, { useState, useEffect } from 'react';
import { Loader2, Users, Heart, MessageCircle, Star, Zap, RefreshCw, AlertCircle, UserCheck } from 'lucide-react';
import { smartMatchingService } from '../../services/smartMatchingService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface MatchedUser {
  id: string;
  name: string;
  avatar?: string;
  bio: string;
  compatibilityScore: number;
  matchType: 'earnings_partner' | 'skill_complement' | 'similar_goals' | 'activity_sync';
  commonInterests: string[];
  strengths: string[];
  mutualConnections: number;
  isOnline: boolean;
  lastActive?: string;
  estimatedEarningsPotential?: number;
}

interface SmartMatchingWidgetProps {
  userId: string;
  className?: string;
  maxMatches?: number;
}

export const SmartMatchingWidget: React.FC<SmartMatchingWidgetProps> = ({
  userId,
  className = "",
  maxMatches = 5
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [matches, setMatches] = useState<MatchedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (userId) {
      fetchSmartMatches();
    }
  }, [userId]);

  const fetchSmartMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to use the smart matching service
      const matchResults = await smartMatchingService.findOptimalMatches(userId, maxMatches);
      
      // Convert to expected format
      const convertedMatches: MatchedUser[] = matchResults.map((match, index) => ({
        id: match.targetUserId,
        name: `User ${match.targetUserId.slice(0, 8)}`,
        bio: 'AI-matched user with high compatibility',
        compatibilityScore: match.compatibilityScore,
        matchType: index % 4 === 0 ? 'earnings_partner' : 
                  index % 4 === 1 ? 'skill_complement' :
                  index % 4 === 2 ? 'similar_goals' : 'activity_sync',
        commonInterests: ['Referrals', 'Growth', 'Success'],
        strengths: match.reasons,
        mutualConnections: Math.floor(Math.random() * 5),
        isOnline: Math.random() > 0.5,
        lastActive: Math.random() > 0.5 ? '2 hours ago' : undefined,
        estimatedEarningsPotential: Math.floor(match.expectedConversion * 1000)
      }));

      setMatches(convertedMatches);

    } catch (err) {
      console.error('Error fetching smart matches:', err);
      setError(err instanceof Error ? err.message : 'Failed to load matches');
      
      // Fallback to mock data for development
      setMatches(getMockMatches());
    } finally {
      setLoading(false);
    }
  };

  const getMockMatches = (): MatchedUser[] => [
    {
      id: '1',
      name: 'Sarah Chen',
      bio: 'Digital marketing specialist focused on e-commerce growth',
      compatibilityScore: 0.92,
      matchType: 'earnings_partner',
      commonInterests: ['Marketing', 'E-commerce', 'Analytics'],
      strengths: ['Social Media', 'Content Creation', 'Data Analysis'],
      mutualConnections: 3,
      isOnline: true,
      estimatedEarningsPotential: 150
    },
    {
      id: '2',
      name: 'Alex Rodriguez',
      bio: 'Full-stack developer with experience in AI and automation',
      compatibilityScore: 0.87,
      matchType: 'skill_complement',
      commonInterests: ['Technology', 'AI', 'Automation'],
      strengths: ['Programming', 'Problem Solving', 'System Design'],
      mutualConnections: 1,
      isOnline: false,
      lastActive: '2 hours ago',
      estimatedEarningsPotential: 200
    },
    {
      id: '3',
      name: 'Maya Patel',
      bio: 'Content creator and influencer with focus on lifestyle',
      compatibilityScore: 0.83,
      matchType: 'similar_goals',
      commonInterests: ['Content Creation', 'Photography', 'Travel'],
      strengths: ['Creativity', 'Community Building', 'Brand Partnerships'],
      mutualConnections: 5,
      isOnline: true,
      estimatedEarningsPotential: 120
    },
    {
      id: '4',
      name: 'Jordan Kim',
      bio: 'Business consultant specializing in startup growth strategies',
      compatibilityScore: 0.79,
      matchType: 'activity_sync',
      commonInterests: ['Business', 'Strategy', 'Networking'],
      strengths: ['Strategic Planning', 'Leadership', 'Communication'],
      mutualConnections: 2,
      isOnline: false,
      lastActive: '1 day ago',
      estimatedEarningsPotential: 180
    }
  ];

  const getMatchTypeInfo = (type: MatchedUser['matchType']) => {
    switch (type) {
      case 'earnings_partner':
        return { label: 'Earnings Partner', color: 'bg-green-500/20 text-green-300', icon: <Zap className="w-3 h-3" /> };
      case 'skill_complement':
        return { label: 'Skill Match', color: 'bg-blue-500/20 text-blue-300', icon: <Star className="w-3 h-3" /> };
      case 'similar_goals':
        return { label: 'Similar Goals', color: 'bg-purple-500/20 text-purple-300', icon: <Heart className="w-3 h-3" /> };
      case 'activity_sync':
        return { label: 'Activity Sync', color: 'bg-orange-500/20 text-orange-300', icon: <Users className="w-3 h-3" /> };
      default:
        return { label: 'Match', color: 'bg-gray-500/20 text-gray-300', icon: <Users className="w-3 h-3" /> };
    }
  };

  const handleConnect = async (matchId: string) => {
    setConnecting(prev => new Set(prev).add(matchId));
    
    // Simulate connection request
    setTimeout(() => {
      setMatches(prev => prev.map(match => 
        match.id === matchId 
          ? { ...match, connectionRequested: true }
          : match
      ));
      setConnecting(prev => {
        const newSet = new Set(prev);
        newSet.delete(matchId);
        return newSet;
      });
    }, 1000);
  };

  const handleMessage = (matchId: string) => {
    // Navigate to messaging or open chat modal
    console.log(`Messaging user ${matchId}`);
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
          <Users className={`w-6 h-6 ${theme === 'professional' ? 'text-cyan-400' : 'text-purple-400'}`} />
          <h3 className="text-xl font-bold text-white">Smart Matches</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
          <span className="ml-3 text-white">Finding your perfect matches...</span>
        </div>
      </div>
    );
  }

  if (error && matches.length === 0) {
    return (
      <div className={`${cardClass} ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-bold text-white">Smart Matches</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">Failed to load matches</p>
          <button onClick={fetchSmartMatches} className={buttonClass}>
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
          <Users className={`w-6 h-6 ${theme === 'professional' ? 'text-cyan-400' : 'text-purple-400'}`} />
          <h3 className="text-xl font-bold text-white">Smart Matches</h3>
        </div>
        <button
          onClick={fetchSmartMatches}
          className="text-white/70 hover:text-white transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {matches.map((match) => {
          const matchInfo = getMatchTypeInfo(match.matchType);
          const isConnecting = connecting.has(match.id);
          
          return (
            <div 
              key={match.id}
              className={`p-4 rounded-lg ${theme === 'professional' ? 'bg-gray-700/30 border border-gray-600/30' : 'bg-white/5 border border-white/10'} hover:bg-opacity-80 transition-all duration-200`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {match.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {match.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-white truncate">{match.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${matchInfo.color}`}>
                      {matchInfo.icon}
                      {matchInfo.label}
                    </span>
                  </div>
                  
                  <p className="text-white/70 text-sm mb-3">{match.bio}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-white/60 mb-3">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {Math.round(match.compatibilityScore * 100)}% match
                    </span>
                    {match.mutualConnections > 0 && (
                      <span>{match.mutualConnections} mutual connections</span>
                    )}
                    {!match.isOnline && match.lastActive && (
                      <span>Active {match.lastActive}</span>
                    )}
                  </div>
                  
                  {/* Common Interests */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {match.commonInterests.slice(0, 3).map((interest, index) => (
                      <span key={index} className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-300">
                        {interest}
                      </span>
                    ))}
                  </div>
                  
                  {/* Earnings Potential */}
                  {match.estimatedEarningsPotential && (
                    <div className="text-xs text-green-400 font-medium mb-3">
                      Estimated collaboration potential: ${match.estimatedEarningsPotential}/week
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConnect(match.id)}
                      disabled={isConnecting}
                      className={`text-xs px-3 py-1 rounded ${buttonClass} ${isConnecting ? 'opacity-50' : ''}`}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          Connecting...
                        </>
                      ) : (
                        'Connect'
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleMessage(match.id)}
                      className={`text-xs px-3 py-1 rounded border ${theme === 'professional' ? 'border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10' : 'border-purple-500/50 text-purple-300 hover:bg-purple-500/10'} transition-colors`}
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {matches.length === 0 && (
          <div className="text-center py-8 text-white/60">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No matches found at the moment.</p>
            <p className="text-sm">Check back later for new recommendations!</p>
          </div>
        )}
        
        {/* Refresh Button */}
        <div className="pt-4 border-t border-white/10">
          <button 
            onClick={fetchSmartMatches}
            className={`w-full ${buttonClass} flex items-center justify-center gap-2`}
          >
            <RefreshCw className="w-4 h-4" />
            Find More Matches
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartMatchingWidget;
