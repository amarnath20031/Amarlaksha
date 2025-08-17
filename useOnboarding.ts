import { useState, useEffect } from "react";

const ONBOARDING_KEY = "laksha_onboarding_completed";
const TOOLTIPS_KEY = "laksha_tooltips_completed";

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTooltips, setShowTooltips] = useState(false);

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem(ONBOARDING_KEY);
    const tooltipsCompleted = localStorage.getItem(TOOLTIPS_KEY);

    if (!onboardingCompleted) {
      setShowOnboarding(true);
    } else if (!tooltipsCompleted) {
      // Small delay to let the main app load first
      setTimeout(() => {
        setShowTooltips(true);
      }, 1000);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
    
    // Start tooltips after onboarding
    setTimeout(() => {
      setShowTooltips(true);
    }, 500);
  };

  const skipOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    localStorage.setItem(TOOLTIPS_KEY, "true");
    setShowOnboarding(false);
    setShowTooltips(false);
  };

  const completeTooltips = () => {
    localStorage.setItem(TOOLTIPS_KEY, "true");
    setShowTooltips(false);
  };

  const skipTooltips = () => {
    localStorage.setItem(TOOLTIPS_KEY, "true");
    setShowTooltips(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(TOOLTIPS_KEY);
    setShowOnboarding(true);
    setShowTooltips(false);
  };

  return {
    showOnboarding,
    showTooltips,
    completeOnboarding,
    skipOnboarding,
    completeTooltips,
    skipTooltips,
    resetOnboarding,
  };
}