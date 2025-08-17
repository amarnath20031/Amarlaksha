import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { UserOnboarding } from "@shared/schema";

export function useOnboardingStatus() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: onboardingData, isLoading: onboardingQueryLoading } = useQuery<UserOnboarding | null>({
    queryKey: ["/api/onboarding"],
    enabled: isAuthenticated && !!user && !authLoading,
    retry: false,
  });

  // Only show onboarding if user is authenticated and hasn't completed it
  // Wait for both auth and onboarding data to load before making decision
  const needsOnboarding = isAuthenticated && 
                          !authLoading && 
                          !onboardingQueryLoading && 
                          !onboardingData?.completed;

  return {
    onboardingData,
    needsOnboarding,
    isLoading: authLoading || (isAuthenticated && onboardingQueryLoading),
    isCompleted: !!onboardingData?.completed,
  };
}