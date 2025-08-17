import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const event = await req.json()

        console.log('Webhook event received:', event.event)

        if (event.event === 'charge.success') {
            const transaction = event.data
            const reference = transaction.reference

            // Extract userId from reference (format: EPRO-{userId}-{timestamp})
            const userId = reference.split('-')[1]

            if (userId) {
                // Get user details
                const { data: user, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single()

                if (userError) {
                    console.error('Error fetching user:', userError)
                    return new Response(JSON.stringify({ error: 'User not found' }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    })
                }

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

                // Update user payment status and add ONLY welcome bonus
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        is_paid: true,
                        balance: currentBalance + 3.00, // Add $3 welcome bonus to existing balance
                        total_earned: currentTotalEarned + 3.00 // Add $3 to total earned
                    })
                    .eq('id', userId)
                    .eq('is_paid', false) // Only update if not already paid

                if (updateError) {
                    console.error('Error updating user:', updateError)
                    return new Response(JSON.stringify({ error: 'Failed to update user' }), {
                        status: 500,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    })
                }

                // Log the welcome bonus transaction
                const { error: bonusError } = await supabase
                    .from('transactions')
                    .insert({
                        user_id: userId,
                        type: 'bonus',
                        amount: 3.00,
                        description: 'Welcome bonus for account activation',
                        reference: `WELCOME-${userId}-${Date.now()}`,
                        status: 'completed'
                    })

                if (bonusError) {
                    console.error('Error logging bonus transaction:', bonusError)
                }

                // Log the activation payment transaction (separate from balance)
                const { error: paymentError } = await supabase
                    .from('transactions')
                    .insert({
                        user_id: userId,
                        type: 'activation_payment',
                        amount: 15.00,
                        description: 'Account activation fee payment',
                        reference: reference,
                        paystack_reference: reference,
                        status: 'completed',
                        note: 'Activation fee - not added to user balance'
                    })

                if (paymentError) {
                    console.error('Error logging payment transaction:', paymentError)
                }

                console.log(`Payment successful for user ${userId}, reference: ${reference}`)
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Webhook error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
}) 