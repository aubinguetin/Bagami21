# Admin Email Notification System

## Overview
Automated email notifications are sent to `guetinp@gmail.com` whenever important admin actions occur in the Bagami platform. All emails are sent in **English only** using the configured Gmail SMTP service.

---

## ✅ Implemented Notification Types

### 1. **🆔 ID Verification Submissions**
**Trigger**: When a user uploads ID documents (National ID or Passport)

**Email Content**:
- User details (name, email, phone, user ID)
- Document type (National ID Card / Passport)
- Submission timestamp (Cameroon timezone)
- Direct link to view uploaded document
- Action reminder to review in admin panel

**API Route**: `/src/app/api/id-documents/route.ts` (POST)

**Template Method**: `sendIdVerificationNotification()`

---

### 2. **📬 Contact Form Submissions**
**Trigger**: When a user (authenticated or guest) submits a contact message

**Email Content**:
- Sender details (name, email, account status)
- User ID (if authenticated user)
- Message subject
- Full message text
- Submission timestamp (Cameroon timezone)
- Badge indicating registered user vs guest visitor

**API Route**: `/src/app/api/contact/route.ts` (POST)

**Template Method**: `sendContactFormNotification()`

---

### 3. **💰 Withdrawal Requests**
**Trigger**: When a user requests to withdraw funds from their wallet

**Email Content**:
- User details (name, email, phone, user ID)
- Withdrawal amount (with currency: XOF)
- Mobile money recipient number
- Transaction ID / Reference
- User's current wallet balance
- Request timestamp (Cameroon timezone)
- Urgent action required notice

**API Route**: `/src/app/api/wallet/withdraw/route.ts` (POST)

**Template Method**: `sendWithdrawalNotification()`

---

## 🛠️ Technical Implementation

### Email Service Location
**File**: `/src/lib/email.ts`

**Class**: `EmailService`

**Key Features**:
- Gmail SMTP integration
- Professional HTML email templates with gradients, icons, and responsive design
- Non-blocking async sending (errors logged, doesn't block user requests)
- Timezone-aware timestamps (Africa/Douala)
- Singleton pattern (`emailService` export)

### Environment Variables
Located in `.env.local`:

```bash
# Gmail SMTP Configuration
GMAIL_USER=baggami.services@gmail.com
GMAIL_APP_PASSWORD=ilus leil asiw tseg

# Admin Notification Email
ADMIN_EMAIL=guetinp@gmail.com
```

### Email Design Features
- **Beautiful Gradients**: Custom color schemes per notification type
  - ID Verification: Blue gradient (#3b82f6 → #1d4ed8)
  - Contact Form: Purple gradient (#8b5cf6 → #6d28d9)
  - Withdrawal: Green gradient (#10b981 → #059669)
- **Icons**: Large emoji icons for visual clarity (🆔, 📬, 💰)
- **Responsive**: Mobile-friendly with media queries
- **Information Cards**: Color-coded sections with borders
- **Action Alerts**: Highlighted call-to-action boxes
- **Clean Typography**: Modern font stack with proper hierarchy

---

## 📧 Email Template Structure

All emails follow this consistent structure:

1. **Header** (Gradient background)
   - Large icon
   - Title
   - Subtitle/status

2. **Main Content** (White background)
   - Intro paragraph
   - User/sender details (gray card)
   - Specific information (colored info boxes)
   - Full message/transaction details

3. **Action Required** (Highlighted alert)
   - Instructions for admin action
   - Link to admin panel (implicit)

4. **Footer** (Light gray)
   - Automated notification disclaimer
   - Copyright notice

---

## 🎨 Email Color Coding

| Notification Type | Primary Color | Gradient | Icon |
|------------------|---------------|----------|------|
| ID Verification | Blue (#3b82f6) | Blue → Dark Blue | 🆔 |
| Contact Form | Purple (#8b5cf6) | Purple → Dark Purple | 📬 |
| Withdrawal | Green (#10b981) | Green → Dark Green | 💰 |

---

## ⚙️ Integration Points

### 1. ID Documents API
```typescript
import { emailService } from '@/lib/email';

// After successful document upload
emailService.sendIdVerificationNotification({
  userId: string,
  name: string,
  email: string,
  phone: string,
  documentType: 'National ID Card' | 'Passport',
  documentUrl: string,
  submittedAt: string
}).catch(error => {
  console.error('Failed to send ID verification notification:', error);
});
```

### 2. Contact Form API
```typescript
import { emailService } from '@/lib/email';

// After contact message creation
emailService.sendContactFormNotification({
  userId?: string,
  senderName: string,
  senderEmail: string,
  subject: string,
  message: string,
  submittedAt: string,
  isAuthenticated: boolean
}).catch(error => {
  console.error('Failed to send contact form notification:', error);
});
```

### 3. Withdrawal API
```typescript
import { emailService } from '@/lib/email';

// After withdrawal transaction creation
emailService.sendWithdrawalNotification({
  userId: string,
  userName: string,
  userEmail: string,
  userPhone: string,
  amount: number,
  currency: string,
  phoneNumber: string,
  transactionId: string,
  submittedAt: string,
  currentBalance: number
}).catch(error => {
  console.error('Failed to send withdrawal notification:', error);
});
```

---

## 📝 Implementation Notes

### Non-Blocking Design
All email notifications use `.catch()` to handle errors without blocking the main API response. If email sending fails:
- Error is logged to console
- User request proceeds normally
- No impact on user experience

### Timezone Handling
All timestamps use:
```typescript
new Date().toLocaleString('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Africa/Douala',
})
```
**Example Output**: `Jan 13, 2025, 3:45 PM`

### Error Handling
- SMTP connection failures are logged but don't affect user operations
- Missing user data (null email/name) are handled gracefully
- Fallback to default values where appropriate

---

## 🔄 Testing Email Notifications

### Local Testing
1. Ensure `.env.local` contains valid Gmail credentials
2. Trigger one of the three events:
   - Upload ID document via `/verification` page
   - Submit contact form via `/contact` page
   - Request withdrawal via `/wallet` page
3. Check `guetinp@gmail.com` inbox for email
4. Verify console logs for send confirmation

### Email Test Command
```typescript
import { emailService } from '@/lib/email';

// Test SMTP connection
await emailService.testConnection();
```

---

## 📊 Email Delivery Status

Emails are sent via Gmail SMTP with:
- **Service**: Gmail (smtp.gmail.com)
- **Port**: 587 (TLS)
- **Auth**: App-specific password
- **From**: `"Bagami Notifications" <baggami.services@gmail.com>`
- **To**: `guetinp@gmail.com`

### Success Indicators
Console logs show:
```
✅ ID verification admin notification sent: <messageId>
✅ Contact form admin notification sent: <messageId>
✅ Withdrawal admin notification sent: <messageId>
```

### Failure Indicators
Console logs show:
```
❌ Failed to send [notification type] email: <error>
```

---

## 🚀 Future Enhancements

Potential improvements (not yet implemented):

1. **Email Preferences**
   - Admin panel toggle for each notification type
   - Multiple admin recipients
   - Email digest mode (daily summary)

2. **Additional Notifications**
   - New user registrations
   - Failed payment attempts
   - Account suspensions
   - Delivery disputes
   - Review flagging

3. **SMS Notifications**
   - Critical alerts via Aqilas SMS
   - Dual notification (email + SMS)

4. **Notification Dashboard**
   - Admin panel section showing notification history
   - Delivery status tracking
   - Failed email retry mechanism

5. **Template Customization**
   - Admin-editable email templates
   - Multi-language support (French)
   - Branding customization

---

## 📖 Related Documentation

- **Email Service**: `/src/lib/email.ts`
- **ID Documents API**: `/src/app/api/id-documents/route.ts`
- **Contact API**: `/src/app/api/contact/route.ts`
- **Withdrawal API**: `/src/app/api/wallet/withdraw/route.ts`
- **Contact Feature**: `ADMIN_NOTIFICATION_SYSTEM.md`
- **Environment Variables**: `.env.local`

---

## ✅ Verification Checklist

- [x] Email service class created with 3 notification methods
- [x] Professional HTML templates with responsive design
- [x] Integration in ID documents upload API
- [x] Integration in contact form submission API
- [x] Integration in withdrawal request API
- [x] Non-blocking async email sending
- [x] Environment variable configuration
- [x] Cameroon timezone support
- [x] Error logging and handling
- [x] Gmail SMTP configuration verified
- [x] Admin email recipient configured

---

**Last Updated**: January 13, 2025  
**Status**: ✅ Fully Implemented  
**Admin Email**: guetinp@gmail.com  
**Language**: English Only
