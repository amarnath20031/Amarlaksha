# Complete Domain Setup Guide for lakshacoach.com

## What This Does

When someone visits your old Replit link (like `yourapp.replit.app`), they will automatically be sent to `lakshacoach.com` instead. This happens instantly and invisibly to the user.

## Step-by-Step Setup Process

### Step 1: Prepare Your Domain
1. **Buy your domain**: You already have `lakshacoach.com` ✅
2. **Set up hosting**: Choose a platform like Vercel, Netlify, or Render
3. **Point your domain**: In your domain provider's settings, point lakshacoach.com to your hosting platform

### Step 2: Update Google Login Settings
Your app uses Google login, so Google needs to know about your new domain:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Find your project (the one you used for Google login)
3. Go to "APIs & Services" → "Credentials"
4. Click on your OAuth 2.0 Client ID
5. Add these to "Authorized redirect URIs":
   - `https://lakshacoach.com/api/auth/google/callback`
6. Add to "Authorized JavaScript origins":
   - `https://lakshacoach.com`
7. Save the changes

### Step 3: Deploy Your App
1. **Upload your code** to GitHub (if not done already)
2. **Connect to hosting platform** (like Vercel or Render)
3. **Set environment variables** in your hosting platform:
   ```
   NODE_ENV=production
   DOMAIN=lakshacoach.com
   DATABASE_URL=your_database_url
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   SESSION_SECRET=your_session_secret
   ```

### Step 4: Test the Setup
1. Visit your old Replit URL
2. You should automatically be redirected to lakshacoach.com
3. Try logging in with Google to make sure it works

## What Happens Behind the Scenes

### In Development (Testing)
- The redirect is turned OFF so you can still test on Replit
- Everything works normally for development

### In Production (Live Website)
- When someone visits the old Replit domain, the server checks the URL
- If it's a Replit domain, it automatically sends them to lakshacoach.com
- This is called a "301 redirect" which tells search engines the site moved permanently

## Code Changes Made

I've already made these changes to your code:

1. **Added redirect logic** in `server/index.ts`:
   - Checks if someone is visiting from an old Replit domain
   - Automatically redirects them to lakshacoach.com
   - Only works in production, not during development

2. **Updated OAuth settings** in `server/googleAuth.ts`:
   - Uses lakshacoach.com for production
   - Still uses development domain for testing

3. **Created environment file** `.env.production`:
   - Template for all the settings you need for production

## Next Steps for You

1. **Choose a hosting platform** (I recommend Vercel or Render)
2. **Update Google OAuth** with your new domain (Step 2 above)
3. **Deploy your app** to the hosting platform
4. **Test the redirect** by visiting your old Replit URL

## Common Questions

**Q: Will my existing users lose their data?**
A: No! The redirect happens before they even see the website, so they'll automatically go to the new domain with all their data intact.

**Q: What about search engines?**
A: The 301 redirect tells search engines that your site permanently moved, so they'll update their links to point to lakshacoach.com.

**Q: Can I still test on Replit during development?**
A: Yes! The redirect only works in production, so development continues to work normally.

**Q: How long does it take to work?**
A: The redirect works instantly once deployed. The Google OAuth update takes effect immediately after saving.