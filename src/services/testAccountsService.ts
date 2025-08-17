import { supabase } from '../lib/supabase';
import { TEST_ACCOUNTS, TEST_CONFIG } from '../config/test.config';
import { generateSecureToken } from '../utils/security';

class TestAccountsService {
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
      // Create admin account
      await this.createUserAccount(TEST_ACCOUNTS.ADMIN);

      // Create test user accounts
      for (const user of TEST_ACCOUNTS.USERS) {
        await this.createUserAccount(user);
      }

      return { success: true, message: 'Test accounts created successfully' };
    } catch (error) {
      console.error('Error creating test accounts:', error);
      return { success: false, message: 'Failed to create test accounts' };
    }
  }

  async createAllTestAccounts() {
    return this.createTestAccounts();
  }

  async checkTestAccounts() {
    try {
      const accountStatus: { [email: string]: boolean } = {};
      
      // Check admin account
      const { data: adminUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', TEST_ACCOUNTS.ADMIN.email)
        .single();
      
      accountStatus[TEST_ACCOUNTS.ADMIN.email] = !!adminUser;

      // Check user accounts
      for (const user of TEST_ACCOUNTS.USERS) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single();
        
        accountStatus[user.email] = !!userData;
      }

      return accountStatus;
    } catch (error) {
      console.error('Error checking test accounts:', error);
      throw error;
    }
  }

  async deleteAllTestAccounts() {
    return this.cleanupTestAccounts();
  }

  private async createUserAccount(user: typeof TEST_ACCOUNTS.ADMIN) {
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
            full_name: user.fullName,
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
          full_name: user.fullName,
          email: user.email,
          role: user.role,
          is_test_account: true,
          referral_code: TEST_CONFIG.REFERRAL_CODE,
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
      const verificationToken = generateSecureToken();
      
      const { error } = await supabase.from('email_verification').insert([
        {
          email,
          token: verificationToken,
          expires_at: new Date(Date.now() + TEST_CONFIG.EMAIL_VERIFICATION.TOKEN_EXPIRY).toISOString()
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
export default testAccountsService;
