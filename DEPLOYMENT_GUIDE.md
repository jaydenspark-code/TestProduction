# 🚀 EarnPro Production Deployment Guide

## 📊 **Pre-Deployment Checklist** 

### ✅ **Critical Requirements (MUST COMPLETE)**

#### 1. **Environment Configuration** 
- [ ] Create `.env` file from `.env.example`
- [ ] Configure Supabase credentials
- [ ] Set up payment gateway API keys
- [ ] Configure email service (SendGrid)
- [ ] Set production URLs and callbacks

#### 2. **Database Setup**
- [ ] Create Supabase project
- [ ] Run database migration scripts
- [ ] Enable Row Level Security
- [ ] Test database connection

#### 3. **API Services Configuration**
- [ ] PayStack integration setup
- [ ] PayPal sandbox/live configuration  
- [ ] Stripe setup (optional)
- [ ] RapidAPI key for social media (optional)
- [ ] Gemini AI API key for chatbot (optional)

---

## 🔧 **Step-by-Step Deployment**

### **Step 1: Environment Variables Setup**

Create `.env` file with these REQUIRED variables:

```bash
# CRITICAL - Database Connection
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# CRITICAL - Payment Gateway (Choose one)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_or_live_key
VITE_PAYSTACK_SECRET_KEY=sk_test_or_live_key

# CRITICAL - Application URLs
VITE_APP_URL=https://yourdomain.com
VITE_API_BASE_URL=https://yourdomain.com/api
VITE_PAYSTACK_CALLBACK_URL=https://yourdomain.com/payment/callback

# OPTIONAL - Enhanced Features
VITE_RAPIDAPI_KEY=your_rapidapi_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SENDGRID_API_KEY=your_sendgrid_key
```

### **Step 2: Supabase Database Setup**

1. **Create Project**: Go to [supabase.com](https://supabase.com)
2. **Get Credentials**: Project Settings → API → Copy URL and anon key
3. **Run Schema**: 
   ```sql
   -- Copy and run contents of supabase/schema.sql
   -- This creates all necessary tables and security policies
   ```

### **Step 3: Vercel Deployment**

#### **Option A: GitHub Integration (Recommended)**
1. Push code to GitHub repository
2. Connect GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

#### **Option B: Direct Deployment**
```bash
npm install -g vercel
vercel --prod
```

### **Step 4: Domain & DNS Configuration**
1. Add custom domain in Vercel
2. Update payment callback URLs
3. Configure SSL certificate (automatic with Vercel)

---

## 🎛️ **Configuration Options**

### **Payment Gateways**

#### **PayStack (Recommended for Africa)**
```bash
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx  # For production
VITE_PAYSTACK_SECRET_KEY=sk_live_xxxxx
```

#### **PayPal (Global)**
```bash
VITE_PAYPAL_CLIENT_ID=your_client_id
VITE_PAYPAL_CLIENT_SECRET=your_client_secret
VITE_PAYPAL_MODE=live  # or 'sandbox' for testing
```

### **Enhanced Features (Optional)**

#### **Real Social Media Data**
```bash
VITE_RAPIDAPI_KEY=your_rapidapi_key
# Enables real follower counts for agent applications
```

#### **AI Chatbot**
```bash
VITE_GEMINI_API_KEY=your_gemini_api_key
# Enables intelligent chatbot responses
```

#### **Email Notifications**
```bash
VITE_SENDGRID_API_KEY=your_sendgrid_key
VITE_SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

---

## ⚠️ **Critical Issues Fixed**

### **1. Environment Configuration**
- ✅ Fixed PayPal mode type casting
- ✅ Improved environment validation
- ✅ Enhanced error messaging

### **2. Hardcoded URLs**
- ✅ Removed hardcoded Supabase URL from ChatBot
- ✅ Made all API endpoints configurable
- ✅ Dynamic URL generation

### **3. TypeScript Issues**
- ✅ Added missing interface definitions
- ✅ Fixed type mismatches
- ✅ Enhanced error handling

---

## 🧪 **Testing Before Launch**

### **Basic Functionality Test**
1. User registration and login
2. Payment processing (use test mode)
3. Referral system
4. Agent application process
5. Admin panel access

### **Performance Test**
1. Page load speeds
2. Database query performance
3. API response times
4. Mobile responsiveness

---

## 🔍 **Post-Deployment Monitoring**

### **Health Checks**
- Monitor Supabase connection status
- Track payment gateway responses
- Monitor error rates and user feedback

### **Analytics Setup**
- Google Analytics integration
- User behavior tracking
- Performance monitoring

---

## 🛠️ **Troubleshooting Common Issues**

### **Database Connection Fails**
- Verify Supabase URL and keys
- Check RLS policies are enabled
- Ensure database schema is applied

### **Payment Processing Fails**
- Verify API keys are correct
- Check webhook URLs are accessible
- Test in sandbox mode first

### **Authentication Issues**
- Check Supabase auth settings
- Verify email confirmation setup
- Test password reset flow

---

## 📞 **Support & Next Steps**

### **Immediate Actions**
1. Complete environment setup
2. Deploy to staging environment
3. Run comprehensive tests
4. Deploy to production

### **Future Enhancements**
- Advanced analytics integration
- Additional payment methods
- Mobile app development
- API marketplace features

---

## 🎯 **Success Metrics**

After deployment, monitor these KPIs:
- User registration conversion rate
- Payment success rate
- Referral participation rate
- User retention metrics
- Revenue growth

---

**Status**: ✅ Ready for Production Deployment
**Estimated Setup Time**: 2-4 hours
**Recommended Launch Strategy**: Soft launch with limited users → Full public launch
