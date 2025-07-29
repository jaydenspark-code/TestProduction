export class TrustScoreService {
  // Build user trust over time to reduce restrictions
  async calculateTrustScore(userId: string): Promise<number> {
    const factors = await Promise.all([
      this.getAccountAge(userId),           // Older accounts = higher trust
      this.getVerificationLevel(userId),    // Email/phone verified
      this.getActivityConsistency(userId),  // Regular, human-like activity
      this.getReferralQuality(userId),      // Quality referrals vs quantity
      this.getPaymentHistory(userId)        // Successful payment history
    ]);
    
    const trustScore = factors.reduce((sum, factor) => sum + factor.score, 0) / factors.length;
    
    // Update user's trust level
    await supabase
      .from('user_trust_scores')
      .upsert({
        user_id: userId,
        trust_score: trustScore,
        last_calculated: new Date(),
        trust_level: this.getTrustLevel(trustScore)
      });
      
    return trustScore;
  }
  
  // Adjust duplicate prevention based on trust
  async getPreventionSettings(userId: string) {
    const trustScore = await this.calculateTrustScore(userId);
    
    if (trustScore > 0.8) {
      return {
        strictness: 'low',
        allowBenefitOfDoubt: true,
        requireManualReview: false
      };
    } else if (trustScore > 0.5) {
      return {
        strictness: 'medium',
        allowBenefitOfDoubt: true,
        requireManualReview: true
      };
    } else {
      return {
        strictness: 'high',
        allowBenefitOfDoubt: false,
        requireManualReview: true
      };
    }
  }
}