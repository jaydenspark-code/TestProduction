# 🚀 EarnPro Integration Guide

This guide will help you set up and configure all the external services needed for the EarnPro application.

## 📋 Prerequisites

- Supabase account and project
- Paystack account (test mode)
- Mailgun account with verified domain
- Hostinger hosting account with earnpro.org domain

## 🔧 1. Supabase Configuration

### Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

### Step 2: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `supabase/schema.sql`
3. Run the SQL script to create all tables and functions

### Step 3: Configure Authentication

1. Go to **Authentication** → **Settings**
2. Configure your site URL: `https://earnpro.org` (for production)
3. Add redirect URLs:
   - `https://earnpro.org/auth/callback`
   - `http://localhost:5173/auth/callback` (for development)

## 💳 2. Paystack Configuration

### Step 1: Update Webhook URLs

In your Paystack dashboard, go to **Settings** → **API Keys & Webhooks** and update:

**Test Callback URL:**
```
https://earnpro.org/api/payments/callback
```

**Test Webhook URL:**
```
https://earnpro.org/api/payments/webhook
```

### Step 2: Get API Keys

1. Copy your **Test Public Key** (starts with `pk_test_`)
2. Copy your **Test Secret Key** (starts with `sk_test_`)

### Step 3: Configure IP Whitelist (Optional)

For security, add your server's IP address to the IP whitelist in Paystack.

## 📧 3. Mailgun Configuration

### Step 1: Verify DNS Records

Ensure all DNS records are properly configured on Hostinger:

**Sending Records:**
- **DKIM:** `email._domainkey.earnpro.org` → `k=rsa; p=MIGFMA0GCSQGSIb3DQ...`
- **SPF:** `earnpro.org` → `v=spf1 include:mailgun.org ~all`

**Receiving Records:**
- **MX:** `earnpro.org` → `mxa.eu.mailgun.org` (Priority: 10)
- **MX:** `earnpro.org` → `mxb.eu.mailgun.org` (Priority: 10)

**Tracking Records:**
- **CNAME:** `email.earnpro.org` → `eu.mailgun.org`

### Step 2: Get API Key

1. In Mailgun dashboard, go to **Settings** → **API Keys**
2. Copy your **Private API Key**

### Step 3: Enable DMARC (Recommended)

1. In Mailgun dashboard, go to **Domain settings** → **DNS records**
2. Click **Enable DMARC** to improve email deliverability

## 🌐 4. Environment Configuration

### Step 1: Create Environment File

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Paystack Configuration (Test Mode)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
VITE_PAYSTACK_SECRET_KEY=sk_test_your_secret_key

# Paystack Webhook URLs
VITE_PAYSTACK_CALLBACK_URL=https://earnpro.org/api/payments/callback
VITE_PAYSTACK_WEBHOOK_URL=https://earnpro.org/api/payments/webhook

# Mailgun Configuration
VITE_MAILGUN_API_KEY=your_mailgun_api_key
VITE_MAILGUN_DOMAIN=earnpro.org
VITE_MAILGUN_REGION=eu

# Application Configuration
VITE_APP_URL=https://earnpro.org
VITE_APP_NAME=EarnPro
VITE_APP_DESCRIPTION=The world's most trusted referral rewards platform

# Development/Production
NODE_ENV=production
```

### Step 2: Update Production URLs

When deploying to production, update these URLs:
- `VITE_APP_URL`: `https://earnpro.org`
- `VITE_PAYSTACK_CALLBACK_URL`: `https://earnpro.org/api/payments/callback`
- `VITE_PAYSTACK_WEBHOOK_URL`: `https://earnpro.org/api/payments/webhook`

## 🚀 5. Backend API Setup

### Step 1: Create API Endpoints

You'll need to create these API endpoints on your backend:

**Payment Callback:**
```
POST /api/payments/callback
```

**Payment Webhook:**
```
POST /api/payments/webhook
```

**Email Webhook:**
```
POST /api/emails/webhook
```

### Step 2: Webhook Verification

Implement webhook signature verification for both Paystack and Mailgun:

```javascript
// Paystack webhook verification
const crypto = require('crypto');
const signature = req.headers['x-paystack-signature'];
const hash = crypto
  .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (hash !== signature) {
  return res.status(400).json({ error: 'Invalid signature' });
}
```

## 🔒 6. Security Configuration

### Step 1: CORS Configuration

Configure CORS in your backend to allow requests from:
- `https://earnpro.org`
- `http://localhost:5173` (development)

### Step 2: Rate Limiting

Implement rate limiting for API endpoints:
- Authentication: 5 requests per minute
- Withdrawals: 3 requests per hour
- Email sending: 10 requests per minute

### Step 3: Input Validation

Ensure all user inputs are validated and sanitized:
- Email addresses
- Amount values
- Bank account details
- Referral codes

## 📱 7. Testing

### Step 1: Test Supabase Connection

```javascript
// Test database connection
const { data, error } = await supabase
  .from('users')
  .select('*')
  .limit(1);

if (error) {
  console.error('Supabase connection failed:', error);
}
```

### Step 2: Test Paystack Integration

```javascript
// Test payment initialization
const response = await paystackService.initializeTransaction({
  email: 'test@example.com',
  amount: 1000,
  reference: 'TEST-001'
});

console.log('Paystack test response:', response);
```

### Step 3: Test Email Service

```javascript
// Test email sending
await emailService.sendWelcomeEmail({
  email: 'test@example.com',
  fullName: 'Test User',
  referralCode: 'TEST123'
});
```

## 🚀 8. Deployment Checklist

### Pre-Deployment
- [ ] All environment variables are set
- [ ] DNS records are properly configured
- [ ] SSL certificate is installed
- [ ] Database schema is deployed
- [ ] API endpoints are tested

### Post-Deployment
- [ ] Test user registration
- [ ] Test payment flow
- [ ] Test withdrawal process
- [ ] Test email notifications
- [ ] Monitor error logs
- [ ] Set up monitoring and alerts

## 🔧 9. Troubleshooting

### Common Issues

**1. Supabase Connection Errors**
- Verify URL and API key
- Check if database schema is deployed
- Ensure RLS policies are configured

**2. Paystack Webhook Failures**
- Verify webhook URLs are accessible
- Check signature verification
- Monitor webhook delivery logs

**3. Email Delivery Issues**
- Verify DNS records are propagated
- Check Mailgun logs for bounces
- Ensure domain is verified

**4. CORS Errors**
- Verify CORS configuration
- Check if requests are coming from allowed origins
- Ensure proper headers are set

### Debug Commands

```bash
# Test Supabase connection
curl -X GET "https://your-project.supabase.co/rest/v1/users" \
  -H "apikey: your-anon-key"

# Test Paystack API
curl -X GET "https://api.paystack.co/bank" \
  -H "Authorization: Bearer your-secret-key"

# Test Mailgun API
curl -X POST "https://api.eu.mailgun.net/v3/earnpro.org/messages" \
  -u "api:your-api-key" \
  -F from="EarnPro <noreply@earnpro.org>" \
  -F to="test@example.com" \
  -F subject="Test Email" \
  -F text="This is a test email"
```

## 📞 10. Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review service-specific documentation:
   - [Supabase Docs](https://supabase.com/docs)
   - [Paystack Docs](https://paystack.com/docs)
   - [Mailgun Docs](https://documentation.mailgun.com/)
3. Contact support teams for each service
4. Check application logs for detailed error messages

## 🔄 11. Maintenance

### Regular Tasks
- Monitor API usage and limits
- Review and update security policies
- Backup database regularly
- Update dependencies
- Monitor email deliverability
- Review webhook logs

### Updates
- Keep all services updated to latest versions
- Monitor for security patches
- Test integrations after updates
- Update documentation as needed

---

**Note:** This guide assumes you're using the provided frontend code. Adjust paths and configurations according to your specific setup. 