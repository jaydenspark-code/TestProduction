# 🌱 AI Data Seeding Guide

This guide explains how to populate your database with realistic sample data to make the AI features work properly.

## 🚨 **Quick Fix for Loading AI Widgets**

The AI-Powered Insights, Smart Matches, and Performance Analytics are currently loading forever because they're trying to analyze empty database tables. Here's how to fix it:

## 📋 **Prerequisites**

1. **Database Schema Applied**: Make sure your Supabase database has the basic schema from `supabase/schema.sql`
2. **Environment Variables**: Your `.env` file should have:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## 🚀 **How to Run**

### **Option 1: Basic Seeding (Recommended)**
```bash
npm run seed:ai
```

### **Option 2: Force Seeding (Even if Data Exists)**
```bash
npm run seed:ai:force
```

## 📊 **What Gets Created**

The seeder will create realistic sample data:

- **100 Users** with various roles (users, agents, advertisers, admins)
- **500 Transactions** (earnings, withdrawals, bonuses, referrals)
- **200 Referrals** with different statuses
- **20 Campaigns** from advertiser accounts
- **30 Agent Applications** (pending, approved, rejected)
- **15 Advertiser Applications** (pending, approved, rejected)
- **300 User Behavior logs** (if AI schema is applied)
- **AI Metrics and Segments** (if AI schema is applied)

## ✅ **Results After Seeding**

Once seeded, you'll immediately see:

1. **AI-Powered Insights** - Will show real data analysis
2. **Smart Matching** - Will display actual user compatibility scores
3. **Performance Analytics** - Will show genuine performance metrics
4. **Admin Panel** - Will have real applications to review
5. **User Dashboards** - Will display actual user activity

## 🔧 **Production Safety**

The seeding system is designed to be safe:

- **Environment Aware**: Only runs in development by default
- **Smart Detection**: Won't seed if sufficient data already exists (50+ users)
- **Easy Disable**: Set `ENABLE_AI_SEEDING=false` to completely disable
- **No Code Changes**: When real users join, just stop running the seeder

## 🛠️ **Troubleshooting**

### **Missing Supabase Credentials**
```
❌ Missing Supabase credentials for seeding
```
**Fix**: Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env` file

### **Database Table Errors**
```
relation "users" does not exist
```
**Fix**: Apply the database schema from `supabase/schema.sql` first

### **Permission Errors**
```
new row violates row-level security policy
```
**Fix**: The service role key should bypass RLS policies

## 🔄 **Transition to Real Data**

When you're ready for production:

1. **Set Environment Variable**: `ENABLE_AI_SEEDING=false`
2. **Clear Sample Data** (optional): Run cleanup if desired
3. **No Code Changes**: Your AI services will automatically work with real user data

## 📈 **Benefits of This Approach**

- ✅ **Zero Migration Risk**: No code changes needed later
- ✅ **Full System Testing**: Tests actual database integration
- ✅ **Realistic Development**: Proper data relationships and patterns
- ✅ **Immediate Results**: AI widgets work right away
- ✅ **Production Ready**: Same code paths as production

## 🎯 **Expected Performance**

After seeding, you should see:

- **Loading times**: 2-3 seconds instead of infinite loading
- **AI Insights**: Actual recommendations and predictions
- **Smart Matches**: Real compatibility scores
- **Analytics**: Genuine performance metrics
- **Charts/Graphs**: Populated with actual data points

---

## 🚀 **Ready to Test?**

Run the seeder and watch your AI features come to life:

```bash
npm run seed:ai
```

Then refresh your application and see the AI-Powered Insights working with real data! 🎉
