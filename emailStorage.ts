import {
  users,
  budgets,
  expenses,
  categories,
  userActivity,
  budgetNotifications,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, and, gte } from "drizzle-orm";
import type { IStorage } from "./storage";
import bcrypt from "bcrypt";

export class EmailBasedStorage implements IStorage {
  // User operations (email-based)
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async getUserByEmailOrUsername(emailOrUsername: string): Promise<User | undefined> {
    try {
      // First try to find by email
      let user = await this.getUserByEmail(emailOrUsername);
      
      // If not found by email, try by username
      if (!user) {
        user = await this.getUserByUsername(emailOrUsername);
      }
      
      return user;
    } catch (error) {
      console.error("Error getting user by email or username:", error);
      return undefined;
    }
  }

  async createUser(userData: UpsertUser & { password?: string }): Promise<User> {
    try {
      // Hash password if provided
      let hashedPassword = undefined;
      if (userData.password) {
        hashedPassword = await bcrypt.hash(userData.password, 10);
      }

      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          password: hashedPassword,
        })
        .returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async authenticateUser(emailOrUsername: string, password: string): Promise<User | null> {
    try {
      // Support login with either email or username
      const user = await this.getUserByEmailOrUsername(emailOrUsername);
      if (!user || !user.password) {
        return null;
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return null;
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      console.error("Error authenticating user:", error);
      return null;
    }
  }

  async updateUser(email: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    try {
      const [user] = await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.email, email))
        .returning();
      return user;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  // Budget operations (email-based)
  async getBudget(userEmail: string): Promise<Budget | undefined> {
    try {
      console.log('📊 Fetching budget for user:', userEmail);
      const [budget] = await db.select().from(budgets).where(eq(budgets.userEmail, userEmail));
      console.log('📊 Found budget:', budget);
      return budget;
    } catch (error) {
      console.error("Error getting budget:", error);
      return undefined;
    }
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    try {
      const [budget] = await db
        .insert(budgets)
        .values(insertBudget)
        .returning();
      return budget;
    } catch (error) {
      console.error("Error creating budget:", error);
      throw error;
    }
  }

  async updateBudget(userEmail: string, updates: Partial<InsertBudget>): Promise<Budget | undefined> {
    try {
      const [budget] = await db
        .update(budgets)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(budgets.userEmail, userEmail))
        .returning();
      return budget;
    } catch (error) {
      console.error("Error updating budget:", error);
      return undefined;
    }
  }

  // Expense operations (email-based)
  async getExpenses(userEmail: string, limit?: number): Promise<Expense[]> {
    try {
      const query = db
        .select()
        .from(expenses)
        .where(eq(expenses.userEmail, userEmail))
        .orderBy(sql`${expenses.date} DESC`);
      
      if (limit) {
        return await query.limit(limit);
      }
      
      return await query;
    } catch (error) {
      console.error("Error getting expenses:", error);
      return [];
    }
  }

  async getExpensesByCategory(userEmail: string, category: string): Promise<Expense[]> {
    try {
      return await db
        .select()
        .from(expenses)
        .where(and(
          eq(expenses.userEmail, userEmail),
          eq(expenses.category, category)
        ))
        .orderBy(sql`${expenses.date} DESC`);
    } catch (error) {
      console.error("Error getting expenses by category:", error);
      return [];
    }
  }

  async getExpensesByDateRange(userEmail: string, startDate: Date, endDate: Date, limit?: number): Promise<Expense[]> {
    try {
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
    } catch (error) {
      console.error("Error getting expenses by date range:", error);
      return [];
    }
  }

  async getExpensesByLocalDate(userEmail: string, localDate: string, limit?: number): Promise<Expense[]> {
    try {
      // Parse the local date (YYYY-MM-DD) to IST timezone
      const startDate = new Date(`${localDate}T00:00:00+05:30`);
      const endDate = new Date(`${localDate}T23:59:59+05:30`);
      
      return await this.getExpensesByDateRange(userEmail, startDate, endDate, limit);
    } catch (error) {
      console.error("Error getting expenses by local date:", error);
      return [];
    }
  }

  async getRecentExpenses(userEmail: string, limit: number = 10): Promise<Expense[]> {
    try {
      console.log('🔍 Storage query recent expenses - userEmail:', userEmail, 'limit:', limit);
      const result = await db
        .select()
        .from(expenses)
        .where(eq(expenses.userEmail, userEmail))
        .orderBy(sql`${expenses.date} DESC`)
        .limit(limit);
      
      console.log('🔍 Storage result recent expenses:', result);
      return result;
    } catch (error) {
      console.error("Error getting recent expenses:", error);
      return [];
    }
  }

  async getExpenseDatesInRange(userEmail: string, startDate: Date, endDate: Date): Promise<string[]> {
    try {
      const result = await db
        .select({ date: expenses.date })
        .from(expenses)
        .where(and(
          eq(expenses.userEmail, userEmail),
          gte(expenses.date, startDate),
          sql`${expenses.date} < ${endDate}`
        ));
      
      return result.map(row => row.date.toISOString().split('T')[0]);
    } catch (error) {
      console.error("Error getting expense dates:", error);
      return [];
    }
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    try {
      const [newExpense] = await db
        .insert(expenses)
        .values(expense)
        .returning();
      return newExpense;
    } catch (error) {
      console.error("Error creating expense:", error);
      throw error;
    }
  }

  async getExpenseById(expenseId: number): Promise<Expense | undefined> {
    try {
      const [expense] = await db.select().from(expenses).where(eq(expenses.id, expenseId));
      return expense;
    } catch (error) {
      console.error("Error getting expense by ID:", error);
      return undefined;
    }
  }

  async deleteExpense(expenseId: number): Promise<Expense | undefined> {
    try {
      const [deletedExpense] = await db
        .delete(expenses)
        .where(eq(expenses.id, expenseId))
        .returning();
      return deletedExpense;
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    try {
      return await db.select().from(categories).orderBy(categories.name);
    } catch (error) {
      console.error("Error getting categories:", error);
      return [];
    }
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    try {
      const [newCategory] = await db
        .insert(categories)
        .values(category)
        .returning();
      return newCategory;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  }

  // Analytics (email-based)
  async getTotalSpentByCategory(userEmail: string, startDate: Date, endDate: Date): Promise<Record<string, number>> {
    try {
      const result = await db
        .select({
          category: expenses.category,
          total: sql<number>`SUM(${expenses.amount}::numeric)`.as('total')
        })
        .from(expenses)
        .where(and(
          eq(expenses.userEmail, userEmail),
          gte(expenses.date, startDate),
          sql`${expenses.date} < ${endDate}`
        ))
        .groupBy(expenses.category);

      const categorySpending: Record<string, number> = {};
      result.forEach(row => {
        categorySpending[row.category] = Number(row.total) || 0;
      });

      return categorySpending;
    } catch (error) {
      console.error("Error getting total spent by category:", error);
      return {};
    }
  }

  async getTotalSpent(userEmail: string, startDate: Date, endDate: Date): Promise<number> {
    try {
      const result = await db
        .select({
          total: sql<number>`SUM(${expenses.amount}::numeric)`.as('total')
        })
        .from(expenses)
        .where(and(
          eq(expenses.userEmail, userEmail),
          gte(expenses.date, startDate),
          sql`${expenses.date} < ${endDate}`
        ));

      return Number(result[0]?.total) || 0;
    } catch (error) {
      console.error("Error getting total spent:", error);
      return 0;
    }
  }

  // Admin stats
  async getUserStats(): Promise<{
    totalUsers: number;
    recentSignups: Array<{ email: string; signupDate: string }>;
    signupsByDay: Record<string, number>;
  }> {
    try {
      const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
      const recentSignups = await db
        .select()
        .from(users)
        .orderBy(sql`${users.createdAt} DESC`)
        .limit(10);

      return {
        totalUsers: Number(totalUsers[0]?.count) || 0,
        recentSignups: recentSignups.map(user => ({
          email: user.email,
          signupDate: user.createdAt?.toISOString().split('T')[0] || ''
        })),
        signupsByDay: {} // Simplified for now
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      return {
        totalUsers: 0,
        recentSignups: [],
        signupsByDay: {}
      };
    }
  }

  // User activity tracking (email-based)
  async logUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    try {
      const [newActivity] = await db
        .insert(userActivity)
        .values(activity)
        .returning();
      return newActivity;
    } catch (error) {
      console.error("Error logging user activity:", error);
      throw error;
    }
  }

  async getDailyActiveUsers(date: Date): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(DISTINCT ${userActivity.userEmail})` })
        .from(userActivity)
        .where(sql`DATE(${userActivity.date}) = DATE(${date})`);

      return Number(result[0]?.count) || 0;
    } catch (error) {
      console.error("Error getting daily active users:", error);
      return 0;
    }
  }

  async getUserActivityStats(userEmail: string, days: number): Promise<{
    totalLogins: number;
    totalExpenses: number;
    lastActive: Date | null;
    dailyUsage: Record<string, number>;
  }> {
    try {
      const expensesCount = await this.getExpenses(userEmail);
      
      return {
        totalLogins: 1, // Simplified
        totalExpenses: expensesCount.length,
        lastActive: new Date(),
        dailyUsage: {} // Simplified
      };
    } catch (error) {
      console.error("Error getting user activity stats:", error);
      return {
        totalLogins: 0,
        totalExpenses: 0,
        lastActive: null,
        dailyUsage: {}
      };
    }
  }

  // Budget notifications (email-based)
  async createBudgetNotification(notification: InsertBudgetNotification): Promise<BudgetNotification> {
    try {
      const [newNotification] = await db
        .insert(budgetNotifications)
        .values(notification)
        .returning();
      return newNotification;
    } catch (error) {
      console.error("Error creating budget notification:", error);
      throw error;
    }
  }

  async checkBudgetThresholds(userEmail: string): Promise<void> {
    // Implementation for budget threshold checking
    console.log('Checking budget thresholds for:', userEmail);
  }

  async getPendingNotifications(userEmail: string): Promise<BudgetNotification[]> {
    try {
      return await db
        .select()
        .from(budgetNotifications)
        .where(and(
          eq(budgetNotifications.userEmail, userEmail),
          eq(budgetNotifications.triggered, false)
        ))
        .orderBy(sql`${budgetNotifications.createdAt} DESC`);
    } catch (error) {
      console.error("Error getting pending notifications:", error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    try {
      await db
        .update(budgetNotifications)
        .set({ triggered: true })
        .where(eq(budgetNotifications.id, notificationId));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }
}