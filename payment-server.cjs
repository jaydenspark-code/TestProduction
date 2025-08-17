const express = require('express');
const cors = require('cors');
const braintree = require('braintree');
require('dotenv').config();

const app = express();
const port = 3001;

// Configure CORS for your frontend
app.use(cors({
  origin: ['http://localhost:5176', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Initialize Braintree Gateway
const privateKey = process.env.BRAINTREE_PRIVATE_KEY || '4edc8a7489369f8e7d5cb8c9a8066c17';

console.log('🔍 Environment check:');
console.log('- Private key loaded:', privateKey ? '✅ Yes' : '❌ No');
console.log('- Environment:', process.env.NODE_ENV || 'development');

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox, // Use Production for live
  merchantId: '2yhrvbtjszdbvxtt',
  publicKey: 'sgfjmfv929kzffsr',
  privateKey: privateKey
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server running', 
    braintree: 'configured',
    timestamp: new Date().toISOString()
  });
});

// Process payment endpoint
app.post('/api/process-payment', async (req, res) => {
  try {
    const { paymentNonce, amount, userId, planType } = req.body;

    if (!paymentNonce || !amount || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: paymentNonce, amount, userId' 
      });
    }

    console.log('🔷 Processing Braintree payment:', {
      nonce: paymentNonce,
      amount: amount,
      userId: userId,
      planType: planType || 'activation'
    });

    // Process the payment through Braintree
    const result = await gateway.transaction.sale({
      amount: amount.toString(),
      paymentMethodNonce: paymentNonce,
      options: {
        submitForSettlement: true
      }
      // Remove custom fields as they're causing validation errors
      // You can store this data in your own database instead
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

      return res.json({
        success: true,
        transactionId: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        message: 'Payment processed successfully'
      });

    } else {
      console.error('❌ Braintree payment failed:', result.message);
      
      let errorMessage = 'Payment processing failed';
      
      if (result.transaction) {
        errorMessage = `Payment failed: ${result.transaction.processorResponseText || result.message}`;
      } else if (result.message) {
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
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Payment server running at http://localhost:${port}`);
  console.log(`🔍 Health check: http://localhost:${port}/health`);
  console.log(`💳 Payment endpoint: http://localhost:${port}/api/process-payment`);
});

module.exports = app;
