/**
 * Test Configuration for Development Environment
 * Provides mock accounts and test settings
 */

export interface TestAccount {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'agent' | 'advertiser' | 'admin';
  isVerified: boolean;
  isPaid: boolean;
  balance: number;
  currency: string;
  referralCode: string;
}

export const TEST_ACCOUNTS: TestAccount[] = [
  {
    id: 'test-user-1',
    email: 'testuser@example.com',
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isVerified: true,
    isPaid: true,
    balance: 150.00,
    currency: 'USD',
    referralCode: 'TESTUSER1'
  },
  {
    id: 'test-agent-1',
    email: 'testagent@example.com',
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'Agent',
    role: 'agent',
    isVerified: true,
    isPaid: true,
    balance: 500.00,
    currency: 'USD',
    referralCode: 'TESTAGENT1'
  },
  {
    id: 'test-admin-1',
    email: 'testadmin@example.com',
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'admin',
    isVerified: true,
    isPaid: true,
    balance: 1000.00,
    currency: 'USD',
    referralCode: 'TESTADMIN1'
  }
];

export const TEST_CONFIG = {
  ENABLE_TEST_ACCOUNTS: true,
  MOCK_PAYMENT_SUCCESS: true,
  MOCK_EMAIL_VERIFICATION: true,
  DEFAULT_TEST_BALANCE: 100.00,
  DEFAULT_TEST_CURRENCY: 'USD',
  TEST_MODE_INDICATOR: true,
  BYPASS_EMAIL_VERIFICATION: true,
  BYPASS_PAYMENT_REQUIREMENTS: false
};

export default {
  TEST_ACCOUNTS,
  TEST_CONFIG
};
