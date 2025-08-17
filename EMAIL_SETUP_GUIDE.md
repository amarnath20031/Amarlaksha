# Professional Email Setup Guide for Laksha

This guide helps you set up a professional email system for sending budget notifications to users.

## Option 1: Quick Setup with SendGrid (Recommended)

### Step 1: Create SendGrid Account
1. Visit [SendGrid.com](https://sendgrid.com) and create a free account
2. You get 100 free emails per day (sufficient for most apps)
3. Verify your email address during signup

### Step 2: Get API Key
1. Go to Settings > API Keys in SendGrid dashboard
2. Click "Create API Key"
3. Choose "Restricted Access" and enable:
   - Mail Send: Full Access
   - Template Engine: Read Access (optional)
4. Copy the API key (you'll only see it once)

### Step 3: Add API Key to Replit Secrets
1. In your Replit project, click the lock icon in the sidebar
2. Add a new secret:
   - Name: `SENDGRID_API_KEY`
   - Value: (paste your SendGrid API key)

### Step 4: Domain Setup (Optional but Professional)
1. In SendGrid, go to Settings > Sender Authentication
2. Add your domain (e.g., `laksha.app` or `yourdomain.com`)
3. Follow DNS verification steps
4. Update the email service to use your domain: `noreply@yourdomain.com`

## Option 2: Professional Domain Email

### Using Your Own Domain
If you have a domain for your app (e.g., `laksha.app`):

1. **Register Domain**: Use services like Namecheap, GoDaddy, or Cloudflare
2. **Email Hosting**: Use Google Workspace, Microsoft 365, or Zoho Mail
3. **SMTP Setup**: Configure SMTP credentials in your app

### Domain Suggestions for Laksha:
- `laksha.app` (premium but professional)
- `lakshabudget.com`
- `budgetlaksha.com`
- `mylaksha.app`

## Current Email Templates

Your app will send these professional email notifications:

### 📊 50% Budget Alert
- **Subject**: "📊 50% Monthly Budget Used - Laksha Budget Alert"
- **When**: User spends 50% of monthly budget
- **Purpose**: Friendly checkpoint reminder

### ⚠️ 80% Budget Alert  
- **Subject**: "⚠️ 80% Monthly Budget Used - Laksha Budget Alert"
- **When**: User spends 80% of monthly budget
- **Purpose**: Warning to slow down spending

### 🚨 Budget Exceeded
- **Subject**: "🚨 Monthly Budget Exceeded - Laksha Budget Alert"
- **When**: User exceeds monthly budget
- **Purpose**: Alert about overspending

### 🚨 Daily Limit Exceeded
- **Subject**: "🚨 Daily Spending Limit Exceeded - Laksha Budget Alert"  
- **When**: User exceeds adaptive daily limit
- **Purpose**: Daily spending control

## Testing Email System

1. Add the SendGrid API key to secrets
2. Create a test expense that triggers a threshold
3. Check your email for the notification
4. Monitor console logs for email sending status

## Email Deliverability Tips

1. **Use Professional From Address**: `noreply@yourdomain.com`
2. **Verify Domain**: Complete SendGrid domain authentication
3. **Monitor Reputation**: Check SendGrid analytics
4. **Unsubscribe Link**: Add to all emails (required by law)
5. **SPF/DKIM Setup**: Follow SendGrid's authentication guide

## Cost Estimation

- **SendGrid Free**: 100 emails/day = 3,000/month (FREE)
- **SendGrid Essentials**: $15/month = 50,000 emails
- **Domain**: $10-15/year
- **Email Hosting**: $6-12/month per user

## Implementation Status

✅ Email service implemented (`server/email-service.ts`)
✅ Budget alert triggers added to expense creation
✅ Professional email templates with Indian currency formatting
✅ Threshold-based notifications (50%, 80%, 100%, daily limit)
✅ Prevention of duplicate alerts

## Next Steps

1. Add `SENDGRID_API_KEY` to your Replit secrets
2. Test with a small expense to trigger notifications
3. Consider purchasing a professional domain
4. Monitor email delivery rates in SendGrid dashboard

Your users will now receive beautiful, professional budget alerts via email!