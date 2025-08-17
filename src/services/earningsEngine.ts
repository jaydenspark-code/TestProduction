import { supabase } from '../lib/supabase';
import AgentProgressionService from './agentProgressionService';

export interface EarningsData {
  userId: string;
  type: 'referral' | 'task' | 'ad_view' | 'activity' | 'bonus' | 'commission' | 'agent_weekly_bonus' | 'agent_withdrawal_commission';
  amount: number;
  currency: string;
  description: string;
  metadata?: any;
  referenceId?: string;
}

export interface UserBalance {
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  withdrawnAmount: number;
  currency: string;
  lastUpdated: Date;
}

export interface EarningsConfig {
  referralCommissions: {
    level1: number; // Direct referral: $25
    level2: number; // Level 2: $5  
    level3: number; // Level 3: $2.50
  };
  taskRewards: {
    basic: number;
    premium: number;
    expert: number;
  };
  socialMediaRewards: {
    telegram: number; // $0.25
    youtube: number;  // $0.25
  };
  adViewRates: {
    basic: number;    // $0.02 per ad
    premium: number;  // $0.05 per ad
  };
  activityBonuses: {
    dailyLogin: number;
    weeklyStreak: number;
    monthlyGoal: number;
  };
  withdrawalLimits: {
    weekly: number;
    minimum: number;
    maximum: number;
  };
}

class EarningsEngine {
  private config: EarningsConfig;

  constructor() {
    this.config = {
      referralCommissions: {
        level1: 1.50, // $1.50 for direct referral (sustainable)
        level2: 1.00, // $1.00 for level 2 referral  
        level3: 0.50, // $0.50 for level 3 referral
      },
      taskRewards: {
        basic: 0.50,   // Social media tasks
        premium: 1.00, // Daily video watching
        expert: 2.50,  // Special tasks
      },
      socialMediaRewards: {
        telegram: 0.25, // $0.25 for joining Telegram
        youtube: 0.25,  // $0.25 for subscribing YouTube
      },
      adViewRates: {
        basic: 0.02,   // $0.02 per basic ad
        premium: 0.05, // $0.05 per premium ad
      },
      activityBonuses: {
        dailyLogin: 0.05,
        weeklyStreak: 0.25,
        monthlyGoal: 2.00,
      },
      withdrawalLimits: {
        weekly: 100.00,
        minimum: 5.00,
        maximum: 500.00,
      },
    };
  }

  /**
   * Add earnings to user account
   */
  async addEarnings(earningsData: EarningsData): Promise<boolean> {
    try {
      console.log(`💰 Adding earnings: ${earningsData.amount} ${earningsData.currency} for ${earningsData.type}`);

      // Start transaction
      const { data, error } = await supabase.rpc('add_user_earnings', {
        p_user_id: earningsData.userId,
        p_type: earningsData.type,
        p_amount: earningsData.amount,
        p_currency: earningsData.currency || 'USD',
        p_description: earningsData.description,
        p_metadata: earningsData.metadata || {},
        p_reference_id: earningsData.referenceId,
      });

      if (error) {
        console.error('❌ Failed to add earnings:', error);
        return false;
      }

      console.log('✅ Earnings added successfully');

      // Trigger real-time balance update
      await this.notifyBalanceUpdate(earningsData.userId);

      return true;
    } catch (error: any) {
      console.error('❌ Error adding earnings:', error);
      return false;
    }
  }

  /**
   * Process multi-level referral commission when user activates account
   * Enhanced with agent progression tracking
   */
  async processReferralCommissions(newUserId: string, activationAmount: number = 15.00): Promise<boolean> {
    try {
      console.log(`💰 Processing referral commissions for user activation: ${newUserId}`);

      // Get the referral chain for this user
      const { data: referralChain, error } = await supabase.rpc('get_referral_chain', {
        p_user_id: newUserId
      });

      if (error) {
        console.error('❌ Failed to get referral chain:', error);
        return false;
      }

      let totalCommissionsPaid = 0;

      // Process Level 1 (Direct referrer) - $1.50 (Updated amount)
      if (referralChain?.level1_referrer) {
        const level1Commission = this.config.referralCommissions.level1;
        
        const success1 = await this.addEarnings({
          userId: referralChain.level1_referrer,
          type: 'referral',
          amount: level1Commission,
          currency: 'USD',
          description: `Level 1 referral commission - Direct referral activated`,
          metadata: {
            referredUserId: newUserId,
            level: 1,
            activationAmount
          },
          referenceId: `ref_l1_${newUserId}_${Date.now()}`,
        });

        if (success1) {
          totalCommissionsPaid += level1Commission;
          console.log(`✅ Level 1 commission paid: $${level1Commission} to ${referralChain.level1_referrer}`);
          
          // Update agent progression for direct referrer
          await this.updateAgentProgression(referralChain.level1_referrer, newUserId);
        }

        // Process Level 2 (Referrer's referrer) - $1.00 (Updated amount)
        if (referralChain?.level2_referrer) {
          const level2Commission = this.config.referralCommissions.level2;
          
          const success2 = await this.addEarnings({
            userId: referralChain.level2_referrer,
            type: 'referral',
            amount: level2Commission,
            currency: 'USD',
            description: `Level 2 referral commission - Indirect referral activated`,
            metadata: {
              referredUserId: newUserId,
              level: 2,
              activationAmount
            },
            referenceId: `ref_l2_${newUserId}_${Date.now()}`,
          });

          if (success2) {
            totalCommissionsPaid += level2Commission;
            console.log(`✅ Level 2 commission paid: $${level2Commission} to ${referralChain.level2_referrer}`);
          }

          // Process Level 3 (Referrer's referrer's referrer) - $0.50 (Updated amount)
          if (referralChain?.level3_referrer) {
            const level3Commission = this.config.referralCommissions.level3;
            
            const success3 = await this.addEarnings({
              userId: referralChain.level3_referrer,
              type: 'referral',
              amount: level3Commission,
              currency: 'USD',
              description: `Level 3 referral commission - Multi-level activation`,
              metadata: {
                referredUserId: newUserId,
                level: 3,
                activationAmount
              },
              referenceId: `ref_l3_${newUserId}_${Date.now()}`,
            });

            if (success3) {
              totalCommissionsPaid += level3Commission;
              console.log(`✅ Level 3 commission paid: $${level3Commission} to ${referralChain.level3_referrer}`);
            }
          }
        }
      }

      if (totalCommissionsPaid > 0) {
        console.log(`🎉 Total referral commissions paid: $${totalCommissionsPaid}`);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('❌ Error processing referral commissions:', error);
      return false;
    }
  }

  /**
   * Update agent progression when they get a new direct referral
   */
  private async updateAgentProgression(referrerUserId: string, newReferralUserId: string): Promise<void> {
    try {
      // Check if referrer is an agent
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', referrerUserId)
        .single();

      if (userError || !user || user.role !== 'agent') {
        return; // Not an agent, skip progression update
      }

      // Get current referral count for this agent
      const { data: referralCount, error: countError } = await supabase
        .rpc('count_direct_referrals', { p_user_id: referrerUserId });

      if (countError) {
        console.error('Error counting direct referrals:', countError);
        return;
      }

      // Update agent progression
      const progressionResult = await AgentProgressionService.updateReferralCount(
        referrerUserId, 
        referralCount || 0
      );

      if (progressionResult.success && progressionResult.data?.tierChanged) {
        console.log(`🎉 Agent ${referrerUserId} progressed to ${progressionResult.data.newTier?.displayName}!`);
      }

    } catch (error) {
      console.error('Error updating agent progression:', error);
    }
  }

  /**
   * Process social media onboarding reward  
   */
  async processSocialMediaReward(userId: string, platform: 'telegram' | 'youtube'): Promise<boolean> {
    try {
      const rewardAmount = this.config.socialMediaRewards[platform];

      const earningsData: EarningsData = {
        userId,
        type: 'bonus',
        amount: rewardAmount,
        currency: 'USD',
        description: `Social media onboarding - ${platform.charAt(0).toUpperCase() + platform.slice(1)} joined`,
        metadata: {
          platform,
          onboardingReward: true,
        },
        referenceId: `social_${platform}_${userId}_${Date.now()}`,
      };

      return await this.addEarnings(earningsData);
    } catch (error: any) {
      console.error('❌ Error processing social media reward:', error);
      return false;
    }
  }

  /**
   * Process ad view reward with correct rates
   */
  async processAdViewReward(userId: string, adId: string, adType: 'basic' | 'premium' = 'basic'): Promise<boolean> {
    try {
      const rewardAmount = this.config.adViewRates[adType];

      const earningsData: EarningsData = {
        userId,
        type: 'ad_view',
        amount: rewardAmount,
        currency: 'USD',
        description: `Ad view reward - ${adType} ad`,
        metadata: {
          adId,
          adType,
          viewedAt: new Date().toISOString(),
        },
        referenceId: `ad_${adType}_${adId}_${userId}_${Date.now()}`,
      };

      return await this.addEarnings(earningsData);
    } catch (error: any) {
      console.error('❌ Error processing ad view reward:', error);
      return false;
    }
  }

  /**
   * Process task completion reward
   */
  async processTaskReward(userId: string, taskType: 'basic' | 'premium' | 'expert', taskId: string): Promise<boolean> {
    try {
      const rewardAmount = this.config.taskRewards[taskType];

      const earningsData: EarningsData = {
        userId,
        type: 'task',
        amount: rewardAmount,
        currency: 'USD',
        description: `Task completion reward (${taskType})`,
        metadata: {
          taskType,
          taskId,
        },
        referenceId: `task_${taskId}_${userId}`,
      };

      return await this.addEarnings(earningsData);
    } catch (error: any) {
      console.error('❌ Error processing task reward:', error);
      return false;
    }
  }

  /**
   * Process ad view reward
   */
  async processAdViewReward(userId: string, adId: string, adProvider: string): Promise<boolean> {
    try {
      const rewardAmount = this.config.adViewRate;

      const earningsData: EarningsData = {
        userId,
        type: 'ad_view',
        amount: rewardAmount,
        currency: 'USD',
        description: `Ad view reward`,
        metadata: {
          adId,
          adProvider,
          viewedAt: new Date().toISOString(),
        },
        referenceId: `ad_${adId}_${userId}_${Date.now()}`,
      };

      return await this.addEarnings(earningsData);
    } catch (error: any) {
      console.error('❌ Error processing ad view reward:', error);
      return false;
    }
  }

  /**
   * Process activity bonus
   */
  async processActivityBonus(userId: string, activityType: 'dailyLogin' | 'weeklyStreak' | 'monthlyGoal', streakCount?: number): Promise<boolean> {
    try {
      let bonusAmount = this.config.activityBonuses[activityType];
      let description = `Activity bonus: ${activityType}`;

      // Apply streak multiplier for weekly streaks
      if (activityType === 'weeklyStreak' && streakCount) {
        bonusAmount *= Math.min(streakCount, 10); // Cap at 10x multiplier
        description += ` (${streakCount} weeks)`;
      }

      const earningsData: EarningsData = {
        userId,
        type: 'activity',
        amount: bonusAmount,
        currency: 'USD',
        description,
        metadata: {
          activityType,
          streakCount,
          bonusDate: new Date().toISOString(),
        },
        referenceId: `activity_${activityType}_${userId}_${Date.now()}`,
      };

      return await this.addEarnings(earningsData);
    } catch (error: any) {
      console.error('❌ Error processing activity bonus:', error);
      return false;
    }
  }

  /**
   * Get user balance
   */
  async getUserBalance(userId: string): Promise<UserBalance | null> {
    try {
      const { data, error } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No balance record exists, create one
          return await this.createUserBalance(userId);
        }
        console.error('❌ Failed to get user balance:', error);
        return null;
      }

      return {
        userId: data.user_id,
        availableBalance: parseFloat(data.available_balance),
        pendingBalance: parseFloat(data.pending_balance),
        totalEarnings: parseFloat(data.total_earnings),
        withdrawnAmount: parseFloat(data.withdrawn_amount),
        currency: data.currency,
        lastUpdated: new Date(data.updated_at),
      };
    } catch (error: any) {
      console.error('❌ Error getting user balance:', error);
      return null;
    }
  }

  /**
   * Create initial user balance record
   */
  private async createUserBalance(userId: string): Promise<UserBalance> {
    try {
      const initialBalance = {
        user_id: userId,
        available_balance: 0,
        pending_balance: 0,
        total_earnings: 0,
        withdrawn_amount: 0,
        currency: 'USD',
      };

      const { data, error } = await supabase
        .from('user_balances')
        .insert(initialBalance)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create user balance:', error);
        throw error;
      }

      return {
        userId: data.user_id,
        availableBalance: 0,
        pendingBalance: 0,
        totalEarnings: 0,
        withdrawnAmount: 0,
        currency: 'USD',
        lastUpdated: new Date(data.created_at),
      };
    } catch (error: any) {
      console.error('❌ Error creating user balance:', error);
      throw error;
    }
  }

  /**
   * Check withdrawal eligibility
   */
  async checkWithdrawalEligibility(userId: string, requestedAmount: number): Promise<{
    eligible: boolean;
    reason?: string;
    availableAmount?: number;
    weeklyLimit?: number;
    weeklyUsed?: number;
  }> {
    try {
      // Get user balance
      const balance = await this.getUserBalance(userId);
      if (!balance) {
        return { eligible: false, reason: 'User balance not found' };
      }

      // Check minimum amount
      if (requestedAmount < this.config.withdrawalLimits.minimum) {
        return {
          eligible: false,
          reason: `Minimum withdrawal amount is $${this.config.withdrawalLimits.minimum}`,
        };
      }

      // Check maximum amount
      if (requestedAmount > this.config.withdrawalLimits.maximum) {
        return {
          eligible: false,
          reason: `Maximum withdrawal amount is $${this.config.withdrawalLimits.maximum}`,
        };
      }

      // Check available balance
      if (requestedAmount > balance.availableBalance) {
        return {
          eligible: false,
          reason: 'Insufficient available balance',
          availableAmount: balance.availableBalance,
        };
      }

      // Check weekly limit
      const weeklyUsed = await this.getWeeklyWithdrawalAmount(userId);
      const remainingWeekly = this.config.withdrawalLimits.weekly - weeklyUsed;

      if (requestedAmount > remainingWeekly) {
        return {
          eligible: false,
          reason: 'Weekly withdrawal limit exceeded',
          weeklyLimit: this.config.withdrawalLimits.weekly,
          weeklyUsed,
        };
      }

      return { eligible: true };
    } catch (error: any) {
      console.error('❌ Error checking withdrawal eligibility:', error);
      return { eligible: false, reason: 'Error checking eligibility' };
    }
  }

  /**
   * Get weekly withdrawal amount
   */
  private async getWeeklyWithdrawalAmount(userId: string): Promise<number> {
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('amount')
        .eq('user_id', userId)
        .gte('created_at', weekStart.toISOString())
        .in('status', ['pending', 'processing', 'completed']);

      if (error) {
        console.error('❌ Failed to get weekly withdrawals:', error);
        return 0;
      }

      return data.reduce((total, withdrawal) => total + parseFloat(withdrawal.amount), 0);
    } catch (error: any) {
      console.error('❌ Error getting weekly withdrawal amount:', error);
      return 0;
    }
  }

  /**
   * Process withdrawal request
   */
  async processWithdrawal(userId: string, amount: number, paymentMethod: string, paymentDetails: any): Promise<{
    success: boolean;
    withdrawalId?: string;
    error?: string;
  }> {
    try {
      // Check eligibility
      const eligibility = await this.checkWithdrawalEligibility(userId, amount);
      if (!eligibility.eligible) {
        return { success: false, error: eligibility.reason };
      }

      // Create withdrawal request
      const withdrawalData = {
        user_id: userId,
        amount: amount,
        currency: 'USD',
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        status: 'pending',
        fee_amount: this.calculateWithdrawalFee(amount, paymentMethod),
      };

      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert(withdrawalData)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create withdrawal request:', error);
        return { success: false, error: 'Failed to create withdrawal request' };
      }

      // Update user balance (move from available to pending)
      await this.updateBalanceForWithdrawal(userId, amount);

      console.log('✅ Withdrawal request created:', data.id);

      return { success: true, withdrawalId: data.id };
    } catch (error: any) {
      console.error('❌ Error processing withdrawal:', error);
      return { success: false, error: 'Withdrawal processing failed' };
    }
  }

  /**
   * Calculate withdrawal fee
   */
  private calculateWithdrawalFee(amount: number, paymentMethod: string): number {
    // Different fee structures based on payment method
    const feeRates = {
      paypal: 0.025, // 2.5%
      bank_transfer: 1.00, // $1 flat fee
      crypto: 0.01, // 1%
      mobile_money: 0.02, // 2%
    };

    const rate = feeRates[paymentMethod as keyof typeof feeRates] || 0.025;
    
    if (paymentMethod === 'bank_transfer') {
      return rate; // Flat fee
    } else {
      return amount * rate; // Percentage fee
    }
  }

  /**
   * Update balance for withdrawal
   */
  private async updateBalanceForWithdrawal(userId: string, amount: number): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_balance_for_withdrawal', {
        p_user_id: userId,
        p_amount: amount,
      });

      if (error) {
        console.error('❌ Failed to update balance for withdrawal:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('❌ Error updating balance for withdrawal:', error);
      throw error;
    }
  }

  /**
   * Log referral activity
   */
  private async logReferralActivity(referrerUserId: string, referredUserId: string, commissionAmount: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('referral_activities')
        .insert({
          referrer_user_id: referrerUserId,
          referred_user_id: referredUserId,
          commission_amount: commissionAmount,
          activity_type: 'deposit_commission',
        });

      if (error) {
        console.error('❌ Failed to log referral activity:', error);
      }
    } catch (error: any) {
      console.error('❌ Error logging referral activity:', error);
    }
  }

  /**
   * Notify balance update via real-time subscription
   */
  private async notifyBalanceUpdate(userId: string): Promise<void> {
    try {
      // Trigger real-time update
      const { error } = await supabase
        .from('balance_updates')
        .insert({
          user_id: userId,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.warn('⚠️ Failed to trigger balance update notification:', error);
      }
    } catch (error: any) {
      console.warn('⚠️ Error triggering balance update:', error);
    }
  }

  /**
   * Get earnings history
   */
  async getEarningsHistory(userId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('earnings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Failed to get earnings history:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('❌ Error getting earnings history:', error);
      return [];
    }
  }

  /**
   * Get earnings configuration
   */
  getConfig(): EarningsConfig {
    return { ...this.config };
  }

  /**
   * Update earnings configuration (admin only)
   */
  updateConfig(newConfig: Partial<EarningsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('✅ Earnings configuration updated');
  }

  // ================================================================
  // AGENT COMMISSION METHODS
  // ================================================================

  /**
   * Process weekly commission bonus for Week 1-3 agents
   */
  async processAgentWeeklyBonus(userId: string, weeklyEarnings: number): Promise<boolean> {
    try {
      console.log(`💰 Processing agent weekly bonus for ${userId}, earnings: $${weeklyEarnings}`);

      // Calculate commission using AgentProgressionService
      const commissionResult = await AgentProgressionService.calculateWeeklyCommission(userId, weeklyEarnings);
      
      if (!commissionResult.success || !commissionResult.data) {
        console.log(`ℹ️ No weekly bonus applicable for agent ${userId}`);
        return false;
      }

      const { commissionAmount, commissionRate, tier } = commissionResult.data;

      if (commissionAmount <= 0) {
        return false;
      }

      // Add commission earnings
      const success = await this.addEarnings({
        userId,
        type: 'agent_weekly_bonus',
        amount: commissionAmount,
        currency: 'USD',
        description: `Agent weekly bonus - ${commissionRate}% commission on $${weeklyEarnings} earnings`,
        metadata: {
          weeklyEarnings,
          commissionRate,
          tier,
          weekEnding: new Date().toISOString().split('T')[0]
        },
        referenceId: `agent_weekly_${userId}_${Date.now()}`,
      });

      if (success) {
        console.log(`✅ Agent weekly bonus paid: $${commissionAmount} (${commissionRate}%) to ${userId}`);
        
        // Record in agent commission transactions
        await this.recordAgentCommissionTransaction(
          userId,
          'weekly_bonus',
          weeklyEarnings,
          commissionRate,
          commissionAmount,
          tier
        );
      }

      return success;
    } catch (error: any) {
      console.error('❌ Error processing agent weekly bonus:', error);
      return false;
    }
  }

  /**
   * Process withdrawal commission for Silver+ agents
   */
  async processAgentWithdrawalCommission(
    userId: string, 
    withdrawalAmount: number, 
    withdrawalRequestId: string
  ): Promise<{ success: boolean; commissionAmount: number; totalAmount: number }> {
    try {
      console.log(`💰 Processing agent withdrawal commission for ${userId}, amount: $${withdrawalAmount}`);

      // Calculate commission using AgentProgressionService
      const commissionResult = await AgentProgressionService.calculateWithdrawalCommission(userId, withdrawalAmount);
      
      if (!commissionResult.success || !commissionResult.data) {
        return { success: false, commissionAmount: 0, totalAmount: withdrawalAmount };
      }

      const { commissionAmount, commissionRate, tier, totalAmount } = commissionResult.data;

      if (commissionAmount <= 0) {
        return { success: true, commissionAmount: 0, totalAmount: withdrawalAmount };
      }

      // Add commission earnings
      const success = await this.addEarnings({
        userId,
        type: 'agent_withdrawal_commission',
        amount: commissionAmount,
        currency: 'USD',
        description: `Agent withdrawal commission - ${commissionRate}% bonus on $${withdrawalAmount} withdrawal`,
        metadata: {
          withdrawalAmount,
          commissionRate,
          tier,
          withdrawalRequestId,
          processedAt: new Date().toISOString()
        },
        referenceId: `agent_withdrawal_${withdrawalRequestId}_${Date.now()}`,
      });

      if (success) {
        console.log(`✅ Agent withdrawal commission paid: $${commissionAmount} (${commissionRate}%) to ${userId}`);
        
        // Record in agent commission transactions
        await this.recordAgentCommissionTransaction(
          userId,
          'withdrawal_commission',
          withdrawalAmount,
          commissionRate,
          commissionAmount,
          tier,
          withdrawalRequestId
        );

        return { success: true, commissionAmount, totalAmount };
      }

      return { success: false, commissionAmount: 0, totalAmount: withdrawalAmount };
    } catch (error: any) {
      console.error('❌ Error processing agent withdrawal commission:', error);
      return { success: false, commissionAmount: 0, totalAmount: withdrawalAmount };
    }
  }

  /**
   * Record agent commission transaction for admin tracking
   */
  private async recordAgentCommissionTransaction(
    userId: string,
    transactionType: 'weekly_bonus' | 'withdrawal_commission',
    baseAmount: number,
    commissionRate: number,
    commissionAmount: number,
    tier: string,
    withdrawalRequestId?: string
  ): Promise<void> {
    try {
      // Get agent profile ID
      const agentProfile = await AgentProgressionService.getAgentProfile(userId);
      if (!agentProfile) {
        console.warn(`No agent profile found for user ${userId}`);
        return;
      }

      const { error } = await supabase
        .from('agent_commission_transactions')
        .insert({
          agent_profile_id: agentProfile.id,
          user_id: userId,
          transaction_type: transactionType,
          base_amount: baseAmount,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          tier_at_time: tier,
          withdrawal_request_id: withdrawalRequestId,
          status: 'approved', // Auto-approved for now
          admin_approved_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error recording agent commission transaction:', error);
      }
    } catch (error) {
      console.error('Error recording agent commission transaction:', error);
    }
  }

  /**
   * Calculate total earnings for an agent for the current week
   */
  async getAgentWeeklyEarnings(userId: string): Promise<number> {
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
      weekStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('earnings')
        .select('amount')
        .eq('user_id', userId)
        .gte('created_at', weekStart.toISOString())
        .neq('type', 'agent_weekly_bonus') // Exclude previous bonuses
        .neq('type', 'agent_withdrawal_commission'); // Exclude withdrawal commissions

      if (error) {
        console.error('Error getting agent weekly earnings:', error);
        return 0;
      }

      return data?.reduce((total, earning) => total + parseFloat(earning.amount), 0) || 0;
    } catch (error) {
      console.error('Error calculating agent weekly earnings:', error);
      return 0;
    }
  }

  /**
   * Run weekly agent commission processing (to be called by scheduled job)
   */
  async processWeeklyAgentCommissions(): Promise<void> {
    try {
      console.log('🔄 Starting weekly agent commission processing...');

      // Get all active agents with Week 1-3 tiers
      const { data: agents, error } = await supabase
        .from('agent_profiles')
        .select('user_id, current_tier')
        .eq('status', 'active')
        .in('current_tier', ['rookie', 'bronze', 'iron']);

      if (error) {
        console.error('Error fetching agents for weekly processing:', error);
        return;
      }

      let processedCount = 0;
      let totalCommissionsPaid = 0;

      for (const agent of agents || []) {
        const weeklyEarnings = await this.getAgentWeeklyEarnings(agent.user_id);
        
        if (weeklyEarnings > 0) {
          const success = await this.processAgentWeeklyBonus(agent.user_id, weeklyEarnings);
          if (success) {
            processedCount++;
            // Calculate commission amount for logging
            const commissionResult = await AgentProgressionService.calculateWeeklyCommission(agent.user_id, weeklyEarnings);
            if (commissionResult.success && commissionResult.data) {
              totalCommissionsPaid += commissionResult.data.commissionAmount;
            }
          }
        }
      }

      console.log(`✅ Weekly agent commission processing completed: ${processedCount} agents processed, $${totalCommissionsPaid.toFixed(2)} total paid`);
    } catch (error) {
      console.error('Error in weekly agent commission processing:', error);
    }
  }
}

// Export singleton instance
export const earningsEngine = new EarningsEngine();
export default EarningsEngine;
