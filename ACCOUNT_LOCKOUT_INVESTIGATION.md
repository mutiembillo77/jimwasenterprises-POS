# Account Lockout Investigation & Resolution

## Issue Description
The admin account displayed: `Account locked. Try again after 02/07/2026, 01:20:14`

## Root Cause
The account was locked due to **5 consecutive failed login attempts**. This is an intentional security feature to protect against brute-force attacks.

### Lockout Mechanism Details
- **File**: `src/lib/auth.ts`
- **Max Failed Attempts**: 5 attempts before lockout
- **Lockout Duration**: 30 minutes
- **Tracked Fields**: 
  - `failed_login_attempts` - Counter incremented on each wrong password
  - `locked_until` - Timestamp when lockout expires

### How the Lockout Occurs
1. User enters wrong password
2. `failed_login_attempts` counter increments
3. After 5 wrong attempts, `locked_until` is set to current time + 30 minutes
4. Login attempts are blocked until the lockout expires

## Solutions Provided

### 1. Password Reset (Recommended for End Users)
Password reset automatically:
- Resets `failed_login_attempts` to 0
- Clears `locked_until` (unlocks account)
- Changes password to new secure value

**Steps**:
1. On login page, click "Forgot Password"
2. Enter your email address
3. Enter the reset token sent to your email
4. Set a new password
5. Account is now unlocked and you can login

**Code Location**: `src/lib/auth.ts` - `resetPasswordWithToken()` function (lines 545-546)

### 2. Development Console Unlock (For Developers)
For testing/development only, unlock accounts via browser console:

```javascript
// Open browser console (F12 or right-click → Inspect → Console)
window.dev.unlockUser('admin')
```

Response:
```
✓ Account "admin" unlocked. Try logging in again.
```

**Code Location**: `src/App.tsx` - Development utilities (lines 45-51)

### 3. Programmatic Unlock (For Backend/Admin)
Call the unlock function directly:

```typescript
import { unlockUserByUsername } from './lib/auth';

const result = await unlockUserByUsername('admin');
if (result.success) {
  console.log('Account unlocked');
} else {
  console.error('Error:', result.error);
}
```

**Available Functions**:
- `unlockUserAccount(userId: string)` - Unlock by user ID
- `unlockUserByUsername(username: string)` - Unlock by username

## Security Audit Trail
When an account is unlocked, a security event is logged:
- **Event Type**: `ACCOUNT_UNLOCKED`
- **Severity**: Logged for audit purposes
- **Location**: `src/lib/security-monitor.ts` - Security events

## Default Test Credentials
```
Username: admin
Password: admin123
```

**Important**: Change the default admin password immediately in production!

## Configuration
To adjust lockout settings, edit `src/lib/auth.ts`:

```typescript
const MAX_FAILED_ATTEMPTS = 5;           // Change this value
const LOCKOUT_DURATION_MINUTES = 30;     // Change this value
```

## Related Files Modified
- `src/lib/auth.ts` - Added unlock functions
- `src/routes/login.tsx` - Enhanced error messaging
- `src/App.tsx` - Added development utilities

## Testing the Fix
1. Open the preview and try logging in 5 times with wrong password
2. Account should lock after 5th failed attempt
3. Use `window.dev.unlockUser('admin')` in console to unlock
4. Try logging in again with correct credentials - should work

## Best Practices
- **Production**: Use password reset mechanism for user-initiated unlocks
- **Development**: Use `window.dev.unlockUser()` for quick testing
- **Admin**: Use programmatic unlock function in admin dashboards
- **Monitoring**: Regularly check security events for suspicious lockout patterns
