// Simple script to manually execute SQL via Supabase API
const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NDA2NCwiZXhwIjoyMDY4NjcwMDY0fQ.gdjAQb72tWoSw2Rf-1llfIDUB7rLFPoGb85ml7676B4';

async function createPaymentsTable() {
  console.log('🔄 Creating payments table...');

  const sql = `
    -- Create payments table for storing payment transactions
    CREATE TABLE IF NOT EXISTS payments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        plan_type TEXT NOT NULL,
        provider TEXT NOT NULL CHECK (provider IN ('paystack', 'braintree', 'paypal', 'stripe')),
        transaction_id TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create index on user_id for faster queries
    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

    -- Enable RLS on payments table
    ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

    -- Grant permissions
    GRANT ALL ON payments TO service_role;
    GRANT SELECT, INSERT ON payments TO authenticated;
  `;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      console.log('✅ Payments table created successfully!');
    } else {
      const error = await response.text();
      console.log('❌ Error response:', error);
    }

  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

createPaymentsTable();
