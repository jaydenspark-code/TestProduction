// API endpoint to send verification emails via SendGrid
// This will be used by Vercel Functions

interface EmailRequest {
  email: string;
  fullName: string;
  verificationToken: string;
}

export default async function handler(request: Request): Promise<Response> {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body: EmailRequest = await request.json();
    const { email, fullName, verificationToken } = body;

    // Validate required fields
    if (!email || !fullName || !verificationToken) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: email, fullName, verificationToken' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('📧 API: Sending verification email to:', email);

    const verificationUrl = `${process.env.VITE_APP_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    
    const emailData = {
      personalizations: [{
        to: [{ email: email, name: fullName }],
        subject: '🔐 Verify Your EarnPro Account - Action Required'
      }],
      from: {
        email: 'noreply@earnpro.org',
        name: 'EarnPro Team'
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
                    Hi ${fullName}! Welcome to EarnPro. Please click the button below to verify your email address and complete your registration.
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

    // Make request to SendGrid API
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer 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`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok || response.status === 202) {
      console.log('✅ API: Verification email sent successfully via SendGrid');
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      const errorText = await response.text();
      console.error('❌ API: Failed to send email via SendGrid:', response.status, errorText);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `SendGrid error: ${response.status}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('❌ API: Error sending verification email:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
