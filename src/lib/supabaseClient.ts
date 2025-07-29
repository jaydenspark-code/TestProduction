import { createClient } from '@supabase/supabase-js';

// Environment variables - NO FALLBACKS for security
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables and handle gracefully
let supabaseClient = null;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your-supabase-url' || supabaseAnonKey === 'your-supabase-anon-key') {
  console.warn('⚠️ Supabase configuration missing or using defaults:');
  console.warn('VITE_SUPABASE_URL:', !!supabaseUrl && supabaseUrl !== 'your-supabase-url');
  console.warn('VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey && supabaseAnonKey !== 'your-supabase-anon-key');
  console.warn('🧪 Running in testing mode without Supabase connection');
  
  supabaseClient = null;
} else {
  console.log('✅ Supabase Configuration Valid:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl?.substring(0, 30) + '...'
  });
  
  // Create the Supabase client with validated credentials
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

export const supabase = supabaseClient;

// Connection test function
export const testSupabaseConnection = async () => {
  if (!supabase) {
    console.log('🧪 Testing mode: Supabase connection not available');
    return false;
  }
  
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key exists:', !!supabaseAnonKey);
    
    const { data, error } = await supabase.auth.getSession();
    console.log('Auth test:', { data, error });
    
    // Test a simple query
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    console.log('DB test:', { testData, testError });
    return !error && !testError;
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return false;
  }
};

// Add this to make the function globally available for testing
if (typeof window !== 'undefined') {
  (window as any).testSupabaseConnection = testSupabaseConnection;
}
