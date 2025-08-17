import React, { useState, useEffect, useCallback } from 'react';
import { Link, CheckCircle, AlertCircle, Loader, Youtube, Instagram, Twitter, Facebook, Linkedin, MessageCircle, Camera, Users } from 'lucide-react';
import { analyzeLink, LinkAnalysis } from '../../utils/linkDetection';

interface SmartLinkInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlatformDetected: (detection: LinkAnalysis) => void;
  className?: string;
}

const SmartLinkInput: React.FC<SmartLinkInputProps> = ({ 
  value, 
  onChange, 
  onPlatformDetected, 
  className = "" 
}) => {
  const [analysis, setAnalysis] = useState<LinkAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedUrl, setLastAnalyzedUrl] = useState('');

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: React.ComponentType<any> } = {
      'YouTube': Youtube,
      'Instagram': Instagram,
      'Twitter/X': Twitter,
      'Facebook': Facebook,
      'LinkedIn': Linkedin,
      'Telegram': MessageCircle,
      'TikTok': Users,
      'Snapchat': Camera
    };
    return icons[platform] || Link;
  };

  // Validate if URL looks like a valid social media URL before making API calls
  const isValidSocialMediaUrl = (url: string): boolean => {
    if (!url || url.length < 10) return false;
    
    const socialMediaDomains = [
      'youtube.com', 'youtu.be',
      'instagram.com',
      'tiktok.com',
      'twitter.com', 'x.com',
      'facebook.com', 'fb.com',
      'linkedin.com',
      't.me', 'telegram.me',
      'snapchat.com'
    ];
    
    return socialMediaDomains.some(domain => url.toLowerCase().includes(domain));
  };

  // Debounced analysis function
  const debouncedAnalyze = useCallback(
    async (url: string) => {
      // Don't analyze if URL hasn't changed or is empty
      if (!url.trim() || url === lastAnalyzedUrl) {
        return;
      }

      // Don't analyze if URL doesn't look like a social media URL
      if (!isValidSocialMediaUrl(url)) {
        setAnalysis(null);
        return;
      }

      console.log(`🔍 Analyzing URL: ${url}`);
      setIsAnalyzing(true);
      setLastAnalyzedUrl(url);

      try {
        const linkAnalysis = await analyzeLink(url);
        console.log(`✅ Analysis complete:`, linkAnalysis);
        
        setAnalysis(linkAnalysis);
        
        if (linkAnalysis.isValid) {
          onPlatformDetected(linkAnalysis);
        }
      } catch (error) {
        console.error('❌ Error analyzing URL:', error);
        setAnalysis({
          platform: 'unknown',
          isValid: false,
          error: 'Failed to analyze link'
        });
      } finally {
        setIsAnalyzing(false);
      }
    },
    [onPlatformDetected, lastAnalyzedUrl]
  );

  // Effect with proper debouncing
  useEffect(() => {
    // Clear analysis immediately if URL is empty
    if (!value.trim()) {
      setAnalysis(null);
      setLastAnalyzedUrl('');
      return;
    }

    // Only debounce for valid-looking URLs
    if (isValidSocialMediaUrl(value)) {
      const timeoutId = setTimeout(() => {
        debouncedAnalyze(value);
      }, 1500); // Increased timeout to prevent rapid API calls

      return () => clearTimeout(timeoutId);
    } else {
      // Clear analysis for invalid URLs immediately
      setAnalysis(null);
    }
  }, [value, debouncedAnalyze]);

  const Icon = analysis ? getPlatformIcon(analysis.platform) : Link;
  const followerCount = analysis?.followers || analysis?.subscribers;

  // Manual analysis trigger
  const handleAnalyzeNow = () => {
    if (value.trim() && isValidSocialMediaUrl(value)) {
      debouncedAnalyze(value);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-10 pr-32 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${className}`}
          placeholder="Enter your channel/profile URL..."
        />
        <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />

        {/* Manual Analyze Button */}
        {value.trim() && isValidSocialMediaUrl(value) && !isAnalyzing && (
          <button
            type="button"
            onClick={handleAnalyzeNow}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md transition-colors"
          >
            Analyze
          </button>
        )}

        {isAnalyzing && (
          <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 animate-spin" />
        )}
      </div>

      {/* Platform Detection Result */}
      {(analysis || isAnalyzing) && (
        <div className={`transition-all duration-300 ease-in-out ${
          isAnalyzing ? 'min-h-[100px]' : ''
        }`}>
          {isAnalyzing ? (
            <div className="p-4 rounded-lg border bg-purple-500/10 border-purple-500/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/20">
                  <Loader className="w-6 h-6 text-purple-300 animate-spin" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">Analyzing your link...</h4>
                  <p className="text-white/70 text-sm">Getting real-time follower data</p>
                </div>
              </div>
            </div>
          ) : analysis ? (
            <div className={`p-4 rounded-lg border transition-all duration-200 ${
              analysis.isValid 
                ? 'bg-green-500/10 border-green-500/30' 
                : analysis.platform === 'unknown'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-yellow-500/10 border-yellow-500/30'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  analysis.isValid ? 'bg-green-500/20' : 'bg-yellow-500/20'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    analysis.isValid ? 'text-green-300' : 'text-yellow-300'
                  }`} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-white font-medium">{analysis.platform}</h4>
                    {analysis.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-300" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-300" />
                    )}
                  </div>

                  {analysis.isValid && analysis.handle && (
                    <p className="text-white/70 text-sm">{analysis.handle}</p>
                  )}

                  {analysis.isValid && followerCount && (
                    <div className="space-y-1">
                      <p className="text-green-300 text-sm font-medium">
                        {followerCount.toLocaleString()} {analysis.platform === 'YouTube' ? 'subscribers' : 'followers'}
                      </p>
                      
                      {/* Display data source and confidence */}
                      <p className={`text-xs ${
                        analysis.source === 'real-time' ? 'text-green-300' : 
                        analysis.confidence === 'high' ? 'text-blue-300' :
                        analysis.confidence === 'medium' ? 'text-yellow-300' : 'text-orange-300'
                      }`}>
                        {analysis.displayMessage || '📊 Estimated metrics'}
                      </p>
                      
                      {/* Verification badge */}
                      {analysis.verified && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-blue-300" />
                          <span className="text-blue-300 text-xs">Verified account</span>
                        </div>
                      )}
                    </div>
                  )}

                  {analysis.isValid && analysis.engagement && (
                    <p className="text-blue-300 text-sm">
                      {analysis.engagement}% engagement rate
                    </p>
                  )}

                  {!analysis.isValid && analysis.error && (
                    <p className="text-red-300 text-sm">
                      {analysis.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Supported Platforms */}
      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
        <p className="text-white/70 text-xs mb-2">Supported platforms:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'YouTube', icon: Youtube },
            { name: 'Instagram', icon: Instagram },
            { name: 'TikTok', icon: Users },
            { name: 'Twitter/X', icon: Twitter },
            { name: 'Facebook', icon: Facebook },
            { name: 'LinkedIn', icon: Linkedin },
            { name: 'Telegram', icon: MessageCircle },
            { name: 'Snapchat', icon: Camera }
          ].map((platform) => {
            const PlatformIcon = platform.icon;
            return (
              <div key={platform.name} className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded text-xs text-white/60">
                <PlatformIcon className="w-3 h-3" />
                <span>{platform.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SmartLinkInput;
