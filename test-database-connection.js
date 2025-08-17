// Test database connection and basic operations
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing EarnPro Database Connection...\n');

  // Test 1: Basic connection
  console.log('1. Testing basic connection...');
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('❌ Basic connection failed:', error.message);
      return false;
    }
    console.log('✅ Basic connection successful');
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }

  // Test 2: Authentication system
  console.log('\n2. Testing authentication system...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error && error.message !== 'No session found') {
      console.error('❌ Auth system error:', error.message);
    } else {
      console.log('✅ Authentication system accessible');
    }
  } catch (error) {
    console.error('❌ Auth system error:', error.message);
  }

  // Test 3: Check required tables exist
  console.log('\n3. Checking required tables...');
  const requiredTables = [
    'users', 
    'transactions', 
    'withdrawal_requests', 
    'agent_applications',
    'advertiser_applications',
    'campaigns',
    'referrals',
    'notifications'
  ];

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`❌ Table '${table}' error:`, error.message);
      } else {
        console.log(`✅ Table '${table}' accessible`);
      }
    } catch (error) {
      console.error(`❌ Table '${table}' error:`, error.message);
    }
  }

  // Test 4: Test user creation flow (simulation)
  console.log('\n4. Testing user creation flow...');
  try {
    // This is a read-only test - we're just checking if the table structure supports the operations
    const testUserData = {
      email: 'test@example.com',
      full_name: 'Test User',
      country: 'US',
      currency: 'USD',
      referral_code: 'TEST123'
    };
    
    // Just validate the query structure without inserting
    const { error } = await supabase
      .from('users')
      .select('*')
      .eq('email', testUserData.email)
      .limit(1);
    
    if (error) {
      console.error('❌ User query structure error:', error.message);
    } else {
      console.log('✅ User operations structure valid');
    }
  } catch (error) {
    console.error('❌ User creation flow error:', error.message);
  }

  // Test 5: Test transaction flow
  console.log('\n5. Testing transaction structure...');
  try {
    const { error } = await supabase
      .from('transactions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Transaction structure error:', error.message);
    } else {
      console.log('✅ Transaction structure valid');
    }
  } catch (error) {
    console.error('❌ Transaction flow error:', error.message);
  }

  // Test 6: Test RLS policies (Row Level Security)
  console.log('\n6. Testing Row Level Security policies...');
  try {
    // Test if RLS is properly configured by trying to access data without auth
    const { error } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    // If we can access data without auth, RLS might not be properly configured
    if (!error) {
      console.log('⚠️  Warning: Data accessible without authentication - check RLS policies');
    } else if (error.message.includes('RLS') || error.message.includes('policy')) {
      console.log('✅ RLS policies are active (this is good for security)');
    } else {
      console.log('❓ RLS status unclear:', error.message);
    }
  } catch (error) {
    console.error('❌ RLS test error:', error.message);
  }

  // Test 7: Performance check
  console.log('\n7. Running performance check...');
  try {
    const startTime = Date.now();
    const { error } = await supabase.from('users').select('count').limit(10);
    const endTime = Date.now();
    
    if (error) {
      console.error('❌ Performance test failed:', error.message);
    } else {
      const responseTime = endTime - startTime;
      if (responseTime < 500) {
        console.log(`✅ Good response time: ${responseTime}ms`);
      } else if (responseTime < 1000) {
        console.log(`⚠️  Acceptable response time: ${responseTime}ms`);
      } else {
        console.log(`❌ Slow response time: ${responseTime}ms - consider optimization`);
      }
    }
  } catch (error) {
    console.error('❌ Performance test error:', error.message);
  }

  console.log('\n🎯 Database Connection Test Complete!');
  console.log('\nNext steps:');
  console.log('- If any errors above, check your Supabase dashboard');
  console.log('- Verify database schema is properly deployed');
  console.log('- Check RLS policies if needed');
  console.log('- Test with actual user registration in the app');
  
  return true;
}

// Run the test
testDatabaseConnection().catch(console.error);
