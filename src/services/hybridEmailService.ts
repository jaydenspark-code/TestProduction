import { supabase } from '../lib/supabase';
import { authEmailService } from './authEmailService-standalone';

interface EmailMetrics {
  sendgridCount: number;
  supabaseCount: number;
  lastReset: string;
  failures: {
    sendgrid: number;
    supabase: number;
  };
}

class HybridEmailService {
  private dailyLimit = {
    sendgrid: 40000, // SendGrid free tier limit
    supabase: 100     // Supabase limit
  };

  private metrics: EmailMetrics = {
    sendgridCount: 0,
    supabaseCount: 0,
    lastReset: new Date().toDateString(),
    failures: {
      sendgrid: 0,
      supabase: 0
    }
  };

  constructor() {
    this.loadMetrics();
    this.resetDailyCountersIfNeeded();
  }

  /**
   * Smart email verification sender with automatic failover
   */
  async sendVerificationEmail(userData: {
    email: string;
    fullName: string;
    userId: string;
  }): Promise<{ success: boolean; method: 'sendgrid' | 'supabase' | 'both'; error?: string }> {
    
    console.log('🔄 Starting hybrid email verification for:', userData.email);
    
    // Reset counters if new day
    this.resetDailyCountersIfNeeded();
    
    // Determine optimal strategy
    const strategy = this.determineEmailStrategy();
    console.log(`📊 Email strategy selected: ${strategy}`);

    try {
      switch (strategy) {
        case 'sendgrid-primary':
          return await this.trySendGridFirst(userData);
          
        case 'supabase-primary':
          return await this.trySupabaseFirst(userData);
          
        case 'both-simultaneous':
          return await this.sendBothSimultaneously(userData);
          
        default:
          throw new Error('No viable email strategy available');
      }
    } catch (error) {
      console.error('❌ Hybrid email service failed:', error);
      return { 
        success: false, 
        method: 'sendgrid', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Determine the best email strategy based on current metrics
   */
  private determineEmailStrategy(): 'sendgrid-primary' | 'supabase-primary' | 'both-simultaneous' {
    const { sendgridCount, supabaseCount, failures } = this.metrics;
    
    // If SendGrid has too many recent failures, use Supabase
    if (failures.sendgrid >= 5) {
      console.log('⚠️ SendGrid has many failures, switching to Supabase primary');
      return 'supabase-primary';
    }
    
    // If SendGrid is near limit, use both or switch to Supabase
    if (sendgridCount >= this.dailyLimit.sendgrid * 0.9) {
      if (supabaseCount < this.dailyLimit.supabase * 0.8) {
        console.log('📊 SendGrid near limit, using both services');
        return 'both-simultaneous';
      } else {
        console.log('📊 Both services near limits, prioritizing Supabase');
        return 'supabase-primary';
      }
    }
    
    // If Supabase is near limit, use SendGrid
    if (supabaseCount >= this.dailyLimit.supabase * 0.8) {
      console.log('📊 Supabase near limit, using SendGrid');
      return 'sendgrid-primary';
    }
    
    // High traffic scenario - use both to distribute load
    const totalToday = sendgridCount + supabaseCount;
    if (totalToday > 50) { // Threshold for high traffic
      console.log('📈 High traffic detected, using both services');
      return 'both-simultaneous';
    }
    
    // Default: SendGrid primary (better capacity and control)
    return 'sendgrid-primary';
  }

  /**
   * Try SendGrid first, fallback to Supabase
   */
  private async trySendGridFirst(userData: {
    email: string;
    fullName: string;
    userId: string;
  }): Promise<{ success: boolean; method: 'sendgrid' | 'supabase'; error?: string }> {
    
    console.log('🎯 Attempting SendGrid first...');
    
    try {
      // Generate custom verification token
      const verificationToken = authEmailService.generateVerificationToken();
      
      // Store token in database
      const storeResult = await authEmailService.storeVerificationToken(
        userData.userId, 
        userData.email, 
        verificationToken
      );
      
      if (!storeResult.success) {
        throw new Error('Failed to store verification token');
      }
      
      // Send via SendGrid
      const sendResult = await authEmailService.sendEmailVerification({
        email: userData.email,
        fullName: userData.fullName,
        verificationToken,
        userId: userData.userId
      });
      
      if (sendResult.success) {
        this.metrics.sendgridCount++;
        this.metrics.failures.sendgrid = 0; // Reset failure count on success
        this.saveMetrics();
        console.log('✅ SendGrid email sent successfully');
        return { success: true, method: 'sendgrid' };
      } else {
        throw new Error(sendResult.error || 'SendGrid failed');
      }
      
    } catch (error) {
      console.warn('⚠️ SendGrid failed, falling back to Supabase:', error);
      this.metrics.failures.sendgrid++;
      this.saveMetrics();
      
      // Fallback to Supabase
      return await this.trySupabaseBackup(userData);
    }
  }

  /**
   * Try Supabase first, fallback to SendGrid
   */
  private async trySupabaseFirst(userData: {
    email: string;
    fullName: string;
    userId: string;
  }): Promise<{ success: boolean; method: 'sendgrid' | 'supabase'; error?: string }> {
    
    console.log('🎯 Attempting Supabase first...');
    
    try {
      // Use Supabase's native signup flow (without password since user exists)
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email?confirmed=true`
        }
      });
      
      if (error) {
        throw error;
      }
      
      this.metrics.supabaseCount++;
      this.metrics.failures.supabase = 0;
      this.saveMetrics();
      console.log('✅ Supabase email sent successfully');
      return { success: true, method: 'supabase' };
      
    } catch (error) {
      console.warn('⚠️ Supabase failed, falling back to SendGrid:', error);
      this.metrics.failures.supabase++;
      this.saveMetrics();
      
      // Fallback to SendGrid
      return await this.trySendGridBackup(userData);
    }
  }

  /**
   * Send via both services simultaneously for maximum reliability
   */
  private async sendBothSimultaneously(userData: {
    email: string;
    fullName: string;
    userId: string;
  }): Promise<{ success: boolean; method: 'both'; error?: string }> {
    
    console.log('🚀 Sending via both services simultaneously...');
    
    const results = await Promise.allSettled([
      this.trySendGridPrimary(userData),
      this.trySupabasePrimary(userData)
    ]);
    
    const sendgridResult = results[0];
    const supabaseResult = results[1];
    
    let successCount = 0;
    let errors: string[] = [];
    
    if (sendgridResult.status === 'fulfilled' && sendgridResult.value.success) {
      successCount++;
      console.log('✅ SendGrid sent successfully');
    } else {
      const error = sendgridResult.status === 'rejected' 
        ? sendgridResult.reason 
        : sendgridResult.value.error;
      errors.push(`SendGrid: ${error}`);
      console.warn('❌ SendGrid failed in simultaneous send');
    }
    
    if (supabaseResult.status === 'fulfilled' && supabaseResult.value.success) {
      successCount++;
      console.log('✅ Supabase sent successfully');
    } else {
      const error = supabaseResult.status === 'rejected' 
        ? supabaseResult.reason 
        : supabaseResult.value.error;
      errors.push(`Supabase: ${error}`);
      console.warn('❌ Supabase failed in simultaneous send');
    }
    
    if (successCount > 0) {
      console.log(`🎉 ${successCount}/2 email services succeeded`);
      return { success: true, method: 'both' };
    } else {
      console.error('❌ Both email services failed');
      return { 
        success: false, 
        method: 'both', 
        error: `All services failed: ${errors.join(', ')}` 
      };
    }
  }

  /**
   * SendGrid without fallback (for simultaneous sending)
   */
  private async trySendGridPrimary(userData: {
    email: string;
    fullName: string;
    userId: string;
  }): Promise<{ success: boolean; error?: string }> {
    
    const verificationToken = authEmailService.generateVerificationToken();
    
    const storeResult = await authEmailService.storeVerificationToken(
      userData.userId, 
      userData.email, 
      verificationToken
    );
    
    if (!storeResult.success) {
      throw new Error('Failed to store verification token');
    }
    
    const sendResult = await authEmailService.sendEmailVerification({
      email: userData.email,
      fullName: userData.fullName,
      verificationToken,
      userId: userData.userId
    });
    
    if (sendResult.success) {
      this.metrics.sendgridCount++;
      this.metrics.failures.sendgrid = 0;
      this.saveMetrics();
    } else {
      this.metrics.failures.sendgrid++;
      this.saveMetrics();
    }
    
    return sendResult;
  }

  /**
   * Supabase without fallback (for simultaneous sending)
   */
  private async trySupabasePrimary(userData: {
    email: string;
    fullName: string;
    userId: string;
  }): Promise<{ success: boolean; error?: string }> {
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: userData.email,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email?confirmed=true`
      }
    });
    
    if (error) {
      this.metrics.failures.supabase++;
      this.saveMetrics();
      return { success: false, error: error.message };
    }
    
    this.metrics.supabaseCount++;
    this.metrics.failures.supabase = 0;
    this.saveMetrics();
    return { success: true };
  }

  /**
   * Supabase backup attempt
   */
  private async trySupabaseBackup(userData: {
    email: string;
    fullName: string;
    userId: string;
  }): Promise<{ success: boolean; method: 'supabase'; error?: string }> {
    
    try {
      const result = await this.trySupabasePrimary(userData);
      return { ...result, method: 'supabase' };
    } catch (error) {
      return { 
        success: false, 
        method: 'supabase', 
        error: error instanceof Error ? error.message : 'Supabase backup failed' 
      };
    }
  }

  /**
   * SendGrid backup attempt
   */
  private async trySendGridBackup(userData: {
    email: string;
    fullName: string;
    userId: string;
  }): Promise<{ success: boolean; method: 'sendgrid'; error?: string }> {
    
    try {
      const result = await this.trySendGridPrimary(userData);
      return { ...result, method: 'sendgrid' };
    } catch (error) {
      return { 
        success: false, 
        method: 'sendgrid', 
        error: error instanceof Error ? error.message : 'SendGrid backup failed' 
      };
    }
  }

  /**
   * Reset daily counters if it's a new day
   */
  private resetDailyCountersIfNeeded(): void {
    const today = new Date().toDateString();
    if (this.metrics.lastReset !== today) {
      console.log('🔄 Resetting daily email counters for new day');
      this.metrics.sendgridCount = 0;
      this.metrics.supabaseCount = 0;
      this.metrics.lastReset = today;
      this.metrics.failures = { sendgrid: 0, supabase: 0 };
      this.saveMetrics();
    }
  }

  /**
   * Load metrics from localStorage
   */
  private loadMetrics(): void {
    try {
      const stored = localStorage.getItem('email-metrics');
      if (stored) {
        this.metrics = { ...this.metrics, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load email metrics:', error);
    }
  }

  /**
   * Save metrics to localStorage
   */
  private saveMetrics(): void {
    try {
      localStorage.setItem('email-metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.warn('Failed to save email metrics:', error);
    }
  }

  /**
   * Get current email usage statistics
   */
  getEmailStats(): {
    sendgrid: { used: number; limit: number; percentage: number };
    supabase: { used: number; limit: number; percentage: number };
    total: number;
    failures: { sendgrid: number; supabase: number };
  } {
    this.resetDailyCountersIfNeeded();
    
    return {
      sendgrid: {
        used: this.metrics.sendgridCount,
        limit: this.dailyLimit.sendgrid,
        percentage: (this.metrics.sendgridCount / this.dailyLimit.sendgrid) * 100
      },
      supabase: {
        used: this.metrics.supabaseCount,
        limit: this.dailyLimit.supabase,
        percentage: (this.metrics.supabaseCount / this.dailyLimit.supabase) * 100
      },
      total: this.metrics.sendgridCount + this.metrics.supabaseCount,
      failures: this.metrics.failures
    };
  }

  /**
   * Send email change confirmation with hybrid approach
   */
  async sendEmailChangeConfirmation(userData: {
    currentEmail: string;
    newEmail: string;
    fullName: string;
    changeToken: string;
    userId: string;
  }): Promise<{ success: boolean; method: 'sendgrid' | 'supabase'; error?: string }> {
    
    console.log('🔄 Starting hybrid email change confirmation for:', userData.newEmail);
    
    // Reset counters if new day
    this.resetDailyCountersIfNeeded();
    
    // Determine optimal strategy
    const strategy = this.determineEmailStrategy();
    console.log(`📊 Email strategy selected: ${strategy}`);

    try {
      // Try SendGrid first for better templates
      const sendGridResult = await authEmailService.sendEmailChangeConfirmation(userData);
      
      if (sendGridResult.success) {
        this.metrics.sendgridCount++;
        this.metrics.failures.sendgrid = 0;
        this.saveMetrics();
        console.log('✅ SendGrid email change confirmation sent successfully');
        return { success: true, method: 'sendgrid' };
      } else {
        throw new Error(sendGridResult.error || 'SendGrid failed');
      }
      
    } catch (error) {
      console.warn('⚠️ SendGrid failed for email change, using Supabase fallback:', error);
      this.metrics.failures.sendgrid++;
      this.saveMetrics();
      
      // Fallback to Supabase
      try {
        const { error } = await supabase.auth.updateUser({
          email: userData.newEmail
        });
        
        if (error) {
          throw error;
        }
        
        this.metrics.supabaseCount++;
        this.metrics.failures.supabase = 0;
        this.saveMetrics();
        console.log('✅ Supabase email change initiated successfully');
        return { success: true, method: 'supabase' };
        
      } catch (supabaseError: any) {
        console.error('❌ Both SendGrid and Supabase failed for email change');
        this.metrics.failures.supabase++;
        this.saveMetrics();
        return { 
          success: false, 
          method: 'sendgrid', 
          error: supabaseError?.message || 'Email change confirmation failed' 
        };
      }
    }
  }

  /**
   * Send reauthentication email with hybrid approach
   */
  async sendReauthenticationEmail(userData: {
    email: string;
    fullName: string;
    reauthToken: string;
    userId: string;
    action: 'password_change' | 'sensitive_operation' | 'account_deletion';
  }): Promise<{ success: boolean; method: 'sendgrid' | 'supabase'; error?: string }> {
    
    console.log('🔄 Starting hybrid reauthentication email for:', userData.email);
    
    // Reset counters if new day
    this.resetDailyCountersIfNeeded();
    
    // Determine optimal strategy
    const strategy = this.determineEmailStrategy();
    console.log(`📊 Email strategy selected: ${strategy}`);

    try {
      // Try SendGrid first for better templates
      const sendGridResult = await authEmailService.sendReauthenticationEmail(userData);
      
      if (sendGridResult.success) {
        this.metrics.sendgridCount++;
        this.metrics.failures.sendgrid = 0;
        this.saveMetrics();
        console.log('✅ SendGrid reauthentication email sent successfully');
        return { success: true, method: 'sendgrid' };
      } else {
        throw new Error(sendGridResult.error || 'SendGrid failed');
      }
      
    } catch (error) {
      console.warn('⚠️ SendGrid failed for reauthentication, using Supabase fallback:', error);
      this.metrics.failures.sendgrid++;
      this.saveMetrics();
      
      // Fallback to basic Supabase approach (limited template options)
      try {
        // Use basic notification through Supabase
        const { error } = await supabase.auth.reauthenticate();
        
        if (error) {
          throw error;
        }
        
        this.metrics.supabaseCount++;
        this.metrics.failures.supabase = 0;
        this.saveMetrics();
        console.log('✅ Supabase reauthentication initiated successfully');
        return { success: true, method: 'supabase' };
        
      } catch (supabaseError: any) {
        console.error('❌ Both SendGrid and Supabase failed for reauthentication');
        this.metrics.failures.supabase++;
        this.saveMetrics();
        return { 
          success: false, 
          method: 'sendgrid', 
          error: supabaseError?.message || 'Reauthentication email failed' 
        };
      }
    }
  }

  /**
   * Force reset email counters (for testing/admin purposes)
   */
  resetCounters(): void {
    this.metrics.sendgridCount = 0;
    this.metrics.supabaseCount = 0;
    this.metrics.failures = { sendgrid: 0, supabase: 0 };
    this.saveMetrics();
    console.log('🔄 Email counters manually reset');
  }
}

export const hybridEmailService = new HybridEmailService();
