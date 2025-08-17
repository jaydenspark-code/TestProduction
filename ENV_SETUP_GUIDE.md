# EarnPro Environment Setup Guide

This guide provides instructions for setting up the environment variables required for the EarnPro application. Create a `.env` file in the root of the project and add the following variables.

## Development Environment

For local development, use the following settings:

```
# Application Environment
VITE_APP_ENV=development

# Supabase Configuration (replace with your development credentials)
VITE_SUPABASE_URL=your_dev_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_dev_supabase_anon_key_here

# Payment Gateways (use sandbox/test credentials)
VITE_PAYSTACK_PUBLIC_KEY=your_dev_paystack_public_key
VITE_STRIPE_PUBLISHABLE_KEY=your_dev_stripe_publishable_key
VITE_PAYPAL_CLIENT_ID=your_dev_paypal_client_id

# Email Service (use a development key or skip)
VITE_SENDGRID_API_KEY=your_dev_sendgrid_api_key

# OpenAI API Key (optional for AI features)
VITE_OPENAI_API_KEY=your_openai_api_key

# Social Media APIs (optional)
VITE_FACEBOOK_APP_ID=your_facebook_app_id
VITE_TWITTER_API_KEY=your_twitter_api_key
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Google APIs (optional)
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# App Configuration
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:5173/api

# Development Settings
NODE_ENV=development
VITE_DEBUG_MODE=true
```

## Production Environment

For production deployment, use the following settings. **NEVER** commit this file to version control.

```
# Application Environment
VITE_APP_ENV=production

# Supabase Configuration (replace with your production credentials)
VITE_SUPABASE_URL=your_prod_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_prod_supabase_anon_key_here

# Payment Gateways (use live credentials)
VITE_PAYSTACK_PUBLIC_KEY=your_prod_paystack_public_key
VITE_STRIPE_PUBLISHABLE_KEY=your_prod_stripe_publishable_key
VITE_PAYPAL_CLIENT_ID=your_prod_paypal_client_id

# Email Service (required for production)
VITE_SENDGRID_API_KEY=your_prod_sendgrid_api_key

# OpenAI API Key (required for AI features)
VITE_OPENAI_API_KEY=your_openai_api_key

# Social Media APIs (required for social tasks)
VITE_FACEBOOK_APP_ID=your_facebook_app_id
VITE_TWITTER_API_KEY=your_twitter_api_key
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Google APIs (required for social login)
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# App Configuration
VITE_APP_URL=https://your-production-app-url.com
VITE_API_URL=https://your-production-app-url.com/api

# Development Settings
NODE_ENV=production
VITE_DEBUG_MODE=false
```

