# 🚀 GET YOUR FREE API KEYS - 5 MINUTE SETUP

## 📺 YouTube Data API v3 (FREE - 10,000 requests/day)

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account
3. Create a new project or select existing one

### Step 2: Enable YouTube Data API

1. Go to "APIs & Services" > "Library"
2. Search for "YouTube Data API v3"
3. Click "Enable"

### Step 3: Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy your API key
4. (Optional) Restrict the key to YouTube Data API only

### Step 4: Update Your .env File

```
VITE_YOUTUBE_API_KEY=your_actual_api_key_here
```

---

## 🐦 Twitter API v2 (FREE - 500K tweets/month)

### Step 1: Go to Twitter Developer Portal

1. Visit: https://developer.twitter.com/
2. Sign in with your Twitter account
3. Apply for a developer account (usually approved instantly)

### Step 2: Create a New App

1. Click "Create App"
2. Fill in basic information
3. Use case: "Academic research" or "Making a bot"

### Step 3: Get Bearer Token

1. Go to your app dashboard
2. Click "Keys and Tokens"
3. Generate and copy "Bearer Token"

### Step 4: Update Your .env File

```
VITE_TWITTER_BEARER_TOKEN=your_bearer_token_here
```

---

## 🎯 TEST YOUR SETUP

Once you have the API keys:

1. **Restart your development server**

   ```bash
   npm run dev
   ```

2. **Test YouTube**: Try `https://youtube.com/@MrBeast`
3. **Test Twitter**: Try `https://twitter.com/elonmusk`
4. **Test Telegram**: Try `https://t.me/positivegh1`

You should see:

- ✅ Real-time data
- Actual follower/subscriber counts
- Console logs showing API calls

---

## 💡 TROUBLESHOOTING

### YouTube API Issues:

- Make sure API is enabled in Google Cloud
- Check quota limits (10K requests/day)
- Verify API key permissions

### Twitter API Issues:

- Ensure you have Essential access level
- Bearer token should start with "AAAAAAAAAAAAAAAAAAAAAx..."
- Check rate limits (300 requests/15 min)

### General Issues:

- Restart dev server after adding API keys
- Check browser console for error messages
- Verify .env file format (no spaces around =)

---

## 🎊 WHAT YOU GET

With these FREE APIs, you'll have:

✅ **Real YouTube subscriber counts** (10K requests/day)
✅ **Real Twitter follower counts** (500K requests/month)  
✅ **Real Telegram member counts** (unlimited, already working)
✅ **Professional accuracy** instead of estimates
✅ **Zero monthly costs** for moderate usage

This covers the 3 most important social media platforms completely FREE! 🎉
