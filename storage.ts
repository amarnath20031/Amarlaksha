import {
  users,
  budgets,
  expenses,
  categories,
  userActivity,
  budgetNotifications,
  passwordResetTokens,
  dataImports,
  notificationSettings,
  notificationLog,
  userOnboarding,
  type User,
  type UpsertUser,
  type Budget,
  type Expense,
  type Category,
  type InsertBudget,
  type InsertExpense,
  type InsertCategory,
  type UserActivity,
  type InsertUserActivity,
  type BudgetNotification,
  type InsertBudgetNotification,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type DataImport,
  type InsertDataImport,
  type NotificationSettings,
  type InsertNotificationSettings,
  type NotificationLog,
  type InsertNotificationLog,
  type UserOnboarding,
  type InsertUserOnboarding,
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, and, gte } from "drizzle-orm";
import bcrypt from "bcrypt";

// Interface for storage operations
export interface IStorage {
  // User operations (email-based and username-based)
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(email: string, updates: Partial<UpsertUser>): Promise<User | undefined>;
  authenticateUser(emailOrUsername: string, password: string): Promise<User | null>;
  
  // Budget operations (email-based)
  getBudget(userEmail: string): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(userEmail: string, budget: Partial<InsertBudget>): Promise<Budget | undefined>;
  
  // Expense operations (email-based)
  getExpenses(userEmail: string, limit?: number): Promise<Expense[]>;
  getExpensesByCategory(userEmail: string, category: string): Promise<Expense[]>;
  getExpensesByDateRange(userEmail: string, startDate: Date, endDate: Date, limit?: number): Promise<Expense[]>;
  getExpensesByLocalDate(userEmail: string, localDate: string, limit?: number): Promise<Expense[]>;
  getRecentExpenses(userEmail: string, limit?: number): Promise<Expense[]>;
  getExpenseDatesInRange(userEmail: string, startDate: Date, endDate: Date): Promise<string[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Analytics (email-based)
  getTotalSpentByCategory(userEmail: string, startDate: Date, endDate: Date): Promise<Record<string, number>>;
  getTotalSpent(userEmail: string, startDate: Date, endDate: Date): Promise<number>;
  
  // Admin stats
  getUserStats(): Promise<{
    totalUsers: number;
    recentSignups: Array<{ email: string; signupDate: string }>;
    signupsByDay: Record<string, number>;
  }>;

  // User activity tracking (email-based)
  logUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  getDailyActiveUsers(date: Date): Promise<number>;
  getUserActivityStats(userEmail: string, days: number): Promise<{
    totalLogins: number;
    totalExpenses: number;
    lastActive: Date | null;
    dailyUsage: Record<string, number>;
  }>;

  // Budget notifications (email-based)
  createBudgetNotification(notification: InsertBudgetNotification): Promise<BudgetNotification>;
  checkBudgetThresholds(userEmail: string): Promise<void>;

  // Password reset operations
  createPasswordResetToken(userEmail: string): Promise<{ token: string; otp: string }>;
  verifyPasswordResetToken(token: string): Promise<PasswordResetToken | null>;
  verifyPasswordResetOTP(email: string, otp: string): Promise<PasswordResetToken | null>;
  resetUserPassword(tokenOrOtp: string, newPassword: string, isOtp?: boolean): Promise<boolean>;
  cleanExpiredTokens(): Promise<void>;
  getPendingNotifications(userEmail: string): Promise<BudgetNotification[]>;
  markNotificationAsRead(notificationId: number): Promise<void>;

  // Data import/export operations
  createDataImport(dataImport: InsertDataImport): Promise<DataImport>;
  updateDataImport(id: number, updates: Partial<InsertDataImport>): Promise<DataImport | undefined>;
  getDataImports(userEmail: string): Promise<DataImport[]>;
  exportUserData(userEmail: string): Promise<{
    user: User;
    expenses: Expense[];
    budgets: Budget[];
    categories: Category[];
  }>;

  // Notification operations
  getNotificationSettings(userEmail: string): Promise<NotificationSettings | undefined>;
  upsertNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;
  createNotificationLog(log: InsertNotificationLog): Promise<NotificationLog>;
  getNotificationLogs(userEmail: string, limit?: number): Promise<NotificationLog[]>;

  // Onboarding operations
  getUserOnboarding(userEmail: string): Promise<UserOnboarding | undefined>;
  createOrUpdateOnboarding(onboarding: InsertUserOnboarding): Promise<UserOnboarding>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined> {
    if (emailOrUsername.includes('@')) {
      return this.getUserByEmail(emailOrUsername);
    } else {
      return this.getUserByUsername(emailOrUsername);
    }
  }

  async authenticateUser(emailOrUsername: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmailOrUsername(emailOrUsername);
    if (!user || !user.password) {
      return null;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return null;
    }

    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    // Hash password if provided
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(email: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    // Hash password if being updated
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.email, email))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Budget operations
  async getBudget(userEmail: string): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.userEmail, userEmail));
    return budget;
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const [budget] = await db
      .insert(budgets)
      .values(insertBudget)
      .returning();
    return budget;
  }

  async updateBudget(userEmail: string, updates: Partial<InsertBudget>): Promise<Budget | undefined> {
    const [budget] = await db
      .update(budgets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(budgets.userEmail, userEmail))
      .returning();
    return budget;
  }

  // Expense operations
  async getExpenses(userEmail: string, limit?: number): Promise<Expense[]> {
    const query = db
      .select()
      .from(expenses)
      .where(eq(expenses.userEmail, userEmail))
      .orderBy(expenses.date);
    
    if (limit) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  async getExpensesByCategory(userEmail: string, category: string): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(and(
        eq(expenses.userEmail, userEmail),
        eq(expenses.category, category)
      ))
      .orderBy(expenses.date);
  }

  async getExpensesByDateRange(userEmail: string, startDate: Date, endDate: Date, limit?: number): Promise<Expense[]> {
    console.log('🔍 Storage query - userEmail:', userEmail, 'startDate:', startDate, 'endDate:', endDate);
    
    const query = db
      .select()
      .from(expenses)
      .where(and(
        eq(expenses.userEmail, userEmail),
        gte(expenses.date, startDate),
        sql`${expenses.date} < ${endDate}`
      ))
      .orderBy(sql`${expenses.date} DESC`);
    
    const result = await (limit ? query.limit(limit) : query);
    console.log('🔍 Storage result:', result);
    return result;
  }

  async getExpensesByLocalDate(userEmail: string, localDate: string, limit?: number): Promise<Expense[]> {
    console.log('🔍 Storage query by local date - userEmail:', userEmail, 'localDate:', localDate);
    
    // Create proper IST date range for the given date (localDate is YYYY-MM-DD)
    const startOfDayIST = new Date(`${localDate}T00:00:00.000+05:30`);
    const endOfDayIST = new Date(`${localDate}T23:59:59.999+05:30`);
    
    console.log('🕐 IST Date range:', { 
      localDate, 
      startOfDayIST: startOfDayIST.toISOString(),
      endOfDayIST: endOfDayIST.toISOString(),
      startIST: startOfDayIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      endIST: endOfDayIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });
    
    // Query expenses that fall within the IST date range
    const query = db
      .select()
      .from(expenses)
      .where(and(
        eq(expenses.userEmail, userEmail),
        gte(expenses.date, startOfDayIST),
        sql`${expenses.date} <= ${endOfDayIST}`
      ))
      .orderBy(sql`${expenses.date} DESC`);
    
    const result = await (limit ? query.limit(limit) : query);
    console.log('🔍 Storage result for IST date:', result.length, 'expenses found');
    return result;
  }

  async getRecentExpenses(userEmail: string, limit?: number): Promise<Expense[]> {
    console.log('🔍 Storage query recent expenses - userEmail:', userEmail, 'limit:', limit);
    
    // Get expenses from last 7 days in IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const sevenDaysAgoIST = new Date(istNow);
    sevenDaysAgoIST.setDate(sevenDaysAgoIST.getDate() - 7);
    sevenDaysAgoIST.setHours(0, 0, 0, 0); // Start of day
    
    console.log('🕐 Recent expenses date range:', {
      sevenDaysAgoIST: sevenDaysAgoIST.toISOString(),
      istNow: istNow.toISOString(),
      sevenDaysAgoISTDisplay: sevenDaysAgoIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      istNowDisplay: istNow.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });
    
    const query = db
      .select()
      .from(expenses)
      .where(and(
        eq(expenses.userEmail, userEmail),
        gte(expenses.date, sevenDaysAgoIST)
      ))
      .orderBy(sql`${expenses.date} DESC, ${expenses.createdAt} DESC`);
    
    const result = await (limit ? query.limit(limit) : query);
    console.log('🔍 Storage result recent expenses:', result.length, 'expenses found');
    return result;
  }

  async getExpenseDatesInRange(userEmail: string, startDate: Date, endDate: Date): Promise<string[]> {
    const results = await db
      .selectDistinct({
        date: sql<string>`DATE(${expenses.date})`.as('date')
      })
      .from(expenses)
      .where(and(
        eq(expenses.userEmail, userEmail),
        gte(expenses.date, startDate),
        sql`${expenses.date} <= ${endDate}`
      ))
      .orderBy(sql`DATE(${expenses.date})`);
    
    return results.map(r => r.date);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values(insertExpense)
      .returning();
    return expense;
  }

  async getExpenseById(id: number): Promise<Expense | undefined> {
    console.log('🔍 Getting expense by ID:', id);
    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id));
    return expense;
  }

  async deleteExpense(id: number): Promise<Expense | undefined> {
    console.log('🗑️ Deleting expense with ID:', id);
    const [deletedExpense] = await db
      .delete(expenses)
      .where(eq(expenses.id, id))
      .returning();
    console.log('✅ Deleted expense:', deletedExpense);
    return deletedExpense;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  // Analytics
  async getTotalSpentByCategory(userEmail: string, startDate: Date, endDate: Date): Promise<Record<string, number>> {
    const userExpenses = await this.getExpensesByDateRange(userEmail, startDate, endDate);
    const categoryTotals: Record<string, number> = {};
    
    userExpenses.forEach(expense => {
      const amount = parseFloat(expense.amount);
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + amount;
    });
    
    return categoryTotals;
  }

  async getTotalSpent(userEmail: string, startDate: Date, endDate: Date): Promise<number> {
    const userExpenses = await this.getExpensesByDateRange(userEmail, startDate, endDate);
    return userExpenses.reduce((total, expense) => total + parseFloat(expense.amount), 0);
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    recentSignups: Array<{ email: string; signupDate: string }>;
    signupsByDay: Record<string, number>;
  }> {
    // Get total user count
    const totalResult = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(users);
    const totalUsers = totalResult[0]?.count || 0;

    // Get recent signups (last 10)
    const recentUsers = await db
      .select({
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(sql`${users.createdAt} DESC`)
      .limit(10);

    const recentSignups = recentUsers.map(user => ({
      email: user.email || 'Unknown',
      signupDate: user.createdAt?.toISOString().split('T')[0] || 'Unknown'
    }));

    // Get signups by day (last 30 days)
    const signupsByDayResult = await db
      .select({
        date: sql<string>`DATE(${users.createdAt})`.as('date'),
        count: sql<number>`count(*)`.as('count')
      })
      .from(users)
      .where(sql`${users.createdAt} >= NOW() - INTERVAL '30 days'`)
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt}) DESC`);

    const signupsByDay: Record<string, number> = {};
    signupsByDayResult.forEach(row => {
      if (row.date) {
        signupsByDay[row.date] = row.count || 0;
      }
    });

    return {
      totalUsers,
      recentSignups,
      signupsByDay
    };
  }

  // User activity tracking
  async logUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const [activityRecord] = await db
      .insert(userActivity)
      .values(activity)
      .returning();
    return activityRecord;
  }

  async getDailyActiveUsers(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await db
      .select({ count: sql<number>`count(DISTINCT ${userActivity.userEmail})`.as('count') })
      .from(userActivity)
      .where(and(
        gte(userActivity.date, startOfDay),
        sql`${userActivity.date} <= ${endOfDay}`
      ));

    return result[0]?.count || 0;
  }

  async getUserActivityStats(userEmail: string, days: number): Promise<{
    totalLogins: number;
    totalExpenses: number;
    lastActive: Date | null;
    dailyUsage: Record<string, number>;
  }> {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    // Get total login count
    const loginResult = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(userActivity)
      .where(and(
        eq(userActivity.userEmail, userEmail),
        eq(userActivity.activityType, 'login'),
        gte(userActivity.date, daysAgo)
      ));

    // Get total expense additions
    const expenseResult = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(userActivity)
      .where(and(
        eq(userActivity.userEmail, userEmail),
        eq(userActivity.activityType, 'expense_added'),
        gte(userActivity.date, daysAgo)
      ));

    // Get last active date
    const lastActiveResult = await db
      .select({ date: userActivity.date })
      .from(userActivity)
      .where(eq(userActivity.userEmail, userEmail))
      .orderBy(sql`${userActivity.date} DESC`)
      .limit(1);

    // Get daily usage breakdown
    const dailyUsageResult = await db
      .select({
        date: sql<string>`DATE(${userActivity.date})`.as('date'),
        count: sql<number>`count(*)`.as('count')
      })
      .from(userActivity)
      .where(and(
        eq(userActivity.userEmail, userEmail),
        gte(userActivity.date, daysAgo)
      ))
      .groupBy(sql`DATE(${userActivity.date})`)
      .orderBy(sql`DATE(${userActivity.date}) DESC`);

    const dailyUsage: Record<string, number> = {};
    dailyUsageResult.forEach(row => {
      if (row.date) {
        dailyUsage[row.date] = row.count || 0;
      }
    });

    return {
      totalLogins: loginResult[0]?.count || 0,
      totalExpenses: expenseResult[0]?.count || 0,
      lastActive: lastActiveResult[0]?.date || null,
      dailyUsage
    };
  }

  // Budget notifications
  async createBudgetNotification(notification: InsertBudgetNotification): Promise<BudgetNotification> {
    const [notificationRecord] = await db
      .insert(budgetNotifications)
      .values(notification)
      .returning();
    return notificationRecord;
  }

  async checkBudgetThresholds(userEmail: string): Promise<void> {
    const budget = await this.getBudget(userEmail);
    if (!budget) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalSpent = await this.getTotalSpent(userEmail, startOfMonth, now);
    const budgetAmount = parseFloat(budget.amount);
    const spentPercentage = (totalSpent / budgetAmount) * 100;

    // Use simple daily limit: monthly budget / 30 days
    const simpleDailyLimit = budgetAmount / 30;

    // Check daily spending
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dailySpent = await this.getTotalSpent(userEmail, startOfDay, now);

    // Daily limit exceeded notification
    if (dailySpent > simpleDailyLimit && simpleDailyLimit > 0) {
      const existingDailyNotification = await db
        .select()
        .from(budgetNotifications)
        .where(and(
          eq(budgetNotifications.userEmail, userEmail),
          eq(budgetNotifications.notificationType, 'daily_limit'),
          gte(budgetNotifications.triggerDate, startOfDay)
        ));

      if (existingDailyNotification.length === 0) {
        await this.createBudgetNotification({
          userEmail,
          budgetId: budget.id,
          notificationType: 'daily_limit',
          triggered: true,
          triggerDate: now,
          message: `📱 Daily Limit Alert: You've spent ₹${dailySpent.toFixed(2)} today, exceeding your daily limit of ₹${simpleDailyLimit.toFixed(2)}. Consider postponing non-essential purchases.`
        });
      }
    }

    // Check 80% threshold
    if (spentPercentage >= 80) {
      const existing80 = await db
        .select()
        .from(budgetNotifications)
        .where(and(
          eq(budgetNotifications.userEmail, userEmail),
          eq(budgetNotifications.budgetId, budget.id),
          eq(budgetNotifications.notificationType, '80_percent'),
          gte(budgetNotifications.triggerDate, startOfMonth)
        ));

      if (existing80.length === 0) {
        await this.createBudgetNotification({
          userEmail,
          budgetId: budget.id,
          notificationType: '80_percent',
          triggered: true,
          triggerDate: now,
          message: `⚠️ Budget Alert: You've used ${spentPercentage.toFixed(1)}% of your monthly budget (₹${totalSpent.toFixed(2)} of ₹${budgetAmount}). Consider reducing expenses to stay within budget.`
        });
      }
    }

    // Check 100% threshold
    if (spentPercentage >= 100) {
      const existing100 = await db
        .select()
        .from(budgetNotifications)
        .where(and(
          eq(budgetNotifications.userEmail, userEmail),
          eq(budgetNotifications.budgetId, budget.id),
          eq(budgetNotifications.notificationType, '100_percent'),
          gte(budgetNotifications.triggerDate, startOfMonth)
        ));

      if (existing100.length === 0) {
        await this.createBudgetNotification({
          userEmail,
          budgetId: budget.id,
          notificationType: '100_percent',
          triggered: true,
          triggerDate: now,
          message: `🚨 Budget Exceeded: You've spent ₹${totalSpent.toFixed(2)}, which is ${spentPercentage.toFixed(1)}% of your ₹${budgetAmount} budget. Time to review your expenses!`
        });
      }
    }
  }

  async getPendingNotifications(userEmail: string): Promise<BudgetNotification[]> {
    return await db
      .select()
      .from(budgetNotifications)
      .where(and(
        eq(budgetNotifications.userEmail, userEmail),
        eq(budgetNotifications.triggered, true)
      ))
      .orderBy(sql`${budgetNotifications.triggerDate} DESC`)
      .limit(5);
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db
      .update(budgetNotifications)
      .set({ triggered: false })
      .where(eq(budgetNotifications.id, notificationId));
  }

  // Password reset methods
  async createPasswordResetToken(userEmail: string): Promise<{ token: string; otp: string }> {
    // Generate secure random token and 6-digit OTP
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now().toString();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Clean up existing expired tokens for this user
    await this.cleanExpiredTokens();
    
    // Delete any existing tokens for this user
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userEmail, userEmail));

    // Create new token
    await db.insert(passwordResetTokens).values({
      userEmail,
      token,
      otp,
      expiresAt,
      used: false,
    });

    return { token, otp };
  }

  async verifyPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          sql`${passwordResetTokens.expiresAt} > NOW()`
        )
      );

    return resetToken || null;
  }

  async verifyPasswordResetOTP(email: string, otp: string): Promise<PasswordResetToken | null> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userEmail, email),
          eq(passwordResetTokens.otp, otp),
          eq(passwordResetTokens.used, false),
          sql`${passwordResetTokens.expiresAt} > NOW()`
        )
      );

    return resetToken || null;
  }

  async resetUserPassword(tokenOrOtp: string, newPassword: string, isOtp: boolean = false): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    
    let resetToken: PasswordResetToken | null = null;

    if (isOtp) {
      // Find token by OTP (need email, but we'll search all active tokens)
      const [foundToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.otp, tokenOrOtp),
            eq(passwordResetTokens.used, false),
            sql`${passwordResetTokens.expiresAt} > NOW()`
          )
        );
      resetToken = foundToken || null;
    } else {
      resetToken = await this.verifyPasswordResetToken(tokenOrOtp);
    }

    if (!resetToken) {
      return false;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
      // Update user password
      await db
        .update(users)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.email, resetToken.userEmail));

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, resetToken.id));

      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  }

  async cleanExpiredTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(sql`${passwordResetTokens.expiresAt} <= NOW() OR ${passwordResetTokens.used} = true`);
  }

  // Data import/export operations
  async createDataImport(dataImport: InsertDataImport): Promise<DataImport> {
    const [result] = await db.insert(dataImports).values(dataImport).returning();
    return result;
  }

  async updateDataImport(id: number, updates: Partial<InsertDataImport>): Promise<DataImport | undefined> {
    const [result] = await db
      .update(dataImports)
      .set(updates)
      .where(eq(dataImports.id, id))
      .returning();
    return result;
  }

  async getDataImports(userEmail: string): Promise<DataImport[]> {
    return await db
      .select()
      .from(dataImports)
      .where(eq(dataImports.userEmail, userEmail))
      .orderBy(sql`${dataImports.createdAt} DESC`);
  }

  async exportUserData(userEmail: string): Promise<{
    user: User;
    expenses: Expense[];
    budgets: Budget[];
    categories: Category[];
  }> {
    const user = await this.getUserByEmail(userEmail);
    if (!user) {
      throw new Error('User not found');
    }

    const [expenses, budgets, categories] = await Promise.all([
      this.getExpenses(userEmail),
      this.getBudget(userEmail).then(budget => budget ? [budget] : []),
      this.getCategories(),
    ]);

    return {
      user,
      expenses,
      budgets,
      categories,
    };
  }

  // Notification operations
  async getNotificationSettings(userEmail: string): Promise<NotificationSettings | undefined> {
    const [settings] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userEmail, userEmail));
    return settings;
  }

  async upsertNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings> {
    const [result] = await db
      .insert(notificationSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: notificationSettings.userEmail,
        set: {
          ...settings,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async createNotificationLog(log: InsertNotificationLog): Promise<NotificationLog> {
    const [result] = await db.insert(notificationLog).values(log).returning();
    return result;
  }

  async getNotificationLogs(userEmail: string, limit = 50): Promise<NotificationLog[]> {
    return await db
      .select()
      .from(notificationLog)
      .where(eq(notificationLog.userEmail, userEmail))
      .orderBy(sql`${notificationLog.createdAt} DESC`)
      .limit(limit);
  }

  // Onboarding operations
  async getUserOnboarding(userEmail: string): Promise<UserOnboarding | undefined> {
    const [onboarding] = await db
      .select()
      .from(userOnboarding)
      .where(eq(userOnboarding.userEmail, userEmail));
    return onboarding;
  }

  async createOrUpdateOnboarding(onboarding: InsertUserOnboarding): Promise<UserOnboarding> {
    try {
      console.log('📝 Creating/updating onboarding for:', onboarding.userEmail);
      console.log('📊 Onboarding data:', onboarding);
      
      const [result] = await db
        .insert(userOnboarding)
        .values({
          ...onboarding,
          completedAt: new Date(), // Set completedAt when inserting
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userOnboarding.userEmail,
          set: {
            ...onboarding,
            completedAt: new Date(), // Update completedAt when updating
            updatedAt: new Date(),
          },
        })
        .returning();
      
      console.log('✅ Onboarding saved successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error saving onboarding:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
