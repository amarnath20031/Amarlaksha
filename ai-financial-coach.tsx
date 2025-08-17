import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, TrendingUp, AlertTriangle, Lightbulb, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/currency";

interface FinancialInsight {
  type: 'warning' | 'tip' | 'achievement' | 'goal';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface UserPersonality {
  type: 'regular_saver' | 'impulsive_spender' | 'budget_tracker' | 'not_sure';
  spendingPattern: 'consistent' | 'sporadic' | 'weekend_heavy' | 'daily_small';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  goalOrientation: 'short_term' | 'long_term' | 'mixed';
}

export default function AIFinancialCoach() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [personality, setPersonality] = useState<UserPersonality | null>(null);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [dailyInsight, setDailyInsight] = useState<FinancialInsight | null>(null);
  const [showComeback, setShowComeback] = useState(false);

  // Fetch user onboarding data for personality analysis
  const { data: onboardingData } = useQuery({
    queryKey: ['/api/onboarding'],
    enabled: !!user
  });

  // Fetch recent expenses for behavior analysis
  const { data: recentExpenses } = useQuery({
    queryKey: ['/api/expenses', 20],
    queryFn: async () => {
      const response = await fetch('/api/expenses?limit=20');
      if (!response.ok) throw new Error('Failed to fetch expenses');
      return response.json();
    },
    enabled: !!user
  });

  // Fetch budget data
  const { data: budget } = useQuery({
    queryKey: ['/api/budget'],
    enabled: !!user
  });

  // Fetch spending analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics/spending', 'month'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/spending?period=month');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    enabled: !!user
  });

  // Add timeout timer for loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!insights.length) {
        setIsTimedOut(true);
      }
    }, 8000); // 8 second timeout

    return () => clearTimeout(timer);
  }, [insights.length, retryCount]);

  // Analyze user behavior and generate insights
  useEffect(() => {
    if (!onboardingData || !recentExpenses || !budget || !analytics) return;

    console.log('🧠 AI Coach analyzing user data:', {
      onboarding: onboardingData,
      expenses: recentExpenses.length,
      budget: (budget as any)?.amount || 'no budget',
      analytics: analytics.totalSpent
    });

    const generatedInsights = analyzeUserBehavior({
      onboarding: onboardingData,
      expenses: recentExpenses,
      budget,
      analytics
    });

    const userPersonality = determinePersonalityProfile({
      onboarding: onboardingData,
      expenses: recentExpenses,
      analytics
    });

    setInsights(generatedInsights);
    setPersonality(userPersonality);
    setIsTimedOut(false);
  }, [onboardingData, recentExpenses, budget, analytics, retryCount]);

  // Daily personalized insights logic - show one tip per day, visible all day (24 hours)
  useEffect(() => {
    if (!onboardingData || !(user as any)?.email) return;

    // Get current IST time for accurate Indian timezone comparison
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const today = istTime.toDateString(); // IST date string
    
    const userKey = `laksha_user_${(user as any).email}`;
    const dailyInsightKey = `${userKey}_daily_insight_date`;
    const insightHideTimeKey = `${userKey}_insight_hide_time`;
    
    const lastShownDate = localStorage.getItem(dailyInsightKey);
    const hideTime = localStorage.getItem(insightHideTimeKey);
    
    console.log('📅 Daily tip logic - IST Today:', today, 'Last shown:', lastShownDate);
    
    // Reset hide time if it's a new day (after midnight IST)
    if (lastShownDate !== today) {
      localStorage.removeItem(insightHideTimeKey);
      console.log('🌅 New day detected - reset hide time');
    }
    
    // Show insight if: new day OR user hasn't manually hidden today's tip
    const shouldShowInsight = (lastShownDate !== today) || !hideTime;
    
    if (!shouldShowInsight) {
      console.log('❌ Tip hidden by user today');
      setShowComeback(true);
      return;
    }

    // Generate personalized insights based on user data
    const personalizedInsights = generateDailyInsights(onboardingData);
    
    // Calculate which insight to show based on days since signup (using IST dates)
    const signupDate = localStorage.getItem(`${userKey}_signup_date`) || today;
    const daysSinceSignup = Math.floor((new Date(today).getTime() - new Date(signupDate).getTime()) / (1000 * 60 * 60 * 24));
    const insightIndex = Math.abs(daysSinceSignup) % personalizedInsights.length;
    
    const todayInsight = personalizedInsights[insightIndex];
    setDailyInsight(todayInsight);
    setShowComeback(false);
    
    console.log('✅ Showing daily tip:', insightIndex, todayInsight.title);
    
    // Mark this insight as shown today (only on first show of the day)
    if (lastShownDate !== today) {
      localStorage.setItem(dailyInsightKey, today);
    }

    // Set signup date if not set (for new users)
    if (!localStorage.getItem(`${userKey}_signup_date`)) {
      localStorage.setItem(`${userKey}_signup_date`, today);
    }
  }, [onboardingData, user]);

  const generateDailyInsights = (onboardingData: any): FinancialInsight[] => {
    const { ageGroup, employmentStatus, savingGoal, moneyPersonality, monthlyIncomeRange } = onboardingData;
    
    const baseInsights: FinancialInsight[] = [
      {
        type: 'tip',
        title: 'Smart Savings Strategy',
        message: `As a ${employmentStatus.toLowerCase()}, try the 50-30-20 rule: 50% needs, 30% wants, 20% savings. Start small if you're new to budgeting!`,
        priority: 'high',
        category: 'Savings'
      },
      {
        type: 'tip',
        title: 'Track Your Chai Money',
        message: `Small daily expenses like chai, coffee, and snacks add up! Track them for a week to see where ₹200-500 might be going monthly.`,
        priority: 'medium',
        category: 'Daily Expenses'
      },
      {
        type: 'goal',
        title: 'Emergency Fund First',
        message: `Before investing, build an emergency fund of 3-6 months expenses. For ${ageGroup} individuals, this provides crucial financial security.`,
        priority: 'high',
        category: 'Emergency Fund'
      },
      {
        type: 'tip',
        title: 'Festival Budget Planning',
        message: `Plan ahead for festivals! Set aside ₹500-2000 monthly in a separate festival fund to avoid overspending during celebrations.`,
        priority: 'medium',
        category: 'Festival Planning'
      },
      {
        type: 'achievement',
        title: 'You\'re Building Great Habits',
        message: `Using Laksha shows you care about your financial future. Keep tracking your expenses - even small steps lead to big changes!`,
        priority: 'low',
        category: 'Motivation'
      }
    ];

    // Customize insights based on user profile
    if (savingGoal === 'house') {
      baseInsights.push({
        type: 'goal',
        title: 'Home Loan Planning',
        message: `For your house goal, start building a credit score and saving for down payment. Aim for 20% down payment to get better loan terms.`,
        priority: 'high',
        category: 'Home Purchase'
      });
    }

    if (moneyPersonality === 'impulsive_spender') {
      baseInsights.push({
        type: 'tip',
        title: 'The 24-Hour Rule',
        message: `Before any non-essential purchase over ₹1000, wait 24 hours. This simple trick can save you thousands per month!`,
        priority: 'high',
        category: 'Spending Control'
      });
    }

    if (ageGroup === '18-25') {
      baseInsights.push({
        type: 'tip',
        title: 'Start Investing Early',
        message: `In your 20s, time is your biggest asset. Even ₹1000/month in SIP can grow to lakhs by retirement due to compound interest!`,
        priority: 'medium',
        category: 'Investment'
      });
    }

    return baseInsights;
  };

  const getPersonalityBadge = () => {
    if (!personality) return null;

    const badges = {
      regular_saver: { label: "The Steady Saver", color: "bg-green-100 text-green-800", icon: "💰" },
      impulsive_spender: { label: "The Spender-In-Training", color: "bg-orange-100 text-orange-800", icon: "🛍️" },
      budget_tracker: { label: "The Financial Planner", color: "bg-blue-100 text-blue-800", icon: "📊" },
      not_sure: { label: "The Financial Explorer", color: "bg-purple-100 text-purple-800", icon: "🔍" }
    };

    const badge = badges[personality.type];
    return (
      <Badge className={`${badge.color} px-3 py-1 text-sm font-medium`}>
        {badge.icon} {badge.label}
      </Badge>
    );
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'tip': return <Lightbulb className="h-5 w-5 text-blue-500" />;
      case 'achievement': return <Star className="h-5 w-5 text-yellow-500" />;
      case 'goal': return <Target className="h-5 w-5 text-green-500" />;
      default: return <Brain className="h-5 w-5 text-purple-500" />;
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setIsTimedOut(false);
    setInsights([]);
  };

  // Show daily insight if available, otherwise show comeback message or loading
  return (
    <Card className="mb-6 border-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Financial Coach
          </CardTitle>
          {getPersonalityBadge()}
        </div>
      </CardHeader>
      <CardContent>
        {dailyInsight ? (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-purple-700 mb-2">📅 Today's Financial Tip</h3>
              <p className="text-sm text-gray-600">Personalized insight just for you</p>
            </div>
            
            <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
              {getInsightIcon(dailyInsight.type)}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">{dailyInsight.title}</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{dailyInsight.message}</p>
                <Badge variant="outline" className="mt-3 text-xs bg-white">
                  {dailyInsight.category}
                </Badge>
              </div>
            </div>
          </div>
        ) : showComeback ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🌅</div>
            <h3 className="font-semibold text-gray-900 mb-2">You're all caught up!</h3>
            <p className="text-sm text-gray-600 mb-4">
              Come back tomorrow for your next personalized financial tip
            </p>
            <Badge className="bg-green-100 text-green-800">
              Next tip available tomorrow
            </Badge>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
              <p className="text-gray-600">Loading your personalized insight...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function analyzeUserBehavior({ onboarding, expenses, budget, analytics }: any): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  const budgetAmount = parseFloat(budget?.amount || '0');
  const totalSpent = analytics.totalSpent || 0;
  const spentPercentage = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;

  // Analyze spending psychology based on onboarding data
  const employmentStatus = onboarding.employmentStatus;
  const incomeRange = onboarding.monthlyIncomeRange;
  const moneyPersonality = onboarding.moneyPersonality;
  const savingGoal = onboarding.savingGoal;
  const ageGroup = onboarding.ageGroup;

  console.log('🧠 Analyzing financial behavior:', {
    employmentStatus,
    incomeRange,
    moneyPersonality,
    savingGoal,
    ageGroup,
    spentPercentage
  });

  // Personality-based insights
  if (moneyPersonality === 'impulsive_spender') {
    if (spentPercentage > 70) {
      insights.push({
        type: 'warning',
        title: 'Impulse Spending Alert',
        message: `You've spent ${spentPercentage.toFixed(0)}% of your budget. As an impulsive spender, try the 24-hour rule: wait a day before making non-essential purchases.`,
        priority: 'high',
        category: 'Psychology'
      });
    }
    
    insights.push({
      type: 'tip',
      title: 'Impulse Control Strategy',
      message: 'Set up automatic transfers to savings right after payday to reduce temptation. Pre-commit your money to goals.',
      priority: 'medium',
      category: 'Behavioral'
    });
  }

  if (moneyPersonality === 'regular_saver' && spentPercentage < 50) {
    insights.push({
      type: 'achievement',
      title: 'Excellent Saving Discipline!',
      message: `Great job! You've only spent ${spentPercentage.toFixed(0)}% of your budget. Your regular saving habit is paying off.`,
      priority: 'low',
      category: 'Achievement'
    });
  }

  if (moneyPersonality === 'budget_tracker' && spentPercentage > 80) {
    insights.push({
      type: 'warning',
      title: 'Budget Tracker Alert',
      message: `You're usually great at tracking - but you've hit ${spentPercentage.toFixed(0)}% of budget. Review your categories to identify the overspend.`,
      priority: 'high',
      category: 'Budget Tracking'
    });
  }

  // Employment-based insights
  if (employmentStatus === 'student') {
    insights.push({
      type: 'tip',
      title: 'Student Financial Tip',
      message: 'Build emergency savings of ₹5,000-10,000 for unexpected college expenses. Consider part-time income sources.',
      priority: 'medium',
      category: 'Student Life'
    });
  }

  if (employmentStatus === 'freelancer') {
    insights.push({
      type: 'tip',
      title: 'Freelancer Buffer Strategy',
      message: 'Keep 3-6 months expenses saved due to irregular income. Set aside 30% for taxes and business expenses.',
      priority: 'high',
      category: 'Freelance'
    });
  }

  // Goal-based insights
  if (savingGoal === 'gadget' && spentPercentage > 60) {
    insights.push({
      type: 'goal',
      title: 'Gadget Goal Check',
      message: 'Slow down spending to reach your gadget goal faster! Consider selling old items to boost your gadget fund.',
      priority: 'medium',
      category: 'Goal Progress'
    });
  }

  if (savingGoal === 'house' && spentPercentage < 60) {
    insights.push({
      type: 'achievement',
      title: 'House Savings on Track',
      message: 'Excellent progress toward your home goal! Consider increasing SIP investments for faster wealth building.',
      priority: 'medium',
      category: 'Long-term Goal'
    });
  }

  // Age-based insights
  if (ageGroup === 'under_18' || ageGroup === '18_24') {
    insights.push({
      type: 'tip',
      title: 'Young Saver Advantage',
      message: 'Start investing small amounts in mutual funds now - time is your biggest advantage for compound growth!',
      priority: 'medium',
      category: 'Youth Finance'
    });
  }

  // Spending pattern analysis
  if (expenses.length > 0) {
    const recentDays = getSpendingPatternAnalysis(expenses);
    
    if (recentDays.hasWeekendSpikes) {
      insights.push({
        type: 'warning',
        title: 'Weekend Spending Pattern',
        message: 'You tend to overspend on weekends. Plan weekend activities in advance with a fixed budget.',
        priority: 'medium',
        category: 'Spending Pattern'
      });
    }

    if (recentDays.hasLargeTransactions) {
      insights.push({
        type: 'tip',
        title: 'Large Purchase Strategy',
        message: 'You make occasional large purchases. Use the 10% rule: save 10% more than the item cost before buying.',
        priority: 'medium',
        category: 'Purchase Strategy'
      });
    }
  }

  // Income vs spending insights
  const incomeRanges = {
    'under_10k': 8000,
    '10k_30k': 20000,
    '30k_60k': 45000,
    '60k_100k': 80000,
    'above_100k': 120000
  };

  const estimatedIncome = incomeRanges[incomeRange as keyof typeof incomeRanges] || 30000;
  const savingsRate = ((estimatedIncome - totalSpent) / estimatedIncome) * 100;

  if (savingsRate < 20) {
    insights.push({
      type: 'warning',
      title: 'Low Savings Rate',
      message: `You're saving only ${savingsRate.toFixed(0)}% of income. Aim for 20-30% savings rate for financial security.`,
      priority: 'high',
      category: 'Savings Rate'
    });
  } else if (savingsRate > 50) {
    insights.push({
      type: 'achievement',
      title: 'Super Saver!',
      message: `Outstanding ${savingsRate.toFixed(0)}% savings rate! Consider investing surplus for wealth building.`,
      priority: 'low',
      category: 'Savings Rate'
    });
  }

  return insights.sort((a, b) => {
    const priority = { high: 3, medium: 2, low: 1 };
    return priority[b.priority] - priority[a.priority];
  });
}

function determinePersonalityProfile({ onboarding, expenses, analytics }: any): UserPersonality {
  const moneyPersonality = onboarding?.moneyPersonality || 'not_sure';
  const employmentStatus = onboarding?.employmentStatus;
  const savingGoal = onboarding?.savingGoal;
  
  // Analyze spending patterns from expense data
  let spendingPattern: 'consistent' | 'sporadic' | 'weekend_heavy' | 'daily_small' = 'consistent';
  let riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate';
  let goalOrientation: 'short_term' | 'long_term' | 'mixed' = 'mixed';
  
  if (expenses?.length > 0) {
    const patterns = getSpendingPatternAnalysis(expenses);
    spendingPattern = patterns.hasWeekendSpikes ? 'weekend_heavy' : 
                    patterns.hasSmallDaily ? 'daily_small' : 
                    patterns.isSporadic ? 'sporadic' : 'consistent';
  }
  
  // Determine risk tolerance based on goals and personality
  if (savingGoal === 'investment' || savingGoal === 'business') {
    riskTolerance = 'aggressive';
  } else if (savingGoal === 'emergency' || employmentStatus === 'retired') {
    riskTolerance = 'conservative';
  }
  
  // Determine goal orientation based on saving goals
  if (savingGoal === 'gadget' || savingGoal === 'vacation') {
    goalOrientation = 'short_term';
  } else if (savingGoal === 'house' || savingGoal === 'retirement') {
    goalOrientation = 'long_term';
  }
  
  return {
    type: moneyPersonality,
    spendingPattern,
    riskTolerance,
    goalOrientation
  };
}

function getSpendingPatternAnalysis(expenses: any[]) {
  if (!expenses || expenses.length === 0) {
    return {
      hasWeekendSpikes: false,
      hasSmallDaily: false,
      isSporadic: false,
      hasLargeTransactions: false
    };
  }
  
  const recentExpenses = expenses.slice(0, 14); // Last 14 transactions
  const amounts = recentExpenses.map(e => parseFloat(e.amount));
  const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
  
  // Check for weekend spending patterns
  let weekendTotal = 0;
  let weekdayTotal = 0;
  let weekendCount = 0;
  let weekdayCount = 0;
  
  recentExpenses.forEach(expense => {
    const date = new Date(expense.date);
    const dayOfWeek = date.getDay();
    const amount = parseFloat(expense.amount);
    
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      weekendTotal += amount;
      weekendCount++;
    } else {
      weekdayTotal += amount;
      weekdayCount++;
    }
  });
  
  const weekendAvg = weekendCount > 0 ? weekendTotal / weekendCount : 0;
  const weekdayAvg = weekdayCount > 0 ? weekdayTotal / weekdayCount : 0;
  
  return {
    hasWeekendSpikes: weekendAvg > weekdayAvg * 1.5,
    hasSmallDaily: avgAmount < 500 && amounts.filter(a => a < 300).length > amounts.length * 0.7,
    isSporadic: amounts.some(a => a > avgAmount * 3),
    hasLargeTransactions: amounts.some(a => a > 2000)
  };
}

