/**
 * ================================================================
 * PROGRESSIVE RESET AGENT PROGRESSION SERVICE
 * ================================================================
 * Enhanced business logic for the progressive reset hybrid referral system
 * Handles tier progression, challenge management, reset logic, and commission calculations
 * 
 * Features:
 * - Progressive Reset System (First 4 tiers: Rookie→Steel)
 * - Hybrid Referral Counting (Direct only → Network building)
 * - Automatic Challenge Management
 * - Demotion Logic with Clean Slate Policy
 * - Enhanced Commission Calculations
 */

import { supabase } from '../lib/supabase';
import { 
  AgentTier, 
  AgentProfile, 
  AgentChallengeHistory, 
  AgentCommissionTransaction,
  AgentWeeklyPerformance,
  AgentProgressionResponse,
  CommissionCalculationResponse,
  EnhancedAgentStats
} from '../types';
import { 
  usesProgressiveResetSystem,
  getMaxAttemptsForTier,
  calculateResetStartingPoint,
  getChallengeDuration,
  getPreviousTier,
  usesDirectOnlyCount
} from '../utils/hybridReferralSystem';
import { showToast } from '../utils/toast';

export class AgentProgressionService {
  // ================================================================
  // TIER MANAGEMENT
  // ================================================================

  /**
   * Get all agent tiers in order
   */
  static async getAllTiers(): Promise<AgentTier[]> {
    try {
      const { data, error } = await supabase
        .from('agent_tiers')
        .select('*')
        .order('referral_requirement', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching agent tiers:', error);
      return this.getMockTiers();
    }
  }

  /**
   * Get specific tier by name
   */
  static async getTierByName(tierName: AgentTier['tierName']): Promise<AgentTier | null> {
    try {
      const { data, error } = await supabase
        .from('agent_tiers')
        .select('*')
        .eq('tier_name', tierName)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching tier:', error);
      return this.getMockTiers().find(t => t.tierName === tierName) || null;
    }
  }

  /**
   * Get next tier in progression
   */
  static async getNextTier(currentTier: AgentTier['tierName']): Promise<AgentTier | null> {
    const tiers = await this.getAllTiers();
    const currentTierData = tiers.find(t => t.tierName === currentTier);
    
    if (!currentTierData) return null;

    return tiers.find(t => t.referralRequirement > currentTierData.referralRequirement) || null;
  }

  // ================================================================
  // AGENT PROFILE MANAGEMENT
  // ================================================================

  /**
   * Get all agent profiles for admin dashboard
   */
  static async getAllAgentProfiles(): Promise<AgentProfile[]> {
    try {
      const { data: profiles, error } = await supabase
        .from('agent_profiles')
        .select(`
          *,
          agent_tiers!agent_profiles_current_tier_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return profiles?.map(profile => this.enhanceAgentProfile(profile)) || [];
    } catch (error) {
      console.error('Error fetching all agent profiles:', error);
      return this.getMockAgentProfiles();
    }
  }

  /**
   * Get or create agent profile for user with progressive reset system support
   */
  static async getAgentProfile(userId: string): Promise<AgentProfile | null> {
    try {
      let { data: profile, error } = await supabase
        .from('agent_profiles')
        .select(`
          *,
          agent_tiers!agent_profiles_current_tier_fkey(*)
        `)
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        profile = await this.createAgentProfile(userId);
      } else if (error) {
        throw error;
      }

      if (profile) {
        return this.enhanceAgentProfile(profile);
      }

      return null;
    } catch (error) {
      console.error('Error fetching agent profile:', error);
      return this.getMockAgentProfile(userId);
    }
  }

  /**
   * Create new agent profile with progressive reset system
   */
  static async createAgentProfile(userId: string): Promise<AgentProfile> {
    try {
      const { data, error } = await supabase
        .from('agent_profiles')
        .insert({
          user_id: userId,
          current_tier: 'rookie', // Start with rookie tier
          current_challenge_tier: 'bronze', // First challenge is bronze
          total_direct_referrals: 0,
          total_level1_indirect_referrals: 0,
          challenge_direct_referrals: 0,
          challenge_level1_referrals: 0,
          challenge_attempts: 0,
          challenge_starting_referrals: 0,
          challenge_max_referrals_reached: 0,
          is_challenge_active: true,
          weekly_earnings: 0,
          total_commission_earned: 0,
          status: 'active',
          challenge_start_date: new Date().toISOString(),
          challenge_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        })
        .select(`
          *,
          agent_tiers!agent_profiles_current_tier_fkey(*)
        `)
        .single();

      if (error) throw error;
      return this.enhanceAgentProfile(data);
    } catch (error) {
      console.error('Error creating agent profile:', error);
      throw error;
    }
  }

  /**
   * Update agent referral count and check progression
   */
  static async updateReferralCount(userId: string, newReferralCount: number): Promise<AgentProgressionResponse> {
    try {
      const profile = await this.getAgentProfile(userId);
      if (!profile) {
        return { success: false, error: 'Agent profile not found' };
      }

      // Update referral count
      const { error: updateError } = await supabase
        .from('agent_profiles')
        .update({ 
          total_direct_referrals: newReferralCount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Check for tier progression
      const progressionResult = await this.checkTierProgression(userId, newReferralCount);
      
      return progressionResult;
    } catch (error) {
      console.error('Error updating referral count:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if agent should progress to next tier
   */
  static async checkTierProgression(userId: string, currentReferrals: number): Promise<AgentProgressionResponse> {
    try {
      const profile = await this.getAgentProfile(userId);
      if (!profile) {
        return { success: false, error: 'Agent profile not found' };
      }

      const allTiers = await this.getAllTiers();
      const currentTier = allTiers.find(t => t.tierName === profile.currentTier);
      const nextTier = allTiers.find(t => 
        t.referralRequirement > (currentTier?.referralRequirement || 0) &&
        currentReferrals >= t.referralRequirement
      );

      if (!nextTier) {
        return { 
          success: true, 
          data: { 
            tierChanged: false, 
            challengeStarted: false,
            challengeCompleted: false,
            message: 'No tier progression available' 
          } 
        };
      }

      // Update to new tier
      const updates: any = {
        current_tier: nextTier.tierName,
        last_tier_achieved_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Start challenge if applicable
      const challengeTier = allTiers.find(t => t.referralRequirement > nextTier.referralRequirement);
      if (challengeTier && nextTier.challengeDurationDays) {
        const challengeEndDate = new Date();
        challengeEndDate.setDate(challengeEndDate.getDate() + nextTier.challengeDurationDays);

        updates.is_challenge_active = true;
        updates.current_challenge_tier = challengeTier.tierName;
        updates.challenge_start_date = new Date().toISOString();
        updates.challenge_end_date = challengeEndDate.toISOString();
        updates.challenge_attempts = profile.challengeAttempts + 1;
      }

      const { error } = await supabase
        .from('agent_profiles')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;

      // Record challenge history if starting new challenge
      if (challengeTier && nextTier.challengeDurationDays) {
        await this.recordChallengeStart(profile.id, challengeTier.tierName, currentReferrals, challengeTier.referralRequirement);
      }

      return {
        success: true,
        data: {
          tierChanged: true,
          newTier: nextTier,
          challengeStarted: !!challengeTier,
          challengeCompleted: false,
          message: `Congratulations! You've been promoted to ${nextTier.displayName}!`
        }
      };

    } catch (error) {
      console.error('Error checking tier progression:', error);
      return { success: false, error: error.message };
    }
  }

  // ================================================================
  // PROGRESSIVE RESET CHALLENGE MANAGEMENT
  // ================================================================

  /**
   * Update challenge progress with hybrid referral counting
   */
  static async updateChallengeProgress(
    userId: string, 
    directReferrals: number, 
    level1IndirectReferrals: number = 0
  ): Promise<AgentProgressionResponse> {
    try {
      const profile = await this.getAgentProfile(userId);
      if (!profile || !profile.currentChallengeTier) {
        return { success: false, error: 'No active challenge found' };
      }

      // Calculate total referrals based on hybrid system
      const totalNetwork = directReferrals + level1IndirectReferrals;
      const challengeCount = usesDirectOnlyCount(profile.currentChallengeTier) 
        ? directReferrals 
        : totalNetwork;

      // Update challenge progress
      const updates: any = {
        total_direct_referrals: directReferrals,
        total_level1_indirect_referrals: level1IndirectReferrals,
        challenge_direct_referrals: directReferrals - profile.challengeStartingReferrals,
        challenge_level1_referrals: level1IndirectReferrals,
        challenge_max_referrals_reached: Math.max(
          profile.challengeMaxReferralsReached || 0,
          challengeCount
        ),
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('agent_profiles')
        .update(updates)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Check for challenge completion
      const targetTier = await this.getTierByName(profile.currentChallengeTier);
      if (targetTier && challengeCount >= targetTier.referralRequirement) {
        return await this.completeChallenge(userId);
      }

      // Check for challenge expiration
      if (profile.challengeEndDate && new Date() > profile.challengeEndDate) {
        return await this.handleChallengeFailure(userId);
      }

      return {
        success: true,
        data: {
          tierChanged: false,
          challengeCompleted: false,
          challengeStarted: false,
          currentProgress: challengeCount,
          targetRequirement: targetTier?.referralRequirement || 0,
          message: 'Challenge progress updated'
        }
      };

    } catch (error) {
      console.error('Error updating challenge progress:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete challenge and auto-start next tier challenge
   */
  static async completeChallenge(userId: string): Promise<AgentProgressionResponse> {
    try {
      // Call the database function to handle completion and auto-start
      const { data, error } = await supabase.rpc('complete_agent_challenge', {
        p_user_id: userId
      });

      if (error) throw error;

      const updatedProfile = await this.getAgentProfile(userId);
      const newTier = updatedProfile?.tier;

      showToast(`🎉 Congratulations! You've been promoted to ${newTier?.displayName}!`, 'success');

      return {
        success: true,
        data: {
          tierChanged: true,
          challengeCompleted: true,
          challengeStarted: !!updatedProfile?.isChallengeActive,
          newTier,
          message: `Promoted to ${newTier?.displayName}! ${updatedProfile?.isChallengeActive ? 'Next challenge started automatically.' : 'You\'ve reached the highest tier!'}`
        }
      };

    } catch (error) {
      console.error('Error completing challenge:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle challenge failure with progressive reset logic
   */
  static async handleChallengeFailure(userId: string): Promise<AgentProgressionResponse> {
    try {
      const profile = await this.getAgentProfile(userId);
      if (!profile || !profile.currentChallengeTier) {
        return { success: false, error: 'No active challenge found' };
      }

      // Call the database function to handle reset or demotion
      const { data: resetResult, error } = await supabase.rpc('reset_agent_challenge', {
        p_user_id: userId
      });

      if (error) throw error;

      const updatedProfile = await this.getAgentProfile(userId);
      const isDemotion = resetResult; // Function returns true if demoted

      if (isDemotion) {
        showToast(
          `⚠️ Challenge failed. You've been demoted to ${updatedProfile?.tier?.displayName}. New challenge started!`,
          'warning'
        );

        return {
          success: true,
          data: {
            tierChanged: true,
            challengeCompleted: false,
            challengeStarted: true,
            demoted: true,
            newTier: updatedProfile?.tier,
            message: `Demoted to ${updatedProfile?.tier?.displayName}. Fresh start with new challenge!`
          }
        };
      } else {
        const maxAttempts = getMaxAttemptsForTier(profile.currentChallengeTier);
        const attemptsRemaining = maxAttempts - (profile.challengeAttempts || 0);

        showToast(
          `💪 Challenge reset! Starting from your progress point. ${attemptsRemaining} attempts remaining.`,
          'info'
        );

        return {
          success: true,
          data: {
            tierChanged: false,
            challengeCompleted: false,
            challengeStarted: true,
            reset: true,
            attemptsRemaining,
            message: `Challenge reset with starting advantage. ${attemptsRemaining} attempts remaining.`
          }
        };
      }

    } catch (error) {
      console.error('Error handling challenge failure:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check for expired challenges and handle them
   */
  static async checkExpiredChallenges(): Promise<void> {
    try {
      const { data: expiredChallenges, error } = await supabase
        .from('agent_profiles')
        .select('user_id')
        .eq('is_challenge_active', true)
        .lt('challenge_end_date', new Date().toISOString());

      if (error) throw error;

      for (const profile of expiredChallenges || []) {
        await this.handleChallengeFailure(profile.user_id);
      }
    } catch (error) {
      console.error('Error checking expired challenges:', error);
    }
  }

  /**
   * Get challenge status and progress information
   */
  static async getChallengeStatus(userId: string): Promise<{
    isActive: boolean;
    targetTier?: AgentTier;
    currentProgress: number;
    targetRequirement: number;
    progressPercentage: number;
    daysRemaining: number;
    attemptsUsed: number;
    maxAttempts: number;
    resetStartingPoint?: number;
    challengeType: 'direct' | 'network';
    timeExtension?: boolean;
  } | null> {
    try {
      const profile = await this.getAgentProfile(userId);
      if (!profile || !profile.isChallengeActive || !profile.currentChallengeTier) {
        return null;
      }

      const targetTier = await this.getTierByName(profile.currentChallengeTier);
      if (!targetTier) return null;

      const isDirectOnly = usesDirectOnlyCount(profile.currentChallengeTier);
      const currentProgress = isDirectOnly 
        ? profile.challengeDirectReferrals || 0
        : (profile.challengeDirectReferrals || 0) + (profile.challengeLevel1Referrals || 0);

      const progressPercentage = (currentProgress / targetTier.referralRequirement) * 100;
      const daysRemaining = profile.challengeEndDate 
        ? Math.max(0, Math.ceil((profile.challengeEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

      const maxAttempts = getMaxAttemptsForTier(profile.currentChallengeTier);
      const resetStartingPoint = calculateResetStartingPoint(
        profile.currentChallengeTier,
        (profile.challengeAttempts || 0) + 1,
        targetTier.referralRequirement,
        profile.challengeMaxReferralsReached || 0
      );

      const isSteel = profile.currentChallengeTier === 'steel';
      const timeExtension = isSteel && (profile.challengeAttempts || 0) > 0;

      return {
        isActive: true,
        targetTier,
        currentProgress,
        targetRequirement: targetTier.referralRequirement,
        progressPercentage: Math.min(progressPercentage, 100),
        daysRemaining,
        attemptsUsed: profile.challengeAttempts || 0,
        maxAttempts,
        resetStartingPoint,
        challengeType: isDirectOnly ? 'direct' : 'network',
        timeExtension
      };

    } catch (error) {
      console.error('Error getting challenge status:', error);
      return null;
    }
  }

  /**
   * Record challenge start in history
   */
  static async recordChallengeStart(
    agentProfileId: number,
    targetTier: AgentTier['tierName'],
    startingReferrals: number,
    targetReferrals: number
  ): Promise<void> {
    try {
      const profile = await supabase
        .from('agent_profiles')
        .select('challenge_start_date, challenge_end_date, challenge_attempts')
        .eq('id', agentProfileId)
        .single();

      if (!profile.data) return;

      await supabase
        .from('agent_challenge_history')
        .insert({
          agent_profile_id: agentProfileId,
          target_tier: targetTier,
          start_date: profile.data.challenge_start_date,
          end_date: profile.data.challenge_end_date,
          starting_referrals: startingReferrals,
          ending_referrals: startingReferrals, // Will be updated when challenge ends
          target_referrals: targetReferrals,
          challenge_result: 'in_progress',
          attempt_number: profile.data.challenge_attempts
        });
    } catch (error) {
      console.error('Error recording challenge start:', error);
    }
  }

  /**
   * Record challenge end in history
   */
  static async recordChallengeEnd(
    agentProfileId: number,
    targetTier: AgentTier['tierName'],
    endingReferrals: number,
    result: 'success' | 'failed'
  ): Promise<void> {
    try {
      await supabase
        .from('agent_challenge_history')
        .update({
          ending_referrals: endingReferrals,
          challenge_result: result
        })
        .eq('agent_profile_id', agentProfileId)
        .eq('target_tier', targetTier)
        .eq('challenge_result', 'in_progress');
    } catch (error) {
      console.error('Error recording challenge end:', error);
    }
  }

  // ================================================================
  // COMMISSION CALCULATIONS
  // ================================================================

  /**
   * Calculate weekly commission for agent
   */
  static async calculateWeeklyCommission(
    userId: string,
    weeklyEarnings: number
  ): Promise<CommissionCalculationResponse> {
    try {
      const profile = await this.getAgentProfile(userId);
      if (!profile) {
        return { success: false, error: 'Agent profile not found' };
      }

      const tier = await this.getTierByName(profile.currentTier);
      if (!tier) {
        return { success: false, error: 'Agent tier not found' };
      }

      // For Week 1-3, commission applies to weekly earnings
      if (['rookie', 'bronze', 'iron'].includes(profile.currentTier)) {
        const commissionAmount = weeklyEarnings * (tier.commissionRate / 100);

        return {
          success: true,
          data: {
            baseAmount: weeklyEarnings,
            commissionRate: tier.commissionRate,
            commissionAmount,
            totalAmount: weeklyEarnings + commissionAmount,
            tier: profile.currentTier
          }
        };
      }

      // For Silver+ tiers, commission is calculated at withdrawal time
      return {
        success: true,
        data: {
          baseAmount: weeklyEarnings,
          commissionRate: tier.commissionRate,
          commissionAmount: 0, // Will be calculated at withdrawal
          totalAmount: weeklyEarnings,
          tier: profile.currentTier
        }
      };

    } catch (error) {
      console.error('Error calculating weekly commission:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate withdrawal commission for Silver+ agents
   */
  static async calculateWithdrawalCommission(
    userId: string,
    withdrawalAmount: number
  ): Promise<CommissionCalculationResponse> {
    try {
      const profile = await this.getAgentProfile(userId);
      if (!profile) {
        return { success: false, error: 'Agent profile not found' };
      }

      const tier = await this.getTierByName(profile.currentTier);
      if (!tier) {
        return { success: false, error: 'Agent tier not found' };
      }

      // Commission only applies to Silver+ tiers at withdrawal time
      if (['silver', 'gold', 'platinum', 'diamond'].includes(profile.currentTier)) {
        const commissionAmount = withdrawalAmount * (tier.commissionRate / 100);

        return {
          success: true,
          data: {
            baseAmount: withdrawalAmount,
            commissionRate: tier.commissionRate,
            commissionAmount,
            totalAmount: withdrawalAmount + commissionAmount,
            tier: profile.currentTier
          }
        };
      }

      return {
        success: true,
        data: {
          baseAmount: withdrawalAmount,
          commissionRate: 0,
          commissionAmount: 0,
          totalAmount: withdrawalAmount,
          tier: profile.currentTier
        }
      };

    } catch (error) {
      console.error('Error calculating withdrawal commission:', error);
      return { success: false, error: error.message };
    }
  }

  // ================================================================
  // WITHDRAWAL MANAGEMENT
  // ================================================================

  /**
   * Check if agent can make withdrawal request
   */
  static async canAgentWithdraw(userId: string, amount: number): Promise<{
    canWithdraw: boolean;
    reason?: string;
    withdrawalsUsedThisWeek: number;
    maxWithdrawalsPerWeek: number;
  }> {
    try {
      const profile = await this.getAgentProfile(userId);
      if (!profile) {
        return { 
          canWithdraw: false, 
          reason: 'Agent profile not found',
          withdrawalsUsedThisWeek: 0,
          maxWithdrawalsPerWeek: 1
        };
      }

      const tier = await this.getTierByName(profile.currentTier);
      if (!tier) {
        return { 
          canWithdraw: false, 
          reason: 'Agent tier not found',
          withdrawalsUsedThisWeek: 0,
          maxWithdrawalsPerWeek: 1
        };
      }

      // Check minimum withdrawal amount for multi-withdrawal agents
      if (tier.withdrawalFrequency > 1 && amount < 100) {
        return {
          canWithdraw: false,
          reason: 'Minimum withdrawal amount is $100 for your tier',
          withdrawalsUsedThisWeek: 0,
          maxWithdrawalsPerWeek: tier.withdrawalFrequency
        };
      }

      // Check weekly withdrawal limit
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { data: withdrawalsThisWeek, error } = await supabase
        .from('withdrawal_requests')
        .select('count')
        .eq('user_id', userId)
        .gte('created_at', weekStart.toISOString())
        .neq('status', 'rejected');

      if (error) throw error;

      const withdrawalsUsed = withdrawalsThisWeek?.[0]?.count || 0;

      if (withdrawalsUsed >= tier.withdrawalFrequency) {
        return {
          canWithdraw: false,
          reason: `You have reached your weekly withdrawal limit (${tier.withdrawalFrequency}x per week)`,
          withdrawalsUsedThisWeek: withdrawalsUsed,
          maxWithdrawalsPerWeek: tier.withdrawalFrequency
        };
      }

      return {
        canWithdraw: true,
        withdrawalsUsedThisWeek: withdrawalsUsed,
        maxWithdrawalsPerWeek: tier.withdrawalFrequency
      };

    } catch (error) {
      console.error('Error checking withdrawal eligibility:', error);
      return { 
        canWithdraw: false, 
        reason: 'Error checking withdrawal eligibility',
        withdrawalsUsedThisWeek: 0,
        maxWithdrawalsPerWeek: 1
      };
    }
  }

  // ================================================================
  // STATISTICS AND ANALYTICS
  // ================================================================

  /**
   * Get enhanced agent statistics
   */
  static async getEnhancedAgentStats(userId: string): Promise<EnhancedAgentStats | null> {
    try {
      const profile = await this.getAgentProfile(userId);
      if (!profile) return null;

      const tier = await this.getTierByName(profile.currentTier);
      const nextTier = await this.getNextTier(profile.currentTier);

      // Get basic stats (you can enhance this with real data)
      const basicStats = this.getMockBasicStats();

      // Calculate challenge info
      const challengeInfo = profile.isChallengeActive && profile.challengeEndDate ? {
        isActive: true,
        targetTier: nextTier,
        daysRemaining: Math.max(0, Math.ceil((new Date(profile.challengeEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
        progressPercentage: nextTier ? (profile.totalDirectReferrals / nextTier.referralRequirement) * 100 : 0,
        startDate: profile.challengeStartDate,
        endDate: profile.challengeEndDate
      } : {
        isActive: false,
        progressPercentage: 0
      };

      // Get withdrawal info
      const withdrawalInfo = await this.canAgentWithdraw(userId, 100);

      const enhancedStats: EnhancedAgentStats = {
        ...basicStats,
        currentTier: tier!,
        nextTier,
        challengeInfo,
        commissionInfo: {
          weeklyRate: tier!.commissionRate,
          withdrawalRate: ['silver', 'gold', 'platinum', 'diamond'].includes(profile.currentTier) ? tier!.commissionRate : 0,
          totalEarned: profile.totalCommissionEarned,
          pendingCommission: 0 // Calculate from pending transactions
        },
        withdrawalInfo: {
          frequency: tier!.withdrawalFrequency,
          usedThisWeek: withdrawalInfo.withdrawalsUsedThisWeek,
          canWithdrawToday: withdrawalInfo.canWithdraw,
          nextWithdrawalDate: withdrawalInfo.canWithdraw ? undefined : new Date()
        }
      };

      return enhancedStats;

    } catch (error) {
      console.error('Error getting enhanced agent stats:', error);
      return null;
    }
  }

  // ================================================================
  // HELPER FUNCTIONS
  // ================================================================

  /**
   * Enhance agent profile with computed properties
   */
  private static enhanceAgentProfile(profile: any): AgentProfile {
    const now = new Date();
    
    return {
      ...profile,
      id: profile.id,
      userId: profile.user_id,
      currentTier: profile.current_tier,
      totalDirectReferrals: profile.total_direct_referrals,
      currentChallengeTier: profile.current_challenge_tier,
      challengeStartDate: profile.challenge_start_date ? new Date(profile.challenge_start_date) : undefined,
      challengeEndDate: profile.challenge_end_date ? new Date(profile.challenge_end_date) : undefined,
      challengeAttempts: profile.challenge_attempts,
      lastTierAchievedDate: profile.last_tier_achieved_date ? new Date(profile.last_tier_achieved_date) : undefined,
      isChallengeActive: profile.is_challenge_active,
      weeklyEarnings: profile.weekly_earnings,
      totalCommissionEarned: profile.total_commission_earned,
      status: profile.status,
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at),
      
      // Computed properties
      tier: profile.agent_tiers,
      daysRemainingInChallenge: profile.challenge_end_date ? 
        Math.max(0, Math.ceil((new Date(profile.challenge_end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 
        undefined
    };
  }

  /**
   * Mock data for development/testing with new tier names
   */
  private static getMockTiers(): AgentTier[] {
    return [
      { id: 1, tierName: 'rookie', displayName: 'Rookie Agent', referralRequirement: 50, commissionRate: 5, withdrawalFrequency: 1, challengeDurationDays: 7, description: 'Entry level: 50 direct referrals in 7 days', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, tierName: 'bronze', displayName: 'Bronze Agent', referralRequirement: 100, commissionRate: 7, withdrawalFrequency: 1, challengeDurationDays: 7, description: 'Progressive: 100 direct referrals in 7 days', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, tierName: 'iron', displayName: 'Iron Agent', referralRequirement: 200, commissionRate: 10, withdrawalFrequency: 2, challengeDurationDays: 7, description: 'Advanced: 200 direct referrals in 7 days', createdAt: new Date(), updatedAt: new Date() },
      { id: 4, tierName: 'steel', displayName: 'Steel Agent', referralRequirement: 400, commissionRate: 15, withdrawalFrequency: 2, challengeDurationDays: 7, description: 'Expert: 400 direct referrals in 7 days (10 days for resets)', createdAt: new Date(), updatedAt: new Date() },
      { id: 5, tierName: 'silver', displayName: 'Silver Agent', referralRequirement: 1000, commissionRate: 20, withdrawalFrequency: 2, challengeDurationDays: 30, description: 'Silver: 1,000 network (direct + level 1) in 30 days', createdAt: new Date(), updatedAt: new Date() },
      { id: 6, tierName: 'gold', displayName: 'Gold Agent', referralRequirement: 5000, commissionRate: 25, withdrawalFrequency: 3, challengeDurationDays: 90, description: 'Gold: 5,000 network (direct + level 1) in 90 days', createdAt: new Date(), updatedAt: new Date() },
      { id: 7, tierName: 'platinum', displayName: 'Platinum Agent', referralRequirement: 10000, commissionRate: 30, withdrawalFrequency: 3, challengeDurationDays: 150, description: 'Platinum: 10,000 network (direct + level 1) in 150 days', createdAt: new Date(), updatedAt: new Date() },
      { id: 8, tierName: 'diamond', displayName: 'Diamond Agent', referralRequirement: 25000, commissionRate: 35, withdrawalFrequency: 4, challengeDurationDays: 300, description: 'Diamond: 25,000 network (direct + level 1) in 300 days', createdAt: new Date(), updatedAt: new Date() }
    ];
  }

  private static getMockAgentProfile(userId: string): AgentProfile {
    return {
      id: 1,
      userId,
      currentTier: 'rookie',
      currentChallengeTier: 'bronze',
      totalDirectReferrals: 25,
      totalLevel1IndirectReferrals: 0,
      totalNetworkSize: 25,
      challengeDirectReferrals: 25,
      challengeLevel1Referrals: 0,
      challengeTotalNetwork: 25,
      challengeAttempts: 0,
      challengeStartingReferrals: 0,
      challengeMaxReferralsReached: 0,
      isChallengeActive: true,
      weeklyEarnings: 0,
      totalCommissionEarned: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      challengeStartDate: new Date(),
      challengeEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days remaining
      usesDirectOnly: true,
      isFirstFourTiers: true,
      maxAttemptsAllowed: 2,
      resetStartingPoint: 50
    };
  }

  private static getMockAgentProfiles(): AgentProfile[] {
    const mockProfiles: AgentProfile[] = [];
    const tiers = ['rookie', 'bronze', 'iron', 'steel', 'silver', 'gold', 'platinum', 'diamond'];
    
    for (let i = 1; i <= 20; i++) {
      const tier = tiers[Math.floor(Math.random() * tiers.length)] as AgentProfile['currentTier'];
      mockProfiles.push({
        id: i,
        userId: `user-${i}`,
        currentTier: tier,
        totalDirectReferrals: Math.floor(Math.random() * 1000),
        totalLevel1IndirectReferrals: Math.floor(Math.random() * 500),
        totalNetworkSize: Math.floor(Math.random() * 1500),
        currentChallengeTier: tier === 'diamond' ? undefined : tiers[tiers.indexOf(tier) + 1] as AgentProfile['currentTier'],
        challengeDirectReferrals: Math.floor(Math.random() * 100),
        challengeLevel1Referrals: Math.floor(Math.random() * 50),
        challengeTotalNetwork: Math.floor(Math.random() * 150),
        challengeAttempts: Math.floor(Math.random() * 3),
        challengeStartingReferrals: 0,
        challengeMaxReferralsReached: Math.floor(Math.random() * 200),
        lastTierAchievedDate: new Date(Date.now() - Math.random() * 86400000 * 30),
        isChallengeActive: Math.random() > 0.5,
        weeklyEarnings: Math.random() * 500,
        totalCommissionEarned: Math.random() * 5000,
        status: 'active',
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 365),
        updatedAt: new Date(Date.now() - Math.random() * 86400000 * 7),
        challengeStartDate: new Date(Date.now() - Math.random() * 86400000 * 7),
        challengeEndDate: new Date(Date.now() + Math.random() * 86400000 * 7),
      });
    }
    
    return mockProfiles;
  }

  private static getMockBasicStats() {
    return {
      totalNetwork: 2847,
      activeUsers: 2456,
      totalEarnings: 15847.89,
      monthlyEarnings: 4567.89,
      weeklyEarnings: 890.45,
      conversionRate: 78.2,
      currentWeek: 1,
      cumulativeReferrals: 25,
      weeklyReferrals: 5,
      commissionRate: 5,
      agentLevel: 'Week 1' as const,
      milestoneProgress: {
        rookie: false,
        bronze: false,
        iron: false,
        steel: false,
        silverAgent: false
      },
      topPerformers: [
        { name: 'John Doe', referrals: 123, earnings: 1845.67 },
        { name: 'Jane Smith', referrals: 98, earnings: 1467.50 }
      ]
    };
  }

  // ================================================================
  // BACKGROUND TASKS
  // ================================================================

  /**
   * Run daily maintenance tasks
   */
  static async runDailyMaintenance(): Promise<void> {
    try {
      console.log('Running agent progression daily maintenance...');
      
      // Check for expired challenges
      await this.checkExpiredChallenges();
      
      // You can add more maintenance tasks here
      
      console.log('Daily maintenance completed successfully');
    } catch (error) {
      console.error('Error running daily maintenance:', error);
    }
  }

  // ================================================================
  // HELPER METHODS
  // ================================================================

  /**
   * Helper method to check if automatic tier promotion should occur
   */
  static async checkAutomaticPromotion(userId: string): Promise<void> {
    const profile = await this.getAgentProfile(userId);
    if (!profile) return;

    // Check if they have enough referrals for their current tier
    const tiers = await this.getAllTiers();
    const currentTier = tiers.find(t => t.tierName === profile.currentTier);
    
    if (currentTier && profile.totalDirectReferrals >= currentTier.referralRequirement) {
      // Auto-promote to next tier if not in a challenge
      if (!profile.isChallengeActive) {
        const nextTier = this.getNextTierByOrder(profile.currentTier, tiers);
        if (nextTier) {
          await this.startNextChallenge(userId, nextTier.tierName);
        }
      }
    }
  }

  /**
   * Helper method to get the next tier in progression
   */
  private static getNextTierByOrder(currentTier: string, tiers: AgentTier[]): AgentTier | null {
    const tierOrder = ['rookie', 'bronze', 'iron', 'steel', 'silver', 'gold', 'platinum', 'diamond'];
    const currentIndex = tierOrder.indexOf(currentTier);
    
    if (currentIndex === -1 || currentIndex >= tierOrder.length - 1) {
      return null; // Already at highest tier or invalid tier
    }
    
    const nextTierName = tierOrder[currentIndex + 1];
    return tiers.find(t => t.tierName === nextTierName) || null;
  }

  /**
   * Helper method to start the next challenge after successful completion
   */
  private static async startNextChallenge(userId: string, nextTierName: string): Promise<void> {
    const { data, error } = await supabase.rpc('start_next_challenge', {
      p_user_id: userId,
      p_next_tier: nextTierName
    });

    if (error) {
      console.error('Error starting next challenge:', error);
      throw new Error(`Failed to start next challenge: ${error.message}`);
    }
  }

  /**
   * Helper method to calculate challenge progress percentage
   */
  static calculateChallengeProgress(profile: AgentProfile, targetTier: AgentTier): number {
    if (!profile.isChallengeActive) return 0;
    
    const currentCount = profile.usesDirectOnly 
      ? profile.challengeDirectReferrals 
      : profile.challengeTotalNetwork;
    
    const required = targetTier.referralRequirement;
    const starting = profile.challengeStartingReferrals || 0;
    const target = required - starting;
    const progress = Math.max(0, currentCount - starting);
    
    return Math.min(100, Math.round((progress / target) * 100));
  }

  /**
   * Helper method to get time remaining in current challenge
   */
  static getChallengeTimeRemaining(profile: AgentProfile): { days: number, hours: number, minutes: number } | null {
    if (!profile.challengeEndDate || !profile.isChallengeActive) return null;
    
    const now = new Date();
    const endDate = new Date(profile.challengeEndDate);
    const msRemaining = endDate.getTime() - now.getTime();
    
    if (msRemaining <= 0) return { days: 0, hours: 0, minutes: 0 };
    
    const days = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes };
  }
}

export default AgentProgressionService;
