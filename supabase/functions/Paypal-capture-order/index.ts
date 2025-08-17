import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

interface PayPalCaptureRequest {
  orderId: string
  userId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, userId }: PayPalCaptureRequest = await req.json()

    // Get PayPal access token
    const authResponse = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${btoa(`${Deno.env.get('PAYPAL_CLIENT_ID')}:${Deno.env.get('PAYPAL_CLIENT_SECRET')}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    const authData = await authResponse.json()
    const accessToken = authData.access_token

    // Capture the PayPal order
    const captureResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `${userId}-capture-${Date.now()}`
      }
    })

    const captureData = await captureResponse.json()

    if (captureData.status === 'COMPLETED') {
      // Initialize Supabase client
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Get current user balance
      const { data: currentUserData, error: fetchError } = await supabase
        .from('users')
        .select('balance, total_earned')
        .eq('id', userId)
        .single()

      if (fetchError) {
        console.error('Error fetching current user data:', fetchError)
      }

      const currentBalance = currentUserData?.balance || 0
      const currentTotalEarned = currentUserData?.total_earned || 0

      // Update user account - activate and add ONLY $3 welcome bonus
      const { error: userError } = await supabase
        .from('users')
        .update({
          is_paid: true,
          balance: currentBalance + 3.00, // Add $3 welcome bonus to existing balance
          total_earned: currentTotalEarned + 3.00 // Add $3 to total earned
        })
        .eq('id', userId)

      if (userError) {
        console.error('Error updating user:', userError)
      }

      // Log the welcome bonus transaction
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'bonus',
          amount: 3.00,
          description: 'Welcome bonus for account activation',
          reference: `WELCOME-${userId}-${Date.now()}`,
          status: 'completed'
        })

      // Log the activation payment transaction (separate from balance)
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'activation_payment',
          amount: 15.00,
          description: 'Account activation fee payment',
          reference: `PAYPAL-${orderId}`,
          gateway_transaction_id: captureData.purchase_units[0].payments.captures[0].id,
          status: 'completed',
          gateway: 'paypal',
          note: 'Activation fee - not added to user balance'
        })

      return new Response(
        JSON.stringify({
          success: true,
          transactionId: captureData.purchase_units[0].payments.captures[0].id,
          message: 'Payment successful and account activated',
          welcomeBonus: 3.00
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      throw new Error('Payment capture failed')
    }
  } catch (error) {
    console.error('PayPal capture error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to capture PayPal payment' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})