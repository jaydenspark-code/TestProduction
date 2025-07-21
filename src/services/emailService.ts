class EmailService {
    private apiKey = import.meta.env.VITE_MAILGUN_API_KEY;
    private domain = import.meta.env.VITE_MAILGUN_DOMAIN;
    private region = import.meta.env.VITE_MAILGUN_REGION || 'eu';
    private baseUrl = `https://api.${this.region === 'eu' ? 'eu.' : ''}mailgun.net/v3/${this.domain}`;

    private async makeRequest(endpoint: string, options: RequestInit = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const auth = btoa(`api:${this.apiKey}`);

        const headers = {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            ...options.headers,
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            throw new Error(`Mailgun API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    // Send email
    async sendEmail(data: {
        to: string;
        subject: string;
        html: string;
        from?: string;
        replyTo?: string;
        attachments?: Array<{
            filename: string;
            data: string;
            contentType: string;
        }>;
    }) {
        const formData = new URLSearchParams();
        formData.append('from', data.from || `EarnPro <noreply@${this.domain}>`);
        formData.append('to', data.to);
        formData.append('subject', data.subject);
        formData.append('html', data.html);

        if (data.replyTo) {
            formData.append('h:Reply-To', data.replyTo);
        }

        if (data.attachments) {
            data.attachments.forEach((attachment, index) => {
                formData.append(`attachment[${index}]`, attachment.data);
                formData.append(`attachment[${index}].filename`, attachment.filename);
                formData.append(`attachment[${index}].content-type`, attachment.contentType);
            });
        }

        return this.makeRequest('/messages', {
            method: 'POST',
            body: formData,
        });
    }

    // Send welcome email
    async sendWelcomeEmail(user: {
        email: string;
        fullName: string;
        referralCode: string;
    }) {
        const subject = 'Welcome to EarnPro! 🎉';
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to EarnPro</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .referral-code { background: #e8f4fd; border: 2px dashed #667eea; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to EarnPro!</h1>
            <p>The world's most trusted referral rewards platform</p>
          </div>
          <div class="content">
            <h2>Hello ${user.fullName}!</h2>
            <p>Welcome to EarnPro! We're excited to have you join our community of earners.</p>
            
            <p>Here's what you can do to get started:</p>
            <ul>
              <li>Complete your profile</li>
              <li>Start earning through our referral program</li>
              <li>Apply to become an agent</li>
              <li>Explore our advertising opportunities</li>
            </ul>

            <div class="referral-code">
              <h3>Your Referral Code</h3>
              <p><strong>${user.referralCode}</strong></p>
              <p>Share this code with friends and earn rewards!</p>
            </div>

            <a href="${import.meta.env.VITE_APP_URL}/dashboard" class="button">Go to Dashboard</a>

            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 EarnPro. All rights reserved.</p>
            <p>This email was sent to ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

        return this.sendEmail({
            to: user.email,
            subject,
            html,
        });
    }

    // Send withdrawal confirmation
    async sendWithdrawalConfirmation(user: {
        email: string;
        fullName: string;
        amount: number;
        method: string;
        reference: string;
        estimatedDelivery: string;
    }) {
        const subject = 'Withdrawal Request Confirmed 💰';
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Withdrawal Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Withdrawal Confirmed!</h1>
            <p>Your withdrawal request has been processed</p>
          </div>
          <div class="content">
            <h2>Hello ${user.fullName}!</h2>
            <p>Your withdrawal request has been successfully submitted and is being processed.</p>

            <div class="details">
              <h3>Withdrawal Details</h3>
              <p><strong>Amount:</strong> $${user.amount.toFixed(2)}</p>
              <p><strong>Method:</strong> ${user.method}</p>
              <p><strong>Reference:</strong> ${user.reference}</p>
              <p><strong>Estimated Delivery:</strong> ${user.estimatedDelivery}</p>
            </div>

            <p>You'll receive another email once the transfer is completed.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 EarnPro. All rights reserved.</p>
            <p>This email was sent to ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

        return this.sendEmail({
            to: user.email,
            subject,
            html,
        });
    }

    // Send withdrawal completed notification
    async sendWithdrawalCompleted(user: {
        email: string;
        fullName: string;
        amount: number;
        method: string;
        reference: string;
    }) {
        const subject = 'Withdrawal Completed Successfully! ✅';
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Withdrawal Completed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Withdrawal Completed!</h1>
            <p>Your funds have been transferred successfully</p>
          </div>
          <div class="content">
            <h2>Hello ${user.fullName}!</h2>
            
            <div class="success">
              <h3>🎉 Congratulations!</h3>
              <p>Your withdrawal has been completed successfully. The funds should appear in your account shortly.</p>
            </div>

            <div class="details">
              <h3>Transaction Details</h3>
              <p><strong>Amount:</strong> $${user.amount.toFixed(2)}</p>
              <p><strong>Method:</strong> ${user.method}</p>
              <p><strong>Reference:</strong> ${user.reference}</p>
              <p><strong>Status:</strong> Completed</p>
            </div>

            <p>Thank you for using EarnPro! Keep earning and growing with us.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 EarnPro. All rights reserved.</p>
            <p>This email was sent to ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

        return this.sendEmail({
            to: user.email,
            subject,
            html,
        });
    }

    // Send application status update
    async sendApplicationStatusUpdate(user: {
        email: string;
        fullName: string;
        applicationType: 'agent' | 'advertiser';
        status: 'approved' | 'rejected';
        feedback?: string;
    }) {
        const isApproved = user.status === 'approved';
        const subject = isApproved
            ? `🎉 Your ${user.applicationType} application has been approved!`
            : `Your ${user.applicationType} application status update`;

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${isApproved ? '#28a745' : '#dc3545'} 0%, ${isApproved ? '#20c997' : '#e74c3c'} 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .status { background: ${isApproved ? '#d4edda' : '#f8d7da'}; border: 1px solid ${isApproved ? '#c3e6cb' : '#f5c6cb'}; color: ${isApproved ? '#155724' : '#721c24'}; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isApproved ? '🎉 Approved!' : 'Application Update'}</h1>
            <p>Your ${user.applicationType} application status</p>
          </div>
          <div class="content">
            <h2>Hello ${user.fullName}!</h2>
            
            <div class="status">
              <h3>${isApproved ? 'Congratulations!' : 'Application Status Update'}</h3>
              <p>Your ${user.applicationType} application has been <strong>${user.status}</strong>.</p>
              ${user.feedback ? `<p><strong>Feedback:</strong> ${user.feedback}</p>` : ''}
            </div>

            ${isApproved ? `
              <p>You can now access your ${user.applicationType} dashboard and start using our platform's advanced features.</p>
              <a href="${import.meta.env.VITE_APP_URL}/dashboard" style="display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Go to Dashboard</a>
            ` : `
              <p>Don't worry! You can still use our platform as a regular user and reapply in the future.</p>
              <p>If you have any questions, please contact our support team.</p>
            `}
          </div>
          <div class="footer">
            <p>&copy; 2025 EarnPro. All rights reserved.</p>
            <p>This email was sent to ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

        return this.sendEmail({
            to: user.email,
            subject,
            html,
        });
    }

    // Send password reset email
    async sendPasswordReset(user: {
        email: string;
        fullName: string;
        resetToken: string;
    }) {
        const subject = 'Reset Your EarnPro Password';
        const resetUrl = `${import.meta.env.VITE_APP_URL}/reset-password?token=${user.resetToken}`;

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
            <p>Reset your EarnPro account password</p>
          </div>
          <div class="content">
            <h2>Hello ${user.fullName}!</h2>
            <p>We received a request to reset your password for your EarnPro account.</p>
            
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <div class="warning">
              <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
              <p>If you didn't request this password reset, please ignore this email.</p>
            </div>

            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 EarnPro. All rights reserved.</p>
            <p>This email was sent to ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

        return this.sendEmail({
            to: user.email,
            subject,
            html,
        });
    }
}

export const emailService = new EmailService(); 