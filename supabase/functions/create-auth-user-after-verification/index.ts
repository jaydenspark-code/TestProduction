// Edge Function: create-auth-user-after-verification
// This function creates a user in Supabase auth after email verification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Create admin Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { email, password, fullName, userId } = await req.json()

    console.log(`🔐 Creating auth user for email: ${email}`)

    // Create user in Supabase auth system
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Skip email confirmation since we already verified via code
      user_metadata: {
        full_name: fullName
      }
    })

    if (authError) {
      console.error('❌ Failed to create auth user:', authError)
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Auth user created successfully: ${authUser.user?.id}`)

    // Update the user record to link to the auth user and remove temp password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        temp_password: null,
        auth_user_id: authUser.user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Failed to update user record:', updateError)
      // Don't fail the request since auth user was created successfully
    } else {
      console.log('✅ User record updated with auth_user_id')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        authUserId: authUser.user?.id,
        message: 'Auth user created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in create-auth-user-after-verification:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
