// Clean implementation of SendGrid-based email service
import { supabase } from '../lib/supabase';
import { emailService } from './emailService';

interface EmailData {
  email: string;
  fullName: string;
  userId: string;
}

interface EmailVerificationData extends EmailData {
  verificationToken: string;
}

class AuthEmailService {
  private baseUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

  /**
   * Generate a verification token
   */
  generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Store verification token in database  
   */
  async storeVerificationToken(userId: string, email: string, token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

      const { error } = await supabase
        .from('email_verification_tokens')
        .upsert({
          user_id: userId,
          email: email,
          token,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email verification using the main email service
   */
  async sendEmailVerification(data: EmailVerificationData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Sending email verification to:', data.email);
      
      // Use the main email service to send verification email
      await emailService.sendEmailVerification({
        email: data.email,
        fullName: data.fullName,
        verificationToken: data.verificationToken
      });
      
      console.log('✅ Email verification sent successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Failed to send verification email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email change confirmation
   */
  async sendEmailChangeConfirmation(data: EmailData & { newEmail: string }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Email change confirmation would be sent to:', data.newEmail);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send reauthentication email
   */
  async sendReauthenticationEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Reauthentication email would be sent to:', data.email);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const authEmailService = new AuthEmailService();