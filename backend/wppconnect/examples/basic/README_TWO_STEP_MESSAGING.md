# Two-Step WhatsApp Messaging System

## Overview
This system implements a two-step messaging process for sending event invitations via WhatsApp:

1. **Step 1**: Send an initial message asking the recipient to respond
2. **Step 2**: When they respond, automatically send the full event invitation with RSVP link

## How It Works

### Initial Message
When guests are added to the messaging queue, they receive a simple message in three languages (Arabic, Hebrew, English) asking them to respond to confirm their phone number is correct.

**Arabic:**
```
مرحباً! 😊

نود التأكد من أن هذا الرقم صحيح.
هل يمكنك الرد على هذه الرسالة بكلمة "نعم" أو "أهلاً"؟
```

**Hebrew:**
```
שלום! 😊

אנחנו רוצים לוודא שמספר הטלפון הזה נכון.
האם תוכל/י לענות להודעה זו עם "כן" או "היי"?
```

**English:**
```
Hello! 😊

We want to make sure this phone number is correct.
Can you reply to this message with "yes" or "hi"?
```

### Invitation Message
Once the recipient responds to the initial message, they automatically receive the full event invitation in all three languages with the RSVP link.

## Database Changes

The system tracks the messaging status using the `messaging_queue` table:
- `status = 'pending'`: Initial message sent, waiting for response
- `status = 'responded'`: Guest responded, invitation sent
- `status = 'sent'`: Message processed

## Files Modified

1. **`db.js`**: Added new database functions for the two-step process
2. **`index.js`**: Modified main WhatsApp bot logic
3. **`dashboardController.js`**: Updated to send initial messages instead of full invitations
4. **`policies.js`**: Created CommonJS version of policy texts

## New Database Functions

- `getEventDetails(eventId)`: Retrieves event information
- `markGuestAsResponded(phoneNumber, eventId)`: Marks guest as having responded
- `getGuestInfo(phoneNumber, eventId)`: Gets guest information

## Benefits

1. **Phone Number Verification**: Ensures the phone number is active and belongs to the intended recipient
2. **Better Engagement**: Recipients are more likely to read and act on messages they've actively responded to
3. **Multi-language Support**: All messages are sent in Arabic, Hebrew, and English
4. **Automated Process**: No manual intervention required after initial setup

## Usage

1. Add guests to the messaging queue via the dashboard
2. The system automatically sends initial messages
3. When guests respond, they automatically receive invitations
4. Monitor the process through the dashboard

## Error Handling

- Connection issues are logged and can trigger email notifications
- Invalid phone numbers are skipped
- Database errors are handled gracefully
- Fallback texts are provided if policy files can't be loaded 