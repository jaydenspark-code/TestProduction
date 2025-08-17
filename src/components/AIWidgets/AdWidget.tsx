import React, { useState, useEffect } from 'react';
import { Eye, MousePointer, Share2, Heart, ExternalLink, Clock, Gift } from 'lucide-react';
import { adDisplayService } from '../../services/adDisplayService';
import { AdCampaign, UserActivity } from '../../types/advertising';

interface AdWidgetProps {
  placement: string;
  userId: string;
  userProfile?: any;
  className?: string;
  maxAds?: number;
  autoRotate?: boolean;
  rotationInterval?: number; // in seconds
}

interface AdCardProps {
  campaign: AdCampaign;
  onInteraction: (action: UserActivity['action']) => void;
  compact?: boolean;
}

const AdCard: React.FC<AdCardProps> = ({ campaign, onInteraction, compact = false }) => {
  const [liked, setLiked] = useState(false);
  const [viewed, setViewed] = useState(false);

  useEffect(() => {
    // Record view when component mounts
    if (!viewed) {
      onInteraction('view');
      setViewed(true);
    }
  }, [onInteraction, viewed]);

  const handleClick = () => {
    onInteraction('click');
  };

  const handleComplete = () => {
    onInteraction('complete');
  };

  const handleShare = () => {
    onInteraction('share');
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: campaign.title,
        text: campaign.description,
        url: window.location.href
      });
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    if (!liked) {
      onInteraction('like');
    }
  };

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-2 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-3">
          {campaign.imageUrl && (
            <img 
              src={campaign.imageUrl} 
              alt={campaign.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {campaign.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {campaign.description}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <Gift className="w-3 h-3 mr-1" />
                ${campaign.reward.amount}
              </span>
              {campaign.estimatedDuration && (
                <span className="inline-flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {campaign.estimatedDuration}m
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleClick}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
          >
            View
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {campaign.imageUrl && (
        <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
          <img 
            src={campaign.imageUrl} 
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
              <Gift className="w-3 h-3 mr-1" />
              ${campaign.reward.amount}
            </span>
          </div>
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            {campaign.advertiser.logo && (
              <img 
                src={campaign.advertiser.logo} 
                alt={campaign.advertiser.name}
                className="w-6 h-6 rounded-full"
              />
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {campaign.advertiser.name}
            </span>
          </div>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {campaign.category}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {campaign.title}
        </h3>

        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {campaign.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            {campaign.estimatedDuration && (
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {campaign.estimatedDuration} min
              </span>
            )}
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {campaign.metrics.impressions}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLike}
              className={`p-2 rounded-full transition-colors ${
                liked 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleClick}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <MousePointer className="w-4 h-4 mr-2" />
            {campaign.callToAction}
          </button>
          
          {campaign.requirements && campaign.requirements.length > 0 && (
            <button
              onClick={handleComplete}
              className="inline-flex items-center justify-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>

        {campaign.requirements && campaign.requirements.length > 0 && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Requirements:
            </h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {campaign.requirements.map((req, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const AdWidget: React.FC<AdWidgetProps> = ({ 
  placement, 
  userId, 
  userProfile,
  className = '',
  maxAds = 3,
  autoRotate = false,
  rotationInterval = 30
}) => {
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAds();
  }, [placement, userId, userProfile]);

  useEffect(() => {
    if (autoRotate && ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % ads.length);
      }, rotationInterval * 1000);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRotate, ads.length, rotationInterval]);

  const loadAds = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const personalizedAds = await adDisplayService.getPersonalizedAds(
        userId,
        placement,
        userProfile || {}
      );
      
      setAds(personalizedAds.slice(0, maxAds));
    } catch (err) {
      setError('Failed to load ads');
      console.error('Error loading ads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdInteraction = async (campaignId: string, action: UserActivity['action']) => {
    try {
      await adDisplayService.recordAdInteraction(
        campaignId,
        userId,
        action,
        {
          placement,
          device: 'web',
          timestamp: new Date().toISOString()
        }
      );
    } catch (err) {
      console.error('Error recording ad interaction:', err);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: maxAds }).map((_, index) => (
          <div key={index} className="bg-gray-100 dark:bg-gray-800 rounded-lg h-64 animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}>
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        <button
          onClick={loadAds}
          className="mt-2 text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 text-sm underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center ${className}`}>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No ads available for this placement
        </p>
      </div>
    );
  }

  // Determine layout based on placement
  const isCompact = placement.includes('sidebar') || placement.includes('compact');
  const isSingle = autoRotate || isCompact;

  if (isSingle) {
    const currentAd = ads[currentAdIndex];
    return (
      <div className={`space-y-2 ${className}`}>
        <AdCard
          campaign={currentAd}
          onInteraction={(action) => handleAdInteraction(currentAd.id, action)}
          compact={isCompact}
        />
        {autoRotate && ads.length > 1 && (
          <div className="flex justify-center space-x-1">
            {ads.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentAdIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentAdIndex 
                    ? 'bg-blue-600' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {ads.map((ad) => (
        <AdCard
          key={ad.id}
          campaign={ad}
          onInteraction={(action) => handleAdInteraction(ad.id, action)}
          compact={isCompact}
        />
      ))}
    </div>
  );
};

export default AdWidget;
