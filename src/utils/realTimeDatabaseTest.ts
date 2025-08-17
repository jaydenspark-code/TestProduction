// REAL-TIME DATABASE ACCESS TEST
// Run this in browser console while logged in with Google OAuth

import { supabase } from '../lib/supabase';

export const runDatabaseDiagnostics = async () => {
  console.log('🔍 Starting comprehensive database diagnostics...');
  
  try {
    // 1. Check current session
    console.log('\n=== AUTHENTICATION STATUS ===');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session Error:', sessionError);
    } else if (session.session?.user) {
      console.log('✅ Active session found:');
      console.log('- User ID:', session.session.user.id);
      console.log('- Email:', session.session.user.email);
      console.log('- Provider:', session.session.user.app_metadata?.provider);
    } else {
      console.log('❌ No active session');
    }

    // 2. Test read access to users table
    console.log('\n=== TESTING READ ACCESS ===');
    const { data: readTest, error: readError } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact' });

    if (readError) {
      console.error('❌ Read test failed:', readError);
    } else {
      console.log('✅ Read test passed. User count:', readTest);
    }

    // 3. Test insert access (if user is logged in)
    if (session.session?.user) {
      console.log('\n=== TESTING INSERT ACCESS ===');
      
      const testUserData = {
        id: session.session.user.id,
        email: session.session.user.email,
        full_name: session.session.user.user_metadata?.full_name || 'Test User',
        is_verified: true,
        is_paid: false,
        country: 'US',
        currency: 'USD',
        role: 'user',
        referral_code: 'TEST' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        updated_at: new Date().toISOString()
      };

      console.log('Attempting to insert/upsert user with data:', testUserData);

      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .upsert([testUserData], { onConflict: ['id'] })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Insert test failed:', insertError);
        console.error('Error code:', insertError.code);
        console.error('Error details:', insertError.details);
        console.error('Error hint:', insertError.hint);
      } else {
        console.log('✅ Insert test passed! User created/updated:', insertData);
      }
    }

    // 4. Check if user exists in users table
    if (session.session?.user) {
      console.log('\n=== CHECKING USER EXISTENCE ===');
      
      const { data: existingUser, error: existError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.session.user.id)
        .single();

      if (existError) {
        if (existError.code === 'PGRST116') {
          console.log('❌ User does not exist in public.users table');
        } else {
          console.error('❌ Error checking user existence:', existError);
        }
      } else {
        console.log('✅ User exists in public.users table:', existingUser);
      }
    }

    // 5. Summary
    console.log('\n=== DIAGNOSTIC SUMMARY ===');
    console.log('- Session Status:', session.session ? '✅ Active' : '❌ No session');
    console.log('- Read Access:', readError ? '❌ Failed' : '✅ Working');
    console.log('- Insert Access:', session.session?.user ? 'Tested above' : 'Cannot test (no session)');

    return {
      session: !!session.session,
      readAccess: !readError,
      userExists: session.session?.user ? 'tested above' : 'no session'
    };

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    return { error: error.message };
  }
};

// Export for console access
if (typeof window !== 'undefined') {
  (window as any).runDatabaseDiagnostics = runDatabaseDiagnostics;
}

export default runDatabaseDiagnostics;
