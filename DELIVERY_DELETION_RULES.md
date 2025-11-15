# Delivery Deletion Rules

## Overview
This document outlines the rules and implementation for delivery deletion in the Bagami platform.

## Deletion Rules

### Rule 1: No Payment Made ✅
**Condition:** No payment has been made for the delivery  
**Action:** User CAN delete the delivery  
**Reason:** Since no financial transaction has occurred, there are no obligations to fulfill

### Rule 2: Payment Made + Delivery Confirmed ✅
**Condition:** Payment has been made AND delivery has been confirmed  
**Action:** User CAN delete the delivery  
**Reason:** The transaction is complete - payment was made, goods were delivered, and both parties fulfilled their obligations

### Rule 3: Payment Made + Delivery NOT Confirmed ❌
**Condition:** Payment has been made BUT delivery has NOT been confirmed  
**Action:** User CANNOT delete the delivery  
**Reason:** There's an outstanding financial obligation. The user received payment but hasn't completed the delivery yet  
**Error Message:** "Cannot delete this delivery because payment has been made but the delivery has not been confirmed yet."

## Implementation Details

### Files Modified

#### 1. `/src/app/deliveries/edit-request/[id]/page.tsx`
- Added `canDelete` state (boolean)
- Added `deleteBlockReason` state (string)
- Added `checkDeletionEligibility()` function
- Modified `handleDelete()` to check deletion eligibility
- Updated delete button UI with disabled state
- Added warning banner when deletion is blocked

#### 2. `/src/app/deliveries/edit-offer/[id]/page.tsx`
- Same changes as edit-request page

### How It Works

1. **On Page Load:**
   - Delivery data is fetched
   - `checkDeletionEligibility()` is called
   - Function fetches all conversations for the current user via `/api/conversations`
   - Filters conversations to find ones related to this specific delivery
   - For each matching conversation, it checks messages for:
     - Payment messages (`messageType: 'payment'`)
     - Delivery confirmation messages (`messageType: 'deliveryConfirmation'`)

2. **Deletion Check Logic:**
   ```javascript
   if (!hasPayment) {
     // No payment - allow deletion
     setCanDelete(true);
   } else if (hasPayment && hasDeliveryConfirmation) {
     // Payment made and delivery confirmed - allow deletion
     setCanDelete(true);
   } else {
     // Payment made but not confirmed - block deletion
     setCanDelete(false);
     setDeleteBlockReason('...');
   }
   ```

3. **Console Logging for Debugging:**
   - Logs delivery ID being checked
   - Logs total conversations found
   - Logs conversations filtered for this delivery
   - Logs payment and confirmation status
   - Logs final decision with reason

4. **UI Feedback:**
   - Delete button is disabled when `canDelete = false`
   - Button appears grayed out with `cursor-not-allowed`
   - Tooltip shows reason when hovering over disabled button
   - Yellow warning banner appears above action buttons explaining why deletion is blocked

### User Experience

#### When Deletion is Allowed:
- Delete button appears in red with hover effect
- Clicking shows confirmation dialog
- After confirmation, delivery is soft-deleted (deletedAt timestamp set)
- Conversations and messages are preserved

#### When Deletion is Blocked:
- Delete button appears grayed out
- Yellow warning banner displays with emoji and explanation
- Hovering shows tooltip with full reason
- Clicking the button shows alert with explanation
- User must confirm delivery first to enable deletion

## Benefits

1. **Financial Protection:** Prevents users from deleting deliveries after receiving payment without completing delivery
2. **Transparency:** Clear messaging explains why deletion is blocked
3. **Flexibility:** Allows deletion once obligations are fulfilled
4. **Data Preservation:** Soft deletion ensures conversation history remains intact
5. **User Guidance:** Visual cues and messages help users understand next steps

## Edge Cases Handled

- **No Conversations:** If delivery has no conversations, deletion is allowed
- **API Errors:** If checking eligibility fails, deletion is **blocked** (fail-safe to protect payments)
- **Multiple Conversations:** Checks all conversations for payment/confirmation
- **Partial Data:** Handles cases where payment exists without confirmation
- **Invalid API Response:** Gracefully handles 401/500 errors from conversation API

## Testing Scenarios

1. ✅ Delete delivery with no conversations → Should succeed
2. ✅ Delete delivery with conversations but no payment → Should succeed
3. ❌ Delete delivery with payment but no confirmation → Should be blocked
4. ✅ Delete delivery with payment AND confirmation → Should succeed
5. ✅ Hover over disabled delete button → Should show tooltip
6. ✅ Click disabled delete button → Should show alert with reason

## Future Enhancements

- Add admin override to force delete if needed
- Log deletion attempts for audit purposes
- Add email notification when deletion is blocked
- Show estimated time until delivery can be deleted
- Add "Cancel Order" flow for unconfirmed deliveries with refund process
