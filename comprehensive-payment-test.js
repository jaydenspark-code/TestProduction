import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class PaymentTester {
  constructor() {
    this.results = {
      paystack: { success: 0, failed: 0, tests: [] },
      stripe: { success: 0, failed: 0, tests: [] },
      paypal: { success: 0, failed: 0, tests: [] }
    };
  }

  async testPaystackScenarios() {
    console.log('\n🔄 Testing Paystack Payment Scenarios...');
    
    const scenarios = [
      {
        name: 'Valid Transaction',
        data: { email: 'test@example.com', amount: 10000 },
        expectSuccess: true
      },
      {
        name: 'Invalid Email',
        data: { email: 'invalid-email', amount: 10000 },
        expectSuccess: false
      },
      {
        name: 'Zero Amount',
        data: { email: 'test@example.com', amount: 0 },
        expectSuccess: false
      },
      {
        name: 'Large Transaction',
        data: { email: 'test@example.com', amount: 100000000 },
        expectSuccess: true
      }
    ];

    for (const scenario of scenarios) {
      try {
        const response = await axios.post(
          'https://api.paystack.co/transaction/initialize',
          scenario.data,
          {
            headers: {
              Authorization: `Bearer ${process.env.VITE_PAYSTACK_SECRET_KEY}`,
            },
          }
        );

        if (scenario.expectSuccess && response.data.status) {
          this.results.paystack.success++;
          this.results.paystack.tests.push({ name: scenario.name, status: '✅ PASS', details: response.data.message });
        } else if (!scenario.expectSuccess && !response.data.status) {
          this.results.paystack.success++;
          this.results.paystack.tests.push({ name: scenario.name, status: '✅ PASS', details: 'Expected failure occurred' });
        } else {
          this.results.paystack.failed++;
          this.results.paystack.tests.push({ name: scenario.name, status: '❌ FAIL', details: 'Unexpected result' });
        }
      } catch (error) {
        if (!scenario.expectSuccess) {
          this.results.paystack.success++;
          this.results.paystack.tests.push({ name: scenario.name, status: '✅ PASS', details: 'Expected error occurred' });
        } else {
          this.results.paystack.failed++;
          this.results.paystack.tests.push({ name: scenario.name, status: '❌ FAIL', details: error.response?.data?.message || error.message });
        }
      }
    }
  }

  async testStripeScenarios() {
    console.log('\n🔄 Testing Stripe Payment Scenarios...');
    
    const scenarios = [
      {
        name: 'Valid Payment Intent',
        data: { amount: '1000', currency: 'usd' },
        expectSuccess: true
      },
      {
        name: 'Invalid Currency',
        data: { amount: '1000', currency: 'xyz' },
        expectSuccess: false
      },
      {
        name: 'Zero Amount',
        data: { amount: '0', currency: 'usd' },
        expectSuccess: false
      },
      {
        name: 'Large Amount',
        data: { amount: '99999999', currency: 'usd' },
        expectSuccess: true
      }
    ];

    for (const scenario of scenarios) {
      try {
        const response = await axios.post(
          'https://api.stripe.com/v1/payment_intents',
          new URLSearchParams(scenario.data),
          {
            headers: {
              Authorization: `Bearer ${process.env.VITE_STRIPE_SECRET_KEY}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        if (scenario.expectSuccess && response.data.id) {
          this.results.stripe.success++;
          this.results.stripe.tests.push({ name: scenario.name, status: '✅ PASS', details: `Payment Intent: ${response.data.id}` });
        } else {
          this.results.stripe.failed++;
          this.results.stripe.tests.push({ name: scenario.name, status: '❌ FAIL', details: 'Unexpected result' });
        }
      } catch (error) {
        if (!scenario.expectSuccess) {
          this.results.stripe.success++;
          this.results.stripe.tests.push({ name: scenario.name, status: '✅ PASS', details: 'Expected error occurred' });
        } else {
          this.results.stripe.failed++;
          this.results.stripe.tests.push({ name: scenario.name, status: '❌ FAIL', details: error.response?.data?.error?.message || error.message });
        }
      }
    }
  }

  async testPayPalScenarios() {
    console.log('\n🔄 Testing PayPal Payment Scenarios...');
    
    try {
      // Get access token first
      const auth = Buffer.from(`${process.env.VITE_PAYPAL_CLIENT_ID}:${process.env.VITE_PAYPAL_CLIENT_SECRET}`).toString('base64');
      const tokenResponse = await axios.post(
        'https://api-m.sandbox.paypal.com/v1/oauth2/token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const accessToken = tokenResponse.data.access_token;

      const scenarios = [
        {
          name: 'Valid Payment',
          data: {
            intent: 'sale',
            payer: { payment_method: 'paypal' },
            transactions: [{ amount: { total: '10.00', currency: 'USD' } }],
            redirect_urls: {
              return_url: 'http://localhost:3000/success',
              cancel_url: 'http://localhost:3000/cancel',
            },
          },
          expectSuccess: true
        },
        {
          name: 'Invalid Amount',
          data: {
            intent: 'sale',
            payer: { payment_method: 'paypal' },
            transactions: [{ amount: { total: 'invalid', currency: 'USD' } }],
            redirect_urls: {
              return_url: 'http://localhost:3000/success',
              cancel_url: 'http://localhost:3000/cancel',
            },
          },
          expectSuccess: false
        }
      ];

      for (const scenario of scenarios) {
        try {
          const response = await axios.post(
            'https://api-m.sandbox.paypal.com/v1/payments/payment',
            scenario.data,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (scenario.expectSuccess && response.data.id) {
            this.results.paypal.success++;
            this.results.paypal.tests.push({ name: scenario.name, status: '✅ PASS', details: `Payment ID: ${response.data.id}` });
          } else {
            this.results.paypal.failed++;
            this.results.paypal.tests.push({ name: scenario.name, status: '❌ FAIL', details: 'Unexpected result' });
          }
        } catch (error) {
          if (!scenario.expectSuccess) {
            this.results.paypal.success++;
            this.results.paypal.tests.push({ name: scenario.name, status: '✅ PASS', details: 'Expected error occurred' });
          } else {
            this.results.paypal.failed++;
            this.results.paypal.tests.push({ name: scenario.name, status: '❌ FAIL', details: error.response?.data?.message || error.message });
          }
        }
      }
    } catch (error) {
      this.results.paypal.failed++;
      this.results.paypal.tests.push({ name: 'Authentication', status: '❌ FAIL', details: 'Failed to get access token' });
    }
  }

  displayResults() {
    console.log('\n📊 PAYMENT TESTING RESULTS');
    console.log('=' .repeat(50));
    
    const providers = ['paystack', 'stripe', 'paypal'];
    
    providers.forEach(provider => {
      const result = this.results[provider];
      const total = result.success + result.failed;
      const successRate = total > 0 ? ((result.success / total) * 100).toFixed(1) : 0;
      
      console.log(`\n${provider.toUpperCase()} - Success Rate: ${successRate}% (${result.success}/${total})`);
      console.log('-'.repeat(30));
      
      result.tests.forEach(test => {
        console.log(`${test.status} ${test.name}: ${test.details}`);
      });
    });

    const totalSuccess = this.results.paystack.success + this.results.stripe.success + this.results.paypal.success;
    const totalTests = Object.values(this.results).reduce((sum, provider) => sum + provider.success + provider.failed, 0);
    const overallSuccessRate = totalTests > 0 ? ((totalSuccess / totalTests) * 100).toFixed(1) : 0;

    console.log(`\n🎯 OVERALL SUCCESS RATE: ${overallSuccessRate}% (${totalSuccess}/${totalTests})`);
    
    if (overallSuccessRate >= 80) {
      console.log('🎉 Payment integration is working well!');
    } else if (overallSuccessRate >= 60) {
      console.log('⚠️ Payment integration needs some attention.');
    } else {
      console.log('🚨 Payment integration requires immediate fixes.');
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Payment Testing...');
    
    await this.testPaystackScenarios();
    await this.testStripeScenarios();
    await this.testPayPalScenarios();
    
    this.displayResults();
  }
}

// Run the tests
const tester = new PaymentTester();
tester.runAllTests().catch(console.error);
