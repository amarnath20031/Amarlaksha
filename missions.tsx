import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import DailyMissionCard from "@/components/daily-mission-card";
import StreakTracker from "@/components/streak-tracker";
import Navigation from "@/components/navigation";
import BudgetNotifications from "@/components/budget-notifications";

export default function Missions() {
  const { user } = useAuth();
  
  // Initialize with current IST date
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const istDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return new Date(istDateStr + 'T00:00:00.000+05:30');
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-gray-100">Daily Missions</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Complete challenges & build streaks</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6 mobile-content">
        {/* Budget Notifications */}
        <div className="mb-6">
          <BudgetNotifications />
        </div>

        {/* Missions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <DailyMissionCard selectedDate={selectedDate} />
          <StreakTracker />
        </div>

        {/* Bottom Navigation */}
        <Navigation />
      </div>
    </div>
  );
}