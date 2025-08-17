import { supabase } from '../lib/supabase';
import { MatchingScore } from '../entities/MatchingScore';
import { trustScoreService } from './trustScoreService';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  interests: string[];
  location: {
    country: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  trustScore?: number;
  profileCompletion: number;
  activityLevel: 'low' | 'medium' | 'high';
  preferences: {
    minTrustScore?: number;
    maxDistance?: number; // in km
    preferredActivityLevel?: 'low' | 'medium' | 'high';
  };
}

export interface MatchResult {
  user: UserProfile;
  score: MatchingScore;
  reasons: string[];
}

class EnhancedSmartMatchingService {
  /**
   * Find unique matches for a user based on comprehensive criteria
   */
  async findUniqueMatches(userId: string, excludeMatched: boolean = true): Promise<MatchResult[]> {
    try {
      // Get current user profile
      const currentUser = await this.getUserProfile(userId);
      if (!currentUser) {
        throw new Error('User profile not found');
      }

      // Get all potential matches
      let potentialMatches = await this.getPotentialMatches(userId);

      if (excludeMatched) {
        const previousMatches = await supabase
          .from('user_matches')
          .select('matched_user_id')
          .eq('user_id', userId);
          
        const matchedIds = previousMatches.data?.map(m => m.matched_user_id) || [];
        potentialMatches = potentialMatches.filter(m => !matchedIds.includes(m.id)); // ✅ No duplicate matches
      }

      // Calculate matching scores
      const matchResults: MatchResult[] = [];
      
      for (const candidate of potentialMatches) {
        const score = await this.calculateMatchingScore(currentUser, candidate);
        const reasons = this.generateMatchingReasons(currentUser, candidate, score);
        
        matchResults.push({
          user: candidate,
          score,
          reasons,
        });
      }

      // Sort by score and apply filters
      return matchResults
        .filter(match => match.score.score >= 0.3) // Minimum 30% match
        .sort((a, b) => b.score.score - a.score.score)
        .slice(0, 20); // Return top 20 matches

    } catch (error) {
      console.error('❌ Error finding matches:', error);
      return [];
    }
  }

  /**
   * Get user profile with all matching-relevant data
   */
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        email,
        interests,
        location,
        profile_completion,
        activity_level,
        preferences
      `)
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return null;
    }

    // Get trust score
    const trustScore = await trustScoreService.getTrustScore(userId);

    return {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      interests: profile.interests || [],
      location: profile.location || { country: '', city: '' },
      trustScore: trustScore?.score || 0,
      profileCompletion: profile.profile_completion || 0,
      activityLevel: profile.activity_level || 'low',
      preferences: profile.preferences || {},
    };
  }

  /**
   * Get potential matches excluding current user
   */
  private async getPotentialMatches(userId: string): Promise<UserProfile[]> {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        email,
        interests,
        location,
        profile_completion,
        activity_level,
        preferences
      `)
      .neq('id', userId)
      .gte('profile_completion', 50); // Only users with at least 50% profile completion

    if (error || !profiles) {
      return [];
    }

    // Get trust scores for all users in parallel
    const usersWithTrust = await Promise.all(
      profiles.map(async (profile) => {
        const trustScore = await trustScoreService.getTrustScore(profile.id);
        
        return {
          id: profile.id,
          fullName: profile.full_name,
          email: profile.email,
          interests: profile.interests || [],
          location: profile.location || { country: '', city: '' },
          trustScore: trustScore?.score || 0,
          profileCompletion: profile.profile_completion || 0,
          activityLevel: profile.activity_level || 'low',
          preferences: profile.preferences || {},
        };
      })
    );

    return usersWithTrust;
  }

  /**
   * Calculate comprehensive matching score
   */
  private async calculateMatchingScore(user: UserProfile, candidate: UserProfile): Promise<MatchingScore> {
    // Interest similarity (40% weight)
    const interestScore = this.calculateInterestSimilarity(user.interests, candidate.interests);
    
    // Location proximity (30% weight)
    const locationScore = this.calculateLocationProximity(user.location, candidate.location);
    
    // Trust score compatibility (30% weight)
    const trustScore = this.calculateTrustCompatibility(user.trustScore || 0, candidate.trustScore || 0);
    
    // Additional factors
    const activityCompatibility = this.calculateActivityCompatibility(user.activityLevel, candidate.activityLevel);
    const profileCompletion = Math.min(candidate.profileCompletion / 100, 1);
    
    // Apply user preferences
    let preferenceMultiplier = 1;
    if (user.preferences.minTrustScore && candidate.trustScore! < user.preferences.minTrustScore) {
      preferenceMultiplier *= 0.5;
    }
    
    // Calculate weighted score
    const rawScore = (
      interestScore * 0.4 +
      locationScore * 0.3 +
      trustScore * 0.3
    ) * activityCompatibility * profileCompletion * preferenceMultiplier;
    
    return {
      score: Math.min(rawScore, 1), // Cap at 1.0
      breakdown: {
        interests: interestScore,
        location: locationScore,
        trustScore: trustScore,
      },
    };
  }

  /**
   * Calculate interest similarity using Jaccard similarity
   */
  private calculateInterestSimilarity(interests1: string[], interests2: string[]): number {
    if (!interests1.length || !interests2.length) return 0;
    
    const set1 = new Set(interests1.map(i => i.toLowerCase()));
    const set2 = new Set(interests2.map(i => i.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate location proximity score
   */
  private calculateLocationProximity(location1: UserProfile['location'], location2: UserProfile['location']): number {
    // Same country gets base score
    if (location1.country !== location2.country) return 0.1;
    
    // Same city gets higher score
    if (location1.city === location2.city) return 1.0;
    
    // If coordinates available, calculate distance
    if (location1.coordinates && location2.coordinates) {
      const distance = this.calculateDistance(
        location1.coordinates.lat,
        location1.coordinates.lng,
        location2.coordinates.lat,
        location2.coordinates.lng
      );
      
      // Closer = higher score (inverse exponential decay)
      return Math.exp(-distance / 100); // 100km half-life
    }
    
    // Same country, different city
    return 0.5;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate trust score compatibility
   */
  private calculateTrustCompatibility(trustScore1: number, trustScore2: number): number {
    // Prefer users with similar or higher trust scores
    const difference = Math.abs(trustScore1 - trustScore2);
    return Math.max(0, 1 - (difference / 100)); // Normalize to 0-1
  }

  /**
   * Calculate activity level compatibility
   */
  private calculateActivityCompatibility(level1: string, level2: string): number {
    const levels = { low: 1, medium: 2, high: 3 };
    const diff = Math.abs(levels[level1 as keyof typeof levels] - levels[level2 as keyof typeof levels]);
    
    return Math.max(0.5, 1 - (diff * 0.25)); // Similar levels get higher scores
  }

  /**
   * Generate human-readable matching reasons
   */
  private generateMatchingReasons(user: UserProfile, candidate: UserProfile, score: MatchingScore): string[] {
    const reasons: string[] = [];
    
    if (score.breakdown.interests > 0.5) {
      const commonInterests = user.interests.filter(interest => 
        candidate.interests.some(ci => ci.toLowerCase() === interest.toLowerCase())
      );
      reasons.push(`Shares ${commonInterests.length} common interests: ${commonInterests.slice(0, 3).join(', ')}`);
    }
    
    if (score.breakdown.location > 0.8) {
      reasons.push(`Located in the same city: ${candidate.location.city}`);
    } else if (score.breakdown.location > 0.4) {
      reasons.push(`Located in the same country: ${candidate.location.country}`);
    }
    
    if (candidate.trustScore! > 80) {
      reasons.push(`High trust score (${candidate.trustScore})`);
    }
    
    if (candidate.profileCompletion > 90) {
      reasons.push('Complete and detailed profile');
    }
    
    if (candidate.activityLevel === 'high') {
      reasons.push('Highly active user');
    }
    
    return reasons;
  }

  /**
   * Store successful match for future exclusion
   */
  async recordMatch(userId: string, matchedUserId: string, matchScore: number): Promise<void> {
    try {
      await supabase
        .from('user_matches')
        .insert({
          user_id: userId,
          matched_user_id: matchedUserId,
          match_score: matchScore,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('❌ Failed to record match:', error);
    }
  }

  /**
   * Get matching statistics for a user
   */
  async getMatchingStats(userId: string) {
    try {
      const { data: matches, error } = await supabase
        .from('user_matches')
        .select('match_score, created_at')
        .eq('user_id', userId);

      if (error || !matches) {
        return null;
      }

      const totalMatches = matches.length;
      const averageScore = matches.reduce((sum, m) => sum + m.match_score, 0) / totalMatches;
      const recentMatches = matches.filter(m => 
        Date.now() - new Date(m.created_at).getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
      ).length;

      return {
        totalMatches,
        averageScore,
        recentMatches,
        matchingTrend: this.calculateMatchingTrend(matches),
      };
    } catch (error) {
      console.error('❌ Failed to get matching stats:', error);
      return null;
    }
  }

  /**
   * Calculate matching trend over time
   */
  private calculateMatchingTrend(matches: Array<{match_score: number, created_at: string}>): 'improving' | 'stable' | 'declining' {
    if (matches.length < 5) return 'stable';
    
    const recent = matches.slice(-5).map(m => m.match_score);
    const older = matches.slice(-10, -5).map(m => m.match_score);
    
    const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
    const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * Suggest profile improvements for better matching
   */
  async suggestProfileImprovements(userId: string): Promise<string[]> {
    const user = await this.getUserProfile(userId);
    if (!user) return [];
    
    const suggestions: string[] = [];
    
    if (user.interests.length < 3) {
      suggestions.push('Add more interests to your profile for better matches');
    }
    
    if (user.profileCompletion < 80) {
      suggestions.push('Complete your profile to improve match quality');
    }
    
    if (!user.location.coordinates) {
      suggestions.push('Enable location services for location-based matching');
    }
    
    if (user.trustScore! < 50) {
      suggestions.push('Build your trust score by completing tasks and getting positive reviews');
    }
    
    return suggestions;
  }
}

export const enhancedSmartMatchingService = new EnhancedSmartMatchingService();
export default enhancedSmartMatchingService;
