// Test script to check Telegram Bot API functionality
const TELEGRAM_BOT_TOKEN = '8280241972:AAGaNeAgx0CV3TtblO6MjNr5vRFQgRwvbzs';

async function testTelegramAPI() {
    console.log('🤖 Testing Telegram Bot API...');
    console.log('Bot Token:', TELEGRAM_BOT_TOKEN ? '✅ Configured' : '❌ Missing');
    
    // Test bot info first
    try {
        console.log('\n📋 Step 1: Getting bot info...');
        const botResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
        const botData = await botResponse.json();
        
        if (botData.ok) {
            console.log('✅ Bot Info:', botData.result.username);
        } else {
            console.log('❌ Bot Info Error:', botData.description);
            return;
        }
    } catch (error) {
        console.log('❌ Bot Info Failed:', error.message);
        return;
    }
    
    // Test channel access with different usernames
    const testChannels = [
        'positivegh1',  // From your screenshot
        'telegram',     // Official Telegram channel
        'durov'         // Pavel Durov's channel
    ];
    
    for (const channel of testChannels) {
        console.log(`\n📊 Testing channel: @${channel}`);
        
        try {
            // Try getChatMemberCount first
            console.log('   Trying getChatMemberCount...');
            const memberResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMemberCount?chat_id=@${channel}`);
            const memberData = await memberResponse.json();
            
            if (memberData.ok) {
                console.log(`   ✅ Member Count: ${memberData.result.toLocaleString()}`);
                continue;
            } else {
                console.log(`   ❌ Member Count Error: ${memberData.description}`);
            }
            
            // Try getChat as fallback
            console.log('   Trying getChat...');
            const chatResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=@${channel}`);
            const chatData = await chatResponse.json();
            
            if (chatData.ok) {
                const chat = chatData.result;
                console.log(`   ✅ Chat Info: ${chat.title}`);
                console.log(`   📝 Type: ${chat.type}`);
                if (chat.members_count) {
                    console.log(`   👥 Members: ${chat.members_count.toLocaleString()}`);
                } else {
                    console.log(`   ⚠️  No member count in getChat response`);
                }
            } else {
                console.log(`   ❌ Chat Error: ${chatData.description}`);
            }
            
        } catch (error) {
            console.log(`   💥 Request Failed: ${error.message}`);
        }
    }
}

// Run the test
testTelegramAPI().catch(console.error);
