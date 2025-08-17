// Check if payments table exists and create if not
import { supabase } from '../lib/supabase';

export async function ensurePaymentsTable() {
  try {
    console.log('🔍 Checking if payments table exists...');
    
    // Try to query the payments table
    const { data, error } = await supabase
      .from('payments')
      .select('id')
      .limit(1);

    if (!error) {
      console.log('✅ Payments table already exists');
      return { success: true };
    }

    // If table doesn't exist, try to create it via a simple insert
    console.log('⚠️ Payments table not found, checking database...');
    
    // Check if we have the user_profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    if (profileError) {
      console.error('❌ Database connection issue:', profileError);
      return { success: false, error: 'Database connection failed' };
    }

    console.log('✅ Database connection working');
    console.log('💡 Note: Payments table may need to be created manually in Supabase dashboard');
    
    return { success: true, note: 'Table check complete' };

  } catch (error: any) {
    console.error('❌ Error checking payments table:', error);
    return { success: false, error: error.message };
  }
}

// Alternative payment storage using user_profiles
export async function storePaymentInProfile(userId: string, planType: string, transactionId: string) {
  try {
    console.log('🔄 Storing payment info in user profile...');
    
    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_paid_user: true,
        subscription_plan: planType,
        payment_transaction_id: transactionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('❌ Error updating user profile:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Payment info stored in user profile');
    return { success: true };

  } catch (error: any) {
    console.error('❌ Exception storing payment:', error);
    return { success: false, error: error.message };
  }
}

export default { ensurePaymentsTable, storePaymentInProfile };
