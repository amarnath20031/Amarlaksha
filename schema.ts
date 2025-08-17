import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with email as primary key
export const users = pgTable("users", {
  email: varchar("email").primaryKey().notNull(), // Email as unique identifier
  googleId: varchar("google_id").unique(), // Google OAuth ID
  username: varchar("username").unique(), // Username for email/password auth
  password: varchar("password"), // Hashed password for email/password auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  country: varchar("country").default("India"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email").notNull(), // Reference to users.email
  type: text("type").notNull(), // 'monthly' | 'daily'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  categoryBudgets: text("category_budgets").notNull().default("{}"), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email").notNull(), // Reference to users.email
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  description: text("description"),
  method: text("method").notNull().default("manual"), // 'manual' | 'voice' | 'receipt'
  receiptUrl: text("receipt_url"),
  voiceNote: text("voice_note"),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  isDefault: boolean("is_default").default(true),
});



// User activity tracking for daily usage analytics
export const userActivity = pgTable("user_activity", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email").notNull(), // Reference to users.email
  date: timestamp("date").defaultNow().notNull(),
  activityType: text("activity_type").notNull(), // 'login', 'expense_added', 'budget_set', 'page_view'
  activityData: jsonb("activity_data"), // Additional context about the activity
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Budget notifications tracking
export const budgetNotifications = pgTable("budget_notifications", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email").notNull(), // Reference to users.email
  budgetId: integer("budget_id").notNull(),
  notificationType: text("notification_type").notNull(), // '80_percent', '100_percent', 'daily_summary'
  triggered: boolean("triggered").default(false),
  triggerDate: timestamp("trigger_date").defaultNow(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password reset tokens for forgot password feature
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email").notNull(), // Reference to users.email
  token: varchar("token").notNull().unique(), // Secure reset token
  otp: varchar("otp", { length: 6 }).notNull(), // 6-digit OTP
  expiresAt: timestamp("expires_at").notNull(), // Token expiry (10 minutes)
  used: boolean("used").default(false), // Whether token has been used
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Data import/export tracking
export const dataImports = pgTable("data_imports", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email").notNull(),
  fileName: varchar("file_name").notNull(),
  fileType: text("file_type").notNull(), // 'csv' | 'xlsx' | 'json'
  sourceApp: text("source_app"), // 'spendee' | 'walnut' | 'manual'
  recordsProcessed: integer("records_processed").default(0),
  recordsImported: integer("records_imported").default(0),
  recordsSkipped: integer("records_skipped").default(0),
  status: text("status").notNull().default("processing"), // 'processing' | 'completed' | 'failed'
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Push notification preferences and tokens
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email").notNull().unique(),
  pushToken: text("push_token"), // Web Push subscription endpoint
  dailyReminders: boolean("daily_reminders").default(true),
  budgetAlerts: boolean("budget_alerts").default(true),
  weeklyReports: boolean("weekly_reports").default(true),
  timezone: varchar("timezone").default("Asia/Kolkata"),
  reminderTime: varchar("reminder_time").default("19:00"), // 7 PM default
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notification delivery log
export const notificationLog = pgTable("notification_log", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email").notNull(),
  notificationType: text("notification_type").notNull(), // 'daily_reminder' | 'budget_alert' | 'weekly_report'
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull(), // 'sent' | 'failed' | 'pending'
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User onboarding data for personalization
export const userOnboarding = pgTable("user_onboarding", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email").notNull().unique(), // Reference to users.email
  employmentStatus: text("employment_status"), // 'student' | 'salaried' | 'freelancer' | 'homemaker' | 'unemployed'
  monthlyIncomeRange: text("monthly_income_range"), // 'under_10k' | '10k_30k' | '30k_60k' | '60k_100k' | 'above_100k'
  topExpenseCategories: text("top_expense_categories").array().default([]), // Array of spending categories
  savingGoal: text("saving_goal"), // 'gadget' | 'education' | 'vacation' | 'house' | 'family' | 'investment'
  moneyPersonality: text("money_personality"), // 'regular_saver' | 'impulsive_spender' | 'budget_tracker' | 'unsure'
  ageGroup: text("age_group"), // 'under_18' | '18_24' | '25_34' | '35_50' | '50_plus'
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform((val) => {
    return typeof val === 'string' ? val : val.toString();
  }),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

// Updated types for email-based authentication
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export const insertUserActivitySchema = createInsertSchema(userActivity).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetNotificationSchema = createInsertSchema(budgetNotifications).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type UserActivity = typeof userActivity.$inferSelect;
export type InsertBudgetNotification = z.infer<typeof insertBudgetNotificationSchema>;
export type BudgetNotification = typeof budgetNotifications.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Data import/export types
export const insertDataImportSchema = createInsertSchema(dataImports).omit({
  id: true,
  createdAt: true,
});

export type InsertDataImport = z.infer<typeof insertDataImportSchema>;
export type DataImport = typeof dataImports.$inferSelect;

// Notification types
export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationLogSchema = createInsertSchema(notificationLog).omit({
  id: true,
  createdAt: true,
});

export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;
export type NotificationLog = typeof notificationLog.$inferSelect;

// Onboarding types
export const insertUserOnboardingSchema = createInsertSchema(userOnboarding).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true, // Exclude completedAt from validation
});

export type InsertUserOnboarding = z.infer<typeof insertUserOnboardingSchema>;
export type UserOnboarding = typeof userOnboarding.$inferSelect;
