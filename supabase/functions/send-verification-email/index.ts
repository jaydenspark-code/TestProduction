import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, fullName, verificationCode } = await req.json()

    if (!email || !fullName || !verificationCode) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // SendGrid API configuration
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') || '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'
    const FROM_EMAIL = 'noreply@earnpro.org'
    const FROM_NAME = 'EarnPro Team'

    // Email content
    const emailContent = {
      personalizations: [
        {
          to: [{ email, name: fullName }],
          subject: `Welcome to EarnPro! Verify Your Email - Code: ${verificationCode}`
        }
      ],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      content: [
        {
          type: 'text/html',
          value: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verify Your Email - EarnPro</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to EarnPro!</h1>
                <p style="color: #f0f0f0; margin: 10px 0 0 0;">Your journey to earning online starts here</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">Hi ${fullName}! 👋</h2>
                
                <p>Thank you for joining EarnPro! To complete your registration and start earning, please verify your email address.</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                  <p style="margin: 0 0 10px 0; font-size: 16px; color: #666;">Your verification code is:</p>
                  <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 3px; font-family: 'Courier New', monospace;">${verificationCode}</div>
                  <p style="margin: 10px 0 0 0; font-size: 14px; color: #999;">This code will expire in 15 minutes</p>
                </div>
                
                <p>Enter this code on the verification page to activate your account and unlock:</p>
                
                <ul style="color: #555; margin: 20px 0;">
                  <li>🎯 <strong>Task Marketplace</strong> - Earn money completing simple tasks</li>
                  <li>💰 <strong>Referral System</strong> - Get paid for every friend you invite</li>
                  <li>📊 <strong>Analytics Dashboard</strong> - Track your earnings and progress</li>
                  <li>🏆 <strong>Achievement System</strong> - Unlock rewards as you progress</li>
                  <li>💎 <strong>Premium Features</strong> - Access exclusive high-paying tasks</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="http://localhost:5175/verify-email" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Verify Email Now</a>
                </div>
                
                <hr style="border: none; height: 1px; background: #eee; margin: 30px 0;">
                
                <p style="font-size: 14px; color: #666;">
                  <strong>Security Notice:</strong> If you didn't create an EarnPro account, please ignore this email. Your email address will not be used again.
                </p>
                
                <p style="font-size: 14px; color: #666;">
                  Need help? Contact our support team at <a href="mailto:support@earnpro.org" style="color: #667eea;">support@earnpro.org</a>
                </p>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="font-size: 12px; color: #999; margin: 0;">
                    © 2025 EarnPro. All rights reserved.<br>
                    Making online earning accessible to everyone.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `
        }
      ]
    }

    // Send email via SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailContent),
    })

    if (response.ok) {
      console.log('✅ Verification email sent successfully to:', email)
      return new Response(
        JSON.stringify({ success: true, message: 'Verification email sent successfully' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      const errorText = await response.text()
      console.error('❌ SendGrid error:', response.status, errorText)
      return new Response(
        JSON.stringify({ success: false, error: `Email send failed: ${response.status}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('❌ Email service error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
