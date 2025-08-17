import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Trophy, 
  Target, 
  Users, 
  DollarSign, 
  Calendar,
  Clock,
  Star,
  Award,
  Crown,
  TrendingUp,
  Zap,
  Gift,
  CheckCircle,
  XCircle,
  PlayCircle,
  Medal,
  Flame,
  Timer,
  Plus
} from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'referral' | 'earnings' | 'tasks' | 'social' | 'streak';
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'upcoming' | 'active' | 'completed' | 'expired';
  startDate: Date;
  endDate: Date;
  participants: number;
  maxParticipants?: number;
  requirements: {
    target: number;
    metric: string;
    timeframe: string;
  };
  rewards: {
    first: { amount: number; badge?: string; title?: string };
    second?: { amount: number; badge?: string; title?: string };
    third?: { amount: number; badge?: string; title?: string };
    participation?: { amount: number; badge?: string };
  };
  leaderboard: Array<{
    rank: number;
    userId: string;
    userName: string;
    progress: number;
    score: number;
  }>;
  isParticipating: boolean;
  userProgress?: {
    current: number;
    percentage: number;
    rank?: number;
  };
}

const CommunityChallenges: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'completed'>('active');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockChallenges: Challenge[] = [
      {
        id: '1',
        title: 'Referral Sprint Challenge',
        description: 'Get 50 new referrals in 7 days and win amazing prizes! Perfect for building your network quickly.',
        type: 'referral',
        difficulty: 'medium',
        status: 'active',
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-01-27'),
        participants: 234,
        maxParticipants: 500,
        requirements: {
          target: 50,
          metric: 'referrals',
          timeframe: '7 days'
        },
        rewards: {
          first: { amount: 500, badge: 'Sprint Champion', title: 'Referral Master' },
          second: { amount: 250, badge: 'Silver Sprinter' },
          third: { amount: 100, badge: 'Bronze Runner' },
          participation: { amount: 25, badge: 'Sprint Participant' }
        },
        leaderboard: [
          { rank: 1, userId: 'user1', userName: 'Alex Chen', progress: 42, score: 84 },
          { rank: 2, userId: 'user2', userName: 'Sarah Kim', progress: 38, score: 76 },
          { rank: 3, userId: 'user3', userName: 'Mike Johnson', progress: 35, score: 70 },
          { rank: 4, userId: 'current', userName: user?.fullName || 'You', progress: 28, score: 56 },
          { rank: 5, userId: 'user4', userName: 'Emma Davis', progress: 25, score: 50 }
        ],
        isParticipating: true,
        userProgress: {
          current: 28,
          percentage: 56,
          rank: 4
        }
      },
      {
        id: '2',
        title: 'Earnings Milestone Challenge',
        description: 'Reach $1,000 in total earnings this month. Show your earning power!',
        type: 'earnings',
        difficulty: 'hard',
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        participants: 89,
        requirements: {
          target: 1000,
          metric: 'dollars earned',
          timeframe: '30 days'
        },
        rewards: {
          first: { amount: 1000, badge: 'Earning Legend', title: 'High Earner' },
          second: { amount: 500, badge: 'Money Maker' },
          third: { amount: 250, badge: 'Profit Pro' },
          participation: { amount: 50 }
        },
        leaderboard: [
          { rank: 1, userId: 'user1', userName: 'Jordan Lee', progress: 850, score: 85 },
          { rank: 2, userId: 'user2', userName: 'Taylor Swift', progress: 720, score: 72 },
          { rank: 3, userId: 'user3', userName: 'Chris Brown', progress: 650, score: 65 }
        ],
        isParticipating: false
      },
      {
        id: '3',
        title: 'Daily Streak Master',
        description: 'Complete daily tasks for 30 consecutive days. Consistency is key!',
        type: 'streak',
        difficulty: 'easy',
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        participants: 156,
        requirements: {
          target: 30,
          metric: 'consecutive days',
          timeframe: '30 days'
        },
        rewards: {
          first: { amount: 200, badge: 'Streak Legend', title: 'Consistency King' },
          participation: { amount: 75, badge: 'Streak Warrior' }
        },
        leaderboard: [
          { rank: 1, userId: 'current', userName: user?.fullName || 'You', progress: 18, score: 60 },
          { rank: 2, userId: 'user1', userName: 'Lisa Wang', progress: 17, score: 57 },
          { rank: 3, userId: 'user2', userName: 'David Park', progress: 16, score: 53 }
        ],
        isParticipating: true,
        userProgress: {
          current: 18,
          percentage: 60,
          rank: 1
        }
      },
      {
        id: '4',
        title: 'Social Media Boost',
        description: 'Share your referral link on 3 different social platforms and get 25 clicks.',
        type: 'social',
        difficulty: 'easy',
        status: 'upcoming',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-07'),
        participants: 0,
        maxParticipants: 200,
        requirements: {
          target: 25,
          metric: 'link clicks',
          timeframe: '7 days'
        },
        rewards: {
          first: { amount: 150, badge: 'Social Influencer' },
          participation: { amount: 30 }
        },
        leaderboard: [],
        isParticipating: false
      }
    ];

    setTimeout(() => {
      setChallenges(mockChallenges);
      setIsLoading(false);
    }, 1000);
  }, [user]);

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20';

  const buttonClass = theme === 'professional'
    ? 'bg-cyan-600 hover:bg-cyan-700'
    : 'bg-purple-600 hover:bg-purple-700';

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'referral': return Users;
      case 'earnings': return DollarSign;
      case 'tasks': return Target;
      case 'social': return Star;
      case 'streak': return Flame;
      default: return Trophy;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'upcoming': return 'text-blue-400';
      case 'completed': return 'text-purple-400';
      case 'expired': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const handleJoinChallenge = (challengeId: string) => {
    setChallenges(prev => prev.map(challenge => 
      challenge.id === challengeId 
        ? { 
            ...challenge, 
            isParticipating: true, 
            participants: challenge.participants + 1,
            userProgress: { current: 0, percentage: 0 }
          }
        : challenge
    ));
  };

  const filteredChallenges = challenges.filter(challenge => {
    switch (activeTab) {
      case 'active': return challenge.status === 'active';
      case 'upcoming': return challenge.status === 'upcoming';
      case 'completed': return challenge.status === 'completed' || challenge.status === 'expired';
      default: return true;
    }
  });

  const getRemainingTime = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Ending soon';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center">
            <Trophy className="w-8 h-8 mr-3 text-yellow-400" />
            Community Challenges
          </h2>
          <p className="text-white/70 mt-2">
            Compete with others and earn exclusive rewards
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`${cardClass} p-2`}>
        <div className="flex space-x-2">
          {[
            { id: 'active', label: 'Active', icon: PlayCircle },
            { id: 'upcoming', label: 'Upcoming', icon: Clock },
            { id: 'completed', label: 'Completed', icon: CheckCircle }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                  activeTab === tab.id
                    ? theme === 'professional'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-purple-600 text-white'
                    : theme === 'professional'
                      ? 'text-white/70 hover:bg-gray-700/50 hover:text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={`${cardClass} p-6 animate-pulse`}>
              <div className="h-6 bg-gray-600 rounded mb-4"></div>
              <div className="h-4 bg-gray-600 rounded mb-2"></div>
              <div className="h-4 bg-gray-600 rounded w-3/4 mb-4"></div>
              <div className="flex space-x-4">
                <div className="h-8 bg-gray-600 rounded flex-1"></div>
                <div className="h-8 bg-gray-600 rounded flex-1"></div>
              </div>
            </div>
          ))
        ) : (
          filteredChallenges.map(challenge => {
            const TypeIcon = getTypeIcon(challenge.type);
            return (
              <div key={challenge.id} className={`${cardClass} p-6 hover:scale-105 transition-all duration-200`}>
                {/* Challenge Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-3 rounded-lg ${
                      theme === 'professional' ? 'bg-gray-700/50' : 'bg-white/10'
                    }`}>
                      <TypeIcon className={`w-6 h-6 ${
                        challenge.type === 'referral' ? 'text-blue-400' :
                        challenge.type === 'earnings' ? 'text-green-400' :
                        challenge.type === 'streak' ? 'text-orange-400' :
                        challenge.type === 'social' ? 'text-purple-400' :
                        'text-yellow-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{challenge.title}</h3>
                      <div className="flex items-center space-x-3">
                        <span className={`text-sm capitalize ${getStatusColor(challenge.status)}`}>
                          {challenge.status}
                        </span>
                        <span className={`text-sm capitalize ${getDifficultyColor(challenge.difficulty)}`}>
                          {challenge.difficulty}
                        </span>
                        {challenge.status === 'active' && (
                          <div className="flex items-center space-x-1 text-orange-400">
                            <Timer className="w-3 h-3" />
                            <span className="text-xs">{getRemainingTime(challenge.endDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {challenge.isParticipating && (
                    <div className="flex items-center space-x-1 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs">Joined</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-white/80 text-sm mb-4 leading-relaxed">
                  {challenge.description}
                </p>

                {/* Requirements */}
                <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4 mb-4`}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-center">
                      <div className="text-white font-bold text-lg">{challenge.requirements.target}</div>
                      <div className="text-white/60">{challenge.requirements.metric}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-bold">{challenge.participants}</div>
                      <div className="text-white/60">participants</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-300 font-bold">${challenge.rewards.first.amount}</div>
                      <div className="text-white/60">1st prize</div>
                    </div>
                  </div>
                </div>

                {/* User Progress (if participating) */}
                {challenge.isParticipating && challenge.userProgress && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/70 text-sm">Your Progress</span>
                      <div className="flex items-center space-x-2">
                        {challenge.userProgress.rank && (
                          <span className="text-yellow-400 text-sm">
                            #{challenge.userProgress.rank}
                          </span>
                        )}
                        <span className="text-white text-sm">
                          {challenge.userProgress.current} / {challenge.requirements.target}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(challenge.userProgress.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Rewards */}
                <div className="mb-4">
                  <h4 className="text-white/70 text-sm mb-2">Rewards</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 text-sm">${challenge.rewards.first.amount}</span>
                    </div>
                    {challenge.rewards.second && (
                      <div className="flex items-center space-x-1">
                        <Medal className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm">${challenge.rewards.second.amount}</span>
                      </div>
                    )}
                    {challenge.rewards.third && (
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4 text-orange-400" />
                        <span className="text-orange-400 text-sm">${challenge.rewards.third.amount}</span>
                      </div>
                    )}
                    {challenge.rewards.participation && (
                      <div className="flex items-center space-x-1">
                        <Gift className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 text-sm">${challenge.rewards.participation.amount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedChallenge(challenge)}
                    className={`flex-1 ${theme === 'professional' ? 'bg-gray-700/50 hover:bg-gray-600/60' : 'bg-white/10 hover:bg-white/20'} text-white py-2 rounded-lg transition-all duration-200 text-sm border ${theme === 'professional' ? 'border-gray-600/50' : 'border-white/20'}`}
                  >
                    View Details
                  </button>
                  {!challenge.isParticipating && challenge.status !== 'completed' && challenge.status !== 'expired' && (
                    <button
                      onClick={() => handleJoinChallenge(challenge.id)}
                      className={`flex-1 ${buttonClass} text-white py-2 rounded-lg transition-all duration-200 text-sm`}
                    >
                      {challenge.status === 'upcoming' ? 'Join Challenge' : 'Join Now'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Challenge Details Modal */}
      {selectedChallenge && (
        <ChallengeDetailsModal
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
          onJoin={() => {
            handleJoinChallenge(selectedChallenge.id);
            setSelectedChallenge(null);
          }}
        />
      )}
    </div>
  );
};

// Challenge Details Modal Component
interface ChallengeDetailsModalProps {
  challenge: Challenge;
  onClose: () => void;
  onJoin: () => void;
}

const ChallengeDetailsModal: React.FC<ChallengeDetailsModalProps> = ({ challenge, onClose, onJoin }) => {
  const { theme } = useTheme();

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/90 backdrop-blur-lg rounded-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20';

  const TypeIcon = challenge.type === 'referral' ? Users :
                  challenge.type === 'earnings' ? DollarSign :
                  challenge.type === 'streak' ? Flame :
                  challenge.type === 'social' ? Star : Target;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`${cardClass} p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-start space-x-4">
            <div className={`p-4 rounded-lg ${
              theme === 'professional' ? 'bg-gray-700/50' : 'bg-white/10'
            }`}>
              <TypeIcon className={`w-8 h-8 ${
                challenge.type === 'referral' ? 'text-blue-400' :
                challenge.type === 'earnings' ? 'text-green-400' :
                challenge.type === 'streak' ? 'text-orange-400' :
                challenge.type === 'social' ? 'text-purple-400' :
                'text-yellow-400'
              }`} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{challenge.title}</h3>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-xs ${
                  challenge.status === 'active' ? 'bg-green-500/20 text-green-300' :
                  challenge.status === 'upcoming' ? 'bg-blue-500/20 text-blue-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>
                  {challenge.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs ${
                  challenge.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' :
                  challenge.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {challenge.difficulty}
                </span>
                <span className="text-white/60 text-sm">
                  {challenge.startDate.toLocaleDateString()} - {challenge.endDate.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h4 className="text-white font-medium mb-3">Challenge Description</h4>
              <p className="text-white/80 leading-relaxed">{challenge.description}</p>
            </div>

            {/* Requirements */}
            <div>
              <h4 className="text-white font-medium mb-3">Requirements</h4>
              <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4`}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">{challenge.requirements.target}</div>
                  <div className="text-white/70">{challenge.requirements.metric}</div>
                  <div className="text-white/50 text-sm mt-1">in {challenge.requirements.timeframe}</div>
                </div>
              </div>
            </div>

            {/* Rewards */}
            <div>
              <h4 className="text-white font-medium mb-3">Rewards</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                  <div className="flex items-center space-x-3">
                    <Crown className="w-5 h-5 text-yellow-400" />
                    <div>
                      <div className="text-white font-medium">1st Place</div>
                      {challenge.rewards.first.badge && (
                        <div className="text-yellow-400 text-sm">{challenge.rewards.first.badge}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-yellow-400 font-bold">${challenge.rewards.first.amount}</div>
                </div>

                {challenge.rewards.second && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-500/10 border border-gray-500/20">
                    <div className="flex items-center space-x-3">
                      <Medal className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-white font-medium">2nd Place</div>
                        {challenge.rewards.second.badge && (
                          <div className="text-gray-400 text-sm">{challenge.rewards.second.badge}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-400 font-bold">${challenge.rewards.second.amount}</div>
                  </div>
                )}

                {challenge.rewards.third && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="flex items-center space-x-3">
                      <Award className="w-5 h-5 text-orange-400" />
                      <div>
                        <div className="text-white font-medium">3rd Place</div>
                        {challenge.rewards.third.badge && (
                          <div className="text-orange-400 text-sm">{challenge.rewards.third.badge}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-orange-400 font-bold">${challenge.rewards.third.amount}</div>
                  </div>
                )}

                {challenge.rewards.participation && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center space-x-3">
                      <Gift className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-white font-medium">Participation</div>
                        {challenge.rewards.participation.badge && (
                          <div className="text-blue-400 text-sm">{challenge.rewards.participation.badge}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-blue-400 font-bold">${challenge.rewards.participation.amount}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Leaderboard */}
          <div>
            <h4 className="text-white font-medium mb-3">Current Leaderboard</h4>
            {challenge.leaderboard.length > 0 ? (
              <div className="space-y-2">
                {challenge.leaderboard.slice(0, 10).map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      entry.userId === 'current' 
                        ? theme === 'professional'
                          ? 'bg-cyan-500/20 border border-cyan-500/30'
                          : 'bg-purple-500/20 border border-purple-500/30'
                        : theme === 'professional'
                          ? 'bg-gray-700/30'
                          : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        entry.rank === 1 ? 'bg-yellow-500 text-black' :
                        entry.rank === 2 ? 'bg-gray-400 text-black' :
                        entry.rank === 3 ? 'bg-orange-500 text-black' :
                        theme === 'professional' ? 'bg-gray-600 text-white' : 'bg-white/20 text-white'
                      }`}>
                        {entry.rank}
                      </div>
                      <div>
                        <div className="text-white font-medium">{entry.userName}</div>
                        <div className="text-white/60 text-sm">{entry.progress} / {challenge.requirements.target}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{entry.progress}</div>
                      <div className="text-white/60 text-sm">{entry.score}%</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/60">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No participants yet. Be the first to join!</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4 mt-8">
          <button
            onClick={onClose}
            className={`flex-1 ${theme === 'professional' ? 'bg-gray-700/50 hover:bg-gray-600/60' : 'bg-white/10 hover:bg-white/20'} text-white py-3 rounded-lg transition-all duration-200 border ${theme === 'professional' ? 'border-gray-600/50' : 'border-white/20'}`}
          >
            Close
          </button>
          {!challenge.isParticipating && challenge.status !== 'completed' && challenge.status !== 'expired' && (
            <button
              onClick={onJoin}
              className={`flex-1 ${theme === 'professional' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-purple-600 hover:bg-purple-700'} text-white py-3 rounded-lg transition-all duration-200`}
            >
              Join Challenge
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityChallenges;
