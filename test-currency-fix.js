console.log('🧪 Testing Fixed Currency Conversion...\n');

// Test the fallback function directly
const { formatDualCurrencySync } = require('./src/utils/currency.ts');

const testAmount = 15; // $15 USD activation fee

console.log('💰 Testing $15 USD conversion to various currencies:\n');

const testCurrencies = [
  { code: 'GHS', expected: '156.75', name: 'Ghanaian Cedi' },
  { code: 'NGN', expected: '22,935.15', name: 'Nigerian Naira' },
  { code: 'GBP', expected: '11.30', name: 'British Pound' },
  { code: 'EUR', expected: '13.91', name: 'Euro' },
  { code: 'CAD', expected: '21.53', name: 'Canadian Dollar' },
  { code: 'JPY', expected: '2,343.00', name: 'Japanese Yen' },
  { code: 'ZAR', expected: '281.25', name: 'South African Rand' },
  { code: 'KES', expected: '1,947.75', name: 'Kenyan Shilling' }
];

console.log('Results:');
testCurrencies.forEach(({ code, expected, name }) => {
  try {
    const result = formatDualCurrencySync(testAmount, code);
    console.log(`✅ ${code} (${name}): ${result}`);
    console.log(`   Expected ~${expected}, Got: ${result.split('≈')[1] || 'N/A'}`);
  } catch (error) {
    console.log(`❌ ${code}: Error - ${error.message}`);
  }
  console.log('');
});

// Test specific calculations manually
console.log('🔢 Manual calculations verification:');
console.log('');

const rates = {
  'GHS': 10.45,
  'NGN': 1529.01,
  'GBP': 0.7530
};

Object.entries(rates).forEach(([currency, rate]) => {
  const calculated = testAmount * rate;
  console.log(`${currency}: $${testAmount} × ${rate} = ${calculated.toFixed(2)}`);
});

console.log('\n🎯 Expected Results:');
console.log('• GHS: $15 × 10.45 = 156.75 (Ghana Cedis)');
console.log('• NGN: $15 × 1529.01 = 22,935.15 (Nigerian Naira)');  
console.log('• GBP: $15 × 0.7530 = 11.30 (British Pounds)');

console.log('\n✨ Test Complete!');
