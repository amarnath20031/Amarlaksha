// Daily missions system for gamification
export interface DailyMission {
  id: string;
  title: string;
  description: string;
  emoji: string;
  targetAmount?: number;
  type: 'no-spend' | 'limit-category' | 'track-expenses' | 'save-target';
}

export const dailyMissions: DailyMission[] = [
  {
    id: 'no-chai-day',
    title: 'Chai-Free Challenge',
    description: 'Skip your chai/coffee breaks today and save ₹50!',
    emoji: '☕',
    targetAmount: 50,
    type: 'no-spend'
  },
  {
    id: 'no-spend-challenge',
    title: 'Complete No-Spend Day',
    description: 'Challenge yourself - zero expenses today! Desh ki savings!',
    emoji: '💪',
    type: 'no-spend'
  },
  {
    id: 'auto-rickshaw-limit',
    title: 'Smart Auto-Rickshaw',
    description: 'Keep auto/transport under ₹100 - try sharing or bus!',
    emoji: '🛺',
    targetAmount: 100,
    type: 'limit-category'
  },
  {
    id: 'street-food-budget',
    title: 'Street Food Control',
    description: 'Limit street food & snacks to ₹150 today!',
    emoji: '🥘',
    targetAmount: 150,
    type: 'limit-category'
  },
  {
    id: 'track-every-rupee',
    title: 'Every Rupee Tracker',
    description: 'Track every expense today - even ₹5 paan!',
    emoji: '📝',
    type: 'track-expenses'
  },
  {
    id: 'petrol-saver',
    title: 'Petrol Price Fighter',
    description: 'Save ₹200 on petrol today - walk or cycle short distances!',
    emoji: '⛽',
    targetAmount: 200,
    type: 'save-target'
  },
  {
    id: 'mobile-recharge-limit',
    title: 'Mobile Bill Smart',
    description: 'No unnecessary mobile recharges today - save ₹100!',
    emoji: '📱',
    targetAmount: 100,
    type: 'limit-category'
  },
  {
    id: 'ott-pause',
    title: 'OTT Subscription Pause',
    description: 'Skip new OTT subscriptions or movie tickets today!',
    emoji: '🎬',
    type: 'no-spend'
  }
];

export interface UserMission {
  mission: DailyMission;
  date: string;
  completed: boolean;
  progress?: number;
}

export class MissionManager {
  private static readonly STORAGE_KEY = 'laksha-user-missions';

  static getTodaysMission(userEmail: string): DailyMission {
    // Use user email and date to generate consistent daily mission
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return this.getDailyMissionForDate(userEmail, today);
  }

  static getDailyMissionForDate(userEmail: string, date: string): DailyMission {
    // Use user email and specific date to generate consistent daily mission
    const seed = this.hashCode(userEmail + date);
    const missionIndex = Math.abs(seed) % dailyMissions.length;
    return dailyMissions[missionIndex];
  }

  static getUserMission(userEmail: string, date?: string): UserMission | null {
    const targetDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const stored = localStorage.getItem(`${this.STORAGE_KEY}-${userEmail}-${targetDate}`);
    
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Create new mission for the target date
    const mission = this.getDailyMissionForDate(userEmail, targetDate);
    const userMission: UserMission = {
      mission,
      date: targetDate,
      completed: false,
      progress: 0
    };
    
    this.saveUserMission(userEmail, userMission);
    return userMission;
  }

  static saveUserMission(userEmail: string, userMission: UserMission): void {
    const key = `${this.STORAGE_KEY}-${userEmail}-${userMission.date}`;
    localStorage.setItem(key, JSON.stringify(userMission));
  }

  static completeMission(userEmail: string): boolean {
    const userMission = this.getUserMission(userEmail);
    if (!userMission || userMission.completed) return false;

    userMission.completed = true;
    this.saveUserMission(userEmail, userMission);
    
    // Update completion streak
    this.updateCompletionStreak(userEmail);
    return true;
  }

  static getMissionProgress(userEmail: string, todaysExpenses: any[], date?: string): number {
    const targetDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const userMission = this.getUserMission(userEmail, targetDate);
    if (!userMission) return 0;

    const mission = userMission.mission;
    
    // Filter expenses for the specific date
    const dateExpenses = todaysExpenses.filter(expense => {
      const expenseDate = new Date(expense.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      return expenseDate === targetDate;
    });

    switch (mission.type) {
      case 'no-spend':
        return dateExpenses.length === 0 ? 100 : 0;
      
      case 'limit-category':
        const categorySpend = dateExpenses
          .filter(e => e.category.toLowerCase().includes(mission.title.toLowerCase().split(' ')[0]))
          .reduce((sum, e) => sum + parseFloat(e.amount), 0);
        return mission.targetAmount ? Math.max(0, 100 - (categorySpend / mission.targetAmount * 100)) : 0;
      
      case 'track-expenses':
        return dateExpenses.length >= 3 ? 100 : (dateExpenses.length * 33);
      
      case 'save-target':
        const totalSpend = dateExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const savedAmount = Math.max(0, (mission.targetAmount || 100) - totalSpend);
        return Math.min(100, (savedAmount / (mission.targetAmount || 100)) * 100);
      
      default:
        return 0;
    }
  }

  private static updateCompletionStreak(userEmail: string): void {
    const streakKey = `laksha-mission-streak-${userEmail}`;
    const currentStreak = parseInt(localStorage.getItem(streakKey) || '0');
    localStorage.setItem(streakKey, (currentStreak + 1).toString());
  }

  static getCompletionStreak(userEmail: string): number {
    const streakKey = `laksha-mission-streak-${userEmail}`;
    return parseInt(localStorage.getItem(streakKey) || '0');
  }

  private static hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
}