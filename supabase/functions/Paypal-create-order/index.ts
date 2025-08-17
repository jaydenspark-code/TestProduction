import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface PayPalRequest {
  amount: number
  currency: string
  userId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency, userId }: PayPalRequest = await req.json()

    console.log('📝 PayPal order creation request:', { amount, currency, userId })

    if (!amount || !currency || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount, currency, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID')
    const paypalClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')

    if (!paypalClientId || !paypalClientSecret) {
      console.error('❌ PayPal credentials not configured')
      return new Response(
        JSON.stringify({ error: 'PayPal credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get PayPal access token
    const authResponse = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${btoa(`${paypalClientId}:${paypalClientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    if (!authResponse.ok) {
      const authError = await authResponse.text()
      console.error('❌ PayPal auth failed:', authError)
      return new Response(
        JSON.stringify({ error: 'PayPal authentication failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authData = await authResponse.json()
    const accessToken = authData.access_token

    if (!accessToken) {
      console.error('❌ No access token received from PayPal')
      return new Response(
        JSON.stringify({ error: 'Failed to get PayPal access token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ PayPal access token obtained')

    // Create PayPal order
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency.toUpperCase(),
          value: amount.toFixed(2)
        },
        custom_id: userId
      }]
    }

    console.log('📦 Creating PayPal order with payload:', JSON.stringify(orderPayload, null, 2))

    const orderResponse = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `${userId}-${Date.now()}`
      },
      body: JSON.stringify(orderPayload)
    })

    if (!orderResponse.ok) {
      const orderError = await orderResponse.text()
      console.error('❌ PayPal order creation failed:', orderError)
      return new Response(
        JSON.stringify({ error: `PayPal order creation failed: ${orderError}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const orderData = await orderResponse.json()
    
    console.log('✅ PayPal order created successfully:', orderData.id)

    return new Response(
      JSON.stringify({
        orderId: orderData.id,
        status: orderData.status,
        approvalUrl: orderData.links?.find((link: any) => link.rel === 'approve')?.href
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ PayPal order creation error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create PayPal order', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})