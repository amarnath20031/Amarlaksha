import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { StreakTracker as StreakTrackerLib, type StreakData } from "@/lib/streaks";
import { useAuth } from "@/hooks/useAuth";

export default function StreakTracker() {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<StreakData | null>(null);

  useEffect(() => {
    if (user?.email) {
      const data = StreakTrackerLib.getStreakData(user.email);
      setStreakData(data);
    }
  }, [user?.email]);

  if (!streakData) return null;

  const emoji = StreakTrackerLib.getStreakEmoji(streakData.currentStreak);
  const message = StreakTrackerLib.getStreakMessage(streakData.currentStreak);

  return (
    <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="text-3xl">{emoji}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {streakData.currentStreak}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                day{streakData.currentStreak !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              {message}
            </p>
            <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>Longest: {streakData.longestStreak} days</span>
              <span>Total: {streakData.totalDaysLogged} days</span>
            </div>
          </div>
        </div>
        
        {/* Visual streak representation */}
        <div className="mt-4 flex gap-1 overflow-x-auto">
          {Array.from({ length: Math.min(streakData.currentStreak, 14) }, (_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-orange-400 dark:bg-orange-500 rounded-full flex-shrink-0"
            />
          ))}
          {streakData.currentStreak > 14 && (
            <span className="text-xs text-gray-500 ml-2 flex items-center">
              +{streakData.currentStreak - 14} more
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}