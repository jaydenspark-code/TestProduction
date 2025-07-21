
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Award, Target, CheckCircle, Clock, Star, Trophy, Crown, Zap } from 'lucide-react';

const AgentMilestones: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('current');

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20';

  const currentMilestones = [
    {
      id: 1,
      title: 'Week 4 Challenge',
      description: 'Reach 300 referrals this week',
      current: 245,
      target: 300,
      reward: '$500 bonus + 12% commission rate',
      deadline: '2024-01-28',
      status: 'in_progress',
      difficulty: 'hard'
    },
    {
      id: 2,
      title: 'Network Growth',
      description: 'Maintain 85% active user rate',
      current: 86.3,
      target: 85,
      reward: 'Elite Agent Badge',
      deadline: '2024-01-31',
      status: 'completed',
      difficulty: 'medium'
    },
    {
      id: 3,
      title: 'Quality Referrals',
      description: 'Achieve 80% conversion rate',
      current: 78.5,
      target: 80,
      reward: '$200 bonus',
      deadline: '2024-01-25',
      status: 'in_progress',
      difficulty: 'medium'
    }
  ];

  const completedMilestones = [
    {
      id: 4,
      title: 'First 100 Referrals',
      description: 'Reach your first 100 referrals',
      completedDate: '2024-01-10',
      reward: '$100 bonus',
      difficulty: 'easy'
    },
    {
      id: 5,
      title: 'Week 1 Champion',
      description: 'Complete Week 1 with 50+ referrals',
      completedDate: '2024-01-07',
      reward: '5% commission rate',
      difficulty: 'easy'
    },
    {
      id: 6,
      title: 'Week 2 Elite',
      description: 'Complete Week 2 with 100+ referrals',
      completedDate: '2024-01-14',
      reward: '7% commission rate',
      difficulty: 'medium'
    },
    {
      id: 7,
      title: 'Week 3 Master',
      description: 'Complete Week 3 with 200+ referrals',
      completedDate: '2024-01-21',
      reward: '10% commission rate',
      difficulty: 'hard'
    }
  ];

  const upcomingMilestones = [
    {
      id: 8,
      title: 'Gold Agent Status',
      description: 'Maintain elite performance for 30 days',
      requirement: 'Complete Week 4 + maintain metrics',
      reward: 'Permanent Gold Status + 15% commission',
      difficulty: 'legendary'
    },
    {
      id: 9,
      title: 'Regional Leader',
      description: 'Top performer in your region',
      requirement: '500+ referrals in a month',
      reward: '$1000 bonus + Regional Leader Badge',
      difficulty: 'legendary'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-300 bg-green-500/20';
      case 'medium': return 'text-yellow-300 bg-yellow-500/20';
      case 'hard': return 'text-orange-300 bg-orange-500/20';
      case 'legendary': return 'text-purple-300 bg-purple-500/20';
      default: return 'text-white/60 bg-white/10';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <Star className="w-4 h-4" />;
      case 'medium': return <Target className="w-4 h-4" />;
      case 'hard': return <Trophy className="w-4 h-4" />;
      case 'legendary': return <Crown className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-yellow-400" />;
      default: return <Target className="w-5 h-5 text-blue-400" />;
    }
  };

  const tabs = [
    { id: 'current', label: 'Current', count: currentMilestones.length },
    { id: 'completed', label: 'Completed', count: completedMilestones.length },
    { id: 'upcoming', label: 'Upcoming', count: upcomingMilestones.length }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center">
          <Award className="w-8 h-8 mr-3 text-yellow-400" />
          Agent Milestones
        </h3>
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-300 font-medium">Elite Status Active</span>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${cardClass} p-6 text-center`}>
          <div className="text-3xl font-bold text-green-300 mb-2">7</div>
          <div className="text-white/70 text-sm">Completed Milestones</div>
          <div className="text-green-300 text-xs">+3 this week</div>
        </div>
        
        <div className={`${cardClass} p-6 text-center`}>
          <div className="text-3xl font-bold text-yellow-300 mb-2">3</div>
          <div className="text-white/70 text-sm">In Progress</div>
          <div className="text-yellow-300 text-xs">2 due this week</div>
        </div>
        
        <div className={`${cardClass} p-6 text-center`}>
          <div className="text-3xl font-bold text-purple-300 mb-2">2</div>
          <div className="text-white/70 text-sm">Legendary Awaiting</div>
          <div className="text-purple-300 text-xs">Elite tier rewards</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`${cardClass}`}>
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-center transition-all duration-200 ${
                activeTab === tab.id
                  ? theme === 'professional'
                    ? 'bg-gray-700/50 text-white border-b-2 border-cyan-400'
                    : 'bg-white/10 text-white border-b-2 border-purple-400'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="font-medium">{tab.label}</div>
              <div className="text-sm text-white/60">({tab.count})</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'current' && (
          <div className="space-y-6">
            {currentMilestones.map((milestone) => (
              <div key={milestone.id} className={`${cardClass} p-6`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(milestone.status)}
                    <div>
                      <h4 className="text-white font-bold text-lg">{milestone.title}</h4>
                      <p className="text-white/70">{milestone.description}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getDifficultyColor(milestone.difficulty)}`}>
                    {getDifficultyIcon(milestone.difficulty)}
                    <span className="capitalize">{milestone.difficulty}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/70">Progress</span>
                    <span className="text-white font-medium">
                      {milestone.current} / {milestone.target}
                      {milestone.title.includes('rate') ? '%' : ''}
                    </span>
                  </div>
                  <div className={`w-full ${theme === 'professional' ? 'bg-gray-700/50' : 'bg-white/10'} rounded-full h-3`}>
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        milestone.status === 'completed' ? 'bg-green-500' : 
                        theme === 'professional' ? 'bg-cyan-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${Math.min((milestone.current / milestone.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-green-300 font-medium">🎁 {milestone.reward}</span>
                  </div>
                  <div className="text-white/60 text-sm">
                    Due: {new Date(milestone.deadline).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="space-y-6">
            {completedMilestones.map((milestone) => (
              <div key={milestone.id} className={`${cardClass} p-6 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -mr-8 -mt-8"></div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <div>
                      <h4 className="text-white font-bold text-lg">{milestone.title}</h4>
                      <p className="text-white/70">{milestone.description}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getDifficultyColor(milestone.difficulty)}`}>
                    {getDifficultyIcon(milestone.difficulty)}
                    <span className="capitalize">{milestone.difficulty}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-green-300 font-medium">✅ {milestone.reward}</span>
                  </div>
                  <div className="text-green-300 text-sm">
                    Completed: {new Date(milestone.completedDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="space-y-6">
            {upcomingMilestones.map((milestone) => (
              <div key={milestone.id} className={`${cardClass} p-6 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -mr-8 -mt-8"></div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Target className="w-6 h-6 text-purple-400" />
                    <div>
                      <h4 className="text-white font-bold text-lg">{milestone.title}</h4>
                      <p className="text-white/70">{milestone.description}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getDifficultyColor(milestone.difficulty)}`}>
                    {getDifficultyIcon(milestone.difficulty)}
                    <span className="capitalize">{milestone.difficulty}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-white/70 text-sm mb-2">Requirement:</div>
                  <div className="text-white">{milestone.requirement}</div>
                </div>

                <div>
                  <span className="text-purple-300 font-medium">🏆 {milestone.reward}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentMilestones;
