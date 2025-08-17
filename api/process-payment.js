const braintree = require('braintree');

// Initialize Braintree gateway
const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox, // Use Sandbox for testing, Production for live
  merchantId: '2yhrvbtjszdbvxtt',
  publicKey: 'sgfjmfv929kzffsr',
  privateKey: process.env.BRAINTREE_PRIVATE_KEY // You'll need to set this in your environment
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentNonce, amount, userId, planType } = req.body;

    if (!paymentNonce || !amount || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: paymentNonce, amount, userId' 
      });
    }

    console.log('🔷 Processing Braintree payment:', {
      nonce: paymentNonce,
      amount: amount,
      userId: userId,
      planType: planType
    });

    // Process the payment through Braintree
    const result = await gateway.transaction.sale({
      amount: amount.toString(),
      paymentMethodNonce: paymentNonce,
      options: {
        submitForSettlement: true
      },
      customFields: {
        userId: userId,
        planType: planType || 'activation'
      }
    });

    if (result.success) {
      const transaction = result.transaction;
      
      console.log('✅ Braintree payment successful:', {
        transactionId: transaction.id,
        amount: transaction.amount,
        status: transaction.status
      });

      // Here you would typically:
      // 1. Update user's payment status in your database
      // 2. Activate their account
      // 3. Send confirmation email
      // 4. Log the transaction

      return res.status(200).json({
        success: true,
        transactionId: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        message: 'Payment processed successfully'
      });

    } else {
      console.error('❌ Braintree payment failed:', result.message);
      
      // Handle specific error types
      let errorMessage = 'Payment processing failed';
      
      if (result.transaction) {
        // Transaction was created but failed
        errorMessage = `Payment failed: ${result.transaction.processorResponseText || result.message}`;
      } else if (result.message) {
        // General validation error
        errorMessage = result.message;
      }

      return res.status(400).json({
        success: false,
        error: errorMessage,
        details: result.message
      });
    }

  } catch (error) {
    console.error('❌ Payment processing error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during payment processing',
      details: error.message
    });
  }
}
