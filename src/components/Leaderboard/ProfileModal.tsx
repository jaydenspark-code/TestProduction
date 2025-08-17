import React, { useState, useEffect } from 'react';
import { UserProfileData } from '../../types/userProfile';
import { X, Crown, Medal, Award, Trophy, Users, TrendingUp, Star, Calendar, MapPin, CheckCircle, Shield, Activity, BarChart3 } from 'lucide-react';
import { formatDualCurrencySync } from '../../utils/currency';

interface ProfileModalProps {
    userId: string;
    username?: string;
    fullName: string;
    currentRank: number;
    points: number;
    isAgent: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ 
    userId, 
    username, 
    fullName, 
    currentRank, 
    points, 
    isAgent, 
    onClose 
}) => {
    const [profileData, setProfileData] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'network' | 'achievements' | 'history'>('overview');

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true);
            try {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Mock profile data - in real app, fetch from userProfileService
                const fetchedData: UserProfileData = {
                    id: userId,
                    username: username || `User${Math.floor(Math.random() * 1000)}`,
                    fullName,
                    profileImage: null,
                    country: ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP', 'BR', 'IN'][Math.floor(Math.random() * 9)],
                    isVerified: Math.random() > 0.3,
                    isAgent,
                    memberSince: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
                    currentRank,
                    currentPoints: points,
                    rankCategory: isAgent ? 'agent' : 'regular',
                    privacySettings: {
                        id: '123',
                        userId,
                        showPublicProfile: Math.random() > 0.1, // 90% public
                        showNetworkOverview: Math.random() > 0.3, // 70% show network
                        showAchievements: Math.random() > 0.2, // 80% show achievements
                        showRankHistory: Math.random() > 0.4, // 60% show history
                        showActivity: Math.random() > 0.6, // 40% show activity
                        createdAt: '2023-01-01',
                        updatedAt: '2023-01-01',
                    },
                    achievements: [
                        {
                            id: '1',
                            userId,
                            achievementType: 'milestone',
                            achievementName: 'First Steps',
                            achievementDescription: 'Completed your first task',
                            achievementIcon: 'trophy',
                            achievementLevel: 'bronze',
                            pointsEarned: 100,
                            earnedAt: new Date().toISOString()
                        },
                        {
                            id: '2',
                            userId,
                            achievementType: 'streak',
                            achievementName: 'Consistency King',
                            achievementDescription: 'Maintained a 7-day streak',
                            achievementIcon: 'star',
                            achievementLevel: 'silver',
                            pointsEarned: 250,
                            earnedAt: new Date().toISOString()
                        }
                    ],
                    recentActivity: [
                        {
                            id: '1',
                            userId,
                            activityType: 'task_completed',
                            activityDescription: 'Completed survey task',
                            pointsEarned: 50,
                            metadata: {},
                            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
                        },
                        {
                            id: '2',
                            userId,
                            activityType: 'referral_earned',
                            activityDescription: 'Earned referral bonus',
                            pointsEarned: 100,
                            metadata: {},
                            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                        }
                    ],
                    rankHistory: Array.from({ length: 7 }, (_, i) => ({
                        id: `hist-${i}`,
                        userId,
                        rankCategory: isAgent ? 'agent' : 'regular',
                        rankPosition: currentRank + Math.floor(Math.random() * 10) - 5,
                        points: points + Math.floor(Math.random() * 1000) - 500,
                        recordedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
                    })),
                    networkStats: {
                        totalReferrals: Math.floor(Math.random() * 50) + 5,
                        activeReferrals: Math.floor(Math.random() * 20) + 2,
                        networkDepth: Math.floor(Math.random() * 5) + 1,
                        networkValue: Math.floor(Math.random() * 10000) + 1000,
                        totalEarningsFromNetwork: Math.floor(Math.random() * 5000) + 500,
                        monthlyGrowth: Math.floor(Math.random() * 50) + 5,
                    },
                    totalEarnings: Math.floor(Math.random() * 20000) + 5000,
                    completedTasks: Math.floor(Math.random() * 200) + 20,
                    successRate: Math.floor(Math.random() * 30) + 70,
                };

                setProfileData(fetchedData);
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [userId, username, fullName, currentRank, points, isAgent]);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Crown className="w-5 h-5 text-yellow-400" />;
            case 2: return <Medal className="w-5 h-5 text-gray-400" />;
            case 3: return <Award className="w-5 h-5 text-amber-600" />;
            default: return <Trophy className="w-5 h-5 text-blue-400" />;
        }
    };

    const getAchievementIcon = (level: string) => {
        const baseClass = "w-6 h-6";
        switch (level) {
            case 'diamond': return <Crown className={`${baseClass} text-cyan-400`} />;
            case 'platinum': return <Star className={`${baseClass} text-gray-300`} />;
            case 'gold': return <Trophy className={`${baseClass} text-yellow-400`} />;
            case 'silver': return <Medal className={`${baseClass} text-gray-400`} />;
            case 'bronze': return <Award className={`${baseClass} text-amber-600`} />;
            default: return <Trophy className={`${baseClass} text-blue-400`} />;
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const diff = Date.now() - new Date(dateString).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return 'Just now';
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0F1520] border border-[#1E2433] rounded-2xl p-8 max-w-2xl w-full mx-4">
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B5CF6]"></div>
                        <span className="ml-3 text-gray-400">Loading profile...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!profileData || !profileData.privacySettings.showPublicProfile) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0F1520] border border-[#1E2433] rounded-2xl p-8 max-w-md w-full mx-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Profile Unavailable</h2>
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex flex-col items-center py-8 space-y-4">
                        <Shield className="w-12 h-12 text-gray-600" />
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-300 mb-2">Profile is Private</h3>
                            <p className="text-gray-500">This user has chosen to keep their profile private.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const accentColor = isAgent ? 'text-[#00FFB0]' : 'text-[#8B5CF6]';
    const accentBg = isAgent ? 'bg-[#00FFB0]' : 'bg-[#8B5CF6]';
    const accentBorder = isAgent ? 'border-[#00FFB0]' : 'border-[#8B5CF6]';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0F1520] border border-[#1E2433] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[#1E2433]">
                    <div className="flex items-center space-x-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isAgent ? 'bg-gradient-to-br from-[#00FFB0]/20 to-[#00FFB0]/10 border border-[#00FFB0]/30' : 'bg-gradient-to-br from-[#8B5CF6]/20 to-[#8B5CF6]/10 border border-[#8B5CF6]/30'}`}>
                            <span className={`text-2xl font-bold ${accentColor}`}>
                                {profileData.fullName[0]}
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h2 className={`text-2xl font-bold ${accentColor}`}>{profileData.fullName}</h2>
                                {profileData.isVerified && <CheckCircle className="w-5 h-5 text-blue-400" />}
                            </div>
                            <div className="flex items-center space-x-4 text-gray-400">
                                <span>@{profileData.username}</span>
                                {profileData.country && (
                                    <div className="flex items-center space-x-1">
                                        <MapPin className="w-4 h-4" />
                                        <span>{profileData.country}</span>
                                    </div>
                                )}
                                <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Since {new Date(profileData.memberSince).getFullYear()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4 p-6 border-b border-[#1E2433]">
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                            {getRankIcon(profileData.currentRank)}
                            <span className={`text-2xl font-bold ${accentColor}`}>#{profileData.currentRank}</span>
                        </div>
                        <p className="text-gray-400 text-sm">Current Rank</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-2xl font-bold ${accentColor}`}>{profileData.currentPoints.toLocaleString()}</p>
                        <p className="text-gray-400 text-sm">Total Points</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-2xl font-bold ${accentColor}`}>{formatDualCurrencySync(profileData.totalEarnings)}</p>
                        <p className="text-gray-400 text-sm">Total Earnings</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-2xl font-bold ${accentColor}`}>{profileData.successRate}%</p>
                        <p className="text-gray-400 text-sm">Success Rate</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#1E2433]">
                    {[
                        { id: 'overview', label: 'Overview', icon: Activity },
                        { id: 'network', label: 'Network', icon: Users, show: profileData.privacySettings.showNetworkOverview },
                        { id: 'achievements', label: 'Achievements', icon: Trophy, show: profileData.privacySettings.showAchievements },
                        { id: 'history', label: 'History', icon: BarChart3, show: profileData.privacySettings.showRankHistory },
                    ].filter(tab => tab.show !== false).map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                                    activeTab === tab.id 
                                        ? `${accentColor} border-b-2 ${accentBorder}` 
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="p-6 max-h-96 overflow-y-auto">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-[#1E2433] rounded-xl p-4">
                                    <h3 className="font-semibold text-white mb-3">Performance Stats</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Completed Tasks</span>
                                            <span className="text-white">{profileData.completedTasks}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Success Rate</span>
                                            <span className="text-white">{profileData.successRate}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Member Since</span>
                                            <span className="text-white">{new Date(profileData.memberSince).getFullYear()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[#1E2433] rounded-xl p-4">
                                    <h3 className="font-semibold text-white mb-3">Quick Info</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Account Type</span>
                                            <span className={`font-medium ${accentColor}`}>
                                                {profileData.isAgent ? 'Agent' : 'Regular User'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Verified</span>
                                            <span className={`${profileData.isVerified ? 'text-green-400' : 'text-gray-400'}`}>
                                                {profileData.isVerified ? 'Yes' : 'No'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Location</span>
                                            <span className="text-white">{profileData.country || 'Not specified'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'network' && profileData.privacySettings.showNetworkOverview && profileData.networkStats && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-[#1E2433] rounded-xl p-4">
                                    <h3 className="font-semibold text-white mb-3">Network Size</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Total Referrals</span>
                                            <span className={`font-bold ${accentColor}`}>{profileData.networkStats.totalReferrals}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Active Referrals</span>
                                            <span className="text-white">{profileData.networkStats.activeReferrals}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Network Depth</span>
                                            <span className="text-white">{profileData.networkStats.networkDepth} levels</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[#1E2433] rounded-xl p-4">
                                    <h3 className="font-semibold text-white mb-3">Network Value</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Network Value</span>
                                            <span className={`font-bold ${accentColor}`}>
                                                {formatDualCurrencySync(profileData.networkStats.networkValue)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Network Earnings</span>
                                            <span className="text-white">
                                                {formatDualCurrencySync(profileData.networkStats.totalEarningsFromNetwork)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Monthly Growth</span>
                                            <span className="text-green-400">+{profileData.networkStats.monthlyGrowth}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'achievements' && profileData.privacySettings.showAchievements && (
                        <div className="space-y-4">
                            {profileData.achievements && profileData.achievements.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {profileData.achievements.map(achievement => (
                                        <div key={achievement.id} className="bg-[#1E2433] rounded-xl p-4 flex items-center space-x-4">
                                            <div className="flex-shrink-0">
                                                {getAchievementIcon(achievement.achievementLevel)}
                                            </div>
                                            <div className="flex-grow">
                                                <h4 className="font-semibold text-white">{achievement.achievementName}</h4>
                                                <p className="text-gray-400 text-sm">{achievement.achievementDescription}</p>
                                                <div className="flex items-center space-x-4 mt-2">
                                                    <span className={`text-xs px-2 py-1 rounded ${accentBg}/20 ${accentColor} border ${accentBorder}/30`}>
                                                        {achievement.achievementLevel.toUpperCase()}
                                                    </span>
                                                    <span className="text-gray-400 text-sm">
                                                        +{achievement.pointsEarned} pts
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-gray-500 text-sm">
                                                {formatTimeAgo(achievement.earnedAt)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                    <p className="text-gray-400">No achievements yet</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && profileData.privacySettings.showRankHistory && (
                        <div className="space-y-4">
                            {profileData.rankHistory && profileData.rankHistory.length > 0 ? (
                                <div className="space-y-2">
                                    {profileData.rankHistory.slice(0, 10).map(record => (
                                        <div key={record.id} className="bg-[#1E2433] rounded-lg p-3 flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-2 h-2 rounded-full ${accentBg}`}></div>
                                                <div>
                                                    <span className="text-white font-medium">Rank #{record.rankPosition}</span>
                                                    <span className="text-gray-400 ml-2">{record.points.toLocaleString()} pts</span>
                                                </div>
                                            </div>
                                            <span className="text-gray-500 text-sm">
                                                {formatTimeAgo(record.recordedAt)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                    <p className="text-gray-400">No rank history available</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
