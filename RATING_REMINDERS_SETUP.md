# Rating Reminder System - Setup Guide

## Overview

The rating reminder system automatically sends notifications to users after their deliveries are completed, reminding them to rate their delivery partner at the following intervals:

- **3 hours** after completion
- **24 hours** after completion (1 day)
- **48 hours** after completion (2 days)
- **96 hours** after completion (4 days)
- **168 hours** after completion (7 days)

## How It Works

1. **Service**: `/src/services/ratingReminderService.ts`
   - Queries for `DELIVERED` status deliveries with receivers
   - Gets completion time from the `deliveryConfirmation` message timestamp
   - Checks if enough time has passed for each reminder interval
   - Only sends reminders if the user hasn't rated yet
   - Prevents duplicate reminders by checking for existing notifications

2. **API Endpoint**: `GET /api/cron/rating-reminders`
   - Accepts optional Bearer token authentication via `CRON_SECRET` env variable
   - Calls `checkAndSendRatingReminders()` from the service
   - Returns JSON with `{ success, remindersSent, timestamp }`

3. **Notification**: Type `rating_reminder`
   - Stored in the database with `userId`, `type`, `message`, `relatedId` (conversation ID)
   - Users receive push notifications (if implemented) and see them in the app

## Setup Options

### Option 1: Manual Testing (Development)

Run the manual script whenever you want to send pending reminders:

```bash
node manual-rating-reminders.js
```

This will:
- Call the rating reminders endpoint
- Process all eligible deliveries
- Send any missed reminders
- Display how many reminders were sent

### Option 2: Vercel Cron Jobs (Production - Recommended)

If hosting on Vercel, add a `vercel.json` file:

```json
{
  "crons": [
    {
      "path": "/api/cron/rating-reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs the job every hour. Vercel automatically adds the authentication header.

### Option 3: External Cron Service (Production)

Use a service like **cron-job.org**, **EasyCron**, or **Uptime Robot**:

1. **Get your CRON_SECRET** from `.env`:
   ```
   CRON_SECRET=your-secret-key-here
   ```

2. **Set up the cron job**:
   - **URL**: `https://yourdomain.com/api/cron/rating-reminders`
   - **Method**: GET
   - **Schedule**: Every 1 hour (recommended: `0 * * * *`)
   - **Header**: `Authorization: Bearer your-secret-key-here`

3. **Recommended Schedule**:
   - **Every hour**: Ensures timely delivery of 3-hour reminders
   - **Every 6 hours**: Good balance for most use cases
   - **Every day**: Minimum frequency (will miss 3-hour window)

### Option 4: Node-Cron (Self-Hosted)

If self-hosting, add a scheduled task:

1. Install `node-cron`:
   ```bash
   npm install node-cron
   ```

2. Create `/src/lib/cron.ts`:
   ```typescript
   import cron from 'node-cron';
   import { checkAndSendRatingReminders } from '@/services/ratingReminderService';

   export function startCronJobs() {
     // Run every hour
     cron.schedule('0 * * * *', async () => {
       console.log('🔄 Running rating reminder cron job...');
       await checkAndSendRatingReminders();
     });

     console.log('✅ Cron jobs started');
   }
   ```

3. Call in your server startup (e.g., `server.ts` or custom server):
   ```typescript
   import { startCronJobs } from './src/lib/cron';
   startCronJobs();
   ```

## Environment Variables

Add to your `.env` file:

```env
# Cron job authentication (use a strong random string in production)
CRON_SECRET=your-very-secret-key-change-in-production
```

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Testing

### 1. Check for Eligible Deliveries

```bash
node test-rating-reminders.js
```

This shows:
- All DELIVERED deliveries
- Completion times
- Hours since completion
- Existing reviews
- Existing rating reminders

### 2. Manually Trigger Rating Reminders

```bash
# Make sure dev server is running
npm run dev

# In another terminal
node manual-rating-reminders.js
```

### 3. Test the Endpoint Directly

```bash
curl http://localhost:3002/api/cron/rating-reminders
```

Expected response:
```json
{
  "success": true,
  "remindersSent": 5,
  "timestamp": "2025-11-10T22:00:00.000Z"
}
```

### 4. Verify Notifications Were Created

```bash
npx prisma studio
```

Navigate to the `Notification` table and filter by:
- `type` = `rating_reminder`
- `createdAt` = recent timestamp

## Monitoring

### Server Logs

The service outputs detailed logs:

```
🔔 Checking for rating reminders...
⏰ Current time: 2025-11-10T22:00:00.000Z
📦 Found 12 completed deliveries

📦 Checking delivery cmhryaevr0009vmz177e78phx:
   Completed at: 2025-11-09T17:08:03.682Z
   Hours since completion: 28.87
   ✓ 3h threshold passed
   ✓ 24h threshold passed
   → Sender hasn't rated yet, checking for existing reminder...
   → No existing 3h reminder for sender, sending now...
✅ Sent 3h reminder to sender cmhry95890005vmz16t1tpcvh
...
🎉 Rating reminder check complete. Sent 15 reminders.
```

### Check Notification Count

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function count() {
  const count = await prisma.notification.count({
    where: { type: 'rating_reminder' }
  });
  console.log('Total rating reminders sent:', count);
}

count().finally(() => prisma.\$disconnect());
"
```

## Troubleshooting

### No reminders are being sent

1. **Check if deliveries have confirmation messages**:
   ```bash
   node test-rating-reminders.js
   ```

2. **Check if cron job is running**:
   - For Vercel: Check Vercel dashboard > Functions > Cron
   - For external service: Check cron service logs
   - For self-hosted: Check server logs

3. **Manually trigger to test**:
   ```bash
   node manual-rating-reminders.js
   ```

### Duplicate reminders

- The service checks for existing notifications before sending
- Each reminder is identified by: userId + type + relatedId + message content (hours)
- If duplicates still occur, check the notification table for the exact query being used

### Reminders sent to wrong users

- Sender receives reminder to rate receiver
- Receiver receives reminder to rate sender
- Check that `senderId` and `receiverId` are correct in the `Delivery` table

### Time intervals not working correctly

- Completion time is taken from `deliveryConfirmation` message `createdAt`
- NOT from `Delivery.updatedAt`
- Verify the message exists: `messageType = 'deliveryConfirmation'`

## Current Status (As of Setup)

- ✅ Service implemented: `/src/services/ratingReminderService.ts`
- ✅ API endpoint created: `/api/cron/rating-reminders`
- ✅ Testing script available: `test-rating-reminders.js`
- ✅ Manual trigger available: `manual-rating-reminders.js`
- ⚠️ **Cron job NOT configured** - Choose one of the setup options above

## Next Steps

1. **Immediate**: Run `manual-rating-reminders.js` to send pending reminders for existing deliveries
2. **Production**: Set up automated cron job using one of the options above
3. **Monitor**: Check logs and notification count regularly

## Files Reference

- Service: `/src/services/ratingReminderService.ts`
- API endpoint: `/src/app/api/cron/rating-reminders/route.ts`
- Test script: `/test-rating-reminders.js`
- Manual trigger: `/manual-rating-reminders.js`
- This guide: `/RATING_REMINDERS_SETUP.md`
