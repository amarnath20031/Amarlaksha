import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, CheckCircle } from "lucide-react";
import { Link } from "wouter";

interface OnboardingCoachProps {
  onComplete: () => void;
}

export default function OnboardingCoach({ onComplete }: OnboardingCoachProps) {
  const [currentTip, setCurrentTip] = useState(0);

  const tips = [
    {
      emoji: "🎯",
      title: "Set Your Monthly Budget",
      description: "Start by setting a realistic monthly budget. Laksha will help you track your progress and send alerts.",
      action: "Next Step",
      link: null
    },
    {
      emoji: "💰",
      title: "Add Your First Expense",
      description: "Track every rupee spent. Use the blue + button or the Add Expense button to record your spending.",
      action: "Next Step",
      link: null
    },
    {
      emoji: "📊",
      title: "View Your Analytics",
      description: "Check your spending patterns and category breakdowns in the Analytics tab to make smarter decisions.",
      action: "Next Step",
      link: null
    },
    {
      emoji: "🚀",
      title: "You're All Set!",
      description: "Laksha will now help you stay on track with your budget. You'll get alerts when spending reaches 80% of your limits.",
      action: "Start Tracking",
      link: null
    }
  ];

  const nextTip = () => {
    if (currentTip < tips.length - 1) {
      setCurrentTip(currentTip + 1);
    } else {
      onComplete();
    }
  };

  const skipOnboarding = () => {
    onComplete();
  };

  const current = tips[currentTip];

  return (
    <Card className="fixed top-20 left-4 right-4 bg-white shadow-xl border-l-4 border-l-blue-500 z-50 max-w-md mx-auto">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2 flex-1 pr-3">
            <span className="text-2xl">{current.emoji}</span>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">{current.title}</h3>
              <p className="text-xs text-gray-500">Step {currentTip + 1} of {tips.length}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={skipOnboarding}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 h-6 w-6 p-0 -mt-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-gray-700 text-sm mb-4 leading-relaxed">
          {current.description}
        </p>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {currentTip === 0 && (
            <Link href="/budget">
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Go to Budget
              </Button>
            </Link>
          )}
          {currentTip === 1 && (
            <Link href="/expense">
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs border-green-200 text-green-700 hover:bg-green-50"
              >
                Add Expense
              </Button>
            </Link>
          )}
          {currentTip === 2 && (
            <Link href="/analytics">
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                View Analytics
              </Button>
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {tips.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index <= currentTip ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipOnboarding}
              className="text-gray-500 hover:text-gray-700"
            >
              Skip Tour
            </Button>
            
            {current.link ? (
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={nextTip}
              >
                {current.action}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={nextTip}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {current.action}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center border-t border-gray-100 pt-3">
          Made with ❤️ in <span style={{ fontFamily: 'Times New Roman, serif' }}>India</span> | Built for <span style={{ fontFamily: 'Times New Roman, serif' }}>India</span> 🇮🇳
        </div>
      </CardContent>
    </Card>
  );
}