const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkUserCurrency() {
  try {
    console.log('🔍 Checking user currency settings...\n');

    // Get all users to see their currency settings
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, country, currency, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    console.log('📊 Recent Users:');
    console.log('================');
    users.forEach(user => {
      console.log(`• ID: ${user.id}`);
      console.log(`  Name: ${user.name || 'Not set'}`);
      console.log(`  Email: ${user.email || 'Not set'}`);
      console.log(`  Country: ${user.country || 'Not set'}`);
      console.log(`  Currency: ${user.currency || 'Not set'}`);
      console.log(`  Created: ${user.created_at}`);
      console.log('---');
    });

    // Check timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log(`\n🌍 Your timezone: ${timezone}`);

    // Currency mapping logic from PaymentHandler
    const timezoneMap = {
      'Africa/Lagos': { currency: 'NGN', rate: 1600 }, // Nigeria
      'Africa/Accra': { currency: 'GHS', rate: 15 },   // Ghana
      'Africa/Johannesburg': { currency: 'ZAR', rate: 18 }, // South Africa
      'Africa/Nairobi': { currency: 'KES', rate: 130 }, // Kenya
      'Africa/Cairo': { currency: 'EGP', rate: 49 },   // Egypt
      'Europe/London': { currency: 'GBP', rate: 0.79 }, // UK
      'America/New_York': { currency: 'USD', rate: 1 }, // USA
    };

    const detectedCurrency = timezoneMap[timezone] || { currency: 'USD', rate: 1 };
    console.log(`💰 Detected currency: ${detectedCurrency.currency} (rate: ${detectedCurrency.rate})`);

    // Show conversion
    const usdAmount = 15; // The hardcoded amount
    const localAmount = usdAmount * detectedCurrency.rate;
    console.log(`\n💳 Payment conversion:`);
    console.log(`   USD $${usdAmount} → ${detectedCurrency.currency} ${localAmount}`);

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkUserCurrency();
