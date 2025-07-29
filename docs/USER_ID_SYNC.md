# User ID Synchronization System

## Overview

This system addresses the root cause of authentication and email verification issues by ensuring that user IDs are consistent between Supabase's auth system and your custom users table.

## The Problem

When users register or when data gets imported, there can be mismatches between:
- The `id` field in the `auth.users` table (managed by Supabase)
- The `id` field in the `public.users` table (your custom table)

This mismatch causes:
- ❌ Login failures
- ❌ Email verification issues  
- ❌ Profile data not loading
- ❌ RLS policies not working correctly

## The Solution

The User ID Synchronization System provides:

1. **Automatic Fix During Login**: AuthContext now automatically detects and fixes ID mismatches
2. **Admin Tools**: Manual synchronization tools for database maintenance
3. **Validation**: Tools to check ID consistency

## Files Added/Modified

### New Files
- `src/utils/userIdSynchronizer.ts` - Core synchronization logic
- `src/scripts/syncUserIds.ts` - CLI script for batch synchronization
- `src/components/admin/UserIdSyncPanel.tsx` - Admin UI component
- `docs/USER_ID_SYNC.md` - This documentation

### Modified Files
- `src/context/AuthContext.tsx` - Enhanced with automatic ID synchronization

## Usage

### 1. Automatic Synchronization (Integrated)

The system now automatically handles ID mismatches during user login:

```typescript
// This happens automatically in AuthContext
const { user, login } = useAuth();

// When user logs in, if there's an ID mismatch, it gets fixed automatically
await login(email, password);
```

### 2. Manual Synchronization via CLI Script

For batch processing or maintenance:

```bash
# Set your service role key
export VITE_SUPABASE_SERVICE_KEY="your_service_role_key_here"

# Run the synchronization script
npx tsx src/scripts/syncUserIds.ts
```

### 3. Admin UI Panel

Add the admin panel to your admin interface:

```tsx
import UserIdSyncPanel from '../components/admin/UserIdSyncPanel';

// In your admin component
<UserIdSyncPanel />
```

### 4. Programmatic Usage

Use the synchronizer directly in your code:

```typescript
import { UserIdSynchronizer } from '../utils/userIdSynchronizer';

// Sync all users
const result = await UserIdSynchronizer.synchronizeUserIds();

// Validate a specific user
const validation = await UserIdSynchronizer.validateUserIdConsistency('user@example.com');

// Fix a specific user
const fixResult = await UserIdSynchronizer.fixSingleUser('user@example.com');
```

## API Reference

### UserIdSynchronizer

#### Methods

##### `synchronizeUserIds(): Promise<UserSyncResult>`
Synchronizes all user IDs between auth and users tables.

**Returns:**
```typescript
{
  success: boolean;
  message: string;
  fixed?: number;        // Number of users fixed
  errors?: string[];     // Any errors encountered
}
```

##### `validateUserIdConsistency(email: string): Promise<ValidationResult>`
Checks if a user's IDs are consistent.

**Returns:**
```typescript
{
  isConsistent: boolean;
  authId?: string;       // ID from auth.users
  publicId?: string;     // ID from public.users
  message: string;
}
```

##### `fixSingleUser(email: string): Promise<UserSyncResult>`
Fixes ID mismatch for a single user.

## What Gets Updated

When synchronizing, the system updates:

1. **Primary Record**: `public.users.id` → matches `auth.users.id`
2. **Related Records**: All foreign key references get updated
   - `withdrawal_requests.user_id`
   - `transactions.user_id`
   - `agent_applications.user_id`
   - `advertiser_applications.user_id`
   - `campaigns.advertiser_id`
   - `referrals.referrer_id` and `referrals.referred_id`
   - `notifications.user_id`
   - `user_sessions.user_id`
   - `users.referred_by`

## Prerequisites

### Service Role Key
The synchronization requires a Supabase service role key to access `auth.users`. Set it as:
- `VITE_SUPABASE_SERVICE_KEY` (for frontend)
- `SUPABASE_SERVICE_KEY` (for backend/scripts)

### Admin Permissions
Only users with admin/superadmin roles should access synchronization tools.

## Safety Measures

### Backup First
Always backup your database before running synchronization:
```sql
-- Create a backup of the users table
CREATE TABLE users_backup AS SELECT * FROM users;
```

### Transaction Safety
The synchronizer uses database transactions to ensure data consistency.

### Error Handling
- Individual user failures don't stop the entire process
- Detailed error reporting for troubleshooting
- Rollback capabilities for failed operations

## Monitoring

### Logs
The system provides detailed console logging:
- `🔄` Starting operations
- `✅` Successful operations  
- `❌` Errors and failures
- `⚠️` Warnings and edge cases

### Success Metrics
Track these metrics to monitor synchronization:
- Number of users fixed
- Validation consistency rate
- Error frequency

## Troubleshooting

### Common Issues

#### 1. "Service role key not found"
**Solution:** Set the `VITE_SUPABASE_SERVICE_KEY` environment variable.

#### 2. "Failed to fetch auth users"
**Cause:** Insufficient permissions or wrong service key.
**Solution:** Verify service role key has auth admin permissions.

#### 3. "Still cannot fetch user data after sync"
**Cause:** User exists in auth but not in public.users.
**Solution:** User needs to complete registration flow.

#### 4. Foreign key constraint errors
**Cause:** Referenced records in related tables.
**Solution:** The synchronizer handles this automatically by updating all related records.

### Debug Mode

Enable debug logging:
```typescript
// Set this before running synchronization
localStorage.setItem('debug', 'user-sync');
```

## Best Practices

1. **Run During Low Traffic**: Synchronization can temporarily lock records
2. **Test on Staging First**: Always test synchronization on a staging environment
3. **Monitor User Sessions**: Users may need to re-login after ID changes
4. **Regular Validation**: Periodically validate ID consistency
5. **Automate Monitoring**: Set up alerts for ID mismatches

## Migration Strategy

### For Existing Systems

1. **Assessment**: Run validation to identify affected users
2. **Communication**: Notify users of potential login disruption
3. **Synchronization**: Run full sync during maintenance window
4. **Verification**: Validate all users after synchronization
5. **Monitoring**: Watch for any remaining issues

### Example Migration Script

```bash
#!/bin/bash
# migration.sh

echo "Starting user ID synchronization migration..."

# 1. Backup database
echo "Creating backup..."
# Add your backup commands here

# 2. Run synchronization
echo "Running synchronization..."
npx tsx src/scripts/syncUserIds.ts

# 3. Validate results
echo "Migration completed. Check logs for results."
```

## Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify your service role key permissions
3. Ensure your database schema matches the expected structure
4. Contact the development team with specific error details

---

**Note**: This system is designed to be safe and reversible, but always backup your data before making changes to user IDs.
