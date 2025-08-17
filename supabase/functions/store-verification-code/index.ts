import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    const { user_id, email, code, expires_at } = await req.json()

    console.log('🔑 Store verification code request:', {
      user_id: user_id?.substring(0, 8) + '...',
      email,
      code: code?.substring(0, 2) + '...',
      timestamp: new Date().toISOString()
    })

    if (!user_id || !email || !code || !expires_at) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: user_id, email, code, expires_at' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key to bypass RLS
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

    // Insert verification code with service role privileges
    const { data, error } = await supabase
      .from('email_verification_codes')
      .insert({
        user_id,
        email,
        code,
        expires_at,
        created_at: new Date().toISOString(),
        attempts: 0
      })
      .select()

    if (error) {
      console.error('❌ Failed to store verification code:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Database error: ${error.message}`,
          code: error.code 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Verification code stored successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification code stored successfully',
        id: data?.[0]?.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Store verification code error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
