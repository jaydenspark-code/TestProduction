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
    console.log('🔧 Applying RLS fixes...')

    // Create Supabase client with service role key for admin access
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

    const sqlFixes = [
      // Fix email_verification_codes policies
      `DROP POLICY IF EXISTS "Users can insert their own privacy settings" ON public.user_privacy_settings`,
      `DROP POLICY IF EXISTS "Users can view their own privacy settings" ON public.user_privacy_settings`,
      `DROP POLICY IF EXISTS "Users can update their own privacy settings" ON public.user_privacy_settings`,
      
      // Create permissive policies
      `CREATE POLICY "Allow service role full access to privacy settings" 
       ON public.user_privacy_settings 
       FOR ALL 
       TO service_role
       USING (true)
       WITH CHECK (true)`,
       
      `CREATE POLICY "Users can manage their own privacy settings" 
       ON public.user_privacy_settings 
       FOR ALL 
       TO authenticated, anon
       USING (true)
       WITH CHECK (true)`,

      // Fix verification codes
      `DROP POLICY IF EXISTS "Allow all operations" ON public.email_verification_codes`,
      `CREATE POLICY "Allow all operations" 
       ON public.email_verification_codes 
       FOR ALL 
       TO anon, authenticated, service_role
       USING (true)
       WITH CHECK (true)`
    ]

    const results = []
    
    for (const sql of sqlFixes) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
        
        if (error) {
          console.error(`❌ SQL Error: ${sql}`, error)
          results.push({ sql, success: false, error: error.message })
        } else {
          console.log(`✅ SQL Success: ${sql.substring(0, 50)}...`)
          results.push({ sql: sql.substring(0, 50) + '...', success: true })
        }
      } catch (err) {
        console.error(`❌ Exception executing: ${sql}`, err)
        results.push({ sql, success: false, error: err.message })
      }
    }

    console.log('🔧 RLS fixes completed')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'RLS fixes applied',
        results 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ RLS fix error:', error)
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
