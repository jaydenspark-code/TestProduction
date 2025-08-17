import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Star, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Heart,
  MessageCircle,
  Share2,
  Plus,
  X,
  Camera,
  Upload,
  CheckCircle,
  Award,
  Crown,
  Trophy
} from 'lucide-react';

interface SuccessStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  content: string;
  category: 'earnings' | 'referrals' | 'growth' | 'milestone' | 'achievement';
  metrics: {
    earnings?: number;
    referrals?: number;
    timeframe?: string;
  };
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  isVerified: boolean;
  createdAt: Date;
  tags: string[];
}

const SuccessStories: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set());

  // Mock data for demonstration
  useEffect(() => {
    const mockStories: SuccessStory[] = [
      {
        id: '1',
        userId: 'user1',
        userName: 'Sarah Johnson',
        userAvatar: undefined,
        title: 'From $0 to $5,000 in 3 Months!',
        content: 'I started with EarnPro as a complete beginner. Through consistent daily tasks and building my referral network, I\'ve managed to earn over $5,000 in just 3 months! The key was focusing on quality referrals and staying active in the community.',
        category: 'earnings',
        metrics: {
          earnings: 5000,
          referrals: 150,
          timeframe: '3 months'
        },
        likes: 127,
        comments: 23,
        shares: 15,
        isVerified: true,
        createdAt: new Date('2024-01-15'),
        tags: ['newbie-success', 'referral-master', 'consistent-growth']
      },
      {
        id: '2',
        userId: 'user2',
        userName: 'Mike Chen',
        userAvatar: undefined,
        title: 'Built a Network of 500+ Active Referrals',
        content: 'My strategy was simple: help others succeed first. I created tutorial videos, shared tips in social media groups, and always responded to questions from my referrals. Now I have 500+ active members in my network!',
        category: 'referrals',
        metrics: {
          referrals: 500,
          timeframe: '6 months'
        },
        likes: 89,
        comments: 31,
        shares: 22,
        isVerified: true,
        createdAt: new Date('2024-01-10'),
        tags: ['network-building', 'community-helper', 'mentor']
      },
      {
        id: '3',
        userId: 'user3',
        userName: 'Emma Rodriguez',
        userAvatar: undefined,
        title: 'Achieved Gold Agent Status in Record Time',
        content: 'I reached Gold Agent status in just 2 months by focusing on high-quality referrals and maintaining excellent conversion rates. The secret is understanding your audience and providing real value.',
        category: 'achievement',
        metrics: {
          timeframe: '2 months'
        },
        likes: 156,
        comments: 18,
        shares: 28,
        isVerified: true,
        createdAt: new Date('2024-01-08'),
        tags: ['gold-agent', 'fast-growth', 'conversion-expert']
      }
    ];

    setTimeout(() => {
      setStories(mockStories);
      setIsLoading(false);
    }, 1000);
  }, []);

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20';

  const buttonClass = theme === 'professional'
    ? 'bg-cyan-600 hover:bg-cyan-700'
    : 'bg-purple-600 hover:bg-purple-700';

  const categories = [
    { id: 'all', label: 'All Stories', icon: Star },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'referrals', label: 'Referrals', icon: Users },
    { id: 'growth', label: 'Growth', icon: TrendingUp },
    { id: 'achievement', label: 'Achievements', icon: Award }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'earnings': return DollarSign;
      case 'referrals': return Users;
      case 'growth': return TrendingUp;
      case 'achievement': return Award;
      case 'milestone': return Trophy;
      default: return Star;
    }
  };

  const handleLike = (storyId: string) => {
    setLikedStories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });

    setStories(prev => prev.map(story => 
      story.id === storyId 
        ? { ...story, likes: likedStories.has(storyId) ? story.likes - 1 : story.likes + 1 }
        : story
    ));
  };

  const filteredStories = selectedCategory === 'all' 
    ? stories 
    : stories.filter(story => story.category === selectedCategory);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center">
            <Star className="w-8 h-8 mr-3 text-yellow-400" />
            Success Stories
          </h2>
          <p className="text-white/70 mt-2">
            Get inspired by our community's amazing achievements
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className={`${buttonClass} text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2`}
        >
          <Plus className="w-5 h-5" />
          <span>Share Your Story</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className={`${cardClass} p-6`}>
        <div className="flex flex-wrap gap-3">
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                  selectedCategory === category.id
                    ? theme === 'professional'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-purple-600 text-white'
                    : theme === 'professional'
                      ? 'bg-gray-700/50 text-white/70 hover:bg-gray-600/60 hover:text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={`${cardClass} p-6 animate-pulse`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-6 bg-gray-600 rounded"></div>
                <div className="h-4 bg-gray-600 rounded"></div>
                <div className="h-4 bg-gray-600 rounded w-3/4"></div>
              </div>
            </div>
          ))
        ) : (
          filteredStories.map(story => {
            const CategoryIcon = getCategoryIcon(story.category);
            return (
              <div key={story.id} className={`${cardClass} p-6 hover:scale-105 transition-all duration-200`}>
                {/* Story Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {story.userName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-white font-medium">{story.userName}</h4>
                        {story.isVerified && <CheckCircle className="w-4 h-4 text-green-400" />}
                      </div>
                      <p className="text-white/60 text-sm">
                        {story.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg ${
                    theme === 'professional' ? 'bg-gray-700/50' : 'bg-white/10'
                  }`}>
                    <CategoryIcon className={`w-5 h-5 ${
                      story.category === 'earnings' ? 'text-green-400' :
                      story.category === 'referrals' ? 'text-blue-400' :
                      story.category === 'achievement' ? 'text-yellow-400' :
                      'text-purple-400'
                    }`} />
                  </div>
                </div>

                {/* Story Content */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-3">{story.title}</h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {story.content}
                  </p>
                </div>

                {/* Metrics */}
                {story.metrics && (
                  <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4 mb-4`}>
                    <div className="flex items-center justify-between text-sm">
                      {story.metrics.earnings && (
                        <div className="text-center">
                          <div className="text-green-300 font-bold">${story.metrics.earnings.toLocaleString()}</div>
                          <div className="text-white/60">Earnings</div>
                        </div>
                      )}
                      {story.metrics.referrals && (
                        <div className="text-center">
                          <div className="text-blue-300 font-bold">{story.metrics.referrals}</div>
                          <div className="text-white/60">Referrals</div>
                        </div>
                      )}
                      {story.metrics.timeframe && (
                        <div className="text-center">
                          <div className="text-purple-300 font-bold">{story.metrics.timeframe}</div>
                          <div className="text-white/60">Timeframe</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {story.tags.map(tag => (
                    <span
                      key={tag}
                      className={`px-3 py-1 rounded-full text-xs ${
                        theme === 'professional'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-purple-500/20 text-purple-300'
                      }`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(story.id)}
                      className={`flex items-center space-x-2 transition-colors ${
                        likedStories.has(story.id) 
                          ? 'text-red-400' 
                          : 'text-white/60 hover:text-red-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${likedStories.has(story.id) ? 'fill-current' : ''}`} />
                      <span className="text-sm">{story.likes}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">{story.comments}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm">{story.shares}</span>
                    </button>
                  </div>
                  <span className="text-white/40 text-xs capitalize">{story.category}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Story Modal */}
      {showCreateForm && (
        <CreateStoryModal
          onClose={() => setShowCreateForm(false)}
          onSubmit={(storyData) => {
            // Add new story to the list
            const newStory: SuccessStory = {
              id: Date.now().toString(),
              userId: user?.id || 'current-user',
              userName: user?.fullName || 'Anonymous',
              ...storyData,
              likes: 0,
              comments: 0,
              shares: 0,
              isVerified: false,
              createdAt: new Date()
            };
            setStories(prev => [newStory, ...prev]);
            setShowCreateForm(false);
          }}
        />
      )}
    </div>
  );
};

// Create Story Modal Component
interface CreateStoryModalProps {
  onClose: () => void;
  onSubmit: (storyData: Partial<SuccessStory>) => void;
}

const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ onClose, onSubmit }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'earnings' as SuccessStory['category'],
    metrics: {
      earnings: '',
      referrals: '',
      timeframe: ''
    },
    tags: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const storyData = {
      title: formData.title,
      content: formData.content,
      category: formData.category,
      metrics: {
        earnings: formData.metrics.earnings ? parseFloat(formData.metrics.earnings) : undefined,
        referrals: formData.metrics.referrals ? parseInt(formData.metrics.referrals) : undefined,
        timeframe: formData.metrics.timeframe || undefined
      },
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    };

    onSubmit(storyData);
  };

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/90 backdrop-blur-lg rounded-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20';

  const inputClass = theme === 'professional'
    ? 'w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500'
    : 'w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`${cardClass} p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Share Your Success Story</h3>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Story Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={inputClass}
              placeholder="e.g., From $0 to $5,000 in 3 Months!"
              required
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as SuccessStory['category'] }))}
              className={inputClass}
              required
            >
              <option value="earnings">Earnings</option>
              <option value="referrals">Referrals</option>
              <option value="growth">Growth</option>
              <option value="milestone">Milestone</option>
              <option value="achievement">Achievement</option>
            </select>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Your Story *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className={`${inputClass} resize-none`}
              rows={6}
              placeholder="Share your journey, challenges overcome, and tips for others..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Earnings ($)
              </label>
              <input
                type="number"
                value={formData.metrics.earnings}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  metrics: { ...prev.metrics, earnings: e.target.value }
                }))}
                className={inputClass}
                placeholder="5000"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Referrals
              </label>
              <input
                type="number"
                value={formData.metrics.referrals}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  metrics: { ...prev.metrics, referrals: e.target.value }
                }))}
                className={inputClass}
                placeholder="150"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Timeframe
              </label>
              <input
                type="text"
                value={formData.metrics.timeframe}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  metrics: { ...prev.metrics, timeframe: e.target.value }
                }))}
                className={inputClass}
                placeholder="3 months"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className={inputClass}
              placeholder="newbie-success, referral-master, consistent-growth"
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 ${theme === 'professional' ? 'bg-gray-700/50 hover:bg-gray-600/60' : 'bg-white/10 hover:bg-white/20'} text-white py-3 rounded-lg transition-all duration-200 border ${theme === 'professional' ? 'border-gray-600/50' : 'border-white/20'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 ${theme === 'professional' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-purple-600 hover:bg-purple-700'} text-white py-3 rounded-lg transition-all duration-200`}
            >
              Share Story
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuccessStories;
