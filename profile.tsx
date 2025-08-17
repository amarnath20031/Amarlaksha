import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Calendar, LogOut, Smartphone, Volume2, VolumeX } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Navigation from "@/components/navigation";
import PushNotifications from "@/components/push-notifications";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { SoundManager } from "@/lib/sounds";


export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Check if PWA can be installed and initialize sound settings
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
    }

    // Initialize sound settings
    const soundManager = SoundManager.getInstance();
    setSoundEnabled(soundManager.isEnabled());

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        toast({
          title: "Signed Out",
          description: "You have been successfully signed out.",
        });
        // Redirect to landing page
        window.location.href = '/';
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Install Not Available",
        description: "Your device doesn't support app installation or LAKSHA is already installed.",
      });
      return;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast({
          title: "LAKSHA Installed!",
          description: "LAKSHA has been added to your home screen.",
        });
        setShowInstallButton(false);
      } else {
        toast({
          title: "Installation Cancelled",
          description: "You can install LAKSHA later from this menu.",
        });
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWA install error:', error);
      toast({
        title: "Install Failed",
        description: "Unable to install LAKSHA. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24 profile-page">
      {/* Header - Clean GitHub-style */}
      <header className="bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="text-lg font-medium text-gray-900">Profile</div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6 pb-8 mobile-content profile-content">
          {/* User Info Card */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 font-semibold">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900 break-all text-sm">{(user as any)?.email}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Member since:</span>
                <span className="font-medium">
                  {(user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString() : 'Recently'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>App Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Sound Effects Toggle */}
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                <div className="flex items-center gap-3">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-400" />
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-900">Sound Effects</span>
                    <p className="text-xs text-gray-600">Play sounds when adding expenses</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={soundEnabled}
                    onCheckedChange={() => {
                      const soundManager = SoundManager.getInstance();
                      const newState = soundManager.toggleSounds();
                      setSoundEnabled(newState);
                      
                      if (newState) {
                        soundManager.playExpenseAdded();
                        toast({
                          title: "Sound Effects Enabled",
                          description: "You'll hear sounds when adding expenses!",
                        });
                      } else {
                        toast({
                          title: "Sound Effects Disabled",
                          description: "Sound feedback is now off.",
                        });
                      }
                    }}
                  />

                </div>
              </div>

              {/* Restart Welcome Tour */}
              <Button
                variant="outline"
                className="w-full justify-start text-blue-700 hover:text-blue-900 hover:bg-blue-50 border-blue-200"
                onClick={() => {
                  if (user) {
                    const userKey = `laksha_user_${(user as any).email}`;
                    localStorage.removeItem(`${userKey}_welcome_seen`);
                    localStorage.removeItem(`${userKey}_coach_completed`);
                    localStorage.setItem(`${userKey}_is_new_user`, 'true');
                    // Navigate without showing login interface
                    window.location.replace('/');
                  }
                }}
              >
                <Calendar className="w-4 h-4 mr-3 text-blue-400" />
                Show Welcome Tour Again
              </Button>

              {/* PWA Install Button */}
              {showInstallButton && (
                <Button 
                  variant="outline" 
                  onClick={handleInstallPWA}
                  className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Add LAKSHA to Home Screen
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Push Notifications */}
          <PushNotifications />

          {/* Sign Out */}
          <Card>
            <CardContent className="pt-6">
              {/* Sign Out Button */}
              <button 
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <Navigation />
    </div>
  );
}