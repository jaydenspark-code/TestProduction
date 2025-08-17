import { supabase } from '../lib/supabase';

export interface EmailVerificationToken {
  id?: string;
  user_id: string;
  email: string;
  token: string;
  expires_at: string;
  created_at?: string;
  verified_at?: string;
}

export class CustomEmailVerificationService {
  private static SENDGRID_API_KEY = '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';
  private static FROM_EMAIL = 'noreply@earnpro.org';
  private static FROM_NAME = 'EarnPro Team';

  /**
   * Generate a secure verification token
   */
  static generateToken(): string {
    const timestamp = Date.now().toString();
    const randomBytes = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));
    const randomString = randomBytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return `${timestamp}-${randomString}`;
  }

  /**
   * Create verification token in database
   */
  static async createVerificationToken(userId: string, email: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const token = this.generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      console.log('🔑 Creating verification token for:', email);

      const { error } = await supabase
        .from('email_verifications')
        .insert({
          user_id: userId,
          email: email,
          token: token,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Failed to create verification token:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Verification token created successfully');
      return { success: true, token };
    } catch (error) {
      console.error('❌ Error creating verification token:', error);
      return { success: false, error: 'Failed to create verification token' };
    }
  }

  /**
   * Send verification email via SendGrid
   */
  static async sendVerificationEmail(email: string, name: string, token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const verificationUrl = `${window.location.origin}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
      
      console.log('📧 Sending verification email to:', email);
      console.log('🔗 Verification URL:', verificationUrl);

      const emailData = {
        personalizations: [{
          to: [{ email: email, name: name }],
          subject: '🔐 Verify Your EarnPro Account - Action Required'
        }],
        from: {
          email: this.FROM_EMAIL,
          name: this.FROM_NAME
        },
        content: [{
          type: 'text/html',
          value: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verify Your EarnPro Account</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">EarnPro</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Multi-Level Referral System</p>
                </div>
                
                <!-- Main Content -->
                <div style="padding: 40px 30px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                      <span style="color: white; font-size: 36px;">📧</span>
                    </div>
                    <h2 style="color: #2d3748; margin: 0 0 10px 0; font-size: 28px;">Verify Your Email Address</h2>
                    <p style="color: #4a5568; margin: 0; font-size: 16px; line-height: 1.5;">
                      Hi ${name}! Welcome to EarnPro. Please click the button below to verify your email address and complete your registration.
                    </p>
                  </div>
                  
                  <!-- Verification Button -->
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${verificationUrl}" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: white; 
                              padding: 16px 32px; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              font-weight: bold; 
                              font-size: 16px;
                              display: inline-block;
                              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                              transition: all 0.3s ease;">
                      ✅ Verify Email Address
                    </a>
                  </div>
                  
                  <!-- Security Notice -->
                  <div style="background: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                    <h3 style="color: #2d3748; margin: 0 0 10px 0; font-size: 16px;">🔒 Security Notice</h3>
                    <p style="color: #4a5568; margin: 0; font-size: 14px; line-height: 1.5;">
                      This verification link will expire in 24 hours for your security. If you didn't create an EarnPro account, please ignore this email.
                    </p>
                  </div>
                  
                  <!-- Manual Link -->
                  <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
                    <p style="color: #718096; font-size: 14px; margin: 0 0 10px 0;">
                      <strong>Button not working?</strong> Copy and paste this link into your browser:
                    </p>
                    <p style="color: #667eea; font-size: 14px; word-break: break-all; background: #f7fafc; padding: 10px; border-radius: 4px; margin: 0;">
                      ${verificationUrl}
                    </p>
                  </div>
                  
                  <!-- Benefits -->
                  <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%); border-radius: 8px;">
                    <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">🎉 What's Next?</h3>
                    <ul style="color: #4a5568; margin: 0; padding-left: 20px; line-height: 1.6;">
                      <li>Complete your profile setup</li>
                      <li>Get your $3.00 welcome bonus</li>
                      <li>Start earning from referrals</li>
                      <li>Access exclusive agent programs</li>
                    </ul>
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="color: #a0aec0; font-size: 14px; margin: 0 0 10px 0;">
                    This email was sent by EarnPro Referral System
                  </p>
                  <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                    If you have any questions, please contact our support team.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `
        }]
      };

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok || response.status === 202) {
        console.log('✅ Verification email sent successfully');
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to send email:', response.status, errorText);
        return { success: false, error: `SendGrid error: ${response.status}` };
      }
      
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      return { success: false, error: 'Failed to send verification email' };
    }
  }

  /**
   * Verify token and mark user as verified
   */
  static async verifyToken(token: string, email: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      console.log('🔍 Verifying token for:', email);

      // Get the verification record
      const { data: verificationData, error: fetchError } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('token', token)
        .eq('email', email)
        .is('verified_at', null)
        .single();

      if (fetchError || !verificationData) {
        console.error('❌ Invalid or expired token:', fetchError?.message);
        return { success: false, error: 'Invalid or expired verification token' };
      }

      // Check if token is expired
      const expiresAt = new Date(verificationData.expires_at);
      if (expiresAt < new Date()) {
        console.error('❌ Token has expired');
        return { success: false, error: 'Verification token has expired. Please request a new one.' };
      }

      // Mark token as verified
      const { error: updateTokenError } = await supabase
        .from('email_verifications')
        .update({ verified_at: new Date().toISOString() })
        .eq('token', token);

      if (updateTokenError) {
        console.error('❌ Failed to update verification token:', updateTokenError);
        return { success: false, error: 'Failed to verify token' };
      }

      // Mark user as verified in users table
      const { error: updateUserError } = await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('id', verificationData.user_id);

      if (updateUserError) {
        console.error('❌ Failed to update user verification status:', updateUserError);
        return { success: false, error: 'Failed to update user status' };
      }

      console.log('✅ User successfully verified:', email);
      return { success: true, userId: verificationData.user_id };
      
    } catch (error) {
      console.error('❌ Error verifying token:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Resending verification email for:', email);

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, is_verified')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        console.error('❌ User not found:', userError?.message);
        return { success: false, error: 'User not found. Please register again.' };
      }

      if (userData.is_verified) {
        return { success: false, error: 'Email already verified. You can login now.' };
      }

      // Delete any existing unverified tokens for this user
      await supabase
        .from('email_verifications')
        .delete()
        .eq('user_id', userData.id)
        .is('verified_at', null);

      // Create new verification token
      const tokenResult = await this.createVerificationToken(userData.id, email);
      if (!tokenResult.success || !tokenResult.token) {
        return { success: false, error: tokenResult.error };
      }

      // Send verification email
      const emailResult = await this.sendVerificationEmail(
        email, 
        userData.full_name || 'User', 
        tokenResult.token
      );

      if (!emailResult.success) {
        return { success: false, error: emailResult.error };
      }

      console.log('✅ Verification email resent successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error resending verification email:', error);
      return { success: false, error: 'Failed to resend verification email' };
    }
  }

  /**
   * Complete custom registration with email verification
   */
  static async registerUserWithEmailVerification(userData: {
    email: string;
    password: string;
    fullName: string;
    country: string;
    currency?: string;
    referredBy?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📝 Starting custom registration with email verification for:', userData.email);

      // First disable Supabase auto-confirmation by not using signUp
      // Instead, create user manually and handle everything ourselves
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email, is_verified')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        if (existingUser.is_verified) {
          return { success: false, error: 'Email already registered and verified. Please login instead.' };
        } else {
          // Resend verification email
          const resendResult = await this.resendVerificationEmail(userData.email);
          if (resendResult.success) {
            return { success: true };
          } else {
            return { success: false, error: resendResult.error };
          }
        }
      }

      // Create auth user with email confirmation DISABLED
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          // This prevents auto-confirmation
          data: {
            email_confirm: false
          }
        }
      });

      if (authError) {
        console.error('❌ Auth user creation failed:', authError);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' };
      }

      // Generate referral code
      const referralCode = `USR${Date.now().toString(36).toUpperCase()}`;

      // Create user profile in users table
      const profileData = {
        id: authData.user.id,
        email: userData.email,
        full_name: userData.fullName,
        country: userData.country,
        currency: userData.currency || 'USD',
        referral_code: referralCode,
        referred_by: userData.referredBy || null,
        is_verified: false, // Important: not verified yet
        is_paid: false,
        role: 'user',
        created_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('users')
        .insert(profileData);

      if (profileError) {
        console.error('❌ Profile creation failed:', profileError);
        // Clean up auth user
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.error('⚠️ Failed to cleanup auth user:', cleanupError);
        }
        return { success: false, error: `Profile creation failed: ${profileError.message}` };
      }

      // Create verification token and send email
      const tokenResult = await this.createVerificationToken(authData.user.id, userData.email);
      if (!tokenResult.success || !tokenResult.token) {
        return { success: false, error: tokenResult.error };
      }

      const emailResult = await this.sendVerificationEmail(
        userData.email, 
        userData.fullName, 
        tokenResult.token
      );

      if (!emailResult.success) {
        return { success: false, error: emailResult.error };
      }

      console.log('✅ User registration completed with email verification sent');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Custom registration failed:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  }
}

export default CustomEmailVerificationService;
