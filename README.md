# EarnPro - Multi-Level Referral Platform

A comprehensive referral rewards platform built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Multi-Level Referral System**: Earn from direct and indirect referrals (up to 3 levels)
- **Agent Program**: Exclusive influencer program with progressive rewards
- **Advertiser Portal**: Campaign management and analytics
- **Daily Tasks**: Video watching and Telegram channel tasks
- **Dual Theme Support**: Classic and Professional themes
- **Multi-Currency Support**: 15+ currencies with real-time conversion
- **Secure Payments**: Integration with Paystack and other payment providers
- **Real-time Analytics**: Comprehensive performance tracking

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Payments**: Paystack integration
- **Email**: Mailgun integration
- **Deployment**: Vercel
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Vercel account (for deployment)

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd earnpro
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and update with your credentials:

```bash
cp .env.example .env
```

### 3. Supabase Setup

1. Create a new Supabase project
2. Click "Connect to Supabase" button in the app header
3. Copy your project URL and anon key from Supabase dashboard
4. The database schema will be automatically applied

### 4. Development

```bash
npm run dev
```

The app will run on `http://localhost:5173`

### 5. Deployment to Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 🗄️ Database Schema

The application uses the following main tables:

- `users` - User profiles and authentication
- `transactions` - Financial transactions and earnings
- `withdrawal_requests` - Withdrawal processing
- `agent_applications` - Agent program applications
- `advertiser_applications` - Advertiser applications
- `campaigns` - Marketing campaigns
- `referrals` - Referral tracking
- `notifications` - User notifications

## 🎨 Themes

### Classic Theme
- Purple and blue gradients
- Vibrant, modern design
- Perfect for younger audiences

### Professional Theme
- Dark theme with cyan accents
- Corporate, sophisticated look
- Ideal for business users

## 🔐 Security Features

- Row Level Security (RLS) policies
- JWT-based authentication
- Encrypted data transmission
- Secure payment processing
- Input validation and sanitization

## 📱 Responsive Design

- Mobile-first approach
- Optimized for all screen sizes
- Touch-friendly interactions
- Progressive Web App (PWA) ready

## 🌍 Multi-Currency Support

Supported currencies:
- USD (US Dollar)
- GHS (Ghanaian Cedi)
- NGN (Nigerian Naira)
- KES (Kenyan Shilling)
- And 11+ more currencies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Email: support@earnpro.com
- Documentation: See `INTEGRATION_GUIDE.md`
- Issues: Create a GitHub issue

## 🚀 Deployment Status

- ✅ Frontend: Ready for Vercel deployment
- ✅ Database: Supabase schema ready
- ✅ Authentication: Implemented with Supabase Auth
- ✅ Payments: Paystack integration ready
- ✅ Email: Mailgun integration ready

## 📊 Project Structure

```
src/
├── components/          # React components
│   ├── Auth/           # Authentication components
│   ├── Dashboard/      # Dashboard components
│   ├── Agent/          # Agent-specific components
│   ├── Advertiser/     # Advertiser components
│   ├── Tasks/          # Task management
│   └── ...
├── context/            # React context providers
├── services/           # API services
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── lib/                # Library configurations

supabase/
├── functions/          # Edge functions
├── migrations/         # Database migrations
└── schema.sql          # Database schema
```

## 🔄 Current Status

The project is in **TESTING MODE** until Supabase is connected. All features work with mock data for development and testing purposes.

To go live:
1. Connect Supabase database
2. Configure payment providers
3. Set up email service
4. Deploy to Vercel
5. Update environment variables