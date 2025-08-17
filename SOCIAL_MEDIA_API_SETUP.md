# 🔧 REAL-TIME SOCIAL MEDIA API SETUP GUIDE

## 📊 Current Issue: Random Follower Counts

Your agent application form is currently showing **estimated/random figures** instead of real-time follower counts because the social media APIs need proper configuration.

## ✅ Solution: API Integration Setup

### **1. Get RapidAPI Key (Primary Source)**

1. **Sign up at RapidAPI**: https://rapidapi.com
2. **Get your API key** from the dashboard
3. **Subscribe to these APIs** (most have free tiers):
   - **YouTube Data API**: Real subscriber counts
   - **Instagram Data API**: Real follower counts
   - **Twitter API**: Real follower counts
   - **TikTok API**: Real follower counts
   - **Telegram API**: Real member counts

### **2. Update Environment Variables**

Replace these in your `.env` file:

```bash
# Real API Keys (replace with your actual keys)
VITE_RAPIDAPI_KEY=your_actual_rapidapi_key_here
VITE_SOCIALBLADE_KEY=your_socialblade_key_here
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### **3. Platform-Specific Setup**

#### **🔴 YouTube (Highest Priority)**

- **Free Option**: Google YouTube Data API v3
- **Paid Option**: RapidAPI YouTube Analytics
- **Setup**: Get API key from Google Cloud Console
- **Cost**: 100 requests/day free, then $0.05 per 1000 requests

#### **📸 Instagram**

- **Option 1**: Instagram Basic Display API (Meta)
- **Option 2**: RapidAPI Instagram API
- **Setup**: Create Facebook Developer account
- **Cost**: Most are free with rate limits

#### **🐦 Twitter/X**

- **Option 1**: Twitter API v2 (Official)
- **Option 2**: RapidAPI Twitter alternatives
- **Setup**: Twitter Developer account required
- **Cost**: $100/month for API access (expensive!)

#### **📱 TikTok**

- **Option 1**: TikTok Research API
- **Option 2**: RapidAPI TikTok scrapers
- **Setup**: Business verification required for official API
- **Cost**: Official API requires approval, alternatives vary

#### **💬 Telegram**

- **Option 1**: Telegram Bot API (Free!)
- **Option 2**: RapidAPI Telegram APIs
- **Setup**: Create bot with @BotFather
- **Cost**: Completely free for basic data

## 🚀 Quick Implementation

### **Step 1: Update .env with Real Keys**

```bash
# Replace these placeholder values
VITE_RAPIDAPI_KEY=your_rapidapi_key_from_rapidapi_dashboard
VITE_TELEGRAM_BOT_TOKEN=bot_token_from_botfather
VITE_GOOGLE_CLIENT_ID=google_api_key_for_youtube
```

### **Step 2: Test with Telegram (Easiest)**

1. Create Telegram bot: Message @BotFather on Telegram
2. Get bot token: Follow BotFather instructions
3. Add token to .env file
4. Test with any public Telegram channel

### **Step 3: Verify Real Data**

After updating keys, the detection should show:

- ✅ **Real follower counts** instead of random numbers
- ✅ **Accurate engagement rates**
- ✅ **Live verification badges**
- ✅ **"Real-time data" indicator**

## 📋 API Cost Breakdown

| Platform      | Free Tier    | Paid Tier      | Best Option         |
| ------------- | ------------ | -------------- | ------------------- |
| **YouTube**   | 100 req/day  | $0.05/1000 req | ✅ Google API       |
| **Telegram**  | Unlimited    | N/A            | ✅ Bot API (Free)   |
| **Instagram** | 200 req/hour | $10-50/month   | ⚠️ RapidAPI         |
| **Twitter**   | None         | $100/month     | ❌ Very expensive   |
| **TikTok**    | Varies       | $20-100/month  | ⚠️ Third-party only |

## 🎯 Recommended Implementation Order

### **Phase 1: Free APIs (Immediate)**

1. ✅ **Telegram** - Free Bot API
2. ✅ **YouTube** - Free Google API (100/day)

### **Phase 2: Essential Paid APIs**

3. 📸 **Instagram** - RapidAPI ($10/month)
4. 📱 **TikTok** - RapidAPI alternatives ($20/month)

### **Phase 3: Premium (Optional)**

5. 🐦 **Twitter** - Only if budget allows ($100/month)

## 🔧 Testing the Fix

### **Before (Current State):**

```
🔗 https://t.me/TeenzMovement
📊 Random Count: 45,267 followers (changes each time)
⚠️ "Estimated metrics" warning
```

### **After (With Real APIs):**

```
🔗 https://t.me/TeenzMovement
📊 Real Count: 116,235 subscribers (live data)
✅ "Real-time data" confirmed
```

## 🚨 Immediate Quick Fix

**If you want to fix this TODAY without API setup:**

1. **Use the intelligent estimation** (already implemented)
2. **Based on handle characteristics** instead of random numbers
3. **More realistic figures** based on username patterns
4. **Clear "estimated" labeling** so users know it's not real-time

## 🎯 Next Steps

1. **Choose your API providers** based on budget
2. **Get API keys** for priority platforms (Telegram + YouTube first)
3. **Update .env file** with real keys
4. **Test with real channels** to verify accuracy
5. **Deploy updates** to production

**Want me to help you set up any specific platform APIs? I can walk you through the exact steps for YouTube, Telegram, or Instagram integration!**
