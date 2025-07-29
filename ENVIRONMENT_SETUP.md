# ⚙️ Environment Configuration Guide

This guide will help you configure all environment variables needed for the AI-powered EarnPro platform.

## 🔧 **Step 2: Environment Variables Configuration**

### ✅ **Already Configured**
The following are already set up correctly:
- ✅ Supabase URL and API Key
- ✅ Paystack Test Keys  
- ✅ Basic App Configuration
- ✅ Real-time Features

### 🆕 **New AI Features Added**
Your `.env` file has been enhanced with:
- 🚀 AI Analytics Configuration
- 🧠 Smart Matching Engine Settings
- 🎯 Personalization Engine Variables
- 📊 Advanced Analytics Options
- 🔄 Real-time AI Updates

## 📋 **Required Actions**

### **1. SendGrid Email Configuration (Optional but Recommended)**

To enable email notifications:

1. **Sign up for SendGrid**: https://sendgrid.com/
2. **Get your API key** from SendGrid dashboard
3. **Update in `.env`**:
   ```env
   VITE_SENDGRID_API_KEY=SG.your_actual_sendgrid_api_key_here
   ```

### **2. Production Deployment Setup**

When ready to deploy to production:

1. **Change environment mode**:
   ```env
   NODE_ENV=production
   ```

2. **Update debug settings**:
   ```env
   VITE_DEBUG_MODE=false
   VITE_ENABLE_CONSOLE_LOGS=false
   ```

3. **Update Paystack to live keys** (when ready):
   ```env
   VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_live_key_here
   VITE_PAYSTACK_SECRET_KEY=sk_live_your_live_key_here
   ```

## 🎛️ **AI Feature Controls**

All AI features are **enabled by default** in your configuration:

```env
VITE_ENABLE_AI_ANALYTICS=true
VITE_ENABLE_SMART_MATCHING=true
VITE_ENABLE_PERSONALIZATION=true
VITE_ENABLE_PREDICTIVE_INSIGHTS=true
VITE_ENABLE_ANOMALY_DETECTION=true
```

### **To Disable Any AI Feature**:
Simply change `true` to `false` for any feature you don't want to use.

## 🔍 **Advanced Configuration Options**

### **AI Model Performance Tuning**:
```env
# Update frequency (in milliseconds)
VITE_AI_MODEL_UPDATE_INTERVAL=3600000  # 1 hour

# Prediction caching (for performance)
VITE_AI_PREDICTION_CACHE_TIME=1800000  # 30 minutes

# Processing batch size
VITE_AI_BATCH_SIZE=100

# Confidence threshold for AI decisions
VITE_AI_CONFIDENCE_THRESHOLD=0.7  # 70% confidence minimum
```

### **Smart Matching Settings**:
```env
# Minimum compatibility score for matches
VITE_MATCHING_MIN_COMPATIBILITY=0.6  # 60% compatibility minimum

# Maximum results to return
VITE_MATCHING_MAX_RESULTS=10

# Cache duration for matches
VITE_MATCHING_CACHE_DURATION=1800000  # 30 minutes
```

### **Real-time Features**:
```env
# Enable live AI-powered features
VITE_ENABLE_LIVE_MATCHING=true
VITE_ENABLE_LIVE_NOTIFICATIONS=true
VITE_ENABLE_LIVE_STATS=true

# Connection settings
VITE_REALTIME_HEARTBEAT_INTERVAL=30000  # 30 seconds
VITE_REALTIME_BATCH_UPDATES=true
```

## 🔒 **Security Best Practices**

### **Environment Security**:
- ✅ Never commit `.env` file to version control
- ✅ Use different keys for development/production
- ✅ Regularly rotate API keys
- ✅ Monitor API usage and rate limits

### **Production Security**:
```env
# Rate limiting
VITE_RATE_LIMIT_WINDOW=900000      # 15 minutes
VITE_RATE_LIMIT_MAX_REQUESTS=100   # Max requests per window

# JWT expiry
VITE_JWT_EXPIRY=3600               # 1 hour

# Request logging
VITE_ENABLE_REQUEST_LOGGING=true   # Monitor for security
```

## 🚀 **Optional Integrations**

The following integrations are available but commented out. Uncomment and configure as needed:

### **Social Media APIs** (for enhanced user matching):
```env
# Facebook
VITE_FACEBOOK_APP_ID=your_facebook_app_id

# Twitter
VITE_TWITTER_API_KEY=your_twitter_api_key

# LinkedIn
VITE_LINKEDIN_CLIENT_ID=your_linkedin_client_id
```

### **Analytics Platforms**:
```env
# Google Analytics
VITE_GA_TRACKING_ID=GA-XXXXXXXXX-X

# Hotjar
VITE_HOTJAR_ID=your_hotjar_id
```

### **AI/ML APIs** (for advanced features):
```env
# OpenAI (for advanced content generation)
VITE_OPENAI_API_KEY=your_openai_api_key

# Google Cloud (for additional ML services)
VITE_GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key
```

## 🧪 **Testing Your Configuration**

After setting up your environment variables:

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Check the browser console** for any configuration errors

3. **Verify AI features are loading** by checking the dashboard

4. **Test real-time connections** by opening multiple browser tabs

## 🔧 **Environment Validation**

Create a simple test to validate your configuration:

```javascript
// Add this to your main app component temporarily
console.log('🔧 Environment Check:');
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('AI Analytics:', import.meta.env.VITE_ENABLE_AI_ANALYTICS);
console.log('Smart Matching:', import.meta.env.VITE_ENABLE_SMART_MATCHING);
console.log('Real-time:', import.meta.env.VITE_ENABLE_REALTIME);
```

## 🆘 **Troubleshooting**

### **Common Issues**:

1. **Environment variables not loading**:
   - Ensure `.env` file is in project root
   - Restart development server
   - Check for typos in variable names

2. **AI features not working**:
   - Verify database schema is applied
   - Check browser console for errors
   - Ensure TensorFlow.js is loading properly

3. **Real-time connection issues**:
   - Check Supabase project is active
   - Verify real-time subscriptions are enabled
   - Check network connectivity

## ✅ **Configuration Checklist**

- [ ] `.env` file updated with AI configurations
- [ ] Database schema applied (from Step 1)
- [ ] Development server restarted
- [ ] No console errors visible
- [ ] AI features are enabled
- [ ] Real-time features working
- [ ] Optional integrations configured (if needed)

Once all items are checked, your environment is ready for AI-powered features! 🎉

---

**Next Step:** Initialize and test the AI models and frontend integration.
