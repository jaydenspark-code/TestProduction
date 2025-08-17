import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';

export interface SocialMediaProfile {
  platform: string;
  username: string;
  followers: number;
  url: string;
  verified?: boolean;
}

export interface ApplicationData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    country: string;
    preferredLanguage: string;
  };
  motivation: {
    experience: string;
    reason: string;
    goals: string;
  };
  socialMediaProfiles: Record<string, SocialMediaProfile>;
}

export interface ApplicationReview {
  id: string;
  userId: string;
  applicationData: ApplicationData;
  aiScore: number;
  aiDecision: 'approved' | 'rejected' | 'flagged' | 'pending';
  aiDecisionReason: string;
  aiComplianceDetails: Record<string, any>;
  adminStatus: 'approved' | 'rejected' | 'pending';
  adminReviewedBy?: string;
  adminReviewReason?: string;
  finalStatus: 'approved' | 'rejected' | 'pending';
  isReapplication: boolean;
  submittedAt: string;
  processedAt?: string;
}

export interface PlatformRequirement {
  platformName: string;
  minFollowers: number;
  verificationMethod: 'api' | 'manual';
  isActive: boolean;
}

export interface ApplicationStats {
  totalApplications: number;
  aiApproved: number;
  aiRejected: number;
  aiFlagged: number;
  adminApproved: number;
  adminRejected: number;
  adminOverrides: number;
  averageAiScore: number;
  platformStats: Record<string, any>;
}

export interface AIReviewResult {
  success: boolean;
  aiScore: number;
  aiDecision: string;
  complianceDetails: Record<string, any>;
  message: string;
}

class AIApplicationService {
  /**
   * Get platform requirements
   */
  static async getPlatformRequirements(): Promise<PlatformRequirement[]> {
    try {
      const { data, error } = await supabase
        .from('social_media_platforms')
        .select('*')
        .eq('is_active', true)
        .order('platform_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching platform requirements:', error);
      throw error;
    }
  }

  /**
   * Submit new agent application
   */
  static async submitApplication(
    userId: string,
    applicationData: ApplicationData
  ): Promise<{ success: boolean; applicationId?: string; error?: string }> {
    try {
      // Check if user already has a pending application
      const { data: existingApp } = await supabase
        .from('agent_applications')
        .select('id, final_status')
        .eq('user_id', userId)
        .eq('final_status', 'pending')
        .maybeSingle();

      if (existingApp) {
        return { 
          success: false, 
          error: 'You already have a pending application. Please wait for review or contact support.' 
        };
      }

      // Check if user is already an agent
      const { data: agentProfile } = await supabase
        .from('agent_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (agentProfile) {
        return { 
          success: false, 
          error: 'You are already an active agent.' 
        };
      }

      // Insert application
      const { data, error } = await supabase
        .from('agent_applications')
        .insert({
          user_id: userId,
          application_data: applicationData,
          social_media_profiles: applicationData.socialMediaProfiles,
          ai_decision: 'pending',
          admin_status: 'pending',
          final_status: 'pending'
        })
        .select('id')
        .single();

      if (error) throw error;

      // Trigger AI review
      const reviewResult = await this.processAIReview(data.id);
      
      if (reviewResult.success) {
        showToast('Application submitted successfully! AI review completed.', 'success');
        return { success: true, applicationId: data.id };
      } else {
        showToast('Application submitted but AI review failed. Admin will review manually.', 'warning');
        return { success: true, applicationId: data.id };
      }

    } catch (error) {
      console.error('Error submitting application:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process AI review for application
   */
  static async processAIReview(applicationId: string): Promise<AIReviewResult> {
    try {
      const { data, error } = await supabase.rpc('process_ai_application_review', {
        p_application_id: applicationId
      });

      if (error) throw error;

      const result = data[0];
      return {
        success: result.success,
        aiScore: result.ai_score,
        aiDecision: result.ai_decision,
        complianceDetails: result.compliance_details,
        message: result.message
      };

    } catch (error) {
      console.error('Error processing AI review:', error);
      return {
        success: false,
        aiScore: 0,
        aiDecision: 'error',
        complianceDetails: {},
        message: error.message
      };
    }
  }

  /**
   * Get all applications for admin review
   */
  static async getApplicationsForReview(
    status?: 'pending' | 'approved' | 'rejected' | 'flagged',
    limit = 50,
    offset = 0
  ): Promise<ApplicationReview[]> {
    try {
      let query = supabase
        .from('agent_applications')
        .select(`
          *,
          user:auth.users(email, raw_user_meta_data),
          admin_reviewer:auth.users!admin_reviewed_by(email, raw_user_meta_data)
        `)
        .order('submitted_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        if (status === 'pending') {
          query = query.or('admin_status.eq.pending,ai_decision.eq.flagged');
        } else {
          query = query.eq('final_status', status);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(app => ({
        id: app.id,
        userId: app.user_id,
        applicationData: app.application_data,
        aiScore: app.ai_score,
        aiDecision: app.ai_decision,
        aiDecisionReason: app.ai_decision_reason,
        aiComplianceDetails: app.ai_compliance_details || {},
        adminStatus: app.admin_status,
        adminReviewedBy: app.admin_reviewed_by,
        adminReviewReason: app.admin_review_reason,
        finalStatus: app.final_status,
        isReapplication: app.is_reapplication,
        submittedAt: app.submitted_at,
        processedAt: app.processed_at,
        userEmail: app.user?.email,
        adminReviewerEmail: app.admin_reviewer?.email
      }));

    } catch (error) {
      console.error('Error fetching applications for review:', error);
      throw error;
    }
  }

  /**
   * Process admin review decision
   */
  static async processAdminReview(
    applicationId: string,
    adminId: string,
    decision: 'approved' | 'rejected',
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('process_admin_application_review', {
        p_application_id: applicationId,
        p_admin_id: adminId,
        p_decision: decision,
        p_reason: reason
      });

      if (error) throw error;

      const result = data[0];
      
      if (result.success) {
        showToast(`Application ${decision} successfully!`, 'success');
        
        // Send real-time notification
        await this.sendApplicationNotification(applicationId, decision, reason);
      }

      return result;

    } catch (error) {
      console.error('Error processing admin review:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get application statistics
   */
  static async getApplicationStats(date?: string): Promise<ApplicationStats> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      // Generate report for the date if it doesn't exist
      await supabase.rpc('generate_daily_application_report', {
        p_date: targetDate
      });

      const { data, error } = await supabase
        .from('application_reports')
        .select('*')
        .eq('report_date', targetDate)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data || {
        totalApplications: 0,
        aiApproved: 0,
        aiRejected: 0,
        aiFlagged: 0,
        adminApproved: 0,
        adminRejected: 0,
        adminOverrides: 0,
        averageAiScore: 0,
        platformStats: {}
      };

    } catch (error) {
      console.error('Error fetching application stats:', error);
      throw error;
    }
  }

  /**
   * Get user's application status
   */
  static async getUserApplicationStatus(userId: string): Promise<ApplicationReview | null> {
    try {
      const { data, error } = await supabase
        .from('agent_applications')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        applicationData: data.application_data,
        aiScore: data.ai_score,
        aiDecision: data.ai_decision,
        aiDecisionReason: data.ai_decision_reason,
        aiComplianceDetails: data.ai_compliance_details || {},
        adminStatus: data.admin_status,
        adminReviewedBy: data.admin_reviewed_by,
        adminReviewReason: data.admin_review_reason,
        finalStatus: data.final_status,
        isReapplication: data.is_reapplication,
        submittedAt: data.submitted_at,
        processedAt: data.processed_at
      };

    } catch (error) {
      console.error('Error fetching user application status:', error);
      throw error;
    }
  }

  /**
   * Allow user to reapply after rejection
   */
  static async reapplyApplication(
    userId: string,
    applicationData: ApplicationData,
    previousApplicationId: string
  ): Promise<{ success: boolean; applicationId?: string; error?: string }> {
    try {
      // Insert new application as reapplication
      const { data, error } = await supabase
        .from('agent_applications')
        .insert({
          user_id: userId,
          application_data: applicationData,
          social_media_profiles: applicationData.socialMediaProfiles,
          ai_decision: 'pending',
          admin_status: 'pending',
          final_status: 'pending',
          is_reapplication: true,
          previous_application_id: previousApplicationId
        })
        .select('id')
        .single();

      if (error) throw error;

      // Trigger AI review
      const reviewResult = await this.processAIReview(data.id);
      
      if (reviewResult.success) {
        showToast('Reapplication submitted successfully! AI review completed.', 'success');
        return { success: true, applicationId: data.id };
      } else {
        showToast('Reapplication submitted but AI review failed. Admin will review manually.', 'warning');
        return { success: true, applicationId: data.id };
      }

    } catch (error) {
      console.error('Error submitting reapplication:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send real-time notification for application updates
   */
  static async sendApplicationNotification(
    applicationId: string,
    decision: string,
    reason?: string
  ): Promise<void> {
    try {
      // Get application details
      const { data: application } = await supabase
        .from('agent_applications')
        .select('user_id, application_data')
        .eq('id', applicationId)
        .single();

      if (application) {
        // Send notification via Supabase real-time
        await supabase
          .from('agent_notifications')
          .insert({
            user_id: application.user_id,
            type: 'application_update',
            title: `Application ${decision.charAt(0).toUpperCase() + decision.slice(1)}`,
            message: reason || `Your agent application has been ${decision}.`,
            data: {
              applicationId,
              decision,
              reason
            }
          });
      }
    } catch (error) {
      console.error('Error sending application notification:', error);
    }
  }

  /**
   * Validate social media profile data
   */
  static validateSocialMediaProfile(profile: SocialMediaProfile): string[] {
    const errors: string[] = [];

    if (!profile.platform) {
      errors.push('Platform is required');
    }

    if (!profile.username) {
      errors.push('Username is required');
    }

    if (!profile.followers || profile.followers < 0) {
      errors.push('Valid follower count is required');
    }

    if (!profile.url) {
      errors.push('Profile URL is required');
    }

    return errors;
  }

  /**
   * Calculate compliance score for social media profiles
   */
  static async calculateComplianceScore(
    socialMediaProfiles: Record<string, SocialMediaProfile>
  ): Promise<{ score: number; details: Record<string, any> }> {
    try {
      const requirements = await this.getPlatformRequirements();
      const requirementMap = requirements.reduce((map, req) => {
        map[req.platformName] = req.minFollowers;
        return map;
      }, {} as Record<string, number>);

      let totalScore = 0;
      let maxScore = 0;
      const details: Record<string, any> = {};

      for (const [platform, profile] of Object.entries(socialMediaProfiles)) {
        const minFollowers = requirementMap[platform] || requirementMap['other'] || 1000;
        maxScore += 100;

        if (profile.followers >= minFollowers) {
          totalScore += 100;
          details[platform] = { status: 'compliant', score: 100 };
        } else if (profile.followers >= minFollowers * 0.8) {
          totalScore += 60;
          details[platform] = { status: 'close', score: 60 };
        } else {
          details[platform] = { status: 'non_compliant', score: 0 };
        }
      }

      const finalScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

      return { score: finalScore, details };
    } catch (error) {
      console.error('Error calculating compliance score:', error);
      return { score: 0, details: {} };
    }
  }
}

export default AIApplicationService;
