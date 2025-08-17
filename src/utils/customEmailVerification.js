// Updated registration flow that creates custom verification tokens
// This works with SendGrid email delivery

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function registerWithCustomVerification(email, password, userData) {
  try {
    console.log('🚀 Starting registration for:', email)

    // Step 1: Create user account with Supabase auth (email_confirmed_at = null)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData, // This will trigger our user creation trigger
        emailRedirectTo: `${window.location.origin}/verify-email` // Won't be used since we're using custom emails
      }
    })

    if (authError) {
      console.error('❌ Auth signup error:', authError)
      throw authError
    }

    console.log('✅ User created in auth:', authData.user?.id)

    // Step 2: Create custom verification token
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('create_verification_token', { 
        user_email: email 
      })

    if (tokenError) {
      console.error('❌ Token creation error:', tokenError)
      throw tokenError
    }

    console.log('✅ Custom verification token created:', tokenData.token.substring(0, 10) + '...')

    // Step 3: Send verification email via our Vite middleware
    const emailResponse = await fetch('/api/send-verification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        verificationToken: tokenData.token,
        name: userData.name || email.split('@')[0]
      })
    })

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text()
      console.error('❌ Email sending error:', emailError)
      throw new Error('Failed to send verification email')
    }

    console.log('✅ Verification email sent via SendGrid')

    return {
      success: true,
      user: authData.user,
      message: 'Registration successful! Please check your email to verify your account.',
      needsVerification: true
    }

  } catch (error) {
    console.error('❌ Registration error:', error)
    return {
      success: false,
      error: error.message || 'Registration failed'
    }
  }
}

// Helper function to check verification status
export async function checkVerificationStatus(email) {
  try {
    const { data, error } = await supabase
      .from('email_verification_tokens')
      .select('verified_at, expires_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('❌ Verification status check error:', error)
      return { verified: false, expired: false }
    }

    const now = new Date()
    const expiresAt = new Date(data.expires_at)
    
    return {
      verified: data.verified_at !== null,
      expired: now > expiresAt && data.verified_at === null
    }
  } catch (error) {
    console.error('❌ Verification status error:', error)
    return { verified: false, expired: false }
  }
}

// Resend verification email
export async function resendVerificationEmail(email) {
  try {
    console.log('🔄 Resending verification email for:', email)

    // Create new verification token
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('create_verification_token', { 
        user_email: email 
      })

    if (tokenError) {
      console.error('❌ Token creation error:', tokenError)
      throw tokenError
    }

    // Send new verification email
    const emailResponse = await fetch('/api/send-verification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        verificationToken: tokenData.token,
        name: email.split('@')[0],
        isResend: true
      })
    })

    if (!emailResponse.ok) {
      throw new Error('Failed to send verification email')
    }

    console.log('✅ Verification email resent')
    return { success: true }

  } catch (error) {
    console.error('❌ Resend email error:', error)
    return { success: false, error: error.message }
  }
}
