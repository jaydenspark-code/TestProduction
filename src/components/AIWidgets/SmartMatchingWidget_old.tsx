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
    fetchSmartMatches();
  }, [userId]);

  const fetchSmartMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ai/matching/smart-recommendations?userId=${userId}&limit=${maxMatches}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch smart matches');
      }

      const data = await response.json();
      setMatches(data.matches || []);

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
      avatar: '/api/placeholder/40/40',
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
      avatar: '/api/placeholder/40/40',
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
      avatar: '/api/placeholder/40/40',
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
      avatar: '/api/placeholder/40/40',
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
    const baseColor = theme === 'professional' ? 'text-white' : 'text-white';
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
    
    try {
      const response = await fetch('/api/connections/send-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: userId,
          toUserId: matchId,
          message: 'Hi! I found your profile through AI matching and would love to connect!'
        })
      });

      if (response.ok) {
        // Update UI to show connection sent
        setMatches(prev => prev.map(match => 
          match.id === matchId 
            ? { ...match, connectionRequested: true }
            : match
        ));
      }
    } catch (err) {
      console.error('Error sending connection request:', err);
    } finally {
      setConnecting(prev => {
        const newSet = new Set(prev);
        newSet.delete(matchId);
        return newSet;
      });
    }
  };

  const handleMessage = (matchId: string) => {
    // Navigate to messaging or open chat modal
    window.location.href = `/messages/new?userId=${matchId}`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Smart Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Finding your perfect matches...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && matches.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Smart Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-red-600 mb-4">Failed to load matches</p>
            <Button onClick={fetchSmartMatches} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Smart Matches
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matches.map((match) => {
            const matchInfo = getMatchTypeInfo(match.matchType);
            const isConnecting = connecting.has(match.id);
            
            return (
              <div 
                key={match.id}
                className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={match.avatar} alt={match.name} />
                      <AvatarFallback>
                        {match.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {match.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{match.name}</h4>
                      <Badge className={`text-xs flex items-center gap-1 ${matchInfo.color}`}>
                        {matchInfo.icon}
                        {matchInfo.label}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2">{match.bio}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
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
                        <Badge key={index} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Earnings Potential */}
                    {match.estimatedEarningsPotential && (
                      <div className="text-xs text-green-600 font-medium mb-3">
                        Estimated collaboration potential: ${match.estimatedEarningsPotential}/week
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleConnect(match.id)}
                        disabled={isConnecting}
                        className="text-xs"
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            Connecting...
                          </>
                        ) : (
                          'Connect'
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMessage(match.id)}
                        className="text-xs"
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Message
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {matches.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No matches found at the moment.</p>
              <p className="text-sm">Check back later for new recommendations!</p>
            </div>
          )}
          
          {/* Refresh Button */}
          <div className="pt-4 border-t">
            <Button 
              onClick={fetchSmartMatches}
              variant="ghost" 
              size="sm"
              className="w-full"
            >
              Find More Matches
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartMatchingWidget;
