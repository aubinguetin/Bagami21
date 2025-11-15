# Backoffice Security Fix

## Issues Fixed

### 1. ❌ Problem: Any user could login via backoffice
**Before**: The backoffice login used the general `credentials` provider, which allowed any user with valid credentials to login, then checked the role AFTER authentication.

**After**: Created a dedicated `backoffice` credentials provider that:
- Only accepts email + password (no phone)
- Validates admin role DURING authentication
- Returns `null` if user doesn't have `admin` or `superadmin` role
- Prevents non-admin users from even getting a session

### 2. ❌ Problem: Admin login redirected to user homepage
**Before**: After successful login, users were redirected to `/` (homepage) instead of `/backoffice/dashboard`

**After**: 
- Updated login form to use `backoffice` provider explicitly
- Updated redirect callback to preserve `/backoffice/*` URLs
- Added explicit `router.push('/backoffice/dashboard')` after successful login

## Code Changes

### 1. New Backoffice Credentials Provider (`src/lib/auth.ts`)

```typescript
CredentialsProvider({
  id: "backoffice",
  name: "Backoffice",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" }
  },
  async authorize(credentials) {
    // ... validation ...
    
    // ✅ CRITICAL: Check role DURING authorization
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      console.log('❌ User is not an admin. Role:', user.role);
      return null; // Deny access immediately
    }
    
    // Only return user if they are admin
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role
    };
  }
}),
```

### 2. Updated Login Handler (`src/app/backoffice/login/page.tsx`)

```typescript
const result = await signIn('backoffice', {  // ✅ Use 'backoffice' provider
  email,
  password,
  redirect: false,
});

if (result?.error || !result?.ok) {
  setError('Invalid credentials or insufficient permissions');
  return;
}

// ✅ Explicit redirect to dashboard
router.push('/backoffice/dashboard');
```

### 3. Updated Redirect Callback (`src/lib/auth.ts`)

```typescript
async redirect({ url, baseUrl }) {
  // ✅ Preserve backoffice URLs
  if (url.includes('/backoffice')) {
    return url;
  }
  // Regular user redirects
  if (url.startsWith('/')) return `${baseUrl}${url}`;
  else if (new URL(url).origin === baseUrl) return url;
  return `${baseUrl}/`;
}
```

### 4. Enhanced User Model Returns

Updated both OTP and password flows in `phone-email` provider to include role:

```typescript
const authUser = {
  id: user.id,
  email: user.email,
  name: user.name,
  image: user.image,
  phone: user.phone,
  role: user.role || 'user'  // ✅ Include role in user object
};
```

## Security Flow

### Regular User Login Flow:
1. User visits `/auth`
2. Signs in with phone/email via `phone-email` provider
3. Gets authenticated with role = 'user'
4. Redirected to homepage
5. ✅ Cannot access `/backoffice/*` (middleware blocks)

### Admin Login Flow:
1. Admin visits `/backoffice/login`
2. Enters email + password
3. `backoffice` provider checks:
   - ✅ User exists
   - ✅ Password is correct
   - ✅ Role is 'admin' or 'superadmin'
4. If all checks pass → authenticated with admin role
5. If role check fails → returns `null` (login denied)
6. Redirected to `/backoffice/dashboard`
7. ✅ Middleware allows access

### Non-Admin Attempting Backoffice Login:
1. User visits `/backoffice/login`
2. Enters credentials (even if valid for regular account)
3. `backoffice` provider validates password ✅
4. Checks role: user has `role = 'user'` ❌
5. Returns `null` (authentication fails)
6. Error shown: "Invalid credentials or insufficient permissions"
7. ✅ Access denied - no session created

## Testing

### Test Admin Access:
```bash
# Login with admin account
Email: admin@bagami.com
Password: AdminBagami2025
```
- ✅ Should login successfully
- ✅ Should redirect to `/backoffice/dashboard`
- ✅ Should see admin sidebar and stats

### Test Regular User Blocked:
```bash
# Try to login with a regular user account
# (create one via /auth if you don't have one)
Email: user@example.com
Password: UserPassword123
```
- ❌ Should fail with "Invalid credentials or insufficient permissions"
- ❌ Should NOT create a session
- ❌ Should NOT redirect to dashboard

### Test Direct URL Access:
```bash
# While logged in as regular user, try:
http://localhost:3000/backoffice/dashboard
```
- ❌ Should redirect to `/backoffice/login`
- ❌ Middleware blocks non-admin access

## Providers Comparison

| Provider | Purpose | Access Level | Role Check |
|----------|---------|--------------|------------|
| `backoffice` | Admin login only | Admin/Superadmin | ✅ During auth |
| `phone-email` | Regular user login | All users | After auth (for role info) |
| `google` | OAuth social login | All users | No role check |
| `facebook` | OAuth social login | All users | No role check |

## Middleware Protection

The middleware now works in layers:

1. **Authentication Check**: Is user logged in?
2. **Role Check (in middleware)**: Does JWT token have admin role?
3. **Route Protection**: Block access if not admin

```typescript
// In middleware.ts
if (pathname.startsWith('/backoffice') && pathname !== '/backoffice/login') {
  const userRole = token?.role as string | undefined
  
  if (!userRole || (userRole !== 'admin' && userRole !== 'superadmin')) {
    return NextResponse.redirect(new URL('/backoffice/login', req.url))
  }
}
```

## Error Messages

| Scenario | Error Message |
|----------|---------------|
| Wrong password | "Invalid credentials or insufficient permissions" |
| User not found | "Invalid credentials or insufficient permissions" |
| Regular user trying backoffice | "Invalid credentials or insufficient permissions" |
| Not logged in accessing /backoffice | Redirect to `/backoffice/login` |

*Note: We use the same error message to avoid leaking information about which accounts exist*

## Summary

✅ **Fixed**: Backoffice now only accepts admin/superadmin users  
✅ **Fixed**: Admin login redirects to dashboard, not homepage  
✅ **Security**: Role validation happens DURING authentication  
✅ **UX**: Clear error messages for unauthorized access  
✅ **Defense**: Multi-layer protection (provider + middleware)

---

**Status**: Backoffice is now properly secured! 🔒
