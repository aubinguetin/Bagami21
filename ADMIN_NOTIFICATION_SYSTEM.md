# Admin Notification System

## Overview

The admin notification system allows administrators to send custom notifications to users, either to all users or to specific selected users. This is useful for announcements, updates, promotions, or important information.

## Features

### 1. **Notification Creation**
- ✅ **Title**: Up to 100 characters
- ✅ **Message**: Up to 500 characters  
- ✅ **Link (Optional)**: Internal routes or external URLs for user redirection
- ✅ **Recipient Selection**: Send to all users or specific users

### 2. **User Selection Interface**
Comprehensive user list with filtering capabilities:

**User Information Displayed:**
- Username
- Email & Phone
- Account Status (Active/Inactive)
- ID Verification Status (Approved/Pending/Rejected)
- Last Activity
- Joined Date
- Number of Transactions

**Filtering Options:**
- ✅ **Search**: By name, email, or phone number
- ✅ **Status Filter**: All, Active Only, Inactive Only
- ✅ **Verification Filter**: All, Verified Only, Pending Only, Rejected Only
- ✅ **Bulk Selection**: Select all filtered users or clear selection

### 3. **Notification Delivery**
- Notifications are stored in the database
- Users see them in their notification page
- Clicking redirects to the specified link (if provided)
- Supports both internal routes and external URLs

## File Structure

### Frontend
- **`/src/app/backoffice/notifications/page.tsx`** - Admin notification creation interface
- **`/src/app/backoffice/layout.tsx`** - Added "Notifications" to admin sidebar

### Backend APIs
- **`/src/app/api/backoffice/users/list/route.ts`** - Fetch all users with detailed information
- **`/src/app/api/backoffice/notifications/send/route.ts`** - Send notifications to users

### User Interface
- **`/src/app/notifications/page.tsx`** - Updated to handle `admin_notification` type

## Usage

### Accessing the Admin Panel

1. Navigate to `/backoffice/notifications`
2. Only admin users with active accounts can access

### Sending a Notification

#### Step 1: Enter Notification Details
```
Title: "Platform Update - New Features Available!"
Message: "We've just released exciting new features including real-time chat and enhanced search. Check them out now!"
Link (optional): "/deliveries" or "https://example.com/announcement"
```

#### Step 2: Choose Recipients

**Option A: Send to All Users**
- Select "Send to all users" radio button
- Notification will be sent to all active, non-admin users

**Option B: Send to Specific Users**
- Select "Send to specific users" radio button
- User selection panel appears

#### Step 3: Select Specific Users (if applicable)

1. **Search Users**: Type in search box to find users by name, email, or phone
2. **Apply Filters**:
   - Status: Active/Inactive
   - ID Verification: Approved/Pending/Rejected
3. **Select Users**:
   - Click individual checkboxes
   - Or use "Select All" to select all filtered users
4. **Review Selection**: Selected count shows in the recipient section

#### Step 4: Send
- Click "Send Notification"
- Success message appears with count of users notified
- Form resets for next notification

## Notification Types

### Internal Links
Redirect within the app:
```
/deliveries
/wallet
/profile
/settings
/reviews
```

### External Links  
Redirect to external websites:
```
https://example.com/blog
https://example.com/help
http://example.com/announcement
```

### No Link
If no link is provided, notification is informational only and doesn't redirect.

## User Experience

### Notification Display
Admin notifications appear in the user's notification page with:
- 📢 Custom title from admin
- 💬 Custom message from admin
- 🔗 Click action (if link provided)

### Notification Click Behavior
- **Internal link**: User is redirected within the app
- **External link**: New window/tab opens
- **No link**: Notification marks as read, no redirect

## Database Schema

### Notification Model
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // "admin_notification"
  title     String
  message   String
  relatedId String?  // Contains the link URL
  isRead    Boolean  @default(false)
  readAt    DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id])
}
```

### Admin Action Logging
All notification sends are logged:
```typescript
{
  action: 'notification_sent',
  targetType: 'Notification',
  details: {
    title: string,
    message: string,
    link: string | null,
    sendToAll: boolean,
    recipientCount: number,
    userIds: string[] | 'all_users'
  }
}
```

## Security

### Access Control
- ✅ Only users with `role: 'admin'` can access
- ✅ Only active admins can send notifications
- ✅ Session verification required
- ✅ Server-side authorization checks

### Input Validation
- ✅ Title required (max 100 chars)
- ✅ Message required (max 500 chars)
- ✅ Link optional (validated format)
- ✅ Recipient validation (at least 1 user)

### Protection Against Abuse
- Character limits prevent spam
- Excludes admins from "send to all" to avoid admin notification spam
- Only sends to active users

## API Endpoints

### GET /api/backoffice/users/list
Fetch all users with detailed information for selection.

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "01234567",
      "countryCode": "+226",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "idVerificationStatus": "approved",
      "transactionCount": 15,
      "lastActivityAt": "2025-11-09T12:00:00.000Z"
    }
  ],
  "count": 100
}
```

### POST /api/backoffice/notifications/send
Send notification to users.

**Request:**
```json
{
  "title": "Platform Update",
  "message": "New features available!",
  "link": "/deliveries",
  "sendToAll": false,
  "userIds": ["user_123", "user_456"]
}
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "message": "Notification sent successfully to 2 users"
}
```

## Examples

### Example 1: Platform Announcement
```
Title: 🎉 Welcome Bonus Available!
Message: New users get 1000 CFA bonus on their first delivery. Invite friends to earn more!
Link: /wallet
Recipients: All Users
```

### Example 2: Verification Reminder
```
Title: ⚠️ Complete Your ID Verification
Message: To access withdrawal features, please upload your ID documents for verification.
Link: /settings
Recipients: Specific Users (Filtered by: ID Verification = Pending)
```

### Example 3: Feature Update
```
Title: 📱 New Feature: Real-time Chat
Message: You can now chat with your delivery partners in real-time! Try it out on your active deliveries.
Link: /messages
Recipients: All Users
```

### Example 4: Promotional Campaign
```
Title: 🔥 Limited Time Offer!
Message: Get 20% off on all delivery fees this weekend. Book your deliveries now!
Link: /deliveries
Recipients: Specific Users (Filtered by: Status = Active, Transactions > 5)
```

## Best Practices

### Writing Effective Notifications

**DO:**
- ✅ Use clear, concise titles
- ✅ Include emoji for visual appeal
- ✅ Provide actionable information
- ✅ Include relevant links
- ✅ Target specific user segments when appropriate

**DON'T:**
- ❌ Send too frequently (avoid notification fatigue)
- ❌ Use all caps or excessive punctuation
- ❌ Send vague messages without context
- ❌ Forget to test links before sending

### Segmentation Strategies

**By Activity:**
- Active users: Engagement campaigns
- Inactive users: Re-engagement campaigns

**By Verification:**
- Unverified users: ID verification reminders
- Verified users: Premium feature announcements

**By Transaction History:**
- High-volume users: VIP benefits
- New users: Onboarding tips

## Troubleshooting

### No users appear in selection
- Check that users exist in database
- Verify filters aren't too restrictive
- Ensure users have `isActive: true`

### Notification not received
- Check user's notification page
- Verify user was included in selection
- Check admin action logs for confirmation

### Link not working
- Verify link format (internal: `/page`, external: `https://...`)
- Test link before sending
- Check for typos in URL

## Future Enhancements

Potential improvements:
- 📧 Email notifications in addition to in-app
- 📊 Analytics dashboard (open rates, click rates)
- ⏰ Schedule notifications for future delivery
- 📝 Notification templates for common messages
- 🎯 Advanced segmentation (by country, delivery type, etc.)
- 📱 Push notifications for mobile apps
- 🔔 Notification preferences for users
- 📈 A/B testing for notification effectiveness

## Support

For issues or questions:
1. Check admin action logs in `/backoffice/audit`
2. Verify database has Notification records
3. Check browser console for errors
4. Review API responses for error messages
