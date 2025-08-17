import { socialMediaAPI, SocialMediaMetrics, APIResponse } from '../services/socialMediaApi';
import { intelligentEstimator, ConsistentMetrics } from './intelligentEstimator';

export interface LinkAnalysis {
  platform: string;
  isValid: boolean;
  followers?: number;
  subscribers?: number;
  engagement?: number;
  handle?: string;
  error?: string;
  verified?: boolean;
  confidence?: 'high' | 'medium' | 'low';
  source?: 'real-time' | 'estimated';
  displayMessage?: string;
}

export interface PlatformDetection {
  platform: string;
  platformName: string;
  isValid: boolean;
  handle?: string;
  followers?: number;
  subscribers?: number;
  engagement?: number;
  verified?: boolean;
}

export async function analyzeLink(url: string): Promise<LinkAnalysis> {
  try {
    const cleanUrl = url.trim().toLowerCase();
    
    // Detect platform first
    const platform = detectPlatformFromUrl(cleanUrl);
    
    if (platform === 'Unknown') {
      return {
        platform: 'unknown',
        isValid: false,
        error: 'Platform not supported or URL format not recognized'
      };
    }

    // Extract handle for validation
    const handle = extractHandleFromUrl(url);
    if (!handle) {
      return {
        platform,
        isValid: false,
        error: 'Could not extract handle from URL'
      };
    }

    // Try real-time API first for supported platforms
    try {
      const apiResult = await socialMediaAPI.getMetricsWithFallback(url, platform);
      
      if (apiResult.success && apiResult.data) {
        const data = apiResult.data;
        return {
          platform: data.platform,
          isValid: true,
          followers: data.followers,
          subscribers: data.subscribers,
          engagement: data.engagement,
          handle: formatHandle(handle, platform),
          verified: data.verified,
          confidence: 'high',
          source: 'real-time',
          displayMessage: '✅ Real-time data'
        };
      }
    } catch (error) {
      console.warn(`Real-time API failed for ${platform}:`, error);
    }

    // Fallback to intelligent estimation
    const estimatedMetrics = intelligentEstimator.getConsistentMetrics(url, platform);
    
    return {
      platform,
      isValid: true,
      followers: estimatedMetrics.followers || undefined,
      subscribers: estimatedMetrics.subscribers || undefined,
      engagement: estimatedMetrics.engagement,
      handle: formatHandle(handle, platform),
      verified: estimatedMetrics.verified,
      confidence: estimatedMetrics.confidence,
      source: estimatedMetrics.source,
      displayMessage: intelligentEstimator.getDisplayMessage(estimatedMetrics.confidence, estimatedMetrics.source)
    };
    
  } catch (error) {
    return {
      platform: 'unknown',
      isValid: false,
      error: 'Failed to analyze link'
    };
  }
}

export function detectPlatformFromUrl(url: string): string {
  const cleanUrl = url.trim().toLowerCase();
  
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    return 'YouTube';
  }
  
  if (cleanUrl.includes('t.me') || cleanUrl.includes('telegram.me')) {
    return 'Telegram';
  }
  
  if (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com')) {
    return 'Twitter/X';
  }
  
  if (cleanUrl.includes('instagram.com')) {
    return 'Instagram';
  }
  
  if (cleanUrl.includes('tiktok.com')) {
    return 'TikTok';
  }
  
  if (cleanUrl.includes('facebook.com') || cleanUrl.includes('fb.com')) {
    return 'Facebook';
  }
  
  if (cleanUrl.includes('linkedin.com')) {
    return 'LinkedIn';
  }
  
  return 'Unknown';
}

function extractHandleFromUrl(url: string): string | null {
  const patterns = [
    // YouTube patterns
    /youtube\.com\/@([a-zA-Z0-9_.-]+)/,
    /youtube\.com\/c\/([a-zA-Z0-9_.-]+)/,
    /youtube\.com\/user\/([a-zA-Z0-9_.-]+)/,
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    
    // Telegram patterns
    /t\.me\/([a-zA-Z0-9_]+)/,
    
    // Twitter/X patterns
    /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/,
    
    // Instagram patterns
    /instagram\.com\/([a-zA-Z0-9_.]+)/,
    
    // TikTok patterns
    /tiktok\.com\/@([a-zA-Z0-9_.]+)/,
    
    // Facebook patterns
    /facebook\.com\/([a-zA-Z0-9_.]+)/,
    
    // LinkedIn patterns
    /linkedin\.com\/(?:in|company)\/([a-zA-Z0-9_.-]+)/,
    
    // Generic pattern (last resort)
    /\/([a-zA-Z0-9_.-]+)(?:\/|$|\?)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Filter out common non-handle paths
      const handle = match[1];
      const excludePaths = ['home', 'explore', 'notifications', 'messages', 'settings', 'about', 'contact'];
      if (!excludePaths.includes(handle.toLowerCase())) {
        return handle;
      }
    }
  }
  
  return null;
}

function formatHandle(handle: string, platform: string): string {
  // Format handle appropriately for each platform
  switch (platform) {
    case 'YouTube':
      return handle.startsWith('@') ? handle : `@${handle}`;
    case 'Telegram':
    case 'Twitter/X':
    case 'Instagram':
    case 'TikTok':
      return handle.startsWith('@') ? handle : `@${handle}`;
    default:
      return handle;
  }
}

export function formatFollowerCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
}

export function validateAgentEligibility(analysis: LinkAnalysis): { eligible: boolean; reason?: string } {
  if (!analysis.isValid) {
    return { eligible: false, reason: 'Invalid social media link' };
  }
  
  const minFollowers = {
    'YouTube': 1000,
    'Telegram': 500,
    'Twitter/X': 1000,
    'Instagram': 1000,
    'TikTok': 1000,
    'Facebook': 500,
    'LinkedIn': 500
  };
  
  const requiredFollowers = minFollowers[analysis.platform] || 1000;
  const actualFollowers = analysis.followers || analysis.subscribers || 0;
  
  if (actualFollowers < requiredFollowers) {
    return { 
      eligible: false, 
      reason: `Minimum ${formatFollowerCount(requiredFollowers)} followers required for ${analysis.platform}` 
    };
  }
  
  // Check engagement rate
  if (analysis.engagement && analysis.engagement < 1.0) {
    return { 
      eligible: false, 
      reason: 'Engagement rate too low (minimum 1.0% required)' 
    };
  }
  
  return { eligible: true };
}
