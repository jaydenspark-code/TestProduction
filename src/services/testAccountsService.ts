// ...existing code...
import { supabase } from '../lib/supabase';
import { TEST_ACCOUNTS, TEST_CONFIG } from '../config/test.config';


class TestAccountsService {
  // Check if test accounts exist (by email)
    // check if test accounts exist (by email)
    async checkTestAccounts(): Promise<{ [email: string]: boolean }> {
    const emails = [
      'thearnest7@gmail.com',
      'ijaydenspark@gmail.com',
      'princeedie142@gmail.com',
      'noguyliketrey@gmail.com'
    ];
    const status: { [email: string]: boolean } = {};
    for (const email of emails) {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      status[email] = !!data && !error;
    }
    return status;
  }

  // Create all test accounts (admin action)
  async createAllTestAccounts() {
    return this.createTestAccounts();
  }

  // Delete all test accounts (admin action)
  async deleteAllTestAccounts() {
    return this.cleanupTestAccounts();
  }
  private static instance: TestAccountsService;

  private constructor() {}

  public static getInstance(): TestAccountsService {
    if (!TestAccountsService.instance) {
      TestAccountsService.instance = new TestAccountsService();
    }
    return TestAccountsService.instance;
  }

  async createTestAccounts() {
    try {
      for (const user of TEST_ACCOUNTS) {
        await this.createUserAccount(user);
      }
      return { success: true, message: 'Test accounts created successfully' };
    } catch (error) {
      console.error('Error creating test accounts:', error);
      return { success: false, message: 'Failed to create test accounts' };
    }
  }

  private async createUserAccount(user: typeof TEST_ACCOUNTS[0]) {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (existingUser) {
        console.log(`User ${user.email} already exists`);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            full_name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            is_test_account: true
          }
        }
      });

      if (signUpError) throw signUpError;

      // Create user profile
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: data.user?.id,
          full_name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          is_test_account: true,
          referral_code: user.referralCode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

      if (profileError) throw profileError;

      console.log(`Created test account: ${user.email}`);
    } catch (error) {
      console.error(`Error creating account for ${user.email}:`, error);
      throw error;
    }
  }

  async cleanupTestAccounts() {
    try {
      const { data: testUsers, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_test_account', true);

      if (fetchError) throw fetchError;

      for (const user of testUsers || []) {
        await supabase.auth.admin.deleteUser(user.id);
        await supabase.from('profiles').delete().eq('id', user.id);
      }

      return { success: true, message: 'Test accounts cleaned up successfully' };
    } catch (error) {
      console.error('Error cleaning up test accounts:', error);
      return { success: false, message: 'Failed to clean up test accounts' };
    }
  }

  async verifyTestAccount(email: string) {
    try {
  // Fallback: generate a simple random token
  const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Set expiry to 1 hour from now (3600000 ms)
      const expiresAt = new Date(Date.now() + 3600000).toISOString();
      const { error } = await supabase.from('email_verification').insert([
        {
          email,
          token: verificationToken,
          expires_at: expiresAt
        }
      ]);

      if (error) throw error;

      return { success: true, message: 'Test account verified successfully' };
    } catch (error) {
      console.error('Error verifying test account:', error);
      return { success: false, message: 'Failed to verify test account' };
    }
  }
}

export const testAccountsService = TestAccountsService.getInstance();
