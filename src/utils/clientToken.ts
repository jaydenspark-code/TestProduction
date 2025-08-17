/**
 * Client Token Utility
 * Handles fetching client tokens from the client token service
 */

import { getClientToken as getTokenFromService, createCustomerAndGetToken as createCustomerFromService, ClientTokenResponse } from '../services/clientTokenService';

export { ClientTokenResponse };

/**
 * Fetch client token for Braintree SDK initialization
 * @param customerId - Optional customer ID for existing customers
 * @returns Promise resolving to client token response
 */
export async function getClientToken(customerId?: string): Promise<ClientTokenResponse> {
  return getTokenFromService(customerId);
}

/**
 * Create customer and get client token
 * @param customerId - Unique customer identifier
 * @param customerData - Customer information
 * @returns Promise resolving to client token response
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
  return createCustomerFromService(customerId, customerData);
}

/**
 * React Hook for managing client tokens
 */
import { useState, useEffect } from 'react';

export function useClientToken(customerId?: string) {
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      setLoading(true);
      setError(null);

      const response = await getClientToken(customerId);

      if (response.success && response.clientToken) {
        setClientToken(response.clientToken);
      } else {
        setError(response.error || 'Failed to fetch client token');
      }

      setLoading(false);
    }

    fetchToken();
  }, [customerId]);

  const refreshToken = async () => {
    const response = await getClientToken(customerId);
    if (response.success && response.clientToken) {
      setClientToken(response.clientToken);
      setError(null);
    } else {
      setError(response.error || 'Failed to refresh client token');
    }
  };

  return {
    clientToken,
    loading,
    error,
    refreshToken,
  };
}
