import { createClient } from '@supabase/supabase-js';

// Environment variables - will be populated when Supabase is connected
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// Check if we're in testing mode (no Supabase credentials or placeholder values)
const TESTING_MODE = !supabaseUrl || 
                     !supabaseAnonKey || 
                     supabaseUrl.includes('your-project') ||
                     supabaseUrl.includes('your_supabase_project_url') ||
                     supabaseAnonKey.includes('your-anon-key') ||
                     supabaseAnonKey.includes('your_supabase_anon_key') ||
                     supabaseUrl === 'https://your-project-id.supabase.co' ||
                     supabaseAnonKey === 'your-anon-key-here';

// Create clients only if not in testing mode AND we have valid credentials
export const supabase = TESTING_MODE ? null : createClient(supabaseUrl!, supabaseAnonKey!);
export const supabaseAdmin = (TESTING_MODE || !supabaseServiceKey) ? null : createClient(supabaseUrl!, supabaseServiceKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Connection test function
export const testSupabaseConnection = async () => {
  if (TESTING_MODE) {
    console.log('🧪 TESTING MODE: Supabase not connected');
    return false;
  }

  try {
    const { data, error } = await supabase!.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
};

// Export testing mode status
export { TESTING_MODE };