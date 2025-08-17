// =================================================================
// SOCIAL MEDIA API TEST SCRIPT
// =================================================================
// Test script to verify real-time follower detection vs estimates

import { socialMediaAPI } from '../src/services/socialMediaApi';
import { analyzeLink } from '../src/utils/linkDetection';

// Test URLs (replace with actual channels)
const testChannels = [
  {
    name: "TEENZ MOVEMENTS (from screenshot)",
    url: "https://t.me/TeenzMovement",
    platform: "Telegram",
    expectedFollowers: 116235 // From your screenshot
  },
  {
    name: "Sample YouTube Channel",
    url: "https://youtube.com/@MrBeast",
    platform: "YouTube",
    expectedFollowers: 200000000 // Example large channel
  },
  {
    name: "Sample Instagram",
    url: "https://instagram.com/cristiano",
    platform: "Instagram", 
    expectedFollowers: 600000000 // Example large account
  }
];

async function testSocialMediaDetection() {
  console.log('🧪 TESTING SOCIAL MEDIA FOLLOWER DETECTION');
  console.log('='.repeat(60));
  
  for (const channel of testChannels) {
    console.log(`\n📍 Testing: ${channel.name}`);
    console.log(`🔗 URL: ${channel.url}`);
    console.log(`📱 Platform: ${channel.platform}`);
    
    try {
      // Test current link analysis (estimated)
      console.log('\n📊 Current System (Estimated):');
      const linkAnalysis = await analyzeLink(channel.url);
      
      if (linkAnalysis.isValid) {
        const currentCount = linkAnalysis.followers || linkAnalysis.subscribers || 0;
        console.log(`   Followers: ${currentCount.toLocaleString()}`);
        console.log(`   Engagement: ${linkAnalysis.engagement}%`);
        console.log(`   Handle: ${linkAnalysis.handle}`);
        console.log(`   Status: ⚠️ ESTIMATED DATA`);
      } else {
        console.log(`   ❌ Invalid: ${linkAnalysis.error}`);
      }
      
      // Test real-time API
      console.log('\n🔴 Real-Time API Test:');
      const apiResult = await socialMediaAPI.getMetricsWithFallback(channel.url, channel.platform);
      
      if (apiResult.success && apiResult.data) {
        const realCount = apiResult.data.followers || apiResult.data.subscribers || 0;
        console.log(`   Followers: ${realCount.toLocaleString()}`);
        console.log(`   Engagement: ${apiResult.data.engagement}%`);
        console.log(`   Verified: ${apiResult.data.verified ? '✅' : '❌'}`);
        console.log(`   Status: ✅ REAL-TIME DATA`);
        console.log(`   Updated: ${apiResult.data.lastUpdated.toLocaleString()}`);
        
        // Compare accuracy
        if (channel.expectedFollowers) {
          const accuracy = (Math.abs(realCount - channel.expectedFollowers) / channel.expectedFollowers) * 100;
          console.log(`   Accuracy: ${accuracy < 10 ? '✅' : '⚠️'} ${(100 - accuracy).toFixed(1)}% accurate`);
        }
      } else {
        console.log(`   ❌ API Failed: ${apiResult.error}`);
        console.log(`   📋 Reason: Likely API keys not configured`);
      }
      
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
    
    console.log('-'.repeat(60));
  }
  
  // API Configuration Status
  console.log('\n🔧 API CONFIGURATION STATUS:');
  console.log('='.repeat(60));
  
  const rapidApiKey = process.env.VITE_RAPIDAPI_KEY;
  const telegramToken = process.env.VITE_TELEGRAM_BOT_TOKEN;
  const googleKey = process.env.VITE_GOOGLE_CLIENT_ID;
  const socialBladeKey = process.env.VITE_SOCIALBLADE_KEY;
  
  console.log(`RapidAPI Key: ${rapidApiKey && rapidApiKey !== 'your_rapidapi_key' ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`Telegram Bot: ${telegramToken && telegramToken !== 'your_telegram_bot_token' ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`Google API: ${googleKey && googleKey !== 'your_google_client_id' ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`SocialBlade: ${socialBladeKey && socialBladeKey !== 'your_socialblade_key' ? '✅ Configured' : '❌ Not configured'}`);
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('='.repeat(60));
  
  if (!telegramToken || telegramToken === 'your_telegram_bot_token') {
    console.log('1. 📱 Set up Telegram Bot API (FREE):');
    console.log('   - Message @BotFather on Telegram');
    console.log('   - Create new bot and get token');
    console.log('   - Add to .env: VITE_TELEGRAM_BOT_TOKEN=your_bot_token');
  }
  
  if (!googleKey || googleKey === 'your_google_client_id') {
    console.log('2. 🎥 Set up YouTube API (100 requests/day FREE):');
    console.log('   - Go to Google Cloud Console');
    console.log('   - Enable YouTube Data API v3');
    console.log('   - Create API key');
    console.log('   - Add to .env: VITE_GOOGLE_CLIENT_ID=your_api_key');
  }
  
  if (!rapidApiKey || rapidApiKey === 'your_rapidapi_key') {
    console.log('3. 🚀 Set up RapidAPI (Various platforms):');
    console.log('   - Sign up at rapidapi.com');
    console.log('   - Subscribe to social media APIs');
    console.log('   - Add to .env: VITE_RAPIDAPI_KEY=your_rapidapi_key');
  }
  
  console.log('\n🎯 EXPECTED RESULTS AFTER SETUP:');
  console.log('✅ TEENZ MOVEMENTS: ~116,235 subscribers (from your screenshot)');
  console.log('✅ Real engagement rates based on recent activity');
  console.log('✅ Verification status badges');
  console.log('✅ "Real-time data" confirmation in UI');
}

// Run the test
if (require.main === module) {
  testSocialMediaDetection().catch(console.error);
}

export { testSocialMediaDetection };

// =================================================================
// MANUAL TESTING COMMANDS
// =================================================================

/*
To test this manually:

1. Open browser console on agent application page
2. Test current system:
   
   const testUrl = "https://t.me/TeenzMovement";
   analyzeLink(testUrl).then(result => {
     console.log("Current (Estimated):", result);
   });

3. Test real API:
   
   socialMediaAPI.getMetricsWithFallback(testUrl, "Telegram").then(result => {
     console.log("Real-time API:", result);
   });

4. Compare results:
   - Current: Shows random/estimated numbers each time
   - Real API: Shows consistent, accurate numbers

Expected Improvement:
- Before: Random count like 45,267 (changes on refresh)
- After: Real count like 116,235 (matches actual channel)
*/
