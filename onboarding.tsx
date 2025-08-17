import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface OnboardingData {
  employmentStatus: string;
  monthlyIncomeRange: string;
  topExpenseCategories: string[];
  savingGoal: string;
  moneyPersonality: string;
  ageGroup: string;
}

const initialData: OnboardingData = {
  employmentStatus: "",
  monthlyIncomeRange: "",
  topExpenseCategories: [],
  savingGoal: "",
  moneyPersonality: "",
  ageGroup: "",
};

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const updateData = (field: keyof OnboardingData, value: string | string[]) => {
    setOnboardingData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || !(user as any)?.email) {
      toast({
        title: "Authentication Error",
        description: "Please log in again.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...onboardingData,
          userEmail: (user as any)?.email,
          completed: true
          // completedAt is set server-side
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save onboarding data");
      }

      toast({
        title: "Welcome to Laksha! 🎉",
        description: "Your profile has been set up successfully. Let's start managing your finances!",
      });

      // Redirect to home page after completing onboarding
      // Add a small delay to ensure the API call completes and the user session is updated
      setTimeout(() => {
        // Force a page reload to ensure proper routing and auth state update
        window.location.href = "/home";
      }, 1000);
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    in: {
      x: 0,
      opacity: 1
    },
    out: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <EmploymentStep 
            data={onboardingData} 
            updateData={updateData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <SpendingStep 
            data={onboardingData} 
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 3:
        return (
          <GoalsStep 
            data={onboardingData} 
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 4:
        return (
          <PersonalityStep 
            data={onboardingData} 
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 5:
        return (
          <AgeStep 
            data={onboardingData} 
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to Laksha AI
          </h1>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Coach!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Let's personalize your financial journey
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(progress)}% complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            custom={1}
            variants={slideVariants}
            initial="initial"
            animate="in"
            exit="out"
            transition={{
              type: "tween",
              ease: "easeInOut",
              duration: 0.3
            }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Step 1: Employment & Income
interface StepProps {
  data: OnboardingData;
  updateData: (field: keyof OnboardingData, value: string | string[]) => void;
  onNext: () => void;
  onPrev?: () => void;
  isSubmitting?: boolean;
}

function EmploymentStep({ data, updateData, onNext }: StepProps) {
  const employmentOptions = [
    { value: "student", label: "I'm a Student", emoji: "🎓" },
    { value: "salaried", label: "I'm a Salaried Employee", emoji: "👨‍💼" },
    { value: "freelancer", label: "I'm a Freelancer / Self-employed", emoji: "💼" },
    { value: "homemaker", label: "I'm a Homemaker", emoji: "🏠" },
    { value: "unemployed", label: "I'm currently Unemployed", emoji: "🚫" },
  ];

  const incomeOptions = [
    { value: "under_10k", label: "Less than ₹10,000" },
    { value: "10k_30k", label: "₹10,000 – ₹30,000" },
    { value: "30k_60k", label: "₹30,000 – ₹60,000" },
    { value: "60k_100k", label: "₹60,000 – ₹1,00,000" },
    { value: "above_100k", label: "More than ₹1,00,000" },
  ];

  const canProceed = data.employmentStatus !== "";

  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-gray-800 dark:text-gray-100">
          Employment & Income
        </CardTitle>
        <p className="text-gray-600 dark:text-gray-300">
          Tell us about your work situation
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Employment Status */}
        <div>
          <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-100">
            What best describes your current work situation?
          </h3>
          <div className="space-y-3">
            {employmentOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateData("employmentStatus", option.value)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3 ${
                  data.employmentStatus === option.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Income Range */}
        <div>
          <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">
            What's your monthly income range? (Optional)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Helps us offer realistic tips for your situation.
          </p>
          <div className="space-y-2">
            {incomeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateData("monthlyIncomeRange", option.value)}
                className={`w-full p-3 rounded-lg border transition-all duration-200 text-left ${
                  data.monthlyIncomeRange === option.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Button 
          onClick={onNext} 
          disabled={!canProceed}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}

// Step 2: Spending Habits
function SpendingStep({ data, updateData, onNext, onPrev }: StepProps) {
  const expenseOptions = [
    { value: "food", label: "Food & delivery", emoji: "🍔" },
    { value: "transport", label: "Transport & fuel", emoji: "🚌" },
    { value: "entertainment", label: "Entertainment & outings", emoji: "🎮" },
    { value: "rent", label: "Rent or housing", emoji: "🏠" },
    { value: "subscriptions", label: "Subscriptions & apps", emoji: "📱" },
    { value: "loans", label: "EMIs / Loans", emoji: "💳" },
    { value: "grocery", label: "Grocery", emoji: "🛒" },
    { value: "shopping", label: "Shopping", emoji: "🛍️" },
  ];

  const toggleCategory = (category: string) => {
    const current = data.topExpenseCategories || [];
    const updated = current.includes(category)
      ? current.filter((c: string) => c !== category)
      : [...current, category];
    updateData("topExpenseCategories", updated);
  };

  const canProceed = (data.topExpenseCategories || []).length > 0;

  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-gray-800 dark:text-gray-100">
          Spending Habits
        </CardTitle>
        <p className="text-gray-600 dark:text-gray-300">
          What do you spend the most on each month?
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          (Pick one or more)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-3">
          {expenseOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => toggleCategory(option.value)}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3 ${
                (data.topExpenseCategories || []).includes(option.value)
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <span className="text-2xl">{option.emoji}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {option.label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={onPrev} 
            variant="outline" 
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!canProceed}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 3: Financial Goals
function GoalsStep({ data, updateData, onNext, onPrev }: StepProps) {
  const goalOptions = [
    { value: "gadget", label: "A new gadget or vehicle", emoji: "🛵" },
    { value: "education", label: "Education or upskilling", emoji: "🎓" },
    { value: "vacation", label: "A vacation or trip", emoji: "🏖️" },
    { value: "house", label: "Buying a house or moving", emoji: "🏡" },
    { value: "family", label: "Supporting family", emoji: "👨‍👩‍👧" },
    { value: "investment", label: "Investing & long-term wealth", emoji: "📈" },
  ];

  const canProceed = data.savingGoal !== "";

  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-gray-800 dark:text-gray-100">
          Financial Goals
        </CardTitle>
        <p className="text-gray-600 dark:text-gray-300">
          What are you currently saving for?
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          (Pick your top goal)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {goalOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateData("savingGoal", option.value)}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3 ${
                data.savingGoal === option.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <span className="text-2xl">{option.emoji}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {option.label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={onPrev} 
            variant="outline" 
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!canProceed}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 4: Money Personality
function PersonalityStep({ data, updateData, onNext, onPrev }: StepProps) {
  const personalityOptions = [
    { value: "regular_saver", label: "I try to save regularly", emoji: "🧘‍♂️" },
    { value: "impulsive_spender", label: "I often spend impulsively", emoji: "😬" },
    { value: "budget_tracker", label: "I track and plan my budget", emoji: "📊" },
    { value: "not_sure", label: "I'm not really sure yet", emoji: "🤷" },
  ];

  const canProceed = data.moneyPersonality !== "";

  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-gray-800 dark:text-gray-100">
          Money Personality
        </CardTitle>
        <p className="text-gray-600 dark:text-gray-300">
          How would you describe your money habits?
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          (Choose the one that feels closest)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {personalityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateData("moneyPersonality", option.value)}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3 ${
                data.moneyPersonality === option.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <span className="text-2xl">{option.emoji}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {option.label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={onPrev} 
            variant="outline" 
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!canProceed}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 5: Age Group
function AgeStep({ data, updateData, onNext, onPrev, isSubmitting }: StepProps) {
  const ageOptions = [
    { value: "under_18", label: "Under 18" },
    { value: "18_24", label: "18–24" },
    { value: "25_34", label: "25–34" },
    { value: "35_50", label: "35–50" },
    { value: "50_plus", label: "50+" },
  ];

  const canProceed = data.ageGroup !== "";

  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-gray-800 dark:text-gray-100">
          Age Group (Optional)
        </CardTitle>
        <p className="text-gray-600 dark:text-gray-300">
          Which age group do you fall into?
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          (Tunes your advice based on life stage)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {ageOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateData("ageGroup", option.value)}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                data.ageGroup === option.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {option.label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={onPrev} 
            variant="outline" 
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={onNext} 
            disabled={!canProceed || isSubmitting}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSubmitting ? "Setting up your profile..." : "Complete Setup"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}