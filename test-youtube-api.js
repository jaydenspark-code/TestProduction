// Quick test script for YouTube API
const YOUTUBE_API_KEY = 'AIzaSyDAuuJ6KNraIyA4E1wizRZx3HDhJTO69QQ';

async function testYouTubeAPI() {
    console.log('🔴 Testing YouTube Data API v3...');
    console.log('API Key:', YOUTUBE_API_KEY ? '✅ Configured' : '❌ Missing');
    
    // Test with MrBeast's channel (known to work)
    const testChannels = [
        { name: 'MrBeast', handle: 'MrBeast', id: 'UCX6OQ3DkcsbYNE6H8uQQuVA' },
        { name: 'MKBHD', handle: 'mkbhd', id: 'UCBJycsmduvYEL83R_U4JriQ' },
        { name: 'PewDiePie', handle: 'PewDiePie', id: 'UC-lHJZR3Gqxm24_Vd_AJ5Yw' }
    ];
    
    for (const channel of testChannels) {
        console.log(`\n📺 Testing: ${channel.name}`);
        
        try {
            // Test with Channel ID (most reliable)
            console.log('   Trying with Channel ID...');
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channel.id}&key=${YOUTUBE_API_KEY}`
            );
            
            if (response.ok) {
                const data = await response.json();
                console.log('   API Response:', data);
                
                if (data.items && data.items.length > 0) {
                    const channelData = data.items[0];
                    const stats = channelData.statistics;
                    const snippet = channelData.snippet;
                    
                    console.log(`   ✅ SUCCESS!`);
                    console.log(`   📊 Subscribers: ${parseInt(stats.subscriberCount).toLocaleString()}`);
                    console.log(`   📹 Videos: ${parseInt(stats.videoCount).toLocaleString()}`);
                    console.log(`   👀 Views: ${parseInt(stats.viewCount).toLocaleString()}`);
                    console.log(`   📅 Created: ${snippet.publishedAt}`);
                    console.log(`   ✨ Title: ${snippet.title}`);
                } else {
                    console.log('   ⚠️  No data returned');
                }
            } else {
                console.log(`   ❌ API Error: ${response.status} ${response.statusText}`);
                const errorData = await response.json();
                console.log('   Error details:', errorData);
            }
            
        } catch (error) {
            console.log(`   💥 Request Failed: ${error.message}`);
        }
    }
    
    // Test quota and rate limits
    console.log('\n📊 Testing API Quotas...');
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UCX6OQ3DkcsbYNE6H8uQQuVA&key=${YOUTUBE_API_KEY}`
        );
        
        console.log('Response headers:');
        for (const [key, value] of response.headers.entries()) {
            if (key.includes('quota') || key.includes('limit') || key.includes('remaining')) {
                console.log(`   ${key}: ${value}`);
            }
        }
        
    } catch (error) {
        console.log('Could not check quota info');
    }
}

// Run the test
testYouTubeAPI().catch(console.error);
