import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Calendar, Plus, Zap, BarChart3, CheckCircle } from "lucide-react";

interface TooltipStep {
  id: string;
  selector: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position: "top" | "bottom" | "left" | "right";
}

interface GuidedTooltipsProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function GuidedTooltips({ isActive, onComplete, onSkip }: GuidedTooltipsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [targetElement, setTargetElement] = useState<Element | null>(null);

  const tooltipSteps: TooltipStep[] = [
    {
      id: "budget",
      selector: "[data-onboarding='budget-card']",
      title: "Set Your Monthly Budget",
      description: "📅 Set your Monthly Budget here — just tap and enter your amount.",
      icon: <Calendar className="w-5 h-5 text-blue-600" />,
      position: "bottom"
    },
    {
      id: "add-expense",
      selector: "[data-onboarding='add-expense-button']",
      title: "Add Daily Expenses",
      description: "➕ Add your daily Expenses from here.",
      icon: <Plus className="w-5 h-5 text-green-600" />,
      position: "top"
    },
    {
      id: "daily-limit",
      selector: "[data-onboarding='daily-limit']",
      title: "Daily Limit Tracker",
      description: "⚡ This shows your Daily Limit Tracker — stay within your budget!",
      icon: <Zap className="w-5 h-5 text-yellow-600" />,
      position: "bottom"
    },
    {
      id: "analytics",
      selector: "[data-onboarding='analytics-tab']",
      title: "View Analytics",
      description: "🔍 View analytics and insights in the Analytics tab.",
      icon: <BarChart3 className="w-5 h-5 text-purple-600" />,
      position: "top"
    }
  ];

  useEffect(() => {
    if (!isActive) return;

    const updateTooltipPosition = () => {
      const currentTooltip = tooltipSteps[currentStep];
      if (!currentTooltip) return;

      const element = document.querySelector(currentTooltip.selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetElement(element);
        
        let x = rect.left + rect.width / 2;
        let y = rect.top;

        switch (currentTooltip.position) {
          case "bottom":
            y = rect.bottom + 10;
            break;
          case "top":
            y = rect.top - 10;
            break;
          case "left":
            x = rect.left - 10;
            y = rect.top + rect.height / 2;
            break;
          case "right":
            x = rect.right + 10;
            y = rect.top + rect.height / 2;
            break;
        }

        setTooltipPosition({ x, y });
      }
    };

    updateTooltipPosition();
    window.addEventListener("resize", updateTooltipPosition);
    window.addEventListener("scroll", updateTooltipPosition);

    return () => {
      window.removeEventListener("resize", updateTooltipPosition);
      window.removeEventListener("scroll", updateTooltipPosition);
    };
  }, [currentStep, isActive]);

  useEffect(() => {
    if (!isActive) return;

    // Add highlight to target element
    if (targetElement) {
      targetElement.classList.add("onboarding-highlight");
      return () => {
        targetElement.classList.remove("onboarding-highlight");
      };
    }
  }, [targetElement, isActive]);

  const nextStep = () => {
    if (currentStep < tooltipSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const skipTour = () => {
    if (targetElement) {
      targetElement.classList.remove("onboarding-highlight");
    }
    onSkip();
  };

  if (!isActive || currentStep >= tooltipSteps.length) {
    return null;
  }

  const currentTooltip = tooltipSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 pointer-events-none" />
      
      {/* Spotlight effect */}
      {targetElement && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: targetElement.getBoundingClientRect().left - 8,
            top: targetElement.getBoundingClientRect().top - 8,
            width: targetElement.getBoundingClientRect().width + 16,
            height: targetElement.getBoundingClientRect().height + 16,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
            borderRadius: "12px",
          }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="fixed z-50 pointer-events-auto"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: `translate(-50%, ${currentTooltip.position === "bottom" ? "0%" : "-100%"})`,
          }}
        >
          <Card className="w-80 border-0 shadow-2xl bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {currentTooltip.icon}
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Step {currentStep + 1} of {tooltipSteps.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {currentTooltip.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                {currentTooltip.description}
              </p>

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Skip Tour
                </Button>
                <Button
                  onClick={nextStep}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {currentStep === tooltipSteps.length - 1 ? (
                    <>
                      Finish
                      <CheckCircle className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>

              {/* Arrow pointer */}
              <div
                className={`absolute w-3 h-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transform rotate-45 ${
                  currentTooltip.position === "bottom"
                    ? "-top-1.5 left-1/2 -translate-x-1/2"
                    : "-bottom-1.5 left-1/2 -translate-x-1/2"
                }`}
              />
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <style>{`
        .onboarding-highlight {
          position: relative;
          z-index: 51;
          border-radius: 12px;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
          animation: pulse-highlight 2s infinite;
        }

        @keyframes pulse-highlight {
          0%, 100% {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3);
          }
        }
      `}</style>
    </>
  );
}