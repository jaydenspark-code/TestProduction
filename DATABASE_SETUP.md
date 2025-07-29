# 🗄️ Database Setup Guide for EarnPro AI Features

This guide will help you set up the complete database schema for your EarnPro platform with advanced AI features.

## 📋 Prerequisites

- Supabase project created and running
- Database access (either via Supabase dashboard or CLI)
- Basic understanding of SQL

## 🚀 Setup Steps

### Step 1: Apply Base Schema

1. **Open your Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run the Base Schema**
   ```sql
   -- Copy and paste the contents of supabase/schema.sql
   -- This creates the basic tables for users, transactions, etc.
   ```

3. **Verify Base Tables Created**
   - Go to **Table Editor** in Supabase
   - You should see tables like: `users`, `transactions`, `campaigns`, `referrals`, etc.

### Step 2: Apply AI Features Schema Extension

1. **Run the AI Features Extension**
   ```sql
   -- Copy and paste the contents of supabase/ai_features_schema.sql
   -- This adds all the AI-powered features tables
   ```

2. **Verify AI Tables Created**
   You should now see additional tables:
   - `user_personalization_profiles`
   - `user_behavior_logs`
   - `content_library`
   - `user_matching_profiles`
   - `referral_matches`
   - `ai_predictions`
   - `user_segments`
   - `anomaly_detections`
   - `live_events`
   - `ai_metrics`
   - And more...

### Step 3: Set Up Real-time Subscriptions

1. **Enable Real-time for Key Tables**
   In your Supabase dashboard, go to **Database** → **Replication**:
   
   Enable real-time for these tables:
   - `transactions`
   - `referrals`
   - `notifications`
   - `users`
   - `live_events`

2. **Configure Row Level Security**
   The schemas already include RLS policies, but verify they're enabled in **Authentication** → **Policies**

## 🎯 Key Features Enabled

### ✅ **User Personalization**
- Stores user preferences and behavior patterns
- Tracks engagement and performance metrics
- Supports custom dashboard layouts

### ✅ **Smart Matching**
- AI-powered referrer-referee matching
- Compatibility scoring algorithms
- Campaign optimization data

### ✅ **AI Analytics**
- Revenue predictions and insights
- User segmentation and clustering
- Anomaly detection for key metrics
- Behavioral pattern recognition

### ✅ **Real-time Features**
- Live event tracking
- Real-time notifications
- Performance metrics monitoring

### ✅ **Content Management**
- Personalized content recommendations
- Engagement tracking
- Dynamic content delivery

## 🔧 Database Functions Available

The schema includes several utility functions:

```sql
-- Calculate user engagement score
SELECT calculate_engagement_score('user-uuid-here');

-- Get user segment
SELECT get_user_segment('user-uuid-here');

-- Refresh AI models
SELECT refresh_ai_models();
```

## 📊 Sample Data

The schema automatically includes sample data for:
- User segments (high-value, growing, dormant, new-users)
- Content library entries
- AI model performance baselines

## 🔒 Security Features

- **Row Level Security (RLS)** enabled on all tables
- **User-specific data access** policies
- **Admin-only access** for sensitive analytics
- **Secure API endpoints** with proper authentication

## 🧪 Testing the Setup

After applying the schemas, you can test with these queries:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify sample data
SELECT * FROM user_segments;
SELECT * FROM content_library;
SELECT * FROM ai_model_performance;

-- Test functions
SELECT refresh_ai_models();
```

## 🚨 Troubleshooting

### Common Issues:

1. **Extension Errors**
   ```sql
   -- If you get extension errors, run:
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   ```

2. **Permission Errors**
   - Ensure you're running as a superuser in Supabase
   - Check that RLS policies are properly configured

3. **Foreign Key Errors**
   - Make sure base schema is applied before AI features schema
   - Verify all referenced tables exist

### Need Help?

- Check Supabase logs in the dashboard
- Review the schema files for specific table requirements
- Ensure all dependencies are properly installed

## ✅ Completion Checklist

- [ ] Base schema applied successfully
- [ ] AI features schema applied successfully
- [ ] Real-time subscriptions enabled
- [ ] Sample data visible in tables
- [ ] Functions working correctly
- [ ] RLS policies active
- [ ] No errors in Supabase logs

Once all items are checked, your database is ready for the AI-powered EarnPro platform! 🎉

---

**Next Step:** Configure your environment variables in the `.env` file to connect your application to this database.
