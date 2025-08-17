const { getAllCountries } = require('./src/utils/countries.ts');
const { ExchangeRateService } = require('./src/services/ExchangeRateService.ts');

console.log('🔍 Testing Country and Currency Improvements...\n');

// Test 1: Check country count and phone codes
try {
  const countries = getAllCountries();
  console.log(`✅ Total countries loaded: ${countries.length}`);
  
  // Show first 10 countries
  console.log('\n📋 First 10 countries with phone codes:');
  countries.slice(0, 10).forEach(country => {
    console.log(`  ${country.flag} ${country.name} (${country.code}) - ${country.phoneCode} - ${country.currency}`);
  });
  
  // Check specific countries
  const testCountries = ['US', 'NG', 'GB', 'DE', 'JP', 'IN', 'BR'];
  console.log('\n🌍 Testing specific countries:');
  testCountries.forEach(code => {
    const country = countries.find(c => c.code === code);
    if (country) {
      console.log(`  ✅ ${country.name}: ${country.phoneCode} (${country.currency})`);
    } else {
      console.log(`  ❌ ${code}: Not found`);
    }
  });
  
} catch (error) {
  console.error('❌ Error testing countries:', error.message);
}

// Test 2: Check currency conversion
async function testCurrency() {
  try {
    console.log('\n💱 Testing currency conversion...');
    
    // Test conversion rates
    const testConversions = [
      { from: 'USD', to: 'EUR', amount: 100 },
      { from: 'USD', to: 'GBP', amount: 100 },
      { from: 'USD', to: 'NGN', amount: 15 },
      { from: 'USD', to: 'JPY', amount: 50 }
    ];
    
    for (const test of testConversions) {
      try {
        const rate = await ExchangeRateService.getConversionRate(test.from, test.to);
        const converted = await ExchangeRateService.convertAmount(test.amount, test.from, test.to);
        console.log(`  ✅ ${test.amount} ${test.from} = ${converted.toFixed(2)} ${test.to} (rate: ${rate.toFixed(4)})`);
      } catch (error) {
        console.log(`  ⚠️  ${test.from} to ${test.to}: ${error.message}`);
      }
    }
    
    // Test cache info
    const cacheInfo = ExchangeRateService.getCacheInfo();
    console.log(`\n📦 Cache status: ${cacheInfo.size} entries`);
    
  } catch (error) {
    console.error('❌ Error testing currency:', error.message);
  }
}

// Run tests
testCurrency().then(() => {
  console.log('\n🎉 Testing complete!');
}).catch(error => {
  console.error('❌ Test failed:', error);
});
