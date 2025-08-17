// Script to create payments table in Supabase
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NDA2NCwiZXhwIjoyMDY4NjcwMDY0fQ.gdjAQb72tWoSw2Rf-1llfIDUB7rLFPoGb85ml7676B4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const createPaymentsTable = async () => {
  console.log('🔄 Creating payments table...');

  const sqlFile = path.join(__dirname, 'create_payments_table.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Error creating payments table:', error);
      process.exit(1);
    }

    console.log('✅ Payments table created successfully!');
    console.log('📋 Result:', data);

  } catch (err) {
    console.error('❌ Exception creating payments table:', err);
    process.exit(1);
  }
};

createPaymentsTable();
