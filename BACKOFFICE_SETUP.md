# Backoffice Admin Platform - Phase 1 Complete

## Overview
The backoffice admin platform provides secure administrative access to manage users, deliveries, transactions, and monitor system activity.

## Features Implemented (Phase 1)

### ✅ Authentication & Security
- **Separate Admin Login**: `/backoffice/login` - dedicated admin authentication portal
- **Role-Based Access Control**: User model extended with `role` field (user, admin, superadmin)
- **Protected Routes**: Middleware enforces admin-only access to `/backoffice/*` routes
- **Session Management**: JWT-based authentication with role persistence
- **Audit Logging**: All admin actions logged with timestamps, IP address, and user agent

### ✅ Database Schema Updates
- **User.role**: Added role field with default value "user"
- **AdminAction Model**: New table for audit trail
  - Tracks: adminId, action, targetType, targetId, details, ipAddress, userAgent, createdAt
  - Indexed on: adminId, action, createdAt, (targetType, targetId)

### ✅ Dashboard Layout
- **Responsive Sidebar**: Collapsible navigation with icon-only mode
- **Mobile Support**: Full responsive design with mobile menu
- **Navigation**: Quick access to Dashboard, Users, Deliveries, Transactions, Audit Logs, Settings
- **User Info Display**: Shows logged-in admin email in sidebar
- **Professional UI**: Modern design with Tailwind CSS and react-icons

### ✅ Dashboard Home
- **Statistics Cards**: 
  - Total Users & Active Users
  - Active Deliveries & Total Deliveries
  - Total Transactions
  - Total Revenue (platform fees)
- **Quick Actions**: Fast navigation to main admin sections
- **Real-time Data**: Stats fetched from database on load

### ✅ API Endpoints

#### `/api/backoffice/verify-admin` (GET)
- Verifies if current user has admin or superadmin role
- Returns: `{ isAdmin: boolean }`

#### `/api/backoffice/audit` (POST/GET)
- **POST**: Log admin action
  - Body: `{ action, targetType?, targetId?, details? }`
  - Auto-captures: IP address, user agent, timestamp
- **GET**: Retrieve audit logs with pagination
  - Query params: `page`, `limit`
  - Returns: logs with admin details and pagination info

#### `/api/backoffice/stats` (GET)
- Returns dashboard statistics
- Includes: user counts, delivery stats, transaction totals, revenue

## File Structure

```
src/
├── app/
│   ├── backoffice/
│   │   ├── login/
│   │   │   └── page.tsx          # Admin login page
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard home
│   │   └── layout.tsx            # Admin layout with sidebar
│   └── api/
│       └── backoffice/
│           ├── verify-admin/
│           │   └── route.ts      # Role verification
│           ├── audit/
│           │   └── route.ts      # Audit logging
│           └── stats/
│               └── route.ts      # Dashboard statistics
├── middleware.ts                  # Route protection
├── lib/
│   └── auth.ts                   # Updated with role support
└── types/
    └── next-auth.d.ts            # Extended with role types

scripts/
└── create-admin.js               # Admin user creation script

prisma/
└── schema.prisma                 # Updated with role & AdminAction
```

## Setup Instructions

### 1. Database Migration
The migration has already been run. If you need to reset:
```bash
npx prisma migrate reset
npx prisma migrate dev --name add_admin_role_and_audit_log
```

### 2. Create First Admin User
Run the script to create an admin account:
```bash
node scripts/create-admin.js admin@example.com SecurePassword123 "Admin Name"
```

Example output:
```
✅ Admin user created successfully!
📧 Email: admin@example.com
👤 Name: Admin Name
🔐 Role: admin
🎉 You can now login at /backoffice/login
```

### 3. Access the Backoffice
1. Navigate to: `http://localhost:3000/backoffice/login`
2. Login with admin credentials
3. You'll be redirected to: `/backoffice/dashboard`

## Security Features

### Route Protection
- Middleware checks authentication on all `/backoffice/*` routes
- Login page (`/backoffice/login`) is publicly accessible
- Non-admin users redirected to login page
- Role verification happens both in middleware AND individual API routes

### Audit Trail
Every admin action is logged with:
- Admin user ID
- Action type (login, user_suspend, delivery_delete, etc.)
- Target resource (if applicable)
- JSON details
- IP address
- User agent
- Timestamp

Example audit log:
```javascript
{
  id: "abc123",
  adminId: "user_123",
  action: "admin_login",
  targetType: null,
  targetId: null,
  details: "{\"email\":\"admin@example.com\"}",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  createdAt: "2025-11-03T..."
}
```

### Session Management
- JWT tokens include user role
- Role refreshed from database on each request
- 30-day session expiry
- Secure cookie storage

## User Roles

### user (default)
- Standard platform user
- Access to delivery posting, messaging, wallet
- No backoffice access

### admin
- Full backoffice access
- Can manage users, deliveries, transactions
- All actions logged in audit trail
- Cannot access certain superadmin features (future)

### superadmin (future)
- All admin permissions
- Can create/manage other admin users
- Access to sensitive system settings
- Can view/export all audit logs

## UI Components

### Login Page
- Clean, professional design
- Email + password authentication
- Loading states during login
- Error message display
- Redirects to dashboard on success
- Logs admin login action

### Dashboard Layout
- Fixed sidebar (desktop) or slide-out menu (mobile)
- Active page highlighting
- Collapsible sidebar for more workspace
- User info section with logout button
- Consistent styling across all admin pages

### Dashboard Home
- 4 stat cards with icons
- Color-coded metrics (blue, green, purple, orange)
- Quick action cards with hover effects
- Responsive grid layout

## Next Steps (Phase 2)

### User Management Page
- [ ] List all users with search/filter
- [ ] User detail modal
- [ ] Suspend/activate users
- [ ] Reset user passwords
- [ ] View user activity

### Delivery Management
- [ ] List all deliveries
- [ ] Filter by status, type, date
- [ ] View delivery details
- [ ] Force delete deliveries
- [ ] View associated conversations

### Transaction Management
- [ ] List all transactions
- [ ] Filter by type, status, user
- [ ] Export transaction data
- [ ] Refund transactions
- [ ] Manual wallet adjustments

### Audit Logs Page
- [ ] Searchable audit log viewer
- [ ] Filter by admin, action, date range
- [ ] Export audit logs
- [ ] Detailed action view

### Settings
- [ ] Platform configuration
- [ ] Fee structure management
- [ ] Email templates
- [ ] System maintenance mode

## API Usage Examples

### Logging an Admin Action
```typescript
await fetch('/api/backoffice/audit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'user_suspend',
    targetType: 'User',
    targetId: 'user_123',
    details: JSON.stringify({ 
      reason: 'Violating terms of service',
      duration: '7 days'
    }),
  }),
});
```

### Fetching Dashboard Stats
```typescript
const response = await fetch('/api/backoffice/stats');
const stats = await response.json();
// {
//   totalUsers: 150,
//   activeUsers: 142,
//   recentUsers: 12,
//   totalDeliveries: 230,
//   activeDeliveries: 45,
//   ...
// }
```

### Checking Admin Status
```typescript
const response = await fetch('/api/backoffice/verify-admin');
const { isAdmin } = await response.json();
```

## Troubleshooting

### "Access denied. Admin privileges required"
- Ensure user has role='admin' or role='superadmin' in database
- Check if user is properly authenticated (session active)
- Verify JWT token includes role field

### Middleware not protecting routes
- Check matcher in `src/middleware.ts`
- Ensure `/backoffice/:path*` is in matcher array
- Verify NEXTAUTH_SECRET is set in `.env`

### Audit logs not appearing
- Check admin user is authenticated
- Verify AdminAction table exists in database
- Check browser console and server logs for errors

### TypeScript errors on Prisma types
```bash
# Regenerate Prisma client
npx prisma generate

# Or clear cache and regenerate
rm -rf node_modules/.prisma && npx prisma generate
```

## Development Tips

### Testing Admin Access
1. Create test admin: `node scripts/create-admin.js test@admin.com Test123`
2. Login at `/backoffice/login`
3. Check browser DevTools → Application → Cookies for session token
4. Verify role in session: check Network tab for API responses

### Adding New Admin Pages
1. Create page in `src/app/backoffice/[section]/page.tsx`
2. Add navigation item in `layout.tsx` navigation array
3. Implement admin check at page level (optional, middleware handles it)
4. Add API route if needed in `/api/backoffice/[endpoint]`

### Logging Admin Actions
Always log critical actions:
```typescript
// After performing action
await fetch('/api/backoffice/audit', {
  method: 'POST',
  body: JSON.stringify({
    action: 'action_name',
    targetType: 'ResourceType',
    targetId: resourceId,
    details: JSON.stringify({ /* relevant data */ }),
  }),
});
```

## Performance Considerations

- Dashboard stats cached client-side (consider adding SWR or React Query)
- Audit logs paginated (50 per page by default)
- Role check refreshes on each JWT validation (consider caching strategy)
- Middleware is lightweight (only checks token presence)

## Security Best Practices

1. **Never expose admin credentials**: Use environment variables for initial admin
2. **Regular audit review**: Check audit logs for suspicious activity
3. **Strong passwords**: Enforce minimum 8 characters for admin accounts
4. **2FA (future)**: Plan to implement two-factor authentication
5. **IP whitelisting (future)**: Restrict backoffice access to specific IPs
6. **Session timeout**: 30-day default, consider shorter for high-security needs

## Dependencies Added

- `react-icons` - Icon library for UI components
- Existing: `next-auth`, `@prisma/client`, `bcryptjs`, `tailwindcss`

## Migration History

- `add_admin_role_and_audit_log` - Adds role field to User model and creates AdminAction table

---

**Phase 1 Status**: ✅ Complete  
**Next Phase**: User Management & Delivery Moderation  
**Estimated Completion**: Phase 2-5 over next development cycles
