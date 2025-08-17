import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Plus, Mic, Bell, LogOut, Calendar, TrendingUp, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import BudgetOverview from "@/components/budget-overview";
import BudgetNotifications from "@/components/budget-notifications";
import Navigation from "@/components/navigation";
import OnboardingCoach from "@/components/onboarding-coach";
import MotivationalQuote from "@/components/motivational-quote";
import LakshaAvatar from "@/components/laksha-avatar";
import AIFinancialCoach from "@/components/ai-financial-coach";


import Notification from "@/components/notification";
import DateExpenseCalendar from "@/components/date-expense-calendar";
import { formatCurrency } from "@/lib/currency";

// Helper functions
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
};

const getTodayDateString = () => {
  const today = new Date();
  return today.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
};

export default function Home() {
  const [location, setLocation] = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOnboardingCoach, setShowOnboardingCoach] = useState(false);

  // Initialize with current IST date
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const istDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return new Date(istDateStr + 'T00:00:00.000+05:30');
  });

  // Get selected date as string for API queries
  const selectedDateStr = selectedDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type?: 'warning' | 'success' | 'error';
  } | null>(null);
  
  const { user } = useAuth();

  // Check if this is a NEW user (first signup) vs returning user (just signing in)
  useEffect(() => {
    if (!(user as any)?.email) return;
    
    const userKey = `laksha_user_${(user as any)?.email}`;
    const hasSeenWelcome = localStorage.getItem(`${userKey}_welcome_seen`);
    const hasSeenCoach = localStorage.getItem(`${userKey}_coach_completed`);
    
    // Check if server indicates this is a new user OR manual restart
    const isManualRestart = localStorage.getItem(`${userKey}_is_new_user`) === 'true';
    const isServerNewUser = (user as any)?.isNewUser === true;
    
    // Only show onboarding to genuinely new users or manual restarts
    if ((isServerNewUser || isManualRestart) && !hasSeenWelcome) {
      setShowWelcome(true);
      // Clear manual restart flag after showing welcome
      if (isManualRestart) {
        localStorage.removeItem(`${userKey}_is_new_user`);
      }
    } else if ((isServerNewUser || isManualRestart) && !hasSeenCoach && hasSeenWelcome) {
      // Show coach after welcome is dismissed for new users only
      setTimeout(() => setShowOnboardingCoach(true), 1000);
    }
  }, [user]);

  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics/spending', 'day', selectedDateStr],
    queryFn: async () => {
      // Use selected date for daily analytics
      const response = await fetch(`/api/analytics/spending?period=day&date=${selectedDateStr}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute to update for day changes
    refetchOnWindowFocus: true
  });

  const { data: budget } = useQuery({
    queryKey: ['/api/budget'],
  });

  const { data: dailyLimitData } = useQuery({
    queryKey: ['/api/analytics/daily-limit', selectedDateStr],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/daily-limit?date=${selectedDateStr}`);
      if (!response.ok) throw new Error('Failed to fetch daily limit');
      return response.json();
    },
    refetchInterval: 1000, // Refetch every second for real-time updates after expense changes
    refetchOnWindowFocus: true
  });

  // Real-time budget alerts with proper Indian timezone
  useEffect(() => {
    const timer = setTimeout(() => {
      if (analytics && (budget as any)?.amount) {
        const budgetAmount = parseFloat((budget as any)?.amount || '0');
        const totalSpent = (analytics as any)?.totalSpent || 0;
        const percentage = (totalSpent / budgetAmount) * 100;
        
        // Budget threshold notifications
        if (percentage >= 100) {
          setNotification({
            title: "Budget Exceeded! 🚨",
            message: `You've spent ₹${totalSpent.toLocaleString('en-IN')} (${Math.round(percentage)}% of budget). Consider reviewing your expenses.`,
            type: 'error'
          });
        } else if (percentage >= 80) {
          setNotification({
            title: "Budget Alert! ⚠️",
            message: `You've used ${Math.round(percentage)}% of your monthly budget. ₹${(budgetAmount - totalSpent).toLocaleString('en-IN')} remaining.`,
            type: 'warning'
          });
        }
        
        // Daily limit alerts
        if (dailyLimitData && dailyLimitData.todaySpent) {
          const dailyLimit = budgetAmount / 30; // Simple daily estimate
          const dailyPercentage = (dailyLimitData.todaySpent / dailyLimit) * 100;
          
          if (dailyPercentage >= 100) {
            setNotification({
              title: "Daily Limit Reached! 📊",
              message: `Today's spending: ₹${dailyLimitData.todaySpent.toLocaleString('en-IN')}. Daily limit: ₹${dailyLimit.toLocaleString('en-IN')}`,
              type: 'warning'
            });
          }
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [analytics, budget, dailyLimitData]);



  // Use actual daily limit and spending from API instead of calculations
  const dailyLimit = dailyLimitData?.dailyLimit || 0;
  const todaySpent = dailyLimitData?.dailySpent || 0;
  const todayPercentage = dailyLimit > 0 ? (todaySpent / dailyLimit) * 100 : 0;
  


  return (
    <div className="page-container bg-white">
      {/* Header - Clean GitHub-style */}
      <header className="bg-white px-6 py-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="text-lg font-medium text-gray-900">Laksha</div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/';
                } catch (error) {
                  window.location.href = '/';
                }
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Responsive scrollable structure */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6 pb-20 md:pb-6">
        {/* Laksha Avatar Greeting */}
        <div className="mb-4">
          <LakshaAvatar />
        </div>

        {/* Budget Notifications */}
        <div className="mb-6">
          <BudgetNotifications />
        </div>

        {/* Welcome Banner for New Users */}
      {showWelcome && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">👋 Welcome to Laksha Coach!</h3>
              </div>
              <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                Your AI-powered Financial Coach — built for India 🇮🇳. Track expenses, set budgets, and stay financially smart every day.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="text-green-600">🧾</span>
                  <span>Track expenses easily</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="text-blue-600">🎯</span>
                  <span>Set smart budgets</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="text-purple-600">📊</span>
                  <span>Stay on top of spending</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Link href="/budget">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Set Your Budget
                  </Button>
                </Link>
                <Link href="/expense">
                  <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                    Add First Expense
                  </Button>
                </Link>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if ((user as any)?.email) {
                  const userKey = `laksha_user_${(user as any).email}`;
                  localStorage.setItem(`${userKey}_welcome_seen`, 'true');
                  setShowWelcome(false);
                  // Start onboarding coach after welcome is dismissed
                  setTimeout(() => setShowOnboardingCoach(true), 500);
                }
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </Button>
          </div>
          <div className="mt-4 text-xs text-gray-500 text-center border-t border-blue-100 pt-3">
            Made with ❤️ in <span style={{ fontFamily: 'Times New Roman, serif' }}>India</span> | Built for <span style={{ fontFamily: 'Times New Roman, serif' }}>India</span> 🇮🇳
          </div>
        </div>
      )}

      {/* Budget Overview */}
        <BudgetOverview />

        {/* Main Content with Tabs - Clean GitHub style */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 rounded-md p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <div className="mb-6">
              <Link href="/expense">
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md border border-green-600 text-sm font-medium transition-colors">
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Expense
                </button>
              </Link>
            </div>

            {/* Today's Spending */}
            <Card 
              data-onboarding="daily-limit"
              className="border border-gray-200 shadow-sm"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Today's Spending</h3>
                  <span className="text-sm text-gray-600">
                    {new Date().toLocaleDateString('en-IN', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(todaySpent)}
                  </span>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Daily Limit</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(dailyLimit)}
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  {/* Emoji Feedback */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span 
                        className={`text-2xl cursor-pointer ${
                          todayPercentage > 130 ? 'animate-shake' : 
                          todayPercentage > 110 ? 'animate-wiggle' : 
                          todayPercentage > 100 ? 'animate-pulse' : 
                          todayPercentage >= 50 ? 'animate-wiggle' : 
                          'animate-bounce'
                        }`}
                        title={
                          todayPercentage > 130 ? "Way over budget! Time to be strict 😠" :
                          todayPercentage > 110 ? "Significantly overspent 😞" :
                          todayPercentage > 100 ? "Oops! You've overspent today 😓" :
                          todayPercentage >= 50 ? "You're getting close to your limit. Stay cautious!" :
                          "You're doing great! Keep it up!"
                        }
                      >
                        {todayPercentage > 130 ? '😠' : 
                         todayPercentage > 110 ? '😞' : 
                         todayPercentage > 100 ? '😓' : 
                         todayPercentage >= 50 ? '😐' : 
                         '😀'}
                      </span>
                      <span className={`font-medium text-sm ${
                        todayPercentage > 130 ? 'text-red-700 font-bold' : 
                        todayPercentage > 110 ? 'text-red-600 font-bold' : 
                        todayPercentage > 100 ? 'text-red-500 font-bold' : 
                        todayPercentage >= 50 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {todayPercentage.toFixed(0)}% of daily limit
                      </span>
                    </div>
                    
                    {/* Motivational message */}
                    <span className={`text-xs font-medium ${
                      todayPercentage > 130 ? 'text-red-700 font-bold' : 
                      todayPercentage > 110 ? 'text-red-600 font-bold' : 
                      todayPercentage > 100 ? 'text-red-500 font-bold' : 
                      todayPercentage >= 50 ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {todayPercentage > 130 ? 'Way Over!' :
                       todayPercentage > 110 ? 'Too Much!' :
                       todayPercentage > 100 ? 'Over Budget!' :
                       todayPercentage >= 80 ? 'Almost There!' :
                       todayPercentage >= 50 ? 'Stay Cautious' :
                       'Great Job!'}
                    </span>
                  </div>

                  {/* Progress Bar - HTML5 progress element with CSS classes */}
                  <div className="w-full">
                    <div className={`progress-container ${
                      todayPercentage >= 100 ? 'over-budget' : 
                      todayPercentage >= 50 ? 'warning' : 'safe'
                    }`}>
                      <div 
                        className={`progress-fill ${
                          todayPercentage >= 100 ? 'fill-red' : 
                          todayPercentage >= 50 ? 'fill-orange' : 'fill-green'
                        } ${todayPercentage > 100 ? 'pulse-effect' : ''}`}
                        style={{ width: `${Math.min(todayPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Status messages only */}
                  <div className="mt-3 flex justify-end text-xs">
                    {todayPercentage >= 100 && (
                      <span className="text-red-600 font-bold animate-pulse">
                        Over by {formatCurrency(todaySpent - dailyLimit)}
                      </span>
                    )}
                    {todayPercentage >= 50 && todayPercentage < 100 && (
                      <span className="text-orange-600 font-medium">
                        {formatCurrency(dailyLimit - todaySpent)} left
                      </span>
                    )}
                    {todayPercentage < 50 && (
                      <span className="text-green-600 font-medium">
                        On track! 🎯
                      </span>
                    )}
                  </div>

                  {/* Motivational tip */}
                  <div className="mt-2 p-2 rounded-lg text-xs text-center" style={{
                    backgroundColor: todayPercentage > 130 ? '#fecaca' : 
                                   todayPercentage > 110 ? '#fed7d7' : 
                                   todayPercentage > 100 ? '#fee2e2' : 
                                   todayPercentage >= 50 ? '#fed7aa' : '#dcfce7'
                  }}>
                    <span className={
                      todayPercentage > 130 ? 'text-red-800 font-bold' : 
                      todayPercentage > 110 ? 'text-red-700 font-bold' : 
                      todayPercentage > 100 ? 'text-red-700' : 
                      todayPercentage >= 50 ? 'text-orange-700' : 'text-green-700'
                    }>
                      {todayPercentage > 130 ? "🚨 Emergency! Cut all non-essential spending now!" :
                       todayPercentage > 110 ? "⚠️ Seriously over budget - review your expenses" :
                       todayPercentage > 100 ? "💡 Try planning smaller expenses tomorrow!" :
                       todayPercentage >= 50 ? "💡 Consider postponing non-essential purchases" :
                       "💡 Nice job! Try keeping it below 50% tomorrow!"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Financial Coach */}
            <AIFinancialCoach />

            {/* Motivational Quote */}
            <div className="mt-6">
              <MotivationalQuote />
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <DateExpenseCalendar 
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </TabsContent>
        </Tabs>

        {/* Enhanced In-app Notification */}
        {notification && (
        <div className={`fixed top-20 left-4 right-4 p-4 rounded-lg shadow-lg z-50 border-l-4 ${
          notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
          notification.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
          'bg-green-50 border-green-500 text-green-800'
        }`}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
              <p className="text-sm leading-relaxed">{notification.message}</p>
              <div className="flex mt-3 space-x-2">
                <Link href="/analytics">
                  <button className="text-xs bg-white px-2 py-1 rounded border hover:bg-gray-50">
                    View Details
                  </button>
                </Link>
                <Link href="/budget">
                  <button className="text-xs bg-white px-2 py-1 rounded border hover:bg-gray-50">
                    Adjust Budget
                  </button>
                </Link>
              </div>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600 ml-3 text-lg"
            >
              ✕
            </button>
          </div>
        </div>
        )}

        {/* Onboarding Coach */}
        {showOnboardingCoach && (
          <OnboardingCoach
            onComplete={() => {
              if ((user as any)?.email) {
                const userKey = `laksha_user_${(user as any).email}`;
                localStorage.setItem(`${userKey}_coach_completed`, 'true');
                setShowOnboardingCoach(false);
              }
            }}
          />
        )}

        {/* Bottom Navigation */}
        <Navigation />
      </div>
    </div>
  );
}
