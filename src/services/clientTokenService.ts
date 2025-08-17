/**
 * Client-side Braintree Token Service
 * Handles client token generation for frontend-only implementation
 */

import { BraintreeConfig } from '../types/braintree';

// This should be moved to environment configuration
const config: BraintreeConfig = {
  environment: 'sandbox',
  merchantId: import.meta.env.VITE_BRAINTREE_MERCHANT_ID || '2yhrvbtjsz0bvktt',
  publicKey: import.meta.env.VITE_BRAINTREE_PUBLIC_KEY || 'sgfjmfv929kzffsr',
  privateKey: import.meta.env.VITE_BRAINTREE_PRIVATE_KEY || '4edc8a7489369f8e7d5cb8c9a8866c17',
};

export interface ClientTokenResponse {
  success: boolean;
  clientToken?: string;
  error?: string;
  environment?: string;
}

/**
 * For demonstration purposes - generates a mock client token
 * In production, this should call your backend API
 */
export async function getClientToken(customerId?: string): Promise<ClientTokenResponse> {
  try {
    console.log('🔧 Getting client token for environment:', config.environment);
    
    // In a real implementation, you would call your backend API here
    // For demo purposes, we'll simulate this with the braintree web SDK directly
    
    // Mock successful response for demonstration
    const mockToken = generateMockClientToken();
    
    return {
      success: true,
      clientToken: mockToken,
      environment: config.environment,
    };
  } catch (error: any) {
    console.error('❌ Error getting client token:', error);
    return {
      success: false,
      error: error.message || 'Failed to get client token',
    };
  }
}

/**
 * Generate a mock client token for testing purposes
 * In production, this would come from your secure backend
 */
function generateMockClientToken(): string {
  const mockTokenData = {
    version: 2,
    authorizationFingerprint: btoa(JSON.stringify({
      environment: config.environment,
      merchantId: config.merchantId,
      publicKey: config.publicKey,
      timestamp: Date.now(),
    })),
    configUrl: `https://api.${config.environment === 'sandbox' ? 'sandbox.' : ''}braintreegateway.com/merchants/${config.merchantId}/client_api/v1/configuration`,
  };
  
  return btoa(JSON.stringify(mockTokenData));
}

/**
 * Create customer and get client token
 * In production, this would call your backend API
 */
export async function createCustomerAndGetToken(
  customerId: string,
  customerData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }
): Promise<ClientTokenResponse> {
  try {
    console.log('👤 Creating customer and getting token:', customerId);
    
    // In production, call your backend API to create customer
    // For demo, simulate successful customer creation
    
    const response = await getClientToken(customerId);
    return {
      ...response,
      customerId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create customer and get token',
    };
  }
}

/**
 * Test the client token service
 */
export async function testClientTokenService(): Promise<void> {
  console.log('🧪 Testing client token service...');
  
  try {
    const response = await getClientToken();
    if (response.success) {
      console.log('✅ Client token service working correctly');
      console.log('📝 Token preview:', response.clientToken?.substring(0, 50) + '...');
    } else {
      console.error('❌ Client token service failed:', response.error);
    }
  } catch (error) {
    console.error('❌ Client token service test failed:', error);
  }
}
