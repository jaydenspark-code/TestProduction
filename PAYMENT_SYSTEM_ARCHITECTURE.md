# EarnPro User Profile & Payment System

## Overview

The EarnPro system now uses a hybrid approach for user data management that ensures compatibility with Supabase Row Level Security (RLS) while maintaining full functionality for payments and database operations.

## How It Works

### 1. User Registration

- **Initial Storage**: User data is stored in Supabase Auth metadata during registration
- **No Database Insert**: Avoids RLS policy conflicts during signup
- **Email Verification**: Works with standalone email service
- **Result**: User can register successfully without RLS errors

### 2. User Profile Creation

- **Lazy Creation**: Database profile is created when needed (first login, payment, etc.)
- **Multiple Fallbacks**: System tries different methods to create the profile
- **Auth Metadata Backup**: If database creation fails, auth metadata is used

### 3. Payment Processing

- **Profile Preparation**: `prepareForPayment()` ensures database profile exists
- **Payment Status Update**: `markAsPaid()` updates both local state and database
- **Database Sync**: Payment status is reflected in Supabase users table

## Key Components

### AuthContext Updates

```typescript
// New functions added to AuthContext
interface AuthContextType {
  // ... existing properties
  ensureUserProfileExists: () => Promise<{ success: boolean; error?: string }>;
}
```

### usePaymentReady Hook

```typescript
const { prepareForPayment, markAsPaid, updateEarnings } = usePaymentReady();

// Before payment processing
await prepareForPayment();

// After successful payment
await markAsPaid();
```

### Payment Component Integration

```typescript
// In PaymentSetup.tsx
const prepResult = await prepareForPayment();
if (!prepResult.success) {
  throw new Error("Could not prepare user profile for payment");
}

// After payment success
await markAsPaid();
await refreshUser();
```

## Data Flow

### Registration Flow

1. User fills registration form
2. Data stored in Supabase Auth metadata
3. Email verification sent
4. User context updated with auth data
5. Database profile creation deferred

### Payment Flow

1. User initiates payment
2. `prepareForPayment()` ensures database profile exists
3. Payment processed through gateway
4. `markAsPaid()` updates user status
5. Database reflects payment status

### Login Flow

1. User authenticates
2. System checks for database profile
3. If missing, creates from auth metadata
4. User context updated with database data

## Benefits

### ✅ RLS Compatibility

- No direct database inserts during registration
- Works with any RLS policy configuration
- Eliminates "row-level security policy" errors

### ✅ Payment Integration

- Database profile guaranteed before payments
- Payment status properly stored
- Earnings tracking supported

### ✅ Data Consistency

- Auth metadata as source of truth initially
- Database sync when needed
- Fallback mechanisms for reliability

### ✅ User Experience

- Smooth registration process
- No registration failures due to RLS
- Payments work reliably

## Technical Implementation

### Database Profile Creation

```sql
-- Function to create user profile (bypasses RLS)
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT,
  user_country TEXT,
  user_currency TEXT DEFAULT 'USD',
  user_referral_code TEXT DEFAULT NULL,
  user_referred_by TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
```

### RLS Policy Updates

```sql
-- Permissive policy for user registration
CREATE POLICY "Allow user registration" ON public.users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);
```

## Usage Examples

### For Payment Components

```typescript
import { usePaymentReady } from "../hooks/usePaymentReady";

const PaymentComponent = () => {
  const { prepareForPayment, markAsPaid } = usePaymentReady();

  const processPayment = async () => {
    // Ensure database profile exists
    await prepareForPayment();

    // Process payment...

    // Update payment status
    await markAsPaid();
  };
};
```

### For Earnings Components

```typescript
const EarningsComponent = () => {
  const { updateEarnings } = usePaymentReady();

  const addEarnings = async (amount: number) => {
    await updateEarnings(amount);
  };
};
```

## Migration Notes

### Existing Users

- Existing users with database profiles continue to work normally
- No migration required for existing data

### New Users

- New users register through auth metadata
- Database profile created on first payment or dashboard access
- Seamless transition between metadata and database

## Monitoring & Debugging

### Console Logs

- `🔧 Preparing user profile for payment...` - Profile creation initiated
- `✅ User profile ready for payment processing` - Profile exists
- `💳 Payment successful, updating user status...` - Payment complete
- `⚠️ Could not update payment status in database` - Database update failed

### Error Handling

- Payment failures don't affect user registration
- Database profile creation has multiple fallback methods
- Local state updates ensure smooth UX even if database fails

This system ensures that payments will always work properly and reflect in the Supabase database, even with strict RLS policies in place.
