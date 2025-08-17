// Apply Critical RLS Security Fix to Supabase
// This script addresses the security warnings shown in Supabase Security Advisor

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSFix() {
  console.log('🔒 CRITICAL: Applying Row Level Security (RLS) fixes...');
  
  try {
    // Read the SQL fix file
    const sqlFile = path.join(__dirname, 'CRITICAL_RLS_SECURITY_FIX.sql');
    const sqlCommands = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 Executing RLS security fix SQL...');
    
    // Split SQL into individual commands and execute
    const commands = sqlCommands
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && cmd !== 'COMMIT');
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`📝 Executing command ${i + 1}/${commands.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        if (error) {
          console.warn(`⚠️ Warning on command ${i + 1}:`, error.message);
        } else {
          console.log(`✅ Command ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.warn(`⚠️ Error on command ${i + 1}:`, err.message);
      }
    }
    
    console.log('🔍 Verifying RLS status...');
    await verifyRLSStatus();
    
  } catch (error) {
    console.error('❌ Error applying RLS fix:', error);
  }
}

async function verifyRLSStatus() {
  try {
    // Check which tables still have RLS disabled
    const { data: tablesWithoutRLS, error } = await supabase
      .from('pg_tables')
      .select('schemaname, tablename, rowsecurity')
      .eq('schemaname', 'public')
      .eq('rowsecurity', false);
    
    if (error) {
      console.error('❌ Error checking RLS status:', error);
      return;
    }
    
    if (tablesWithoutRLS && tablesWithoutRLS.length > 0) {
      console.log('⚠️ Tables still without RLS:');
      tablesWithoutRLS.forEach(table => {
        console.log(`  - ${table.tablename}`);
      });
    } else {
      console.log('✅ All public tables now have RLS enabled!');
    }
    
    // Check RLS policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname')
      .eq('schemaname', 'public');
    
    if (!policiesError && policies) {
      console.log(`📋 Total RLS policies created: ${policies.length}`);
      
      // Group by table
      const policiesByTable = policies.reduce((acc, policy) => {
        if (!acc[policy.tablename]) {
          acc[policy.tablename] = [];
        }
        acc[policy.tablename].push(policy.policyname);
        return acc;
      }, {});
      
      console.log('📋 Policies by table:');
      Object.entries(policiesByTable).forEach(([table, tablePolicies]) => {
        console.log(`  ${table}: ${tablePolicies.length} policies`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error verifying RLS status:', error);
  }
}

async function checkSecurityStatus() {
  console.log('🔍 Checking current security status...');
  
  const criticalTables = [
    'support_conversations',
    'support_tickets', 
    'agent_notifications',
    'support_knowledge_base',
    'chat_sessions',
    'users',
    'referrals',
    'campaigns',
    'transactions'
  ];
  
  for (const tableName of criticalTables) {
    try {
      // Check if table exists and has RLS
      const { data, error } = await supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('schemaname', 'public')
        .eq('tablename', tableName)
        .single();
      
      if (error) {
        console.log(`❓ Table ${tableName}: Not found or error`);
      } else {
        const status = data.rowsecurity ? '✅ RLS Enabled' : '❌ RLS DISABLED';
        console.log(`📋 Table ${tableName}: ${status}`);
      }
    } catch (err) {
      console.log(`❓ Table ${tableName}: Error checking status`);
    }
  }
}

// Main execution
async function main() {
  console.log('🔒 SUPABASE SECURITY FIX TOOL');
  console.log('=============================');
  
  const action = process.argv[2] || 'check';
  
  switch (action) {
    case 'check':
      await checkSecurityStatus();
      break;
    case 'fix':
      await applyRLSFix();
      break;
    case 'verify':
      await verifyRLSStatus();
      break;
    default:
      console.log('Usage: node apply-rls-fix.js [check|fix|verify]');
      console.log('  check  - Check current RLS status');
      console.log('  fix    - Apply RLS security fixes');
      console.log('  verify - Verify RLS status after fix');
  }
}

main().catch(console.error);

export { applyRLSFix, verifyRLSStatus, checkSecurityStatus };
