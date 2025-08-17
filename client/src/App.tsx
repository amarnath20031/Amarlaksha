import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import OnboardingPage from "@/pages/onboarding";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import SignIn from "@/pages/signin";
import SignUp from "@/pages/signup";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import ExpenseForm from "@/pages/expense-form";
import BudgetSetting from "@/pages/budget-setting";
import Profile from "@/pages/profile";
import Analytics from "@/pages/analytics";
import Missions from "@/pages/missions";
import Transactions from "@/pages/transactions";

import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { needsOnboarding, isLoading: onboardingLoading } = useOnboardingStatus();

  // Show loading state while checking auth and onboarding status
  if (isLoading || (isAuthenticated && onboardingLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Authentication pages - always available */}
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      
      {/* Conditional routing based on auth state */}
      {!isAuthenticated ? (
        /* Show landing page for unauthenticated users */
        <Route path="*" component={Landing} />
      ) : needsOnboarding ? (
        /* Show onboarding for authenticated users who haven't completed it */
        <Route path="*" component={OnboardingPage} />
      ) : (
        /* Authenticated routes for users who completed onboarding */
        <>
          <Route path="/" component={Home} />
          <Route path="/home" component={Home} />
          <Route path="/dashboard" component={Home} />
          <Route path="/missions" component={Missions} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/expense" component={ExpenseForm} />
          <Route path="/budget" component={BudgetSetting} />
          <Route path="/profile" component={Profile} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/admin" component={AdminDashboard} />
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="app-container bg-background text-foreground min-h-screen">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
