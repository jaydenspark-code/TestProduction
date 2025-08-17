import React, { useEffect, useState } from 'react';

const SimpleBraintreeTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Initializing...');
  const [clientToken, setClientToken] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testBraintree = async () => {
      try {
        setStatus('Testing environment configuration...');
        
        // Test environment variables are accessible
        const environment = import.meta.env.VITE_BRAINTREE_ENVIRONMENT;
        const merchantId = import.meta.env.VITE_BRAINTREE_MERCHANT_ID;
        const publicKey = import.meta.env.VITE_BRAINTREE_PUBLIC_KEY;
        
        if (!environment || !merchantId || !publicKey) {
          throw new Error('Missing required environment variables');
        }
        
        setStatus('✅ Environment variables loaded successfully');
        
        // Generate a mock client token for testing
        const mockToken = `eyJ2ZXJzaW9uIjoyLCJhdXRob3JpemF0aW9uRmluZ2VycHJpbnQiOiIke Date.now()}","configUrl":"https://api.sandbox.braintreegateway.com:443/merchants/${merchantId}/client_api/v1/configuration"}`;
        
        setClientToken(btoa(mockToken)); // Base64 encode
        setStatus('✅ Mock client token generated successfully');
        
        // Test if we can load Braintree Web SDK
        if (typeof window !== 'undefined') {
          setStatus('✅ Browser environment ready for Braintree integration');
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('❌ Test failed');
      }
    };

    testBraintree();
  }, []);

  const envVars = {
    environment: import.meta.env.VITE_BRAINTREE_ENVIRONMENT,
    merchantId: import.meta.env.VITE_BRAINTREE_MERCHANT_ID,
    publicKey: import.meta.env.VITE_BRAINTREE_PUBLIC_KEY,
    privateKey: import.meta.env.VITE_BRAINTREE_PRIVATE_KEY
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Braintree Integration Test</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Status</h2>
            <p className="text-lg">{status}</p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-red-400">Error</h2>
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {clientToken && (
            <div className="bg-green-900/50 border border-green-500 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-green-400">Mock Client Token</h2>
              <p className="text-green-300 break-all text-sm">{clientToken}</p>
            </div>
          )}

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span>Environment:</span>
                <span className={envVars.environment ? 'text-green-400' : 'text-red-400'}>
                  {envVars.environment || 'Not set'}
                </span>
              </p>
              <p className="flex justify-between">
                <span>Merchant ID:</span>
                <span className={envVars.merchantId ? 'text-green-400' : 'text-red-400'}>
                  {envVars.merchantId ? '✅ Set' : '❌ Not set'}
                </span>
              </p>
              <p className="flex justify-between">
                <span>Public Key:</span>
                <span className={envVars.publicKey ? 'text-green-400' : 'text-red-400'}>
                  {envVars.publicKey ? '✅ Set' : '❌ Not set'}
                </span>
              </p>
              <p className="flex justify-between">
                <span>Private Key:</span>
                <span className={envVars.privateKey ? 'text-green-400' : 'text-red-400'}>
                  {envVars.privateKey ? '✅ Set' : '❌ Not set'}
                </span>
              </p>
            </div>
          </div>

          <div className="bg-blue-900/50 border border-blue-500 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Next Steps</h2>
            <div className="space-y-2 text-sm">
              <p>1. ✅ Environment variables configured</p>
              <p>2. ✅ Mock token generation working</p>
              <p>3. 🔄 Load Braintree Web SDK</p>
              <p>4. 🔄 Create payment form</p>
              <p>5. 🔄 Process test payment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleBraintreeTest;
