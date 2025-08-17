# Laksha - Personal Budget Tracking App Documentation

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Getting Started](#getting-started)
4. [User Guide](#user-guide)
5. [Technical Architecture](#technical-architecture)
6. [API Documentation](#api-documentation)
7. [Development Setup](#development-setup)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

## Overview

**Laksha** is a modern, mobile-first personal budget tracking application designed specifically for Indian users. The app helps users track expenses in Indian Rupees, set smart budgets, categorize spending, and receive real-time alerts when approaching budget limits.

### Key Benefits
- **Simple Expense Tracking**: Add expenses manually, via voice input, or by taking photos of receipts
- **Smart Budget Management**: Set monthly budgets with category-wise allocations
- **Real-time Alerts**: Get notified when you exceed 80% of your budget or daily spending limits
- **Indian-focused**: Pre-built categories for Indian lifestyle (Petrol, Mobile Recharge, Rent, etc.)
- **Progressive Web App**: Install on mobile home screen for native app experience

## Features

### 🎯 Core Features
- **Expense Tracking**
  - Manual expense entry with amount, category, and description
  - Voice-to-text input for quick expense logging
  - Receipt photo capture for record keeping
  - Automatic category detection from voice input

- **Budget Management**
  - Monthly budget setting with intelligent recommendations
  - Category-wise budget allocation
  - Adaptive daily spending limits
  - Budget progress tracking

- **Analytics & Insights**
  - Category-wise spending breakdown
  - Daily, weekly, and monthly spending trends
  - Budget vs actual spending comparison
  - Top spending categories visualization

- **Smart Notifications**
  - 80% budget threshold alerts
  - 100% budget exceeded warnings
  - Daily spending limit notifications
  - Real-time notification system

### 🏷️ Category Management
- **Default Indian Categories**: Food & Dining, Transport, Groceries, Entertainment, Health, Shopping, Petrol, Mobile Recharge, Rent
- **Custom Categories**: Add personalized categories like "WiFi Recharge", "Insurance", etc.
- **Visual Icons**: Each category has distinct icons and colors for easy identification

### 📱 Mobile Experience
- Mobile-first responsive design
- Progressive Web App (PWA) capabilities
- Offline functionality
- Home screen installation
- Touch-optimized interface

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for initial setup
- Mobile device recommended for best experience

### Quick Start
1. **Access the App**: Open Laksha in your web browser
2. **Sign In**: Use your email address for instant login
3. **Set Budget**: Configure your monthly budget and category allocations
4. **Add Expenses**: Start tracking your spending using manual entry, voice, or camera
5. **Monitor Progress**: Check your spending against budget limits

### First-Time Setup
1. **Email Authentication**: Enter your email for secure, password-free login
2. **Budget Configuration**: 
   - Enter your monthly income or preferred budget amount
   - Choose from intelligent budget recommendations (₹10,000 - ₹1,00,000)
   - Adjust category-wise allocations based on your spending patterns
3. **Category Customization**: Add custom categories specific to your needs

## User Guide

### Adding Expenses

#### Manual Entry
1. Tap the "+" floating action button on the home screen
2. Enter the expense amount in Indian Rupees
3. Select a category from the grid
4. Add optional description
5. Tap "Save" to record the expense

#### Voice Input
1. Tap the "Voice Note" button in the expense form
2. Speak your expense naturally: "500 on food" or "1500 for petrol"
3. The app automatically detects amount and category
4. Review and save the expense

#### Receipt Photo
1. Tap "Take Photo" in the expense form
2. Capture a clear photo of your receipt
3. Add amount and category manually
4. Save with photo attached for records

### Budget Management

#### Setting Monthly Budget
1. Navigate to Budget Settings from the home page
2. Enter your monthly budget amount
3. Use the slider to allocate percentages to each category
4. Save your budget configuration

#### Understanding Budget Alerts
- **Green**: Spending is under 80% of category budget
- **Orange**: Spending is between 80-100% of budget (warning)
- **Red**: Spending exceeds 100% of budget (critical)

### Custom Categories

#### Adding New Categories
1. In the expense form, tap the "+" button in the category grid
2. Enter a descriptive name (e.g., "WiFi Recharge", "Insurance")
3. Tap "Add Category" to save
4. The category becomes available for all future expenses

#### Managing Categories
- Custom categories appear with a purple tag icon
- Categories persist throughout your session
- Use consistent naming for better tracking

### Analytics & Reports

#### Category Breakdown
- View top 6 spending categories
- See percentage of budget used per category
- Compare actual vs budgeted amounts
- Identify overspending patterns

#### Daily Limits
- Adaptive daily spending limits based on remaining budget
- Real-time calculation: (Remaining Budget ÷ Days Left in Month)
- Daily limit notifications when exceeded

## Technical Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Simple email-based authentication
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Build System**: Vite for frontend, esbuild for backend

### Database Schema

#### Users Table
```sql
- id: varchar (primary key)
- email: varchar (unique)
- firstName: varchar
- lastName: varchar
- profileImageUrl: varchar
- createdAt: timestamp
- updatedAt: timestamp
```

#### Budgets Table
```sql
- id: serial (primary key)
- userId: varchar (foreign key)
- type: text ('monthly')
- amount: decimal
- categoryBudgets: jsonb
- createdAt: timestamp
- updatedAt: timestamp
```

#### Expenses Table
```sql
- id: serial (primary key)
- userId: varchar (foreign key)
- amount: decimal
- category: text
- description: text
- method: text ('manual', 'voice', 'receipt')
- receiptUrl: text
- voiceNote: text
- date: timestamp
- createdAt: timestamp
```

### Security Features
- Session-based authentication
- CSRF protection
- Input validation and sanitization
- Secure cookie configuration
- Environment variable protection

## API Documentation

### Authentication Endpoints

#### GET /api/auth/user
Returns current authenticated user information.

**Response:**
```json
{
  "id": "user123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Budget Endpoints

#### GET /api/budget
Get user's current budget configuration.

#### POST /api/budget
Create or update user's budget.

**Request Body:**
```json
{
  "type": "monthly",
  "amount": "25000",
  "categoryBudgets": "{\"Food & Dining\":5000,\"Transport\":3000}"
}
```

### Expense Endpoints

#### GET /api/expenses
Get user's expenses with optional limit.

**Query Parameters:**
- `limit`: Number of expenses to return

#### POST /api/expenses
Create a new expense.

**Request Body:**
```json
{
  "amount": "500",
  "category": "Food & Dining",
  "description": "Lunch at restaurant",
  "method": "manual",
  "date": "2025-07-16T12:00:00.000Z"
}
```

### Analytics Endpoints

#### GET /api/analytics/spending
Get spending analytics including total spent and category breakdown.

#### GET /api/analytics/daily-limit
Get adaptive daily spending limit based on remaining budget.

## Development Setup

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database
- Git

### Installation Steps

1. **Clone the Repository**
```bash
git clone <repository-url>
cd laksha
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Setup**
Create `.env` file with:
```
DATABASE_URL=postgresql://username:password@localhost:5432/laksha
SESSION_SECRET=your-secret-key
NODE_ENV=development
```

4. **Database Setup**
```bash
npm run db:push
```

5. **Start Development Server**
```bash
npm run dev
```

### Development Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run db:push`: Push schema changes to database
- `npm run db:generate`: Generate database migrations

## Deployment

### Production Build
```bash
npm run build
```

### Environment Variables (Production)
```
DATABASE_URL=your-production-database-url
SESSION_SECRET=secure-session-secret
NODE_ENV=production
```

### Deployment Platforms
- **Render.com**: Recommended platform with automatic PostgreSQL provisioning
- **Vercel**: Frontend deployment with serverless functions
- **Railway**: Full-stack deployment with database

## Troubleshooting

### Common Issues

#### Budget Not Saving
- **Symptom**: Budget settings don't persist after saving
- **Solution**: Check authentication status and database connection
- **Prevention**: Ensure user is logged in before setting budget

#### Expenses Not Appearing
- **Symptom**: Added expenses don't show in the list
- **Solution**: Refresh the page or check network connection
- **Prevention**: Verify database write permissions

#### Voice Input Not Working
- **Symptom**: Voice recognition fails to capture input
- **Solution**: Check microphone permissions in browser
- **Prevention**: Use HTTPS connection for voice API access

#### Custom Categories Missing
- **Symptom**: Custom categories disappear after page refresh
- **Solution**: Currently session-based; will persist in future updates
- **Prevention**: Re-add categories as needed

### Performance Optimization
- Clear browser cache regularly
- Use latest browser version
- Enable hardware acceleration
- Ensure stable internet connection

### Getting Help
- Check console logs in browser developer tools
- Verify all required environment variables are set
- Review database connection status
- Contact support with specific error messages

---

## Changelog

### Version 1.0 (Current)
- Initial release with core expense tracking
- Monthly budget management
- Real-time notifications
- Voice input support
- Receipt photo capture
- Custom category creation
- Indian Rupee currency support
- Mobile-first PWA design

### Upcoming Features
- Data export functionality
- Advanced analytics and charts
- Recurring expense management
- Multi-currency support
- Family budget sharing
- Bank account integration

---

**Laksha** - Simplifying personal finance management for Indian users.