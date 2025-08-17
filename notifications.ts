import { storage } from "./storage";
import webpush from "web-push";

// Configure web push (you'll need to set these environment variables)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@lakshacoach.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

export async function sendPushNotification(
  userEmail: string,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    const settings = await storage.getNotificationSettings(userEmail);
    
    if (!settings?.pushToken) {
      console.log(`No push token found for user ${userEmail}`);
      return false;
    }
    
    const subscription = JSON.parse(settings.pushToken);
    
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-192x192.png',
      tag: payload.tag,
      data: payload.data
    });
    
    await webpush.sendNotification(subscription, notificationPayload);
    
    // Log the notification
    await storage.createNotificationLog({
      userEmail,
      notificationType: payload.tag || 'general',
      title: payload.title,
      message: payload.body,
      status: 'sent',
      sentAt: new Date()
    });
    
    console.log(`✅ Push notification sent to ${userEmail}: ${payload.title}`);
    return true;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    
    // Log the failed notification
    await storage.createNotificationLog({
      userEmail,
      notificationType: payload.tag || 'general',
      title: payload.title,
      message: payload.body,
      status: 'failed'
    });
    
    return false;
  }
}

export async function sendDailyReminder(userEmail: string, firstName?: string): Promise<boolean> {
  const user = await storage.getUserByEmail(userEmail);
  const name = firstName || user?.firstName || 'there';
  
  const messages = [
    `Hey ${name} 👋 Don't forget to log your expenses today!`,
    `${name}, have you tracked your spending today? 📱💰`,
    `Quick reminder ${name}: Log today's expenses to stay on budget! 🎯`,
    `${name}, keeping track of expenses helps you save more! 💪`,
    `Don't let expenses slip by ${name} - log them now! ⚡`
  ];
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  return await sendPushNotification(userEmail, {
    title: 'Laksha Daily Reminder',
    body: randomMessage,
    tag: 'daily_reminder',
    data: { type: 'daily_reminder', url: '/' }
  });
}

export async function sendBudgetAlert(
  userEmail: string,
  alertType: 'budget_50' | 'budget_80' | 'budget_100' | 'daily_limit',
  percentage?: number,
  amount?: number,
  limit?: number
): Promise<boolean> {
  const user = await storage.getUserByEmail(userEmail);
  const name = user?.firstName || 'there';
  
  let title = '';
  let body = '';
  
  switch (alertType) {
    case 'budget_50':
      title = '🟡 Budget Alert - 50% Used';
      body = `${name}, you've used 50% of your monthly budget. You're doing great! 👍`;
      break;
    case 'budget_80':
      title = '🟠 Budget Alert - 80% Used';
      body = `${name}, you've used 80% of your budget. Want to slow down a little? 🧘`;
      break;
    case 'budget_100':
      title = '🔴 Budget Exceeded!';
      body = `${name}, you've exceeded your monthly budget. Time to tighten the belt! 💸`;
      break;
    case 'daily_limit':
      title = '📱 Daily Limit Alert';
      body = `${name}, you've passed today's limit. Challenge: Spend ₹0 tomorrow. Are you in? 💪`;
      break;
  }
  
  return await sendPushNotification(userEmail, {
    title,
    body,
    tag: alertType,
    data: { 
      type: alertType, 
      percentage, 
      amount, 
      limit,
      url: '/budget' 
    }
  });
}

export async function sendWeeklyReport(userEmail: string): Promise<boolean> {
  const user = await storage.getUserByEmail(userEmail);
  const name = user?.firstName || 'there';
  
  // Get this week's spending
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const weeklySpent = await storage.getTotalSpent(userEmail, weekStart, now);
  
  return await sendPushNotification(userEmail, {
    title: '📊 Your Weekly Report',
    body: `${name}, you spent ₹${weeklySpent.toFixed(2)} this week. Check your analytics for insights! 📈`,
    tag: 'weekly_report',
    data: { 
      type: 'weekly_report', 
      weeklySpent,
      url: '/analytics' 
    }
  });
}

export async function checkAndSendNotifications(): Promise<void> {
  console.log('🔔 Checking notifications...');
  
  try {
    // Get all users with notification settings
    const users = await storage.getUserStats();
    
    for (const userInfo of users.recentSignups) {
      const userEmail = userInfo.email;
      const settings = await storage.getNotificationSettings(userEmail);
      
      if (!settings) continue;
      
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Check if user has logged expenses today
      const todayExpenses = await storage.getExpensesByLocalDate(userEmail, today);
      
      // Send daily reminder if no expenses logged and time is right
      if (settings.dailyReminders && todayExpenses.length === 0) {
        const [reminderHour, reminderMinute] = settings.reminderTime.split(':').map(Number);
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Send reminder at the set time (with 5-minute window)
        if (currentHour === reminderHour && currentMinute >= reminderMinute && currentMinute < reminderMinute + 5) {
          await sendDailyReminder(userEmail);
        }
      }
      
      // Check budget alerts
      if (settings.budgetAlerts) {
        await storage.checkBudgetThresholds(userEmail);
      }
      
      // Send weekly report on Sundays
      if (settings.weeklyReports && now.getDay() === 0 && now.getHours() === 9) {
        await sendWeeklyReport(userEmail);
      }
    }
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
}

// Service worker registration script for push notifications
export const serviceWorkerScript = `
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/icon-192x192.png',
      tag: data.tag,
      data: data.data,
      actions: [
        {
          action: 'open',
          title: 'Open App'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});
`;