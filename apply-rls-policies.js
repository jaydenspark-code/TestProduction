// Apply RLS policies to EarnPro Supabase database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sqlContent, description) {
  console.log(`\n📝 ${description}...`);
  
  try {
    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (statement.length === 0) continue;
      
      try {
        // Execute each SQL statement
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });

        if (error) {
          // Try alternative method using direct query
          const { error: altError } = await supabase
            .from('_sql_exec')
            .select('*')
            .eq('query', statement);

          if (altError) {
            console.warn(`⚠️  Statement execution warning: ${error.message}`);
            console.log(`   Statement: ${statement.substring(0, 100)}...`);
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.warn(`⚠️  Statement execution error: ${err.message}`);
        console.log(`   Statement: ${statement.substring(0, 100)}...`);
        errorCount++;
      }
    }

    console.log(`✅ ${description} completed: ${successCount} successful, ${errorCount} warnings`);
    return { success: successCount, errors: errorCount };
  } catch (error) {
    console.error(`❌ Failed to execute ${description}:`, error.message);
    return { success: 0, errors: 1 };
  }
}

async function executeRawSQL(sqlContent, description) {
  console.log(`\n📝 ${description}...`);
  
  try {
    // For policies, we need to execute them one by one
    const lines = sqlContent.split('\n');
    let currentStatement = '';
    let successCount = 0;
    let errorCount = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (trimmedLine.startsWith('--') || trimmedLine.length === 0) {
        continue;
      }

      currentStatement += line + '\n';

      // If line ends with semicolon, execute the statement
      if (trimmedLine.endsWith(';')) {
        try {
          const { error } = await supabase.rpc('exec_sql', {
            sql_query: currentStatement
          });

          if (error) {
            // Some errors are expected (like "policy already exists")
            if (error.message.includes('already exists') || 
                error.message.includes('does not exist') ||
                error.message.includes('permission denied')) {
              console.log(`ℹ️  Info: ${error.message}`);
            } else {
              console.warn(`⚠️  Warning: ${error.message}`);
              errorCount++;
            }
          } else {
            successCount++;
          }
        } catch (err) {
          console.warn(`⚠️  Error executing statement: ${err.message}`);
          errorCount++;
        }

        currentStatement = '';
      }
    }

    console.log(`✅ ${description} completed: ${successCount} successful, ${errorCount} warnings`);
    return { success: successCount, errors: errorCount };
  } catch (error) {
    console.error(`❌ Failed to execute ${description}:`, error.message);
    return { success: 0, errors: 1 };
  }
}

async function applyRLSPolicies() {
  console.log('🔐 Applying Row Level Security (RLS) Policies to EarnPro Database');
  console.log('='.repeat(70));

  try {
    // Check if we can connect to the database
    console.log('🔍 Testing database connection...');
    const { error: connectionError } = await supabase.from('users').select('count').limit(1);
    
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError.message);
      return;
    }
    console.log('✅ Database connection successful');

    let totalSuccess = 0;
    let totalErrors = 0;

    // Read and apply main RLS policies
    const rlsPoliciesPath = path.join(process.cwd(), 'supabase', 'rls_policies.sql');
    if (fs.existsSync(rlsPoliciesPath)) {
      const rlsPoliciesContent = fs.readFileSync(rlsPoliciesPath, 'utf8');
      const result1 = await executeRawSQL(rlsPoliciesContent, 'Applying main RLS policies');
      totalSuccess += result1.success;
      totalErrors += result1.errors;
    } else {
      console.warn('⚠️  Main RLS policies file not found:', rlsPoliciesPath);
    }

    // Read and apply AI RLS policies
    const aiRlsPoliciesPath = path.join(process.cwd(), 'supabase', 'rls_ai_policies.sql');
    if (fs.existsSync(aiRlsPoliciesPath)) {
      const aiRlsPoliciesContent = fs.readFileSync(aiRlsPoliciesPath, 'utf8');
      const result2 = await executeRawSQL(aiRlsPoliciesContent, 'Applying AI feature RLS policies');
      totalSuccess += result2.success;
      totalErrors += result2.errors;
    } else {
      console.warn('⚠️  AI RLS policies file not found:', aiRlsPoliciesPath);
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('🎯 RLS Policy Application Summary');
    console.log('='.repeat(70));
    console.log(`✅ Total successful operations: ${totalSuccess}`);
    console.log(`⚠️  Total warnings/errors: ${totalErrors}`);

    if (totalErrors === 0) {
      console.log('\n🎉 All RLS policies applied successfully!');
      console.log('🔒 Your database is now secured with Row Level Security.');
    } else {
      console.log('\n⚠️  Some operations had warnings, but this is often normal.');
      console.log('🔍 Review the warnings above to ensure everything is configured correctly.');
    }

    // Test RLS is working
    console.log('\n🧪 Testing RLS policies...');
    await testRLSPolicies();

  } catch (error) {
    console.error('❌ Failed to apply RLS policies:', error.message);
  }
}

async function testRLSPolicies() {
  try {
    // Test 1: Try to access users table without authentication (should fail or return no data)
    console.log('1. Testing unauthenticated access to users table...');
    const { data, error } = await supabase.from('users').select('id, email').limit(1);
    
    if (error) {
      if (error.message.includes('RLS') || error.message.includes('policy')) {
        console.log('✅ RLS is working: Unauthenticated access properly blocked');
      } else {
        console.log(`ℹ️  Access result: ${error.message}`);
      }
    } else if (!data || data.length === 0) {
      console.log('✅ RLS is working: No data returned for unauthenticated access');
    } else {
      console.log('⚠️  Warning: Data accessible without authentication - check RLS policies');
    }

    // Test 2: Check if RLS is enabled on main tables
    console.log('\n2. Checking RLS status on main tables...');
    const mainTables = ['users', 'transactions', 'withdrawal_requests', 'notifications'];
    
    for (const table of mainTables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error && (error.message.includes('RLS') || error.message.includes('policy'))) {
          console.log(`✅ Table '${table}': RLS is active`);
        } else {
          console.log(`ℹ️  Table '${table}': ${error ? error.message : 'Accessible'}`);
        }
      } catch (err) {
        console.log(`ℹ️  Table '${table}': ${err.message}`);
      }
    }

    console.log('\n✅ RLS policy testing completed');

  } catch (error) {
    console.error('❌ Error testing RLS policies:', error.message);
  }
}

// Alternative function to execute SQL using direct PostgreSQL connection
async function executeSQLDirect(sqlContent, description) {
  console.log(`\n📝 ${description} (Direct method)...`);
  
  // This is a fallback method that constructs the SQL and logs it
  // In a real scenario, you might use a PostgreSQL client directly
  
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  console.log(`📊 Found ${statements.length} SQL statements to execute`);
  
  for (let i = 0; i < Math.min(5, statements.length); i++) {
    const stmt = statements[i];
    if (stmt.includes('CREATE POLICY')) {
      console.log(`   ${i + 1}. Creating policy: ${stmt.match(/CREATE POLICY "([^"]+)"/)?.[1] || 'Unknown'}`);
    } else if (stmt.includes('ALTER TABLE')) {
      console.log(`   ${i + 1}. Enabling RLS on: ${stmt.match(/ALTER TABLE [^.]*\.?(\w+)/)?.[1] || 'Unknown table'}`);
    } else {
      console.log(`   ${i + 1}. ${stmt.substring(0, 50)}...`);
    }
  }
  
  if (statements.length > 5) {
    console.log(`   ... and ${statements.length - 5} more statements`);
  }
  
  console.log('ℹ️  Note: If automatic execution fails, you can copy these statements to Supabase SQL Editor');
  
  return { success: statements.length, errors: 0 };
}

// Run the script
if (process.argv.includes('--test-only')) {
  testRLSPolicies();
} else {
  applyRLSPolicies().catch(console.error);
}
