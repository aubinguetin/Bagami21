# Rating Reminder System - Implementation Guide

## Overview
The rating reminder system automatically sends notifications to users who need to rate their delivery partners after a delivery is confirmed. The system runs even when the app is not actively being used, thanks to Vercel Cron Jobs.

## Architecture

### 1. Automated Scheduling
**Vercel Cron Job** (`vercel.json`)
```json
{
  "crons": [
    {
      "path": "/api/cron/rating-reminders",
      "schedule": "*/30 * * * *"
    }
  ]
}
```
- Runs every 30 minutes automatically
- Works even when the app is closed
- Managed by Vercel's infrastructure

### 2. Reminder Intervals
The system sends reminders at these intervals after delivery confirmation:
- **3 hours** - First reminder
- **24 hours** (1 day) - Second reminder
- **48 hours** (2 days) - Third reminder
- **96 hours** (4 days) - Fourth reminder
- **168 hours** (7 days) - Final reminder

### 3. Smart Reminder Logic
**File:** `/src/services/ratingReminderService.ts`

The service:
1. ✅ Finds all delivered deliveries with confirmed status
2. ✅ Checks time elapsed since delivery confirmation
3. ✅ Verifies if sender has rated receiver (and vice versa)
4. ✅ Sends reminder if no review exists AND interval has passed
5. ✅ Prevents duplicate reminders by checking existing notifications
6. ✅ Automatically stops when user rates their partner

### 4. Automatic Cleanup
**File:** `/src/app/api/reviews/route.ts`

When a user submits a review:
```typescript
// Delete all rating reminder notifications for this reviewer
await prisma.notification.deleteMany({
  where: {
    userId: currentReviewerId,
    type: 'rating_reminder',
    relatedId: { in: [deliveryId, conversationId] },
  },
});
```
- ✅ Removes all pending rating reminders for that user
- ✅ Prevents future reminders from being sent
- ✅ Keeps notification list clean

## API Endpoints

### 1. Automated Cron Endpoint
**GET** `/api/cron/rating-reminders`
- Called automatically by Vercel every 30 minutes
- Protected with `CRON_SECRET` (optional)
- Returns: `{ success, remindersSent, timestamp }`

### 2. Manual Trigger Endpoint
**POST/GET** `/api/admin/trigger-rating-reminders`
- For testing or manual execution
- Can be called from admin panel or directly
- Same response format as cron endpoint

## Database Schema

### Notification Table
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // 'rating_reminder' for reminders
  title     String
  message   String
  relatedId String?  // conversationId or deliveryId
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
  // ... other fields
}
```

## How It Works - Step by Step

### Scenario: User completes a delivery

1. **Delivery Confirmed (T=0)**
   - Status changes to `DELIVERED`
   - `deliveryConfirmation` message created with timestamp
   - No reminders yet

2. **After 3 Hours (T=3h)**
   - Cron job runs
   - Checks: Has 3 hours passed? ✅
   - Checks: Has sender rated receiver? ❌
   - Action: Send 3h reminder to sender
   - Checks: Has receiver rated sender? ❌
   - Action: Send 3h reminder to receiver

3. **User Rates Partner (T=5h)**
   - User submits review via `/api/reviews`
   - All rating reminders for this user are deleted
   - No more reminders sent to this user for this delivery

4. **After 24 Hours (T=24h)**
   - Cron job runs
   - Checks: Has sender rated? ✅ (Skip sender)
   - Checks: Has receiver rated? ❌
   - Action: Send 24h reminder to receiver (only)

5. **Process Continues**
   - Reminders sent at 48h, 96h, 168h intervals
   - Only sent to users who haven't rated yet
   - Stops automatically when both users have rated

## Translation Support

Reminders are sent in the user's preferred language:

**English:**
```
⭐ Rate your delivery partner
It's been 3 hours since your delivery was completed. How was your experience with John? Share your feedback!
```

**French:**
```
⭐ Notez votre partenaire de livraison
Cela fait 3 heures que votre livraison a été complétée. Comment s'est passée votre expérience avec John ? Partagez votre avis !
```

## Configuration

### Environment Variables
```env
CRON_SECRET=your-secret-key  # Optional: Protects cron endpoint
```

### Vercel Setup
1. Push code to repository
2. Deploy to Vercel
3. Vercel automatically reads `vercel.json`
4. Cron job is configured automatically
5. Check Vercel Dashboard > Cron to verify

## Testing

### Manual Test
1. Visit: `/api/admin/trigger-rating-reminders`
2. Check response for `remindersSent` count
3. Check notification table for new reminders

### Test Checklist
- [ ] Complete a delivery
- [ ] Wait 3+ hours (or modify interval for testing)
- [ ] Trigger cron manually or wait for automatic run
- [ ] Verify notification created in database
- [ ] Verify notification appears in user's notifications page
- [ ] Submit a review
- [ ] Verify reminder notifications are deleted
- [ ] Verify no more reminders are sent to that user

## Monitoring

### Check Cron Execution
- Vercel Dashboard > Your Project > Cron
- View execution history and logs

### Check Database
```sql
-- See all rating reminders
SELECT * FROM "Notification" WHERE type = 'rating_reminder' ORDER BY "createdAt" DESC;

-- Count pending reminders per user
SELECT "userId", COUNT(*) as reminder_count
FROM "Notification"
WHERE type = 'rating_reminder' AND "isRead" = false
GROUP BY "userId";
```

### Check Service Logs
Look for these log patterns:
- `🔔 Checking for rating reminders...`
- `✅ Sent 3h reminder to sender...`
- `🗑️ Deleted N rating reminder notifications...`
- `🎉 Rating reminder check complete. Sent N reminders.`

## Troubleshooting

### Reminders Not Sending
1. Check Vercel Cron is enabled in dashboard
2. Verify `vercel.json` is in root directory
3. Check database for `DELIVERED` deliveries
4. Run manual trigger to see error logs

### Duplicate Reminders
- System checks for existing notifications before sending
- Uses `createdAt` timestamp to prevent duplicates
- If duplicates occur, check reminder logic in service

### Reminders After Rating
- Should be automatically deleted when review is submitted
- Check `/api/reviews` POST handler has cleanup code
- Verify `deleteMany` query is working

## Files Modified/Created

1. ✅ `/vercel.json` - Cron schedule configuration
2. ✅ `/src/services/ratingReminderService.ts` - Main reminder logic
3. ✅ `/src/app/api/cron/rating-reminders/route.ts` - Cron endpoint
4. ✅ `/src/app/api/reviews/route.ts` - Review submission + cleanup
5. ✅ `/src/app/api/admin/trigger-rating-reminders/route.ts` - Manual trigger
6. ✅ `/src/lib/notificationTranslations.ts` - Translation helper
7. ✅ This documentation file

## Future Enhancements

- [ ] Add admin panel to view reminder statistics
- [ ] Add email/SMS reminders (in addition to in-app)
- [ ] Add user preference to disable/customize reminder frequency
- [ ] Add analytics to track reminder effectiveness
- [ ] Add A/B testing for reminder timing optimization

## Summary

✅ **Automated**: Runs every 30 minutes via Vercel Cron
✅ **Smart**: Only sends to users who haven't rated
✅ **Clean**: Deletes reminders when user rates
✅ **Scalable**: Works even when app is closed
✅ **Bilingual**: Supports English and French
✅ **Tested**: Can be triggered manually for testing

The system is production-ready and requires no manual intervention once deployed to Vercel.
