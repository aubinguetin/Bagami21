# Quick Start - Rating Reminders

## ✅ IMMEDIATE FIX COMPLETE

**34 rating reminder notifications** have been sent to users for deliveries completed >3 hours ago.

## Run Rating Reminders Anytime

```bash
node send-rating-reminders-now.js
```

This will:
- Check all DELIVERED deliveries
- Send reminders for 3h, 24h, 48h, 96h, 168h intervals
- Skip users who already rated
- Prevent duplicate notifications

## Check What Will Be Sent (Preview)

```bash
node test-rating-reminders.js
```

Shows deliveries, completion times, and existing reminders.

## Set Up Automated Reminders

### Option A: cPanel or Linux Server

Add to crontab (run every hour):

```bash
crontab -e
```

Add this line:
```
0 * * * * cd /path/to/Bagami21 && node send-rating-reminders-now.js >> /var/log/rating-reminders.log 2>&1
```

### Option B: Vercel

Create `vercel.json` in project root:

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

Then deploy.

### Option C: External Service

Use **cron-job.org** or **EasyCron**:

1. Create account
2. Add cron job:
   - **URL:** `https://yourdomain.com/api/cron/rating-reminders`
   - **Interval:** Every hour
   - **Method:** GET

## Files

- `send-rating-reminders-now.js` - **RUN THIS** to send reminders
- `test-rating-reminders.js` - Check delivery status
- `RATING_REMINDERS_FIX.md` - Complete fix documentation
- `RATING_REMINDERS_SETUP.md` - Full setup guide

## Current Status

- ✅ Service implemented
- ✅ 34 reminders sent (Nov 10, 2025 21:44 UTC)
- ⚠️ Needs automated scheduling for future deliveries

## Next Step

**Set up automated cron job** (choose Option A, B, or C above) so future deliveries automatically get rating reminders.
