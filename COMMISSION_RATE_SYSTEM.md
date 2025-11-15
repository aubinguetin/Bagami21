# Platform Commission Rate System - Complete Documentation

## Overview
The platform now has a fully dynamic commission rate management system that allows the admin to change commission rates, with changes automatically reflected across all payment calculations and dashboard displays.

## Current Configuration
- **Current Commission Rate**: 50% (0.5 in database)
- **Default Rate** (fallback if database unavailable): 17.5% (0.175)
- **Admin Email**: admin@bagami.com
- **Admin Password**: Admin@123456

## System Architecture

### 1. Database Storage
- **Table**: `PlatformSettings`
- **Schema**:
  - `id`: Integer (Primary Key)
  - `key`: String (Unique - e.g., "commission_rate")
  - `value`: String (e.g., "0.5" for 50%)
  - `description`: String
  - `updatedBy`: String (Admin user ID)
  - `updatedAt`: DateTime
  - `createdAt`: DateTime

### 2. Configuration System (`/src/config/platform.ts`)

#### Available Functions:

**`getPlatformConfig()`** - Async
```typescript
// Fetches current commission rate from database
const config = await getPlatformConfig();
// Returns: { FEE_RATE: 0.5 } (or default 0.175 if unavailable)
```

**`calculatePlatformFee(amount: number)`** - Async
```typescript
// Calculates platform fee dynamically from database
const fee = await calculatePlatformFee(1000);
// Returns:
{
  grossAmount: 1000,
  feeAmount: 500,        // 50% of 1000
  netAmount: 500,        // Amount service provider receives
  feeRate: 0.5,
  feePercentage: 50
}
```

**`calculatePlatformFeeSync(amount: number, customRate?: number)`** - Sync
```typescript
// Synchronous calculation with optional custom rate
const fee = calculatePlatformFeeSync(1000, 0.5);
// Use only when async is not possible
```

**`formatPlatformFee(amount: number, currency: string)`** - Async
```typescript
// Formats platform fee for display
const formatted = await formatPlatformFee(1000, 'USD');
// Returns: "$500.00 (50%)"
```

### 3. Admin Panel Integration

#### Platform Settings Page
- **Location**: `/backoffice/platform-settings`
- **Access**: Admin/Superadmin only
- **Features**:
  - Real-time commission rate editing
  - Percentage display (0-100%)
  - Example calculations for preview
  - Validation (must be between 0% and 100%)
  - Save/Cancel functionality
  - Success notifications

#### Dashboard Display
- **Location**: `/backoffice/dashboard`
- **Features**:
  - Dynamically fetches current commission rate on load
  - Platform Revenue card shows: "From platform fees ({rate}%)"
  - Updates automatically when rate changes

### 4. API Endpoints

#### GET `/api/backoffice/platform-settings`
- **Authentication**: Required (Admin/Superadmin)
- **Returns**: All platform settings as object
```json
{
  "success": true,
  "settings": {
    "commission_rate": {
      "value": "0.5",
      "description": "Platform commission rate applied to transactions"
    }
  }
}
```

#### POST `/api/backoffice/platform-settings`
- **Authentication**: Required (Admin/Superadmin)
- **Body**: 
```json
{
  "commission_rate": 0.25  // 25%
}
```
- **Actions**:
  - Validates rate (0-1 range)
  - Fetches old value for audit
  - Updates database
  - Logs change to AdminAction table
  - Returns updated settings

### 5. Payment Flow Integration

#### Payment Processing (`/src/app/payment-summary/[conversationId]/page.tsx`)
```typescript
// Line 203 - Dynamically calculates fee from database
const feeCalculation = await calculatePlatformFee(agreedPrice);

// Creates transaction with metadata
await prisma.transaction.create({
  data: {
    // ... other fields
    metadata: JSON.stringify({
      grossAmount: feeCalculation.grossAmount,
      platformFee: feeCalculation.feeAmount,
      netAmount: feeCalculation.netAmount,
      feeRate: feeCalculation.feeRate
    })
  }
});

// Credits only net amount to service provider
await walletService.credit(
  delivery.receiverId,
  feeCalculation.netAmount,
  // ...
);
```

#### Transaction Metadata Structure
```json
{
  "grossAmount": 1000,
  "platformFee": 500,
  "netAmount": 500,
  "feeRate": 0.5
}
```

### 6. Revenue Tracking

#### Stats API (`/src/app/api/backoffice/stats/route.ts`)
- Fetches all "Delivery Income" transactions
- Extracts `platformFee` from transaction metadata
- Calculates total platform revenue
- No hardcoded rates - uses actual fees charged

## How Commission Rate Changes Work

### Step-by-Step Flow:

1. **Admin Changes Rate**
   - Admin navigates to `/backoffice/platform-settings`
   - Updates commission rate (e.g., from 50% to 20%)
   - Clicks "Save Changes"

2. **Database Update**
   - POST request to `/api/backoffice/platform-settings`
   - Old value fetched for audit: "0.5"
   - New value stored: "0.2"
   - AdminAction logged with details

3. **Immediate Effect on New Payments**
   - Next payment calculation calls `await calculatePlatformFee(amount)`
   - Function fetches "0.2" from database
   - Platform fee calculated as 20% of payment
   - Service provider receives 80% of payment

4. **Dashboard Updates**
   - Dashboard fetches current rate on load
   - Displays "From platform fees (20%)"
   - Revenue calculated from transaction metadata (actual fees)

5. **Historical Transactions**
   - Previous transactions unaffected
   - Metadata preserves actual fee charged at that time
   - Revenue reports accurate regardless of current rate

## Testing the System

### Test Scenario:
1. **Login as Admin**
   - Email: admin@bagami.com
   - Password: Admin@123456

2. **Check Current Rate**
   - Navigate to `/backoffice/dashboard`
   - Look at Platform Revenue card
   - Should show: "From platform fees (50%)"

3. **Change Commission Rate**
   - Navigate to `/backoffice/platform-settings`
   - Change rate to 20% (0.2)
   - Click "Save Changes"

4. **Verify Dashboard Update**
   - Return to `/backoffice/dashboard`
   - Refresh page
   - Should now show: "From platform fees (20%)"

5. **Create Test Payment**
   - Complete a delivery payment flow
   - Check transaction metadata
   - Should show `"feeRate": 0.2` and `"platformFee": 20%` of amount

6. **Check Revenue**
   - Platform revenue should include the new 20% fee
   - Historical payments still show their original fees

## Audit Trail

Every commission rate change is logged in the `AdminAction` table:

```sql
SELECT * FROM AdminAction WHERE action = 'UPDATE_SETTING';
```

Logs include:
- Admin user ID
- Timestamp
- Target type: 'platform_setting'
- Target ID: 'commission_rate'
- Details: `{"old_value": "0.5", "new_value": "0.2"}`

## Error Handling & Fallbacks

### Database Unavailable
- System falls back to default 17.5% rate
- Error logged to console
- Payment processing continues without interruption

### Invalid Rate
- API validates rate is between 0 and 1
- Returns 400 error if invalid
- No database changes made

### Authentication Failure
- Non-admin users cannot access settings
- 401/403 responses returned
- Settings remain unchanged

## Seeding Default Configuration

The seed script (`/prisma/seed.ts`) creates:
- Admin account with credentials above
- Platform commission rate setting (0.175 = 17.5%)

To reset to defaults:
```bash
npm run seed
```

## Key Files Reference

### Configuration
- `/src/config/platform.ts` - Core configuration functions
- `/prisma/schema.prisma` - PlatformSettings model definition

### Admin UI
- `/src/app/backoffice/platform-settings/page.tsx` - Settings editor
- `/src/app/backoffice/dashboard/page.tsx` - Dashboard with dynamic rate display

### API Routes
- `/src/app/api/backoffice/platform-settings/route.ts` - Settings CRUD
- `/src/app/api/backoffice/stats/route.ts` - Revenue calculations

### Payment Processing
- `/src/app/payment-summary/[conversationId]/page.tsx` - Payment flow with fee calculation

### Database
- `/prisma/seed.ts` - Database seeding
- `/prisma/migrations/20251109164217_add_platform_settings/` - Initial migration

## Best Practices

1. **Always use async functions** when calculating fees in payment flows
2. **Never hardcode rates** - always fetch from database
3. **Store actual fees in transaction metadata** - don't recalculate historical data
4. **Test rate changes** before deploying to production
5. **Monitor AdminAction logs** for audit compliance
6. **Document rate changes** for business records

## Current Status

✅ **Fully Functional**
- Admin can change commission rates
- Dashboard displays current rate dynamically
- All payments use database-driven rates
- Transaction metadata includes actual fees
- Revenue calculated from transaction data
- Audit logging captures all changes
- Fallback system ensures uptime

✅ **Verified Working**
- Commission rate: 50% (0.5)
- Admin account active
- All API endpoints functional
- Payment flow tested and working
- Dashboard showing dynamic rate

---

**Last Updated**: Current session
**Current Commission Rate**: 50%
**System Version**: Dynamic v1.0
