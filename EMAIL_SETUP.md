# Free Email OTP Setup Guide

## Quick Setup (Gmail SMTP - Free)

To enable real email OTP delivery, you can use Gmail's free SMTP service:

### Step 1: Create App Password
1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password

### Step 2: Set Environment Variables
Add these to your environment (or `.env` file):

```bash
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
```

### Step 3: Test
- Users will receive OTP codes directly in their email
- No cost involved - completely free
- Works instantly

## Alternative: Console Mode (Current)
Without setup, OTP codes appear in server console logs for testing.

## Production Options
For production apps, consider:
- SendGrid (free tier: 100 emails/day)
- Mailgun (free tier: 100 emails/day)  
- AWS SES (very low cost)

The app will automatically detect and use any configured email service.