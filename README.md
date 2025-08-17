# Laksha - Indian Budget Tracking App

A smart budget tracking application designed specifically for Indian users. Track expenses in rupees, set smart budgets, and get real-time alerts when you're spending too much.

## Features

- **Smart Budget Alerts**: Get notified when you've used 80% of your budget for categories like food, transport, etc.
- **Voice Input**: Say "Spent 200 rupees on lunch" and we'll automatically categorize and save it
- **Receipt Capture**: Take photos of receipts to quickly add expenses
- **Indian Categories**: Pre-built categories for Indian lifestyle (Petrol, Mobile Recharge, etc.)
- **Secure Authentication**: Login with your Replit account
- **Data Persistence**: All data stored securely in PostgreSQL

## Tech Stack

- **Frontend**: React 18 with TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: OpenID Connect (Replit Auth)
- **Deployment**: Render.com with PostgreSQL database

## Environment Variables

For production deployment, set these environment variables:

```
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-session-secret
REPL_ID=your-replit-app-id
REPLIT_DOMAINS=your-domain.com
ISSUER_URL=https://replit.com/oidc
```

## Deployment

### Deploy to Render

1. Connect your GitHub repository to Render
2. Use the `render.yaml` configuration file for automatic setup
3. Set the required environment variables in Render dashboard
4. The app will automatically build and deploy

### Database Setup

The app requires a PostgreSQL database. On Render:
1. Create a PostgreSQL database
2. Copy the connection string to `DATABASE_URL` environment variable
3. The app will automatically run migrations on startup

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm start
```

## License

MIT