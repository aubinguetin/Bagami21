# Rating Reminder Cron Setup

This cron job checks for deliveries that need rating reminders and sends notifications at the following intervals:
- 3 hours after completion
- 24 hours after completion
- 48 hours after completion (2 days)
- 96 hours after completion (4 days)
- 168 hours after completion (7 days)

## Setup

### Option 1: Using Vercel Cron Jobs (Recommended for Production)

Add to your `vercel.json`:

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

This will run every hour.

### Option 2: Using External Cron Service

Use a service like:
- **cron-job.org**: Free, reliable cron service
- **EasyCron**: Simple cron job service
- **UptimeRobot**: Can be configured to call the endpoint

Set up to call:
```
GET https://your-domain.com/api/cron/rating-reminders
```

Every hour (recommended) or every 30 minutes for more precision.

### Option 3: System Cron (Development/Self-hosted)

Add to crontab (`crontab -e`):

```bash
# Run every hour at minute 0
0 * * * * curl https://your-domain.com/api/cron/rating-reminders

# Or for localhost development
0 * * * * curl http://localhost:3000/api/cron/rating-reminders
```

## Manual Testing

You can manually trigger the reminder check by visiting:
```
http://localhost:3000/api/cron/rating-reminders
```

Or using curl:
```bash
curl http://localhost:3000/api/cron/rating-reminders
```

## Security

The endpoint checks for an authorization header. Set `CRON_SECRET` in your environment variables:

```env
CRON_SECRET=your-secret-key-here
```

Then call the endpoint with:
```bash
curl -H "Authorization: Bearer your-secret-key-here" https://your-domain.com/api/cron/rating-reminders
```

## How It Works

1. Finds all completed deliveries with receivers
2. Calculates time since completion
3. For each reminder interval (3h, 24h, 48h, 96h, 168h):
   - Checks if we're within the 1-hour window of that interval
   - Checks if the user has already rated their partner
   - Checks if we've already sent this specific reminder
   - If all conditions pass, creates a notification
4. Both sender and receiver can receive reminders independently

## Notification Details

- **Type**: `rating_reminder`
- **Title**: `⭐ Rate your delivery partner`
- **Message**: `It's been {time} since your delivery was completed. How was your experience with {partner name}? Share your feedback!`
- **Related ID**: Conversation ID (links to chat page)
- **Click Action**: Opens chat page with the delivery partner

## Database Impact

The cron job:
- Reads completed deliveries
- Checks existing reviews
- Checks existing notifications
- Creates new notifications only when needed

Estimated queries per run: 
- ~10-50 queries depending on number of completed deliveries
- Very lightweight, runs in <1 second typically
