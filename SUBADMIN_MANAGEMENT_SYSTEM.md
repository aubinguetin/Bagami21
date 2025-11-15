# Subadmin Management System

## Overview
The Subadmin Management System allows administrators to create and manage subadmin accounts with granular access control to different sections of the backoffice dashboard.

## Features

### 1. Subadmin CRUD Operations
- ✅ Create new subadmin accounts
- ✅ View all subadmins
- ✅ Edit subadmin information and permissions
- ✅ Suspend/activate subadmin accounts
- ✅ Delete subadmin accounts

### 2. Permission-Based Access Control
Subadmins can be granted access to specific dashboard sections:

| Permission ID | Section Name | Description |
|--------------|--------------|-------------|
| `dashboard` | Dashboard | View dashboard and analytics |
| `users` | Users | Manage users and verify IDs |
| `deliveries` | Deliveries | View and manage deliveries |
| `transactions` | Transactions | View transaction history |
| `notifications` | Notifications | Send notifications to users |
| `platform-settings` | Platform Settings | Modify platform fee and settings |
| `withdrawals` | Withdrawals | Approve/reject withdrawal requests |
| `topup` | Top up | Add funds to user wallets |
| `terms-policy` | Terms & Policy | Edit terms and policies |
| `audit` | Audit Logs | View audit logs and admin actions |

### 3. Account Status Management
- **Active**: Subadmin can log in and access permitted sections
- **Suspended**: Subadmin cannot log in (account frozen)

## Database Schema

### Subadmin Model
```prisma
model Subadmin {
  id          String   @id @default(cuid())
  email       String   @unique
  password    String   // Bcrypt hashed
  name        String?
  roleTitle   String   @default("Subadmin")
  isActive    Boolean  @default(true)
  permissions String   @default("[]") // JSON array of permission IDs
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   User     @relation(fields: [createdById], references: [id], onDelete: Cascade)
}
```

## User Interface

### Main Page (`/backoffice/subadmins`)

#### Header Section
- Title: "Subadmin Management"
- "Create Subadmin" button (orange)

#### Statistics Cards
1. **Total Subadmins**: Count of all subadmins
2. **Active**: Count of active subadmins (green)
3. **Suspended**: Count of suspended subadmins (red)

#### Subadmins Table
Columns:
- **Subadmin**: Name and email
- **Role**: Role title badge (purple)
- **Permissions**: Clickable count (shows expandable row)
- **Status**: Active/Suspended toggle button
- **Created**: Creation date
- **Actions**: Edit and Delete buttons

#### Expandable Row
When clicking on permissions count, shows:
- Grid of all assigned permissions with green shield icons
- Permission names from the AVAILABLE_PERMISSIONS list

## Modals

### Create Subadmin Modal
Fields:
- **Email** (required): Subadmin's email address
- **Name** (optional): Display name
- **Password** (required): Account password (8+ characters recommended)
  - Toggle visibility with eye icon
- **Role Title**: Custom role name (default: "Subadmin")
- **Access Permissions** (required): Checkboxes for each permission
  - "Select All" and "Clear All" quick actions
  - Each permission shows name and description
  - At least one permission required

Actions:
- Cancel button
- Create Subadmin button (disabled if no permissions selected)

### Edit Subadmin Modal
Same fields as Create modal, with:
- Email field is disabled (cannot change email)
- Password field is optional (leave blank to keep current password)
- All other fields pre-filled with current values

### Delete Confirmation Modal
- Warning icon (red alert circle)
- Confirmation message with subadmin email
- "Cannot be undone" warning
- Cancel and Delete buttons

## API Endpoints

### GET `/api/backoffice/subadmins`
Fetch all subadmins created by the current admin.

**Authorization**: Admin/Superadmin only

**Response**:
```json
{
  "success": true,
  "subadmins": [
    {
      "id": "clx...",
      "email": "subadmin@example.com",
      "name": "John Doe",
      "roleTitle": "Support Manager",
      "isActive": true,
      "permissions": ["users", "deliveries", "notifications"],
      "createdAt": "2025-11-10T12:00:00Z",
      "updatedAt": "2025-11-10T12:00:00Z",
      "createdBy": {
        "name": "Admin Name",
        "email": "admin@example.com"
      }
    }
  ]
}
```

### POST `/api/backoffice/subadmins`
Create a new subadmin account.

**Authorization**: Admin/Superadmin only

**Request Body**:
```json
{
  "email": "subadmin@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "roleTitle": "Support Manager",
  "permissions": ["users", "deliveries", "notifications"]
}
```

**Validation**:
- Email and password required
- At least one permission required
- Email must be unique
- Password is bcrypt hashed

**Audit Log**: Creates `subadmin_create` action

### PATCH `/api/backoffice/subadmins/[id]`
Update an existing subadmin.

**Authorization**: Admin/Superadmin only (must be creator)

**Request Body** (all fields optional):
```json
{
  "name": "Jane Doe",
  "roleTitle": "Senior Support",
  "permissions": ["users", "deliveries", "transactions"],
  "isActive": false,
  "password": "newPassword123"
}
```

**Notes**:
- Email cannot be changed
- Password only updated if provided
- At least one permission required
- Only the admin who created the subadmin can update it

**Audit Logs**:
- `subadmin_update`: General updates
- `subadmin_suspend`: When isActive set to false
- `subadmin_activate`: When isActive set to true

### DELETE `/api/backoffice/subadmins/[id]`
Delete a subadmin account.

**Authorization**: Admin/Superadmin only (must be creator)

**Response**:
```json
{
  "success": true,
  "message": "Subadmin deleted successfully"
}
```

**Audit Log**: Creates `subadmin_delete` action

### POST `/api/backoffice/subadmin-login`
Authenticate a subadmin.

**Public Endpoint**

**Request Body**:
```json
{
  "email": "subadmin@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "subadmin": {
    "id": "clx...",
    "email": "subadmin@example.com",
    "name": "John Doe",
    "roleTitle": "Support Manager",
    "permissions": ["users", "deliveries", "notifications"]
  }
}
```

**Sets Cookie**: `subadmin-token` (HTTP-only, 7-day expiry)

**Validation**:
- Checks if subadmin exists
- Verifies password (bcrypt compare)
- Checks if account is active
- Returns 403 if suspended

## Security Features

### Password Security
- All passwords hashed with bcrypt (10 rounds)
- Passwords never returned in API responses
- Password visibility toggle in forms (client-side only)

### Access Control
- Only admins/superadmins can create/manage subadmins
- Admins can only manage subadmins they created
- Subadmins cannot create other subadmins
- Suspended subadmins cannot log in

### Audit Logging
All subadmin actions are logged:
- `subadmin_create`: When created
- `subadmin_update`: When edited
- `subadmin_suspend`: When suspended
- `subadmin_activate`: When activated
- `subadmin_delete`: When deleted

Logs include:
- Admin who performed the action
- Target subadmin ID
- Subadmin email
- Changes made (for updates)
- Timestamp

## UI Components

### Permission Checkbox Grid
```tsx
<label className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
  <input type="checkbox" />
  <div>
    <p className="font-medium">{permission.name}</p>
    <p className="text-xs text-gray-500">{permission.description}</p>
  </div>
</label>
```

### Status Toggle Button
```tsx
<button
  onClick={() => handleToggleActive(subadmin)}
  className={subadmin.isActive 
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800'
  }
>
  {subadmin.isActive ? 'Active' : 'Suspended'}
</button>
```

### Permission Badge (in expanded row)
```tsx
<div className="flex items-center gap-2">
  <FiShield className="text-green-500" />
  {permission.name}
</div>
```

## Color Scheme

### Status Colors
- **Active**: Green (#10B981)
- **Suspended**: Red (#EF4444)
- **Role Badge**: Purple (#9333EA)
- **Primary Actions**: Orange (#F97316)

### Icons
- Main Icon: `FiUserCheck` (User with checkmark)
- Shield: `FiShield` (Permissions)
- Edit: `FiEdit2`
- Delete: `FiTrash2`
- Alert: `FiAlertCircle`
- Lock: `FiLock`
- Check: `FiCheck`
- Eye: `FiEye` / `FiEyeOff`

## Implementation Files

### Frontend
- `/src/app/backoffice/subadmins/page.tsx` - Main subadmin management page
- `/src/app/backoffice/layout.tsx` - Updated with Subadmins nav item

### Backend
- `/src/app/api/backoffice/subadmins/route.ts` - GET (list) and POST (create)
- `/src/app/api/backoffice/subadmins/[id]/route.ts` - PATCH (update) and DELETE
- `/src/app/api/backoffice/subadmin-login/route.ts` - Subadmin authentication

### Database
- `/prisma/schema.prisma` - Subadmin model definition
- `/prisma/migrations/20251110_add_subadmin/` - Initial migration
- `/prisma/migrations/20251110155543_add_subadmin/` - Generated migration

## Usage Flow

### Creating a Subadmin
1. Admin clicks "Create Subadmin"
2. Fills in email, password, name, role title
3. Selects at least one permission checkbox
4. Clicks "Create Subadmin"
5. API validates and hashes password
6. Subadmin created and appears in table
7. Admin action logged

### Editing Permissions
1. Admin clicks Edit icon for a subadmin
2. Modal opens with current data
3. Admin checks/unchecks permissions
4. Clicks "Update Subadmin"
5. Permissions updated
6. Admin action logged

### Suspending a Subadmin
1. Admin clicks Status badge (Active)
2. Status immediately toggles to "Suspended"
3. Subadmin cannot log in anymore
4. Admin action logged as `subadmin_suspend`

### Deleting a Subadmin
1. Admin clicks Delete icon
2. Confirmation modal appears
3. Admin confirms deletion
4. Subadmin permanently deleted
5. Admin action logged

## Future Enhancements (Not Implemented)

### Potential Features
- [ ] Subadmin activity logs (track what subadmins do)
- [ ] Permission groups/templates (pre-defined sets)
- [ ] Subadmin invitation system (email invites)
- [ ] Two-factor authentication for subadmins
- [ ] Session management (view/revoke active sessions)
- [ ] Subadmin profile page (self-service password change)
- [ ] Granular permissions (read vs write access)
- [ ] IP whitelisting for subadmin accounts
- [ ] Login history and security alerts
- [ ] Bulk permission updates

## Testing Checklist

### Create Subadmin
- [ ] Email validation (must be valid email)
- [ ] Password validation (required for creation)
- [ ] Permission validation (at least one required)
- [ ] Duplicate email rejection
- [ ] Password is hashed (not stored plaintext)
- [ ] Audit log created

### Edit Subadmin
- [ ] Name can be updated
- [ ] Role title can be updated
- [ ] Permissions can be added/removed
- [ ] At least one permission must remain
- [ ] Password update is optional
- [ ] Email cannot be changed
- [ ] Audit log created

### Suspend/Activate
- [ ] Status toggles correctly
- [ ] Suspended subadmin cannot log in
- [ ] Activated subadmin can log in
- [ ] Audit log created with correct action type

### Delete Subadmin
- [ ] Confirmation modal appears
- [ ] Subadmin is removed from database
- [ ] Subadmin removed from table
- [ ] Audit log created

### Permissions Display
- [ ] Permission count shows correct number
- [ ] Expandable row shows all permissions
- [ ] Permission names match available permissions
- [ ] Suspended accounts still show permissions

### Security
- [ ] Only admins can access subadmin management
- [ ] Admins only see their own subadmins
- [ ] Subadmins cannot be created by non-admins
- [ ] Passwords are bcrypt hashed
- [ ] Suspended subadmins rejected at login

## Troubleshooting

### "Property 'subadmin' does not exist on type 'PrismaClient'"
**Solution**: Run `npx prisma generate` to regenerate Prisma Client after schema changes

### "Email already in use"
**Cause**: Another subadmin exists with the same email
**Solution**: Use a different email address or update the existing subadmin

### "At least one permission must be selected"
**Cause**: Trying to create/update subadmin without permissions
**Solution**: Select at least one permission checkbox

### "Subadmin not found"
**Cause**: Trying to edit/delete a subadmin that doesn't exist or wasn't created by you
**Solution**: Verify the subadmin ID and that you're the creator

### "Account suspended"
**Cause**: Subadmin trying to log in while suspended
**Solution**: Admin must activate the account (toggle status to Active)

## Performance Considerations

- Subadmins table supports pagination (not yet implemented)
- Permissions stored as JSON string (lightweight)
- Bcrypt hashing is CPU-intensive (use async hash function)
- Indexes on email and createdById for faster queries
- Audit logs can grow large over time (consider archival strategy)

---

**Created**: November 10, 2025  
**Status**: ✅ Fully Implemented  
**Version**: 1.0
