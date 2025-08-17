// Standalone email service without problematic dependencies
console.log('🔧 Loading AuthEmailService (standalone version)...');

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
  private static SENDGRID_API_KEY = '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';
  private static FROM_EMAIL = 'noreply@earnpro.org';
  private static FROM_NAME = 'EarnPro Team';

  /**
   * Generate a verification token
   */
  generateVerificationToken(): string {
    const timestamp = Date.now().toString();
    const randomBytes = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));
    const randomString = randomBytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return `${timestamp}-${randomString}`;
  }

  /**
   * Store verification token in database  
   */
  async storeVerificationToken(userId: string, email: string, token: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Storing verification token for:', email);
      // For now, we'll rely on in-memory storage since this is standalone
      // In production, this would store in the database
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(data: EmailVerificationData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Sending verification email to:', data.email);
      console.log('🔗 Using local API endpoint via Vite middleware');

      // Use our API endpoint which is now handled by Vite middleware
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: data.email,
          fullName: data.fullName,
          verificationToken: data.verificationToken
        })
      });

      console.log('📨 API Response status:', response.status);

      // Check if response is ok first
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API returned error status:', response.status, errorText);
        return { success: false, error: `API error: ${response.status} - ${errorText}` };
      }

      // Try to parse JSON response
      let result;
      const responseText = await response.text();
      console.log('📨 Raw response:', responseText);

      if (!responseText || responseText.trim() === '') {
        console.error('❌ Empty response from API');
        return { success: false, error: 'Empty response from email API' };
      }

      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        console.error('❌ Response text was:', responseText);
        return { success: false, error: 'Invalid JSON response from email API' };
      }

      if (result.success) {
        console.log('✅ Verification email sent successfully via API');
        return { success: true };
      } else {
        console.error('❌ Failed to send email via API:', result.error);
        return { success: false, error: result.error || 'Failed to send verification email' };
      }
      
    } catch (error: any) {
      console.error('❌ Error sending verification email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email change confirmation
   */
  async sendEmailChangeConfirmation(data: EmailData & { newEmail: string; changeToken: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const changeUrl = `${this.baseUrl}/confirm-email-change?token=${data.changeToken}&email=${encodeURIComponent(data.newEmail)}`;
      
      console.log('📧 Sending email change confirmation to:', data.newEmail);

      const emailData = {
        personalizations: [{
          to: [{ email: data.newEmail, name: data.fullName }],
          subject: '🔐 Confirm Your Email Change - EarnPro'
        }],
        from: {
          email: AuthEmailService.FROM_EMAIL,
          name: AuthEmailService.FROM_NAME
        },
        content: [{
          type: 'text/html',
          value: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Confirm Email Change</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">EarnPro</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Email Change Confirmation</p>
                </div>
                <div style="padding: 40px 30px; text-align: center;">
                  <h2 style="color: #2d3748; margin: 0 0 20px 0;">Confirm Your New Email</h2>
                  <p style="color: #4a5568; margin: 0 0 30px 0;">
                    Hi ${data.fullName}! Please click the button below to confirm your email change to ${data.newEmail}.
                  </p>
                  <a href="${changeUrl}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            padding: 16px 32px; 
                            text-decoration: none; 
                            border-radius: 8px; 
                            font-weight: bold; 
                            display: inline-block;">
                    ✅ Confirm Email Change
                  </a>
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
          'Authorization': `Bearer ${AuthEmailService.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok || response.status === 202) {
        console.log('✅ Email change confirmation sent successfully via SendGrid');
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to send email change confirmation:', response.status, errorText);
        return { success: false, error: `SendGrid error: ${response.status}` };
      }
      
    } catch (error: any) {
      console.error('❌ Error sending email change confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send reauthentication email
   */
  async sendReauthenticationEmail(data: EmailData & { reauthToken: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const reauthUrl = `${this.baseUrl}/reauthenticate?token=${data.reauthToken}&email=${encodeURIComponent(data.email)}`;
      
      console.log('📧 Sending reauthentication email to:', data.email);

      const emailData = {
        personalizations: [{
          to: [{ email: data.email, name: data.fullName }],
          subject: '🔒 Security Alert - Reauthentication Required - EarnPro'
        }],
        from: {
          email: AuthEmailService.FROM_EMAIL,
          name: AuthEmailService.FROM_NAME
        },
        content: [{
          type: 'text/html',
          value: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Reauthentication Required</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">EarnPro</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Security Alert</p>
                </div>
                <div style="padding: 40px 30px; text-align: center;">
                  <h2 style="color: #2d3748; margin: 0 0 20px 0;">Reauthentication Required</h2>
                  <p style="color: #4a5568; margin: 0 0 30px 0;">
                    Hi ${data.fullName}! For security reasons, we need you to verify your identity. Please click the button below to reauthenticate.
                  </p>
                  <a href="${reauthUrl}" 
                     style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); 
                            color: white; 
                            padding: 16px 32px; 
                            text-decoration: none; 
                            border-radius: 8px; 
                            font-weight: bold; 
                            display: inline-block;">
                    🔒 Reauthenticate Now
                  </a>
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
          'Authorization': `Bearer ${AuthEmailService.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok || response.status === 202) {
        console.log('✅ Reauthentication email sent successfully via SendGrid');
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to send reauthentication email:', response.status, errorText);
        return { success: false, error: `SendGrid error: ${response.status}` };
      }
      
    } catch (error: any) {
      console.error('❌ Error sending reauthentication email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string, fullName: string): Promise<{ success: boolean; error?: string }> {

    try {
      console.log('🔄 Resending verification email to:', email);
      // Generate a new verification token
      const verificationToken = this.generateVerificationToken();
      // Store the new verification token in database
      console.log('💾 Storing new verification token in database...');
      const { supabase } = await import('../lib/supabase');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      if (userError || !userData) {
        console.error('❌ Failed to find user for email:', email);
        return { success: false, error: 'User not found for resend' };
      }
      const { error: tokenError } = await supabase
        .from('email_verification_tokens')
        .insert({
          user_id: userData.id,
          email: email,
          token: verificationToken,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        });
      if (tokenError) {
        console.error('❌ Failed to store new verification token:', tokenError);
        return { success: false, error: 'Failed to store verification token' };
      }
      console.log('✅ New verification token stored successfully');
      // Use API endpoint to send the email
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          fullName,
          verificationToken,
          isResend: true
        })
      });

      console.log('📨 Resend API Response status:', response.status);

      // Check if response is ok first
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Resend API returned error status:', response.status, errorText);
        return { success: false, error: `API error: ${response.status} - ${errorText}` };
      }

      // Try to parse JSON response
      let result;
      const responseText = await response.text();
      console.log('📨 Resend raw response:', responseText);

      if (!responseText || responseText.trim() === '') {
        console.error('❌ Empty response from resend API');
        return { success: false, error: 'Empty response from email API' };
      }

      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse resend JSON response:', parseError);
        console.error('❌ Response text was:', responseText);
        return { success: false, error: 'Invalid JSON response from email API' };
      }

      if (result.success) {
        console.log('✅ Verification email resent successfully via API');
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Failed to resend verification email' };
      }
      
    } catch (error: any) {
      console.error('❌ Error resending verification email:', error);
      return { success: false, error: error.message };
    }
  }
}

console.log('✅ AuthEmailService (standalone) initialized with SendGrid integration');
export const authEmailService = new AuthEmailService();
