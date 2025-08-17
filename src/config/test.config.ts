/**
 * Test Configuration for EarnPro Application
 * Contains test accounts and configuration for development and testing
 */

export const TEST_ACCOUNTS = {
  ADMIN: {
    email: 'admin@earnpro.test',
    password: 'AdminTest123!',
    fullName: 'Test Administrator',
    role: 'admin' as const,
    country: 'US',
    currency: 'USD'
  },
  USERS: [
    {
      email: 'user1@earnpro.test',
      password: 'UserTest123!',
      fullName: 'Test User One',
      role: 'user' as const,
      country: 'US',
      currency: 'USD'
    },
    {
      email: 'user2@earnpro.test',
      password: 'UserTest123!',
      fullName: 'Test User Two',
      role: 'user' as const,
      country: 'UK',
      currency: 'GBP'
    },
    {
      email: 'advertiser@earnpro.test',
      password: 'AdvTest123!',
      fullName: 'Test Advertiser',
      role: 'advertiser' as const,
      country: 'CA',
      currency: 'CAD'
    },
    {
      email: 'agent@earnpro.test',
      password: 'AgentTest123!',
      fullName: 'Test Agent',
      role: 'agent' as const,
      country: 'AU',
      currency: 'AUD'
    }
  ]
};

export const TEST_CONFIG = {
  REFERRAL_CODE: 'TEST2025',
  EMAIL_VERIFICATION: {
    TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
    MAX_ATTEMPTS: 3
  },
  PAYMENT: {
    TEST_AMOUNT: 10.00,
    TEST_CURRENCY: 'USD'
  },
  API: {
    TIMEOUT: 5000,
    RETRY_ATTEMPTS: 3
  }
};

export default {
  TEST_ACCOUNTS,
  TEST_CONFIG
};