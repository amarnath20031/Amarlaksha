// Streak tracking system for expense logging
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLoggedDate: string;
  totalDaysLogged: number;
}

export class StreakTracker {
  private static readonly STORAGE_KEY = 'laksha-expense-streak';

  static getStreakData(userEmail: string): StreakData {
    const key = `${this.STORAGE_KEY}-${userEmail}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      return JSON.parse(stored);
    }
    
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastLoggedDate: '',
      totalDaysLogged: 0
    };
  }

  static updateStreak(userEmail: string): StreakData {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const streakData = this.getStreakData(userEmail);
    
    // Don't update if already logged today
    if (streakData.lastLoggedDate === today) {
      return streakData;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    
    if (streakData.lastLoggedDate === yesterdayStr) {
      // Continue streak
      streakData.currentStreak += 1;
    } else if (streakData.lastLoggedDate === '') {
      // First time logging
      streakData.currentStreak = 1;
    } else {
      // Streak broken, start over
      streakData.currentStreak = 1;
    }
    
    // Update other data
    streakData.lastLoggedDate = today;
    streakData.totalDaysLogged += 1;
    streakData.longestStreak = Math.max(streakData.longestStreak, streakData.currentStreak);
    
    // Save to localStorage
    const key = `${this.STORAGE_KEY}-${userEmail}`;
    localStorage.setItem(key, JSON.stringify(streakData));
    
    return streakData;
  }

  static getStreakMessage(currentStreak: number): string {
    if (currentStreak === 0) {
      return "Start your tracking journey! 🚀";
    } else if (currentStreak === 1) {
      return "Great start! Keep the momentum! 💪";
    } else if (currentStreak < 7) {
      return `You're on a ${currentStreak}-day streak! Keep going! 🔥`;
    } else if (currentStreak < 30) {
      return `Amazing ${currentStreak}-day streak! You're on fire! 🚀`;
    } else {
      return `Incredible ${currentStreak}-day streak! You're a tracking legend! 👑`;
    }
  }

  static getStreakEmoji(currentStreak: number): string {
    if (currentStreak === 0) return "🎯";
    if (currentStreak < 3) return "🔥";
    if (currentStreak < 7) return "🚀";
    if (currentStreak < 14) return "⭐";
    if (currentStreak < 30) return "💎";
    return "👑";
  }

  static shouldShowCelebration(oldStreak: number, newStreak: number): boolean {
    // Show celebration for milestone achievements
    const milestones = [5, 7, 14, 21, 30, 60, 90, 180, 365];
    return milestones.some(milestone => oldStreak < milestone && newStreak >= milestone);
  }

  static getCelebrationMessage(streak: number): string {
    if (streak >= 365) return "🎉 One full year of tracking! You're a financial champion! 👑";
    if (streak >= 180) return "🎉 Six months of consistent tracking! Incredible dedication! 💎";
    if (streak >= 90) return "🎉 Three months strong! You're building amazing habits! 🚀";
    if (streak >= 60) return "🎉 Two months of tracking! Your financial awareness is soaring! ⭐";
    if (streak >= 30) return "🎉 One month streak! You're officially a tracking pro! 💪";
    if (streak >= 21) return "🎉 Three weeks! You're creating lasting habits! 🔥";
    if (streak >= 14) return "🎉 Two weeks straight! Consistency is key! 💪";
    if (streak >= 7) return "🎉 One week streak! You're building momentum! 🚀";
    if (streak >= 5) return "🎉 Five days in a row! Keep the streak alive! 🔥";
    return "🎉 Great job staying consistent! 💪";
  }
}