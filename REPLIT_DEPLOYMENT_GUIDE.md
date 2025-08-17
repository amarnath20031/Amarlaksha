# Deploy with Replit (Easiest Option)

## Why Replit is Perfect for This

- Your code is already here
- Built-in database support
- Custom domain support
- Automatic HTTPS
- No need to move your code anywhere

## Step-by-Step Deployment

### Step 1: Upgrade to Replit Core (Required for Custom Domains)
1. Click your profile in top-right corner
2. Go to "Account" → "Plans"
3. Upgrade to Replit Core ($7/month)
4. This includes custom domain support and better performance

### Step 2: Set Up Production Database
1. In your Repl, go to "Database" tab (left sidebar)
2. Your PostgreSQL database is already set up
3. The DATABASE_URL is already configured

### Step 3: Add Production Environment Variables
1. Go to "Secrets" tab (left sidebar) 
2. Add these secrets:
   ```
   NODE_ENV=production
   DOMAIN=lakshacoach.com
   SESSION_SECRET=your_secure_random_string
   ```
3. Your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET should already be there

### Step 4: Deploy Your Repl
1. Click the "Deploy" button (top of your Repl)
2. Choose "Static Deployment" or "Autoscale Deployment"
3. Your app will get a .replit.app URL first

### Step 5: Add Custom Domain
1. In deployment settings, find "Custom Domain"
2. Add `lakshacoach.com`
3. Replit will give you DNS instructions
4. Add the CNAME record to your domain provider
5. Wait for DNS to propagate (usually 5-10 minutes)

### Step 6: Update Domain Provider DNS
Go to where you bought lakshacoach.com and add:
- Type: CNAME
- Name: @ (or leave blank for root domain)  
- Value: your-app.replit.app (the URL Replit gives you)

## What Happens After Deployment

1. **lakshacoach.com loads your app**
2. **Old Replit dev URLs redirect to lakshacoach.com** (our redirect code kicks in)
3. **Google login works perfectly** (you already configured this)
4. **All existing users are automatically redirected**

## Benefits of Using Replit

- No code migration needed
- Database already configured
- Environment variables already set
- SSL certificate automatic
- Easy to manage and update

## Cost

- Replit Core: $7/month
- Includes custom domain support
- Much simpler than managing separate hosting + database

This is actually the easiest path since everything is already set up in your current Repl!