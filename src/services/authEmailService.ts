import { emailService } from './emailService';
import { supabase } from '../lib/supabaseClient';

interface EmailVerificationData {
  email: string;
  fullName: string;
  verificationToken: string;
  userId: string;
}

class AuthEmailService {
  private baseUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5176';

  /**
   * Send email verification using SendGrid
   */
  async sendEmailVerification(data: EmailVerificationData) {
    if (!data.email || !data.verificationToken) {
      throw new Error('Email and verification token are required for email verification');
    }
    const verificationUrl = `${this.baseUrl}/auth/verify-email?token=${data.verificationToken}&email=${encodeURIComponent(data.email)}`;
    
    const subject = 'Verify Your EarnPro Account - Complete Registration 📧';
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - EarnPro</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            line-height: 1.6; 
            color: #333333; 
            background-color: #f8fafc; 
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 { 
            color: #ffffff; 
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 8px; 
        }
        .header p { 
            color: rgba(255,255,255,0.9); 
            font-size: 16px; 
        }
        .content { 
            padding: 40px 30px; 
        }
        .greeting { 
            font-size: 20px; 
            font-weight: 600; 
            color: #1a202c; 
            margin-bottom: 20px; 
        }
        .message { 
            font-size: 16px; 
            color: #4a5568; 
            margin-bottom: 30px; 
            line-height: 1.7; 
        }
        .verification-box { 
            background: linear-gradient(135deg, #e6fffa 0%, #f0fff4 100%); 
            border: 2px solid #48bb78; 
            border-radius: 12px; 
            padding: 30px; 
            text-align: center; 
            margin: 30px 0; 
        }
        .verification-box h3 { 
            color: #2f855a; 
            font-size: 18px; 
            margin-bottom: 15px; 
        }
        .verify-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); 
            color: #ffffff; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 16px; 
            margin: 20px 0; 
            transition: transform 0.2s;
            box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
        }
        .verify-button:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 6px 16px rgba(72, 187, 120, 0.4);
        }
        .security-note { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            color: #856404; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 25px 0; 
            font-size: 14px;
        }
        .footer { 
            background: #f7fafc; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e2e8f0; 
        }
        .footer p { 
            color: #718096; 
            font-size: 14px; 
            margin-bottom: 5px; 
        }
        .backup-link {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            font-size: 14px;
            color: #4a5568;
        }
        .backup-link code {
            background: #e2e8f0;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            word-break: break-all;
        }
        @media only screen and (max-width: 600px) {
            .content, .header, .footer { padding: 20px !important; }
            .header h1 { font-size: 24px !important; }
            .verify-button { padding: 14px 24px !important; font-size: 14px !important; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>📧 Verify Your Email</h1>
            <p>Complete your EarnPro registration</p>
        </div>
        
        <div class="content">
            <div class="greeting">Hello ${data.fullName}!</div>
            
            <div class="message">
                Thank you for registering with EarnPro! To complete your account setup and start earning, please verify your email address by clicking the button below.
            </div>
            
            <div class="verification-box">
                <h3>🎯 Verify Your Email Address</h3>
                <p style="color: #4a5568; margin-bottom: 20px;">
                    Click the button below to verify your email and activate your account:
                </p>
                <a href="${verificationUrl}" class="verify-button">
                    ✅ Verify Email Address
                </a>
                <p style="color: #4a5568; font-size: 14px; margin-top: 15px;">
                    This verification link will expire in 24 hours for security.
                </p>
            </div>

            <div class="security-note">
                <strong>🔒 Security Notice:</strong> This email was sent because someone registered an account with this email address. If this wasn't you, please ignore this email and no account will be created.
            </div>

            <div class="backup-link">
                <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
                <code>${verificationUrl}</code>
            </div>

            <div class="message">
                After verification, you'll be redirected to complete your account activation with a one-time payment of $15.00 and receive an instant $3.00 welcome bonus!
            </div>
        </div>
        
        <div class="footer">
            <p><strong>EarnPro</strong> - The World's Most Trusted Referral Platform</p>
            <p>© 2025 EarnPro. All rights reserved.</p>
            <p style="margin-top: 15px;">This email was sent to ${data.email}</p>
            <p style="font-size: 12px; color: #a0aec0;">
                If you didn't create an account, you can safely ignore this email.
            </p>
        </div>
    </div>
</body>
</html>`;

    try {
      console.log('📧 Sending email verification via SendGrid to:', data.email);
      
      await emailService.sendEmail({
        to: data.email,
        subject,
        html,
        from: import.meta.env.VITE_SENDGRID_FROM_EMAIL || 'noreply@earnpro.org'
      });

      console.log('✅ Email verification sent successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Failed to send verification email:', error);
      return { success: false, error: error?.message || 'Failed to send verification email' };
    }
  }

  /**
   * Generate a secure verification token
   */
  generateVerificationToken(): string {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const randomString = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${timestamp}-${randomString}`;
  }

  /**
   * Store verification token in database
   */
  async storeVerificationToken(userId: string, email: string, token: string) {
    if (!supabase) {
      console.log('🧪 Testing mode: Skipping token storage');
      return { success: true };
    }

    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const { error } = await supabase
        .from('email_verifications')
        .upsert({
          user_id: userId,
          email: email,
          token: token,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error storing verification token:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Verification token stored successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error storing token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify email token and activate account
   */
  async verifyEmailToken(token: string, email: string) {
    if (!supabase) {
      console.log('🧪 Testing mode: Email verification simulated');
      return { success: true, message: 'Email verified successfully' };
    }

    try {
      // Check if token exists and is valid
      const { data: verification, error: fetchError } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('token', token)
        .eq('email', email)
        .single();

      if (fetchError || !verification) {
        console.error('❌ Invalid or expired verification token');
        return { success: false, error: 'Invalid or expired verification link' };
      }

      // Check if token has expired
      const now = new Date();
      const expiresAt = new Date(verification.expires_at);
      
      if (now > expiresAt) {
        console.error('❌ Verification token has expired');
        return { success: false, error: 'Verification link has expired. Please request a new one.' };
      }

      // Update user as verified
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          is_verified: true,
          email_verified_at: new Date().toISOString()
        })
        .eq('id', verification.user_id);

      if (updateError) {
        console.error('❌ Error updating user verification status:', updateError);
        return { success: false, error: 'Failed to verify account. Please try again.' };
      }

      // Delete the used token
      await supabase
        .from('email_verifications')
        .delete()
        .eq('token', token);

      console.log('✅ Email verified successfully for user:', verification.user_id);
      return { 
        success: true, 
        message: 'Email verified successfully! Redirecting to payment...',
        userId: verification.user_id
      };
    } catch (error) {
      console.error('❌ Unexpected error during email verification:', error);
      return { success: false, error: 'An unexpected error occurred during verification' };
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string) {
    if (!supabase) {
      console.log('🧪 Testing mode: Resend verification simulated');
      return { success: true };
    }

    try {
      // Get user data
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !user) {
        return { success: false, error: 'User not found' };
      }

      if (user.is_verified) {
        return { success: false, error: 'Email is already verified' };
      }

      // Generate new token
      const newToken = this.generateVerificationToken();
      
      // Store new token
      const storeResult = await this.storeVerificationToken(user.id, email, newToken);
      if (!storeResult.success) {
        return storeResult;
      }

      // Send new verification email
      const emailResult = await this.sendEmailVerification({
        email: user.email,
        fullName: user.full_name,
        verificationToken: newToken,
        userId: user.id
      });

      return emailResult;
    } catch (error) {
      console.error('❌ Error resending verification email:', error);
      return { success: false, error: 'Failed to resend verification email' };
    }
  }
}

export const authEmailService = new AuthEmailService();