import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface ClientTokenRequest {
  customerId?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customerId }: ClientTokenRequest = await req.json()

    // Use Braintree REST API to generate client token
    const environment = Deno.env.get('BRAINTREE_ENVIRONMENT') || 'sandbox'
    const merchantId = Deno.env.get('BRAINTREE_MERCHANT_ID')
    const publicKey = Deno.env.get('BRAINTREE_PUBLIC_KEY')
    const privateKey = Deno.env.get('BRAINTREE_PRIVATE_KEY')

    if (!merchantId || !publicKey || !privateKey) {
      throw new Error('Missing Braintree credentials')
    }

    // Check for dummy/invalid credentials - updated to exclude real credentials
    const dummyCredentials = [
      // Note: Removed real credentials from this list
      'your_merchant_id_here',
      'your_public_key_here', 
      'your_private_key_here',
      'your_real_merchant_id',
      'your_real_public_key',
      'your_real_private_key_very_long',
      'dummy',
      'test',
      'placeholder',
      'example',
      'sample'
    ]
    
    // Real credentials from dashboard (these are VALID):
    // merchantId: 2yhrvbtjszdbvxtt
    // publicKey: sgfjmfv929kzffsr  
    // privateKey: 4edc8a7489369f8e7d5cb8c9a8066c17
    
    if (dummyCredentials.includes(merchantId) || 
        dummyCredentials.includes(publicKey) || 
        dummyCredentials.includes(privateKey)) {
      console.log('Detected dummy credential:', { merchantId, publicKey, privateKey })
      throw new Error('Invalid Braintree credentials detected. Please update with real sandbox credentials from https://developer.paypal.com/braintree/')
    }

    console.log('Braintree Environment:', environment)
    console.log('Merchant ID:', merchantId)
    console.log('Public Key:', publicKey ? 'Set' : 'Missing')
    console.log('Private Key:', privateKey ? 'Set' : 'Missing')

    // Create basic auth header with public:private key format
    const credentials = btoa(`${publicKey}:${privateKey}`)
    
    // Use the correct Braintree Gateway API endpoint for client tokens
    const gatewayUrl = environment === 'sandbox'
      ? 'https://api.sandbox.braintreegateway.com'
      : 'https://api.braintreegateway.com'

    // Create client token request body
    // For one-time payments, we don't need to specify a customer_id
    // This avoids the "customer does not exist" error
    const requestBody = {
      client_token: {
        // Don't include customer_id for one-time payments
        // This allows any user to make payments without pre-existing customer records
      }
    }

    console.log('Making request to:', `${gatewayUrl}/merchants/${merchantId}/client_token`)
    console.log('Request body:', JSON.stringify(requestBody, null, 2))

    const tokenResponse = await fetch(`${gatewayUrl}/merchants/${merchantId}/client_token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Braintree-Version': '2019-01-01'
      },
      body: JSON.stringify(requestBody)
    })

    console.log('Braintree API Response Status:', tokenResponse.status)
    const responseText = await tokenResponse.text()
    console.log('Braintree API Response:', responseText)

    if (!tokenResponse.ok) {
      throw new Error(`Braintree API error: ${tokenResponse.status} - ${responseText}`)
    }

    let tokenData
    try {
      tokenData = JSON.parse(responseText)
    } catch (parseError) {
      // If it's not JSON, the response might be the client token directly
      tokenData = { client_token: responseText }
    }

    return new Response(
      JSON.stringify({
        success: true,
        clientToken: tokenData.client_token || tokenData.clientToken || responseText
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Braintree client token error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to generate client token' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
