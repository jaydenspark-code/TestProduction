import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle,
  Filter,
  Plus,
  X,
  CheckCircle,
  Flag,
  Calendar,
  Award,
  Crown,
  Shield,
  TrendingUp,
  Users,
  Search,
  Heart,
  Eye
} from 'lucide-react';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userTitle?: string;
  userBadges: string[];
  isVerified: boolean;
  rating: number;
  title: string;
  content: string;
  category: 'platform' | 'support' | 'earnings' | 'community' | 'features';
  tags: string[];
  likes: number;
  dislikes: number;
  replies: number;
  views: number;
  isHelpful: boolean;
  isFeatured: boolean;
  createdAt: Date;
  responses?: Array<{
    id: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: Date;
  }>;
}

const UserReviews: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating' | 'helpful'>('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());

  // Mock data for demonstration
  useEffect(() => {
    const mockReviews: Review[] = [
      {
        id: '1',
        userId: 'user1',
        userName: 'Jennifer Martinez',
        userTitle: 'Gold Agent',
        userBadges: ['Top Performer', 'Mentor'],
        isVerified: true,
        rating: 5,
        title: 'Amazing platform for earning!',
        content: 'I\'ve been using EarnPro for 6 months now and I\'m absolutely amazed by the results. The referral system is transparent, payments are always on time, and the community is incredibly supportive. I\'ve earned over $3,000 so far!',
        category: 'platform',
        tags: ['referrals', 'earnings', 'reliable'],
        likes: 47,
        dislikes: 2,
        replies: 8,
        views: 256,
        isHelpful: true,
        isFeatured: true,
        createdAt: new Date('2024-01-15'),
        responses: [
          {
            id: '1-1',
            userId: 'admin',
            userName: 'EarnPro Team',
            content: 'Thank you for the amazing feedback, Jennifer! We\'re thrilled to hear about your success. Keep up the great work!',
            createdAt: new Date('2024-01-16')
          }
        ]
      },
      {
        id: '2',
        userId: 'user2',
        userName: 'Marcus Thompson',
        userTitle: 'Silver Agent',
        userBadges: ['Fast Starter'],
        isVerified: false,
        rating: 4,
        title: 'Great support team!',
        content: 'Had some questions when I started and the support team was incredibly helpful. They responded within hours and walked me through everything step by step. The live chat feature is a game-changer.',
        category: 'support',
        tags: ['customer-service', 'helpful', 'responsive'],
        likes: 23,
        dislikes: 1,
        replies: 3,
        views: 189,
        isHelpful: true,
        isFeatured: false,
        createdAt: new Date('2024-01-10')
      },
      {
        id: '3',
        userId: 'user3',
        userName: 'Sarah Kim',
        userTitle: 'Platinum Agent',
        userBadges: ['Network Builder', 'High Earner', 'Community Star'],
        isVerified: true,
        rating: 5,
        title: 'Best community I\'ve ever joined',
        content: 'The community aspect of EarnPro is what sets it apart. Everyone is willing to help, share tips, and celebrate each other\'s success. The challenges and leaderboards make it fun and engaging. Highly recommend!',
        category: 'community',
        tags: ['community', 'engaging', 'supportive'],
        likes: 61,
        dislikes: 0,
        replies: 12,
        views: 342,
        isHelpful: true,
        isFeatured: true,
        createdAt: new Date('2024-01-08')
      },
      {
        id: '4',
        userId: 'user4',
        userName: 'David Rodriguez',
        userBadges: ['Newcomer'],
        isVerified: false,
        rating: 4,
        title: 'Easy to get started',
        content: 'As someone new to referral marketing, I found the platform very user-friendly. The onboarding process was smooth and the tutorials were helpful. Still learning but already seeing some earnings!',
        category: 'features',
        tags: ['beginner-friendly', 'easy-to-use'],
        likes: 18,
        dislikes: 1,
        replies: 2,
        views: 134,
        isHelpful: true,
        isFeatured: false,
        createdAt: new Date('2024-01-05')
      },
      {
        id: '5',
        userId: 'user5',
        userName: 'Lisa Chen',
        userTitle: 'Gold Agent',
        userBadges: ['Consistent Earner'],
        isVerified: true,
        rating: 5,
        title: 'Consistent earnings every month',
        content: 'What I love most about EarnPro is the consistency. Every month I know I can count on earning at least $500-800 from my referral network. The passive income aspect is incredible.',
        category: 'earnings',
        tags: ['consistent', 'passive-income', 'reliable'],
        likes: 35,
        dislikes: 3,
        replies: 6,
        views: 278,
        isHelpful: true,
        isFeatured: false,
        createdAt: new Date('2024-01-02')
      }
    ];

    setTimeout(() => {
      setReviews(mockReviews);
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
    { id: 'all', label: 'All Reviews', icon: Star },
    { id: 'platform', label: 'Platform', icon: TrendingUp },
    { id: 'support', label: 'Support', icon: MessageCircle },
    { id: 'earnings', label: 'Earnings', icon: Award },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'features', label: 'Features', icon: CheckCircle }
  ];

  const handleLike = (reviewId: string) => {
    setLikedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });

    setReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? { ...review, likes: likedReviews.has(reviewId) ? review.likes - 1 : review.likes + 1 }
        : review
    ));
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-400'
        }`}
      />
    ));
  };

  const filteredReviews = reviews.filter(review => {
    const matchesCategory = selectedFilter === 'all' || review.category === selectedFilter;
    const matchesRating = selectedRating === null || review.rating === selectedRating;
    const matchesSearch = searchQuery === '' || 
      review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.userName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesRating && matchesSearch;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'oldest':
        return a.createdAt.getTime() - b.createdAt.getTime();
      case 'rating':
        return b.rating - a.rating;
      case 'helpful':
        return b.likes - a.likes;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center">
            <Star className="w-8 h-8 mr-3 text-yellow-400" />
            User Reviews & Testimonials
          </h2>
          <p className="text-white/70 mt-2">
            See what our community members say about EarnPro
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className={`${buttonClass} text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2`}
        >
          <Plus className="w-5 h-5" />
          <span>Write Review</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className={`${cardClass} p-6`}>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviews..."
              className={`w-full pl-10 pr-4 py-3 ${
                theme === 'professional'
                  ? 'bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400'
                  : 'bg-white/10 border border-white/20 text-white placeholder-white/50'
              } rounded-lg focus:outline-none focus:ring-2 ${
                theme === 'professional' ? 'focus:ring-cyan-500' : 'focus:ring-purple-500'
              }`}
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedFilter(category.id)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                    selectedFilter === category.id
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

          {/* Rating and Sort */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-white/70 text-sm">Rating:</span>
              <div className="flex space-x-1">
                {[5, 4, 3, 2, 1].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                    className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                      selectedRating === rating
                        ? theme === 'professional'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-purple-600 text-white'
                        : theme === 'professional'
                          ? 'bg-gray-700/50 text-white/70 hover:bg-gray-600/60'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {rating}★
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-white/70 text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  theme === 'professional'
                    ? 'bg-gray-700/50 border border-gray-600/50 text-white'
                    : 'bg-white/10 border border-white/20 text-white'
                } focus:outline-none focus:ring-2 ${
                  theme === 'professional' ? 'focus:ring-cyan-500' : 'focus:ring-purple-500'
                }`}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="rating">Rating</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={`${cardClass} p-6 animate-pulse`}>
              <div className="flex items-start space-x-4 mb-4">
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
        ) : sortedReviews.length > 0 ? (
          sortedReviews.map(review => (
            <div key={review.id} className={`${cardClass} p-6 ${review.isFeatured ? 'ring-2 ring-yellow-400/30' : ''}`}>
              {review.isFeatured && (
                <div className="flex items-center space-x-2 mb-4">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 text-sm font-medium">Featured Review</span>
                </div>
              )}

              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {review.userName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-white font-medium">{review.userName}</h4>
                      {review.isVerified && <CheckCircle className="w-4 h-4 text-green-400" />}
                      {review.userTitle && (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          review.userTitle.includes('Platinum') ? 'bg-purple-500/20 text-purple-300' :
                          review.userTitle.includes('Gold') ? 'bg-yellow-500/20 text-yellow-300' :
                          review.userTitle.includes('Silver') ? 'bg-gray-500/20 text-gray-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {review.userTitle}
                        </span>
                      )}
                    </div>
                    
                    {/* User Badges */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {review.userBadges.map(badge => (
                        <span
                          key={badge}
                          className={`px-2 py-1 rounded-full text-xs ${
                            theme === 'professional'
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}
                        >
                          {badge}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        {renderStars(review.rating)}
                        <span className="text-white/60 text-sm ml-2">{review.rating}/5</span>
                      </div>
                      <span className="text-white/40 text-sm">
                        {review.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs capitalize ${
                    review.category === 'platform' ? 'bg-blue-500/20 text-blue-300' :
                    review.category === 'support' ? 'bg-green-500/20 text-green-300' :
                    review.category === 'earnings' ? 'bg-yellow-500/20 text-yellow-300' :
                    review.category === 'community' ? 'bg-purple-500/20 text-purple-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {review.category}
                  </span>
                </div>
              </div>

              {/* Review Content */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-3">{review.title}</h3>
                <p className="text-white/80 leading-relaxed">{review.content}</p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {review.tags.map(tag => (
                  <span
                    key={tag}
                    className={`px-3 py-1 rounded-full text-xs ${
                      theme === 'professional'
                        ? 'bg-gray-700/50 text-gray-300'
                        : 'bg-white/10 text-white/70'
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => handleLike(review.id)}
                    className={`flex items-center space-x-2 transition-colors ${
                      likedReviews.has(review.id) 
                        ? 'text-green-400' 
                        : 'text-white/60 hover:text-green-400'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm">{review.likes}</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{review.replies}</span>
                  </button>
                  
                  <div className="flex items-center space-x-2 text-white/40">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">{review.views}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {review.isHelpful && (
                    <span className="text-green-400 text-sm flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Helpful</span>
                    </span>
                  )}
                  <button className="text-white/40 hover:text-white transition-colors">
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Responses */}
              {review.responses && review.responses.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <h5 className="text-white/70 text-sm mb-3">Team Response</h5>
                  {review.responses.map(response => (
                    <div key={response.id} className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 font-medium text-sm">{response.userName}</span>
                        <span className="text-white/40 text-xs">
                          {response.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-white/80 text-sm">{response.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Star className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <h3 className="text-white/60 text-lg mb-2">No reviews found</h3>
            <p className="text-white/40">Try adjusting your filters or be the first to write a review!</p>
          </div>
        )}
      </div>

      {/* Create Review Modal */}
      {showCreateForm && (
        <CreateReviewModal
          onClose={() => setShowCreateForm(false)}
          onSubmit={(reviewData) => {
            const newReview: Review = {
              id: Date.now().toString(),
              userId: user?.id || 'current-user',
              userName: user?.fullName || 'Anonymous',
              userBadges: [],
              isVerified: false,
              ...reviewData,
              likes: 0,
              dislikes: 0,
              replies: 0,
              views: 0,
              isHelpful: false,
              isFeatured: false,
              createdAt: new Date()
            };
            setReviews(prev => [newReview, ...prev]);
            setShowCreateForm(false);
          }}
        />
      )}
    </div>
  );
};

// Create Review Modal Component
interface CreateReviewModalProps {
  onClose: () => void;
  onSubmit: (reviewData: Partial<Review>) => void;
}

const CreateReviewModal: React.FC<CreateReviewModalProps> = ({ onClose, onSubmit }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'platform' as Review['category'],
    rating: 5,
    tags: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const reviewData = {
      title: formData.title,
      content: formData.content,
      category: formData.category,
      rating: formData.rating,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    };

    onSubmit(reviewData);
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
          <h3 className="text-2xl font-bold text-white">Write a Review</h3>
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
              Review Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={inputClass}
              placeholder="e.g., Amazing platform for earning!"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Review['category'] }))}
                className={inputClass}
                required
              >
                <option value="platform">Platform</option>
                <option value="support">Support</option>
                <option value="earnings">Earnings</option>
                <option value="community">Community</option>
                <option value="features">Features</option>
              </select>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Rating *
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, rating }))}
                    className="transition-colors"
                  >
                    <Star className={`w-6 h-6 ${
                      rating <= formData.rating ? 'text-yellow-400 fill-current' : 'text-gray-400'
                    }`} />
                  </button>
                ))}
                <span className="text-white/70 ml-2">{formData.rating}/5</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Your Review *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className={`${inputClass} resize-none`}
              rows={6}
              placeholder="Share your experience with EarnPro..."
              required
            />
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
              placeholder="e.g., reliable, easy-to-use, great-support"
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
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserReviews;
