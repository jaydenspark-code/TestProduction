import axios from 'axios';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

async function testPaystack() {
  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: 'test@example.com',
        amount: 10000,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.VITE_PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    console.log('Paystack Response:', response.data);
  } catch (error) {
    console.error('Paystack Test Failed:', error.response?.data || error.message);
  }
}

async function testStripe() {
  try {
    const response = await axios.post(
      'https://api.stripe.com/v1/payment_intents',
      new URLSearchParams({
        amount: '1000',
        currency: 'usd',
      }),
      {
        headers: {
          Authorization: `Bearer ${process.env.VITE_STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('Stripe Response:', response.data);
  } catch (error) {
    console.error('Stripe Test Failed:', error.response?.data || error.message);
  }
}

async function testPayPal() {
  try {
    const auth = Buffer.from(`${process.env.VITE_PAYPAL_CLIENT_ID}:${process.env.VITE_PAYPAL_CLIENT_SECRET}`).toString('base64');
    const { data } = await axios.post('https://api-m.sandbox.paypal.com/v1/oauth2/token', 'grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const response = await axios.post(
      'https://api-m.sandbox.paypal.com/v1/payments/payment',
      {
        intent: 'sale',
        payer: {
          payment_method: 'paypal',
        },
        transactions: [{
          amount: {
            total: '10.00',
            currency: 'USD',
          },
        }],
        redirect_urls: {
          return_url: 'http://localhost:3000/success',
          cancel_url: 'http://localhost:3000/cancel',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('PayPal Response:', response.data);
  } catch (error) {
    console.error('PayPal Test Failed:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('Starting payment tests...');
  await testPaystack();
  await testStripe();
  await testPayPal();
  console.log('Payment tests completed.');
}

runTests();
