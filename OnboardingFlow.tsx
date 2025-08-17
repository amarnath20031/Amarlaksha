import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, Target, TrendingUp, Receipt, BarChart3, Calendar, Plus, Zap, Eye, Sparkles } from "lucide-react";

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 3;

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const steps = [
    {
      id: "welcome",
      component: <WelcomeStep onNext={nextStep} onSkip={onSkip} />
    },
    {
      id: "features",
      component: <FeaturesStep onNext={nextStep} onSkip={onSkip} />
    },
    {
      id: "getting-started",
      component: <GettingStartedStep onNext={nextStep} onSkip={onSkip} />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Skip
            </Button>
          </div>
          <Progress value={((currentStep + 1) / totalSteps) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={currentStep}
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
          >
            {steps[currentStep].component}
          </motion.div>
        </AnimatePresence>

        {/* Made in India Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          Made with ❤️ in India | Built for India 🇮🇳
        </div>
      </div>
    </div>
  );
}

// Welcome Step Component
function WelcomeStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardContent className="p-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              👋 Welcome to Laksha Coach
            </h1>
            <p className="text-lg text-blue-600 dark:text-blue-400 font-medium mb-6">
              Your AI-powered Financial Coach — built for India 🇮🇳
            </p>
          </div>

          <div className="space-y-4 text-left mb-8">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Laksha helps you track expenses, set budgets, and stay financially smart — every single day.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Whether you're a student, professional, or saver, Laksha is designed to simplify money management for you.
            </p>
          </div>

          <Button 
            onClick={onNext}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl"
            size="lg"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}

// Features Step Component
function FeaturesStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const features = [
    {
      icon: <Receipt className="w-8 h-8 text-green-600" />,
      title: "🧾 Track Expenses Easily",
      description: "Add your daily expenses in seconds with smart categorization."
    },
    {
      icon: <Target className="w-8 h-8 text-blue-600" />,
      title: "🎯 Set Smart Budgets",
      description: "Set your monthly limit and watch Laksha keep you on track."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-purple-600" />,
      title: "📊 Stay on Top of Spending",
      description: "Laksha reminds you when you're overspending and how to cut back."
    }
  ];

  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardContent className="p-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            💡 What Can You Do With Laksha?
          </h2>

          <div className="space-y-6 mb-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-100 dark:border-gray-600"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <Button 
            onClick={onNext}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl"
            size="lg"
          >
            Let's Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}

// Getting Started Step Component
function GettingStartedStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const tips = [
    {
      icon: <Calendar className="w-6 h-6 text-blue-600" />,
      text: "📅 Set your Monthly Budget here — just tap and enter your amount."
    },
    {
      icon: <Plus className="w-6 h-6 text-green-600" />,
      text: "➕ Add your daily Expenses from here."
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      text: "⚡ This shows your Daily Limit Tracker — stay within your budget!"
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-purple-600" />,
      text: "🔍 View analytics and insights in the Analytics tab."
    }
  ];

  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardContent className="p-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            🚀 Quick Guide
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Here's how to make the most of Laksha
          </p>

          <div className="space-y-4 mb-8">
            {tips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600"
              >
                <div className="flex-shrink-0 mt-1">
                  {tip.icon}
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {tip.text}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-8 border border-green-200 dark:border-green-700">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800 dark:text-green-300">
                You're all set!
              </span>
            </div>
            <p className="text-green-700 dark:text-green-400 text-sm">
              Laksha is now your daily money coach. Let's go 🚀
            </p>
          </div>

          <Button 
            onClick={onNext}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-3 rounded-xl"
            size="lg"
          >
            Start Using Laksha
            <Sparkles className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}