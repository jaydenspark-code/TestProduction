class EmailService {
    private apiKey = import.meta.env.VITE_SENDGRID_API_KEY;
    private fromEmail = import.meta.env.VITE_SENDGRID_FROM_EMAIL || 'noreply@earnpro.org';
    private baseUrl = 'https://api.sendgrid.com/v3';

    private isConfigured(): boolean {
        // More thorough configuration check
        const hasApiKey = !!this.apiKey;
        const isValidKey = this.apiKey && this.apiKey !== 'your_sendgrid_api_key_here' && this.apiKey.startsWith('SG.');
        const hasFromEmail = !!this.fromEmail;
        const isConfigured = hasApiKey && isValidKey && hasFromEmail;
        
        console.log('🔍 SendGrid Configuration Check:', {
            hasApiKey,
            apiKeyLength: this.apiKey?.length || 0,
            startsWithSG: this.apiKey?.startsWith('SG.') || false,
            hasFromEmail,
            fromEmail: this.fromEmail,
            isConfigured
        });
        
        if (!isConfigured) {
            console.warn('⚠️ SendGrid Configuration Issues:', {
                apiKey: hasApiKey ? 'Present' : 'Missing',
                validKey: isValidKey ? 'Valid' : 'Invalid',
                fromEmail: hasFromEmail ? 'Present' : 'Missing'
            });
        }
        
        return !!isConfigured;
    }

    private async makeRequest(endpoint: string, options: RequestInit = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`SendGrid API error: ${response.status} ${response.statusText} - ${errorText}`);
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
        // Check if SendGrid is configured
        if (!this.isConfigured()) {
            console.warn('⚠️ SendGrid not configured, email sending skipped');
            console.log('📧 Would send email to:', data.to, 'Subject:', data.subject);
            return Promise.resolve({ message: 'Email sending skipped - SendGrid not configured' });
        }
        const payload = {
            personalizations: [
                {
                    to: [{ email: data.to }],
                    subject: data.subject,
                }
            ],
            from: { 
                email: data.from || this.fromEmail,
                name: 'EarnPro'
            },
            content: [
                {
                    type: 'text/html',
                    value: data.html
                }
            ]
        };

        if (data.replyTo) {
            (payload as any).reply_to = { email: data.replyTo };
        }

        if (data.attachments) {
            (payload as any).attachments = data.attachments.map(attachment => ({
                content: attachment.data,
                filename: attachment.filename,
                type: attachment.contentType,
                disposition: 'attachment'
            }));
        }

        return this.makeRequest('/mail/send', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    // Send welcome email with professional template
    async sendWelcomeEmail(user: {
        email: string;
        fullName: string;
        referralCode: string;
    }) {
        const subject = 'Welcome to EarnPro - Your Journey Starts Now! 🚀';
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to EarnPro</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333333; background-color: #f8fafc; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: #ffffff; font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .header p { color: rgba(255,255,255,0.9); font-size: 16px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 20px; font-weight: 600; color: #1a202c; margin-bottom: 20px; }
        .message { font-size: 16px; color: #4a5568; margin-bottom: 30px; line-height: 1.7; }
        .features-list { background: #f7fafc; border-radius: 12px; padding: 25px; margin: 30px 0; }
        .features-list h3 { color: #2d3748; font-size: 18px; margin-bottom: 15px; }
        .features-list ul { list-style: none; }
        .features-list li { padding: 8px 0; color: #4a5568; position: relative; padding-left: 25px; }
        .features-list li:before { content: "✓"; position: absolute; left: 0; color: #48bb78; font-weight: bold; }
        .referral-box { background: linear-gradient(135deg, #e6fffa 0%, #f0fff4 100%); border: 2px solid #48bb78; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0; }
        .referral-box h3 { color: #2f855a; font-size: 18px; margin-bottom: 10px; }
        .referral-code { font-size: 24px; font-weight: 700; color: #2f855a; background: #ffffff; padding: 15px 20px; border-radius: 8px; display: inline-block; margin: 10px 0; letter-spacing: 2px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0; transition: transform 0.2s; }
        .cta-button:hover { transform: translateY(-2px); }
        .footer { background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #718096; font-size: 14px; margin-bottom: 5px; }
        .social-links { margin: 20px 0; }
        .social-links a { display: inline-block; margin: 0 10px; color: #667eea; text-decoration: none; }
        @media only screen and (max-width: 600px) {
            .content, .header, .footer { padding: 20px !important; }
            .header h1 { font-size: 24px !important; }
            .referral-code { font-size: 20px !important; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🎉 Welcome to EarnPro!</h1>
            <p>The world's most trusted referral rewards platform</p>
        </div>
        
        <div class="content">
            <div class="greeting">Hello ${user.fullName}!</div>
            
            <div class="message">
                Welcome to EarnPro! We're thrilled to have you join our community of successful earners. Your journey to financial freedom starts today.
            </div>
            
            <div class="features-list">
                <h3>🚀 What you can do right now:</h3>
                <ul>
                    <li>Complete your profile to unlock all features</li>
                    <li>Start earning through our referral program</li>
                    <li>Apply to become a verified agent</li>
                    <li>Explore premium advertising opportunities</li>
                    <li>Join our exclusive community of top earners</li>
                </ul>
            </div>

            <div class="referral-box">
                <h3>🎯 Your Personal Referral Code</h3>
                <div class="referral-code">${user.referralCode}</div>
                <p style="color: #4a5568; margin-top: 10px;">Share this code with friends and family to start earning rewards instantly!</p>
            </div>

            <div style="text-align: center;">
                <a href="${import.meta.env.VITE_APP_URL}/dashboard" class="cta-button">Access Your Dashboard</a>
            </div>

            <div class="message">
                Need help getting started? Our support team is here 24/7 to assist you. Simply reply to this email or visit our help center.
            </div>
        </div>
        
        <div class="footer">
            <div class="social-links">
                <a href="#">Facebook</a> | <a href="#">Twitter</a> | <a href="#">LinkedIn</a>
            </div>
            <p><strong>EarnPro</strong> - Empowering Your Financial Future</p>
            <p>© 2025 EarnPro. All rights reserved.</p>
            <p style="margin-top: 15px;">This email was sent to ${user.email}</p>
            <p style="font-size: 12px; color: #a0aec0;">If you no longer wish to receive these emails, you can <a href="#" style="color: #667eea;">unsubscribe here</a>.</p>
        </div>
    </div>
</body>
</html>`;

        return this.sendEmail({
            to: user.email,
            subject,
            html,
        });
    }

    // Professional withdrawal confirmation template
    async sendWithdrawalConfirmation(user: {
        email: string;
        fullName: string;
        amount: number;
        method: string;
        reference: string;
        estimatedDelivery: string;
    }) {
        const subject = 'Withdrawal Request Confirmed - Processing Your Payment 💰';
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Withdrawal Confirmation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f8fafc; }
        .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 40px 30px; text-align: center; color: white; }
        .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .content { padding: 40px 30px; }
        .status-badge { background: #f0fff4; border: 2px solid #48bb78; color: #2f855a; padding: 12px 20px; border-radius: 25px; display: inline-block; font-weight: 600; margin: 20px 0; }
        .details-card { background: #f7fafc; border-left: 4px solid #48bb78; padding: 25px; border-radius: 8px; margin: 25px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #4a5568; }
        .detail-value { color: #2d3748; font-weight: 500; }
        .timeline { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0; }
        .footer { background: #f7fafc; padding: 30px; text-align: center; color: #718096; font-size: 14px; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>💰 Withdrawal Confirmed</h1>
            <p>Your payment is being processed</p>
        </div>
        
        <div class="content">
            <h2 style="color: #2d3748; margin-bottom: 15px;">Hello ${user.fullName}!</h2>
            
            <div class="status-badge">✅ Processing</div>
            
            <p style="color: #4a5568; font-size: 16px; margin-bottom: 25px;">
                Great news! Your withdrawal request has been successfully submitted and is now being processed by our secure payment system.
            </p>

            <div class="details-card">
                <h3 style="color: #2d3748; margin-bottom: 15px;">💳 Transaction Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Amount:</span>
                    <span class="detail-value">$${user.amount.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Method:</span>
                    <span class="detail-value">${user.method}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Reference ID:</span>
                    <span class="detail-value">${user.reference}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Estimated Delivery:</span>
                    <span class="detail-value">${user.estimatedDelivery}</span>
                </div>
            </div>

            <div class="timeline">
                <h3 style="color: #2d3748; margin-bottom: 15px;">📋 What happens next?</h3>
                <ul style="list-style: none; padding: 0;">
                    <li style="padding: 8px 0; color: #48bb78;">✅ Request submitted and verified</li>
                    <li style="padding: 8px 0; color: #ed8936;">🔄 Processing payment (current step)</li>
                    <li style="padding: 8px 0; color: #a0aec0;">⏳ Transfer to your account</li>
                    <li style="padding: 8px 0; color: #a0aec0;">📧 Completion confirmation email</li>
                </ul>
            </div>

            <p style="color: #4a5568; font-size: 16px;">
                You'll receive another email once the transfer is completed. If you have any questions, our support team is available 24/7.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>EarnPro</strong> - Secure & Reliable Payments</p>
            <p>© 2025 EarnPro. All rights reserved.</p>
            <p>This email was sent to ${user.email}</p>
        </div>
    </div>
</body>
</html>`;

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

    // Send email verification using SendGrid directly with 6-character code
    async sendEmailVerificationCode(user: {
        email: string;
        fullName: string;
        verificationCode: string;
    }) {
        console.log('📧 Sending verification code directly via SendGrid to:', user.email);
        
        if (!this.isConfigured()) {
            console.error('❌ SendGrid not configured properly');
            return { success: false, error: 'Email service not configured' };
        }
        
        try {
            const emailData = {
                personalizations: [
                    {
                        to: [{ email: user.email, name: user.fullName }],
                        subject: 'Verify Your EarnPro Account - Verification Code',
                    },
                ],
                from: { email: this.fromEmail, name: 'EarnPro' },
                content: [
                    {
                        type: 'text/html',
                        value: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Verify Your EarnPro Account</title>
                        </head>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to EarnPro!</h1>
                                <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Multi-Level Referral Rewards Platform</p>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
                                <h2 style="color: #333; margin-top: 0;">Hello ${user.fullName}!</h2>
                                <p style="font-size: 16px; margin-bottom: 20px;">
                                    Thank you for joining EarnPro! To complete your registration and activate your account, please use the verification code below:
                                </p>
                                
                                <div style="background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 25px 0; border-radius: 8px;">
                                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Your Verification Code:</p>
                                    <h2 style="color: #667eea; font-size: 32px; font-weight: bold; letter-spacing: 3px; margin: 0; font-family: 'Courier New', monospace;">
                                        ${user.verificationCode}
                                    </h2>
                                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #888;">Code expires in 15 minutes</p>
                                </div>
                                
                                <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
                                    <p style="margin: 0; font-size: 14px;">
                                        <strong>Instructions:</strong><br>
                                        1. Return to the EarnPro registration page<br>
                                        2. Enter the 6-character code above<br>
                                        3. Complete your account setup and payment
                                    </p>
                                </div>
                                
                                <p style="font-size: 14px; color: #666;">
                                    Once verified, you'll gain access to:
                                </p>
                                <ul style="color: #666; font-size: 14px;">
                                    <li>Multi-level referral earnings</li>
                                    <li>$3.00 instant welcome bonus</li>
                                    <li>Daily earning tasks</li>
                                    <li>24/7 support and guidance</li>
                                </ul>
                            </div>
                            
                            <div style="text-align: center; padding: 20px; border-top: 1px solid #eee;">
                                <p style="margin: 0; font-size: 12px; color: #888;">
                                    If you didn't request this verification, please ignore this email.<br>
                                    This code will expire in 15 minutes for security purposes.
                                </p>
                            </div>
                        </body>
                        </html>
                        `
                    }
                ],
            };

            const response = await this.makeRequest('/mail/send', {
                method: 'POST',
                body: JSON.stringify(emailData),
            });

            if (response.ok) {
                console.log('✅ Verification email sent successfully via SendGrid');
                return { success: true };
            } else {
                const errorText = await response.text();
                console.error('❌ SendGrid API error:', response.status, errorText);
                return { success: false, error: `SendGrid error: ${response.status}` };
            }
        } catch (error: any) {
            console.error('❌ Error sending verification email:', error);
            return { success: false, error: `Email send failed: ${error?.message || 'Unknown error'}` };
        }
    }
}

export const emailService = new EmailService(); 
