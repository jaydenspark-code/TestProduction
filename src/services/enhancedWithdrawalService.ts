/**
 * ================================================================
 * ENHANCED WITHDRAWAL SERVICE
 * ================================================================
 * Handles withdrawal requests with agent progression system integration
 * Supports tier-based withdrawal limits and commission calculations
 */

import { supabase } from '../lib/supabase';
import { WithdrawalRequest, AgentProfile } from '../types';
import AgentProgressionService from './agentProgressionService';
import { earningsEngine } from './earningsEngine';
import { showToast } from '../utils/toast';

export interface CreateWithdrawalRequest {
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentDetails: Record<string, any>;
  userNotes?: string;
}

export interface WithdrawalProcessingResult {
  success: boolean;
  withdrawalId?: string;
  message: string;
  totalAmount?: number;
  commissionAdded?: number;
  error?: string;
}

export class EnhancedWithdrawalService {
  
  // ================================================================
  // WITHDRAWAL REQUEST CREATION
  // ================================================================

  /**
   * Create a new withdrawal request with agent progression integration
   */
  static async createWithdrawalRequest(request: CreateWithdrawalRequest): Promise<WithdrawalProcessingResult> {
    try {
      console.log(`💳 Creating withdrawal request for user ${request.userId}, amount: $${request.amount}`);

      // Get user information
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role, full_name, email, country')
        .eq('id', request.userId)
        .single();

      if (userError || !user) {
        return { success: false, message: 'User not found', error: userError?.message };
      }

      const isAgent = user.role === 'agent';
      let agentProfile: AgentProfile | null = null;
      let canWithdraw = { canWithdraw: true, reason: '', withdrawalsUsedThisWeek: 0, maxWithdrawalsPerWeek: 1 };

      // Check agent-specific withdrawal rules
      if (isAgent) {
        agentProfile = await AgentProgressionService.getAgentProfile(request.userId);
        if (!agentProfile) {
          return { success: false, message: 'Agent profile not found' };
        }

        canWithdraw = await AgentProgressionService.canAgentWithdraw(request.userId, request.amount);
        if (!canWithdraw.canWithdraw) {
          return { success: false, message: canWithdraw.reason || 'Withdrawal not permitted' };
        }
      }

      // Validate minimum amount for regular users
      if (!isAgent && request.amount < 50) {
        return { success: false, message: 'Minimum withdrawal amount is $50' };
      }

      // Check user balance
      const userBalance = await earningsEngine.getUserBalance(request.userId);
      if (!userBalance || userBalance.availableBalance < request.amount) {
        return { success: false, message: 'Insufficient balance' };
      }

      // Create withdrawal request
      const withdrawalData: any = {
        user_id: request.userId,
        amount: request.amount,
        currency: request.currency,
        payment_method: request.paymentMethod,
        payment_details: request.paymentDetails,
        user_notes: request.userNotes,
        status: 'pending',
        is_agent_withdrawal: isAgent,
        weekly_withdrawal_count: canWithdraw.withdrawalsUsedThisWeek + 1
      };

      // Add agent-specific data
      if (isAgent && agentProfile) {
        withdrawalData.agent_tier = agentProfile.currentTier;
        
        // For Silver+ agents, calculate commission that will be added upon approval
        if (['silver', 'gold', 'platinum', 'diamond'].includes(agentProfile.currentTier)) {
          const commissionResult = await AgentProgressionService.calculateWithdrawalCommission(request.userId, request.amount);
          if (commissionResult.success && commissionResult.data) {
            withdrawalData.commission_rate = commissionResult.data.commissionRate;
            withdrawalData.commission_amount = commissionResult.data.commissionAmount;
            withdrawalData.total_amount_with_commission = commissionResult.data.totalAmount;
          }
        }
      }

      const { data: withdrawal, error: insertError } = await supabase
        .from('withdrawal_requests')
        .insert(withdrawalData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating withdrawal request:', insertError);
        return { success: false, message: 'Failed to create withdrawal request', error: insertError.message };
      }

      console.log(`✅ Withdrawal request created: ${withdrawal.id}`);

      return {
        success: true,
        withdrawalId: withdrawal.id,
        message: 'Withdrawal request submitted successfully. Admin approval required.',
        totalAmount: withdrawalData.total_amount_with_commission || request.amount,
        commissionAdded: withdrawalData.commission_amount || 0
      };

    } catch (error: any) {
      console.error('Error creating withdrawal request:', error);
      return { success: false, message: 'Failed to create withdrawal request', error: error.message };
    }
  }

  // ================================================================
  // ADMIN WITHDRAWAL MANAGEMENT
  // ================================================================

  /**
   * Get all pending withdrawal requests for admin review
   */
  static async getPendingWithdrawals(): Promise<WithdrawalRequest[]> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select(`
          *,
          users!withdrawal_requests_user_id_fkey(
            full_name,
            email,
            country,
            role
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching pending withdrawals:', error);
        return [];
      }

      return data?.map(this.enhanceWithdrawalRequest) || [];
    } catch (error) {
      console.error('Error getting pending withdrawals:', error);
      return [];
    }
  }

  /**
   * Approve withdrawal request
   */
  static async approveWithdrawal(
    withdrawalId: string, 
    adminId: string, 
    adminNotes?: string
  ): Promise<WithdrawalProcessingResult> {
    try {
      console.log(`✅ Admin ${adminId} approving withdrawal ${withdrawalId}`);

      // Get withdrawal request
      const { data: withdrawal, error: fetchError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (fetchError || !withdrawal) {
        return { success: false, message: 'Withdrawal request not found' };
      }

      if (withdrawal.status !== 'pending') {
        return { success: false, message: 'Withdrawal request is not pending' };
      }

      let finalAmount = withdrawal.amount;
      let commissionAdded = 0;

      // Process agent withdrawal commission if applicable
      if (withdrawal.is_agent_withdrawal && withdrawal.commission_amount > 0) {
        const commissionResult = await earningsEngine.processAgentWithdrawalCommission(
          withdrawal.user_id,
          withdrawal.amount,
          withdrawalId
        );

        if (commissionResult.success) {
          finalAmount = commissionResult.totalAmount;
          commissionAdded = commissionResult.commissionAmount;
          console.log(`💰 Agent withdrawal commission processed: $${commissionAdded}`);
        }
      }

      // Update withdrawal status
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'approved',
          admin_approved_by: adminId,
          admin_approved_at: new Date().toISOString(),
          admin_notes: adminNotes,
          total_amount_with_commission: finalAmount
        })
        .eq('id', withdrawalId);

      if (updateError) {
        console.error('Error approving withdrawal:', updateError);
        return { success: false, message: 'Failed to approve withdrawal', error: updateError.message };
      }

      // Deduct amount from user balance
      await this.updateUserBalanceForWithdrawal(withdrawal.user_id, withdrawal.amount);

      console.log(`✅ Withdrawal approved: ${withdrawalId}, final amount: $${finalAmount}`);

      return {
        success: true,
        withdrawalId,
        message: 'Withdrawal approved successfully',
        totalAmount: finalAmount,
        commissionAdded
      };

    } catch (error: any) {
      console.error('Error approving withdrawal:', error);
      return { success: false, message: 'Failed to approve withdrawal', error: error.message };
    }
  }

  /**
   * Reject withdrawal request
   */
  static async rejectWithdrawal(
    withdrawalId: string, 
    adminId: string, 
    reason: string
  ): Promise<WithdrawalProcessingResult> {
    try {
      console.log(`❌ Admin ${adminId} rejecting withdrawal ${withdrawalId}`);

      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          admin_rejected_by: adminId,
          admin_rejected_at: new Date().toISOString(),
          admin_notes: reason
        })
        .eq('id', withdrawalId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error rejecting withdrawal:', error);
        return { success: false, message: 'Failed to reject withdrawal', error: error.message };
      }

      return {
        success: true,
        withdrawalId,
        message: 'Withdrawal rejected successfully'
      };

    } catch (error: any) {
      console.error('Error rejecting withdrawal:', error);
      return { success: false, message: 'Failed to reject withdrawal', error: error.message };
    }
  }

  // ================================================================
  // USER WITHDRAWAL HISTORY
  // ================================================================

  /**
   * Get withdrawal history for a user
   */
  static async getUserWithdrawals(userId: string, limit: number = 20): Promise<WithdrawalRequest[]> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user withdrawals:', error);
        return [];
      }

      return data?.map(this.enhanceWithdrawalRequest) || [];
    } catch (error) {
      console.error('Error getting user withdrawals:', error);
      return [];
    }
  }

  // ================================================================
  // STATISTICS AND ANALYTICS
  // ================================================================

  /**
   * Get withdrawal statistics for admin dashboard
   */
  static async getWithdrawalStats(): Promise<{
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    pendingAmount: number;
    approvedAmount: number;
    agentWithdrawals: number;
    regularWithdrawals: number;
  }> {
    try {
      const { data: stats, error } = await supabase
        .from('withdrawal_requests')
        .select('status, amount, is_agent_withdrawal')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (error) {
        console.error('Error fetching withdrawal stats:', error);
        return this.getDefaultStats();
      }

      const result = {
        totalPending: 0,
        totalApproved: 0,
        totalRejected: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        agentWithdrawals: 0,
        regularWithdrawals: 0
      };

      stats?.forEach(withdrawal => {
        const amount = parseFloat(withdrawal.amount);
        
        switch (withdrawal.status) {
          case 'pending':
            result.totalPending++;
            result.pendingAmount += amount;
            break;
          case 'approved':
          case 'completed':
            result.totalApproved++;
            result.approvedAmount += amount;
            break;
          case 'rejected':
            result.totalRejected++;
            break;
        }

        if (withdrawal.is_agent_withdrawal) {
          result.agentWithdrawals++;
        } else {
          result.regularWithdrawals++;
        }
      });

      return result;
    } catch (error) {
      console.error('Error calculating withdrawal stats:', error);
      return this.getDefaultStats();
    }
  }

  // ================================================================
  // HELPER METHODS
  // ================================================================

  /**
   * Update user balance after withdrawal approval
   */
  private static async updateUserBalanceForWithdrawal(userId: string, amount: number): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_balance_for_withdrawal', {
        p_user_id: userId,
        p_amount: amount
      });

      if (error) {
        console.error('Error updating user balance for withdrawal:', error);
      }
    } catch (error) {
      console.error('Error updating user balance:', error);
    }
  }

  /**
   * Enhance withdrawal request with computed properties
   */
  private static enhanceWithdrawalRequest(withdrawal: any): WithdrawalRequest {
    return {
      ...withdrawal,
      id: withdrawal.id,
      userId: withdrawal.user_id,
      amount: parseFloat(withdrawal.amount),
      currency: withdrawal.currency,
      paymentMethod: withdrawal.payment_method,
      paymentDetails: withdrawal.payment_details,
      status: withdrawal.status,
      adminNotes: withdrawal.admin_notes,
      userNotes: withdrawal.user_notes,
      isAgentWithdrawal: withdrawal.is_agent_withdrawal,
      agentTier: withdrawal.agent_tier,
      commissionRate: withdrawal.commission_rate ? parseFloat(withdrawal.commission_rate) : undefined,
      commissionAmount: withdrawal.commission_amount ? parseFloat(withdrawal.commission_amount) : undefined,
      totalAmountWithCommission: withdrawal.total_amount_with_commission ? parseFloat(withdrawal.total_amount_with_commission) : undefined,
      weeklyWithdrawalCount: withdrawal.weekly_withdrawal_count,
      adminApprovedBy: withdrawal.admin_approved_by,
      adminApprovedAt: withdrawal.admin_approved_at ? new Date(withdrawal.admin_approved_at) : undefined,
      adminRejectedBy: withdrawal.admin_rejected_by,
      adminRejectedAt: withdrawal.admin_rejected_at ? new Date(withdrawal.admin_rejected_at) : undefined,
      createdAt: new Date(withdrawal.created_at),
      updatedAt: new Date(withdrawal.updated_at),
      
      // Computed properties
      user: withdrawal.users,
      canApprove: withdrawal.status === 'pending',
      isOverLimit: false // Could add logic to check limits
    };
  }

  /**
   * Default stats for error cases
   */
  private static getDefaultStats() {
    return {
      totalPending: 0,
      totalApproved: 0,
      totalRejected: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      agentWithdrawals: 0,
      regularWithdrawals: 0
    };
  }

  // ================================================================
  // VALIDATION HELPERS
  // ================================================================

  /**
   * Validate withdrawal request data
   */
  static validateWithdrawalRequest(request: CreateWithdrawalRequest): { valid: boolean; error?: string } {
    if (!request.userId || !request.amount || !request.currency || !request.paymentMethod) {
      return { valid: false, error: 'Missing required fields' };
    }

    if (request.amount <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }

    if (request.amount > 10000) {
      return { valid: false, error: 'Amount exceeds maximum limit of $10,000' };
    }

    if (!['USD', 'GHS', 'NGN', 'KES'].includes(request.currency)) {
      return { valid: false, error: 'Unsupported currency' };
    }

    if (!['bank_transfer', 'paypal', 'mobile_money', 'crypto'].includes(request.paymentMethod)) {
      return { valid: false, error: 'Unsupported payment method' };
    }

    return { valid: true };
  }
}

export default EnhancedWithdrawalService;
