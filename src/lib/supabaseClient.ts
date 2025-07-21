import { createClient } from '@supabase/supabase-js';

// Completely disable current Supabase connection
const TESTING_MODE = true;

// Placeholder values for new project (to be updated later)
const supabaseUrl = 'https://your-new-project.supabase.co';
const supabaseAnonKey = 'your-new-anon-key';
const supabaseServiceKey = 'your-new-service-key';

// All clients are null in testing mode
export const supabase = TESTING_MODE ? null : createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = TESTING_MODE ? null : createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Mock functions for frontend testing
export const testSupabaseConnection = async () => {
  console.log('🧪 TESTING MODE: Supabase completely disconnected');
  return false;
};
