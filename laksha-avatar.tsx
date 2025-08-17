import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AvatarGreeting {
  message: string;
  subMessage: string;
  emoji: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
}

const greetings: AvatarGreeting[] = [
  {
    message: "Good morning! Ready to track your expenses today?",
    subMessage: "Start your day with smart financial decisions 🌅",
    emoji: "☀️",
    timeOfDay: 'morning'
  },
  {
    message: "Good afternoon! How's your spending going today?",
    subMessage: "Keep an eye on your budget and stay on track 📊",
    emoji: "🌤️",
    timeOfDay: 'afternoon'
  },
  {
    message: "Good evening! Time to review today's expenses",
    subMessage: "Reflect on your spending and plan for tomorrow 🌙",
    emoji: "🌙",
    timeOfDay: 'evening'
  }
];

const motivationalMessages = [
  "Every rupee saved is a rupee earned! 💰",
  "Smart spending leads to financial freedom 🎯",
  "Track today, prosper tomorrow! 📈",
  "Your future self will thank you for budgeting 🙏",
  "Small expenses, big impact when tracked! 📱"
];

export default function LakshaAvatar() {
  const { user } = useAuth();
  const [showGreeting, setShowGreeting] = useState(false);
  const [currentGreeting, setCurrentGreeting] = useState<AvatarGreeting | null>(null);

  useEffect(() => {
    if (!user?.email) return;

    const userKey = `laksha_user_${user.email}`;
    const today = new Date().toDateString();
    const lastShownDate = localStorage.getItem(`${userKey}_avatar_last_shown`);

    // Only show once per day
    if (lastShownDate === today) return;

    // Determine time of day
    const hour = new Date().getHours();
    let timeOfDay: 'morning' | 'afternoon' | 'evening';
    
    if (hour < 12) {
      timeOfDay = 'morning';
    } else if (hour < 17) {
      timeOfDay = 'afternoon';
    } else {
      timeOfDay = 'evening';
    }

    // Find appropriate greeting
    const greeting = greetings.find(g => g.timeOfDay === timeOfDay) || greetings[0];
    setCurrentGreeting(greeting);
    setShowGreeting(true);

    // Mark as shown for today
    localStorage.setItem(`${userKey}_avatar_last_shown`, today);
  }, [user]);

  const handleDismiss = () => {
    setShowGreeting(false);
  };

  if (!showGreeting || !currentGreeting) return null;

  const randomMotivation = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Laksha Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
              L
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-lg">{currentGreeting.emoji}</span>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Laksha Coach</h3>
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2 leading-relaxed">
                {currentGreeting.message}
              </p>
              
              <p className="text-gray-600 dark:text-gray-400 text-xs mb-3">
                {currentGreeting.subMessage}
              </p>
              
              <div className="bg-white/50 dark:bg-white/10 rounded-md p-2 border border-purple-100 dark:border-purple-700">
                <p className="text-purple-700 dark:text-purple-300 text-xs font-medium">
                  💡 {randomMotivation}
                </p>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 h-6 w-6 p-0 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}