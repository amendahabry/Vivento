# How to Use Vivento

Vivento is a modern event management platform that helps you create and organize events with automated WhatsApp invitations, guest management, RSVP tracking, and shared photo albums. Perfect for weddings, birthday parties, gender reveals, and private gatherings.

## Quick Start

• **Sign up**: Fill out the contact form with your name, phone, and email
• **Create account**: Accept terms of service and privacy policy to get your login credentials via WhatsApp
• **Access dashboard**: Sign in with your username and password to manage your event
• **Set up event**: Fill in event details (name, date, time, location) and save
• **Add guests**: Upload Excel/CSV file, use Google Sheets link, or add guests manually
• **Send invitations**: Select guests and click **Send invites** to start the two-step WhatsApp invitation process
• **Track responses**: Monitor RSVPs and view statistics in real-time
• **Manage photos**: View and manage photos uploaded by guests in the **Event Photos** section

## Core Features

### Event Management
**What it is:** Create and customize your event with all essential details
**When to use:** Start here to set up your event before inviting guests
**How to use:**
1. Access **Event Details** section in your dashboard
2. Enter **Name**, **Date**, **Time**, and **Location** fields
3. Optionally add **Latitude** and **Longitude** coordinates for GPS navigation
4. Add event **Note** for special instructions
5. Click **Save** to update event information

### Guest List Management
**What it is:** Add guests through multiple methods and manage their information
**When to use:** After setting up event details, before sending invitations
**How to use:**
1. Navigate to **Upload Guest List** section
2. Choose one method:
   - **Excel/CSV Upload**: Click **Download CSV template**, fill with guest_name and phone_number columns, then upload
   - **Google Sheets**: Click **Open Google Sheet**, create sheet with headers, paste link in input field
   - **Manual Entry**: Click **Add Guest Manually**, fill **Guest Name** and **Phone Number** fields
3. Review guest list for accuracy
4. Use search function to find specific guests

### Two-Step WhatsApp Invitations
**What it is:** Automated invitation system that first confirms phone numbers, then sends full invitations
**When to use:** When ready to invite guests to your event
**How to use:**
1. Select guests by checking boxes next to their names
2. Click **Send invites** button
3. System sends initial confirmation message asking guests to reply with "yes" or "hi"
4. When guests respond, system automatically sends full invitation with RSVP link
5. Monitor status in guest list (pending/responded/sent)

### RSVP Tracking
**What it is:** Real-time tracking of guest responses and attendance statistics
**When to use:** After sending invitations to monitor responses
**How to use:**
1. Check **Statistics** section for overview: total guests, coming, not coming, RSVP rate
2. View **Guest Response List** for detailed responses with timestamps
3. Use search function to filter responses
4. Click **Export to Excel** to download response data

### Photo Gallery
**What it is:** Shared album where guests can upload event photos
**When to use:** During and after the event for photo collection
**How to use:**
1. Access **Event Photos** section in dashboard
2. View grid of all uploaded photos with guest names and dates
3. Click any photo to view full-size with details
4. Delete inappropriate photos if needed using **Delete Photo** button
5. Click **Refresh Photos** to update gallery
6. Share event link (viventoevents.com/event/[EVENT_ID]) with guests for photo uploads

### Invitation Image Customization
**What it is:** Custom invitation image that appears in WhatsApp messages
**When to use:** Before sending invitations to personalize messages
**How to use:**
1. Navigate to **Invitation Image** section
2. Click **Choose Image File** to select image (max 10MB, formats: JPEG, PNG, GIF, WebP)
3. Image uploads automatically to cloud storage
4. Replace existing image by uploading new one
5. Delete current image with **Delete Image** button

## Tips & Best Practices

• **Prepare guest list in advance** using the provided CSV template for faster bulk uploads
• **Test phone number formats** - use international format (e.g., +1234567890) for best delivery
• **Add GPS coordinates** to enable one-click navigation for guests via Google Maps and Waze
• **Upload invitation image** before sending invitations to make them more personal and engaging
• **Monitor two-step process** - guests must respond to initial message before receiving full invitation
• **Use search functions** to quickly find specific guests or responses in large lists
• **Export data regularly** to maintain backup copies of guest lists and responses
• **Check photo gallery frequently** during events to monitor uploads and remove inappropriate content
• **Share event link widely** so guests can easily access RSVP form and photo upload

## Troubleshooting & FAQs

**Can't sign in to dashboard**
*Cause:* Wrong credentials or account not created
*Solution:* Check username/password sent via WhatsApp, or re-submit contact form if no credentials received

**Guests not receiving WhatsApp invitations**
*Cause:* Incorrect phone format or WhatsApp connectivity issues
*Solution:* Verify phone numbers use international format (+country code), check guest list for typos

**Guest list upload failed**
*Cause:* Wrong file format or missing required columns
*Solution:* Use provided CSV template, ensure guest_name and phone_number columns are filled, save as CSV format

**Photos not loading in gallery**
*Cause:* Network issues or expired S3 links
*Solution:* Click **Refresh Photos** button, check internet connection, wait for automatic refresh

**RSVP link not working for guests**
*Cause:* Event URL malformed or database issues
*Solution:* Copy exact event URL (viventoevents.com/event/[EVENT_ID]), try incognito mode, contact support

**File upload rejected**
*Cause:* File too large or wrong format
*Solution:* Ensure images under 10MB, use JPEG/PNG/GIF/WebP formats only

**Statistics showing wrong numbers**
*Cause:* Multiple responses from same guest or calculation errors
*Solution:* Check **Guest Response List** for duplicates, latest response overrides previous ones

**Two-step invitation stuck on pending**
*Cause:* Guest hasn't responded to initial confirmation message
*Solution:* Ask guest to reply "yes" or "hi" to WhatsApp message, check spam/blocked numbers

**Excel export not working**
*Cause:* Browser blocking downloads or large dataset
*Solution:* Allow downloads in browser settings, try different browser, filter data before exporting

**Language display issues**
*Cause:* Browser not supporting RTL or mixed language content
*Solution:* Use modern browser with RTL support, system auto-detects language preference

## Privacy & Safety

Vivento stores your event data, guest information, and uploaded photos securely using industry-standard encryption. Guest phone numbers are used only for invitation purposes and are not shared with third parties. Photos are stored in AWS S3 with secure access controls. All WhatsApp communications are handled through verified business API. You can request data deletion by contacting support. Event data is retained for 12 months after event date unless requested otherwise.

## Contact/Support

**Email Support:** vivento.event@gmail.com
**WhatsApp Support:** +972505670930
**Web Application:** viventoevents.com

For technical issues, account problems, or feature requests, contact our support team. Response time is typically within 24 hours during business days. Include your event ID and detailed description of the issue for faster resolution. 