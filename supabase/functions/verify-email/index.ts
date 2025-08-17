// Custom email verification API endpoint
// This handles verification tokens from SendGrid emails and updates Supabase auth
// This function is designed to be publicly accessible for email verification links

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // IMPORTANT: Remove all authentication checks to make this truly public
  // Supabase infrastructure was blocking requests before reaching our code

  try {
    // Get URL parameters - NO AUTHENTICATION REQUIRED
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    
    console.log('🚀 Public email verification request:', {
      method: req.method,
      url: req.url,
      token: token ? token.substring(0, 10) + '...' : null,
      timestamp: new Date().toISOString()
    })
    
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'No verification token provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key for admin access to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔍 Verifying token:', token.substring(0, 10) + '...')

    // Call our custom verification function
    const { data: verificationResult, error } = await supabase
      .rpc('verify_email_token', { verification_token: token })

    if (error) {
      console.error('❌ Verification error:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Verification result:', verificationResult)

    if (verificationResult.success) {
      // Create a success page HTML that redirects to payment
      const successHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verified - EarnPro</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              min-height: 100vh; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
            }
            .container { 
              background: white; 
              padding: 40px; 
              border-radius: 12px; 
              box-shadow: 0 8px 32px rgba(0,0,0,0.1); 
              text-align: center; 
              max-width: 500px; 
              width: 100%; 
            }
            .success-icon { 
              font-size: 64px; 
              margin-bottom: 20px; 
            }
            .title { 
              color: #2d3748; 
              font-size: 28px; 
              font-weight: bold; 
              margin-bottom: 16px; 
            }
            .message { 
              color: #4a5568; 
              font-size: 16px; 
              line-height: 1.6; 
              margin-bottom: 30px; 
            }
            .redirect-info { 
              background: #f7fafc; 
              padding: 20px; 
              border-radius: 8px; 
              border-left: 4px solid #48bb78; 
              margin-bottom: 30px; 
            }
            .btn { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 14px 28px; 
              border: none; 
              border-radius: 8px; 
              font-size: 16px; 
              font-weight: bold; 
              cursor: pointer; 
              text-decoration: none; 
              display: inline-block; 
              transition: transform 0.2s; 
            }
            .btn:hover { 
              transform: translateY(-2px); 
            }
            .countdown { 
              color: #718096; 
              font-size: 14px; 
              margin-top: 20px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h1 class="title">Email Verified Successfully!</h1>
            <p class="message">
              Welcome to EarnPro! Your email address <strong>${verificationResult.email}</strong> has been verified.
            </p>
            <div class="redirect-info">
              <p><strong>🎉 Account Activated!</strong></p>
              <p>You will be automatically redirected to complete your account setup and access the payment page.</p>
            </div>
            <a href="${Deno.env.get('APP_URL') || 'http://localhost:5173'}/payment" class="btn">
              Continue to Payment Page
            </a>
            <p class="countdown">
              Redirecting automatically in <span id="countdown">5</span> seconds...
            </p>
          </div>
          
          <script>
            let countdown = 5;
            const countdownElement = document.getElementById('countdown');
            
            const timer = setInterval(() => {
              countdown--;
              countdownElement.textContent = countdown;
              
              if (countdown <= 0) {
                clearInterval(timer);
                window.location.href = '${Deno.env.get('APP_URL') || 'http://localhost:5173'}/payment';
              }
            }, 1000);
          </script>
        </body>
        </html>
      `

      return new Response(successHtml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      })
    } else {
      // Return error page
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Failed - EarnPro</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              min-height: 100vh; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
            }
            .container { 
              background: white; 
              padding: 40px; 
              border-radius: 12px; 
              box-shadow: 0 8px 32px rgba(0,0,0,0.1); 
              text-align: center; 
              max-width: 500px; 
              width: 100%; 
            }
            .error-icon { 
              font-size: 64px; 
              margin-bottom: 20px; 
            }
            .title { 
              color: #e53e3e; 
              font-size: 28px; 
              font-weight: bold; 
              margin-bottom: 16px; 
            }
            .message { 
              color: #4a5568; 
              font-size: 16px; 
              line-height: 1.6; 
              margin-bottom: 30px; 
            }
            .btn { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 14px 28px; 
              border: none; 
              border-radius: 8px; 
              font-size: 16px; 
              font-weight: bold; 
              cursor: pointer; 
              text-decoration: none; 
              display: inline-block; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">❌</div>
            <h1 class="title">Verification Failed</h1>
            <p class="message">
              ${verificationResult.error || 'The verification link is invalid or has expired.'}
            </p>
            <a href="${Deno.env.get('APP_URL') || 'http://localhost:5173'}/register" class="btn">
              Back to Registration
            </a>
          </div>
        </body>
        </html>
      `

      return new Response(errorHtml, {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      })
    }

  } catch (error) {
    console.error('❌ Verification endpoint error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
