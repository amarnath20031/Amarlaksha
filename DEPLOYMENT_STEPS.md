# Next Steps: Deploy to Production

Now that Google OAuth is configured for lakshacoach.com, you need to deploy your app to make the domain redirection work.

## Deployment Options (Choose One)

### Option 1: Vercel (Recommended - Free)
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Connect your repository
4. Add environment variables (see below)
5. Deploy with custom domain

### Option 2: Netlify (Alternative - Free)
1. Go to [netlify.com](https://netlify.com)
2. Sign up and connect GitHub
3. Deploy your repository
4. Add environment variables
5. Configure custom domain

### Option 3: Render (Paid but more powerful)
1. Go to [render.com](https://render.com)
2. Create PostgreSQL database first
3. Deploy web service
4. Configure custom domain

## Required Environment Variables

When deploying, you MUST set these environment variables:

```
NODE_ENV=production
DOMAIN=lakshacoach.com
DATABASE_URL=your_database_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=generate_random_32_character_string
```

## Domain Configuration

After deployment:
1. **Point your domain**: In your domain provider (where you bought lakshacoach.com), add these DNS records:
   - Type: CNAME
   - Name: www
   - Value: your-deployment-url (e.g., yourapp.vercel.app)
   
2. **Root domain**: Add an A record or ALIAS record pointing to your hosting provider

## Testing the Complete Setup

Once deployed:
1. Visit your old Replit URL → should redirect to lakshacoach.com
2. Visit lakshacoach.com directly → should load your app
3. Try Google login → should work with your updated OAuth settings

## Current Status

✅ Google OAuth configured for lakshacoach.com
✅ Code has automatic redirect functionality
⏳ Need to deploy to production
⏳ Need to configure DNS for lakshacoach.com

Would you like me to help you with any specific deployment platform?