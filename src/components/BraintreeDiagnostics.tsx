import React, { useState } from 'react';

const BraintreeDiagnostics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      // Get client token first
      const credentials = btoa('sgfjmfv929kzffsr:4edc8a7489369f8e7d5cb8c9a8066c17');
      const requestBody = `<?xml version="1.0" encoding="UTF-8"?><client-token></client-token>`;
      const apiUrl = 'https://api.sandbox.braintreegateway.com/merchants/2yhrvbtjszdbvxtt/client_token';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/xml',
          'Accept': 'application/xml',
          'Braintree-Version': '2019-01-01'
        },
        body: requestBody
      });
      
      if (!response.ok) {
        throw new Error(`Braintree API error: ${response.status}`);
      }
      
      const responseText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(responseText, 'text/xml');
      const clientTokenElement = xmlDoc.querySelector('client-token');
      
      if (!clientTokenElement) {
        throw new Error('No client token found in response');
      }
      
      // Decode the client token to see what's enabled
      const rawJsonToken = clientTokenElement.textContent?.trim();
      if (rawJsonToken) {
        const tokenData = JSON.parse(rawJsonToken);
        setDiagnostics({
          tokenReceived: true,
          merchantId: tokenData.merchantId,
          environment: tokenData.environment,
          paypalEnabled: !!tokenData.paypal,
          applePayEnabled: !!tokenData.applePay,
          googlePayEnabled: !!tokenData.androidPay,
          venmoEnabled: !!tokenData.venmo,
          threeDSecureEnabled: !!tokenData.threeDSecureEnabled,
          fullToken: tokenData
        });
      }
      
    } catch (error: any) {
      setDiagnostics({
        error: error.message,
        tokenReceived: false
      });
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px', 
      border: '2px solid #e0e0e0', 
      borderRadius: '8px',
      backgroundColor: '#f5f5f5'
    }}>
      <h3>🔍 Braintree Configuration Diagnostics</h3>
      
      <button 
        onClick={runDiagnostics}
        disabled={loading}
        style={{
          background: '#2196f3',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Running Diagnostics...' : 'Check Payment Methods'}
      </button>

      {diagnostics && (
        <div style={{ 
          background: 'white', 
          padding: '16px', 
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          <h4>Configuration Results:</h4>
          
          {diagnostics.error ? (
            <div style={{ color: 'red' }}>
              <strong>Error:</strong> {diagnostics.error}
            </div>
          ) : (
            <div>
              <div><strong>Token Received:</strong> {diagnostics.tokenReceived ? '✅' : '❌'}</div>
              <div><strong>Merchant ID:</strong> {diagnostics.merchantId}</div>
              <div><strong>Environment:</strong> {diagnostics.environment}</div>
              <div><strong>PayPal Enabled:</strong> {diagnostics.paypalEnabled ? '✅' : '❌'}</div>
              <div><strong>Apple Pay Enabled:</strong> {diagnostics.applePayEnabled ? '✅' : '❌'}</div>
              <div><strong>Google Pay Enabled:</strong> {diagnostics.googlePayEnabled ? '✅' : '❌'}</div>
              <div><strong>Venmo Enabled:</strong> {diagnostics.venmoEnabled ? '✅' : '❌'}</div>
              <div><strong>3D Secure Enabled:</strong> {diagnostics.threeDSecureEnabled ? '✅' : '❌'}</div>
              
              <details style={{ marginTop: '16px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Full Token Data (Click to expand)
                </summary>
                <pre style={{ 
                  background: '#f0f0f0', 
                  padding: '12px', 
                  marginTop: '8px',
                  overflow: 'auto',
                  maxHeight: '300px'
                }}>
                  {JSON.stringify(diagnostics.fullToken, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

      <div style={{ 
        marginTop: '20px', 
        padding: '12px', 
        background: '#e3f2fd', 
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <strong>Note:</strong> Some payment methods (like Apple Pay, Google Pay, Venmo) may only appear 
        when certain conditions are met (device compatibility, browser support, etc.) or when specifically 
        enabled in your Braintree merchant account settings.
      </div>
    </div>
  );
};

export default BraintreeDiagnostics;
