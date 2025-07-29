#!/usr/bin/env tsx

/**
 * Admin Script: User ID Synchronization
 * 
 * This script synchronizes user IDs between Supabase auth and the custom users table.
 * It fixes the root cause of authentication and email verification issues.
 * 
 * Usage:
 * 1. Make sure you have your Supabase service role key set as VITE_SUPABASE_SERVICE_KEY
 * 2. Run: npx tsx src/scripts/syncUserIds.ts
 * 
 * IMPORTANT: This script requires service role permissions to access auth.users
 */

import { UserIdSynchronizer } from '../utils/userIdSynchronizer';

async function main() {
  console.log('🚀 Starting User ID Synchronization Script...');
  console.log('=' .repeat(50));
  
  try {
    // Check if we have the service role key
    const serviceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (!serviceKey) {
      console.error('❌ Missing service role key! Please set VITE_SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_KEY');
      console.log('💡 You can find this key in your Supabase dashboard under Settings > API');
      process.exit(1);
    }

    console.log('🔑 Service role key found');
    console.log('🔄 Running synchronization...');
    
    // Run the synchronization
    const result = await UserIdSynchronizer.synchronizeUserIds();
    
    console.log('=' .repeat(50));
    console.log('📊 SYNCHRONIZATION RESULTS:');
    console.log('=' .repeat(50));
    
    if (result.success) {
      console.log('✅ Status: SUCCESS');
      console.log(`📈 Users Fixed: ${result.fixed || 0}`);
      console.log(`💬 Message: ${result.message}`);
      
      if (result.errors && result.errors.length > 0) {
        console.log('\n⚠️  ERRORS ENCOUNTERED:');
        result.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
    } else {
      console.log('❌ Status: FAILED');
      console.log(`💬 Message: ${result.message}`);
    }
    
    console.log('=' .repeat(50));
    console.log('🎉 Synchronization script completed!');
    
  } catch (error: any) {
    console.error('💥 Script failed with unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { main };
