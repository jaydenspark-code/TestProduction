import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

interface PaymentRequest {
  paymentMethodNonce: string
  amount: number
  customerId: string
  orderId?: string
  description?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { paymentMethodNonce, amount, customerId, orderId, description }: PaymentRequest = await req.json()

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const environment = Deno.env.get('BRAINTREE_ENVIRONMENT') || 'sandbox'
    const merchantId = Deno.env.get('BRAINTREE_MERCHANT_ID')
    const publicKey = Deno.env.get('BRAINTREE_PUBLIC_KEY')
    const privateKey = Deno.env.get('BRAINTREE_PRIVATE_KEY')

    if (!merchantId || !publicKey || !privateKey) {
      throw new Error('Missing Braintree credentials')
    }

    // Process payment via Braintree
    const authString = btoa(`${publicKey}:${privateKey}`)
    
    // Use correct Braintree Gateway URL
    const gatewayUrl = environment === 'sandbox'
      ? 'https://api.sandbox.braintreegateway.com'
      : 'https://api.braintreegateway.com'
    
    const paymentData = {
      transaction: {
        amount: amount.toFixed(2),
        payment_method_nonce: paymentMethodNonce,
        customer_id: customerId,
        order_id: orderId,
        options: {
          submit_for_settlement: true,
          store_in_vault_on_success: true
        }
      }
    }

    if (description) {
      paymentData.transaction.descriptor = {
        name: `EarnPro*${description.substring(0, 18)}`
      }
    }

    console.log('Processing Braintree payment with data:', JSON.stringify(paymentData, null, 2))

    const paymentResponse = await fetch(`${gatewayUrl}/merchants/${merchantId}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })

    console.log('Braintree payment response status:', paymentResponse.status)
    const responseText = await paymentResponse.text()
    console.log('Braintree payment response:', responseText)

    let paymentResult
    try {
      paymentResult = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse Braintree response:', parseError)
      throw new Error(`Invalid response from Braintree: ${responseText}`)
    }

    if (paymentResult.transaction && paymentResult.transaction.status === 'submitted_for_settlement') {
      // Get current user balance to add welcome bonus
      const { data: userData, error: userFetchError } = await supabase
        .from('users')
        .select('balance, total_earned')
        .eq('id', customerId)
        .single()

      if (userFetchError) {
        console.error('Error fetching user data:', userFetchError)
      }

      const currentBalance = userData?.balance || 0
      const currentTotalEarned = userData?.total_earned || 0

      // Payment successful - activate account and add ONLY $3 welcome bonus (NOT the $15 payment)
      const { error: userError } = await supabase
        .from('users')
        .update({
          is_paid: true,
          balance: currentBalance + 3.00, // Add $3 welcome bonus to existing balance
          total_earned: currentTotalEarned + 3.00 // Add $3 to total earned
        })
        .eq('id', customerId)

      if (userError) {
        console.error('Error updating user:', userError)
      }

      // Log the welcome bonus transaction (NOT the activation payment)
      await supabase
        .from('transactions')
        .insert({
          user_id: customerId,
          type: 'bonus',
          amount: 3.00,
          description: 'Welcome bonus for account activation',
          reference: `WELCOME-${customerId}-${Date.now()}`,
          status: 'completed'
        })

      // Log the activation payment transaction (separate from balance - this is the $15 fee)
      await supabase
        .from('transactions')
        .insert({
          user_id: customerId,
          type: 'activation_payment',
          amount: amount,
          description: 'Account activation fee payment',
          reference: orderId || `BT-${paymentResult.transaction.id}`,
          gateway_transaction_id: paymentResult.transaction.id,
          status: 'completed',
          gateway: 'braintree',
          note: 'Activation fee - not added to user balance'
        })

      // ✅ Process multi-level referral commissions (Level 1: $25, Level 2: $5, Level 3: $2.50)
      try {
        console.log('💰 Processing referral commissions for user activation...');
        
        // Trigger the referral commission function
        const { data: referralResult, error: referralError } = await supabase.rpc('activate_referral_commission', {
          p_user_id: customerId,
          p_activation_amount: amount
        });

        if (referralError) {
          console.error('❌ Error processing referral commissions:', referralError);
        } else {
          console.log('✅ Multi-level referral commissions processed successfully');
        }
      } catch (referralProcessError) {
        console.error('❌ Referral commission processing failed:', referralProcessError);
        // Don't fail the payment for referral errors
      }

      return new Response(
        JSON.stringify({
          success: true,
          transactionId: paymentResult.transaction.id,
          message: 'Payment successful and account activated',
          welcomeBonus: 3.00,
          note: 'Account activated with $3 welcome bonus'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      console.error('Braintree payment failed:', paymentResult)
      return new Response(
        JSON.stringify({
          success: false,
          error: paymentResult.message || 'Payment processing failed'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Braintree payment error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to process payment' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
