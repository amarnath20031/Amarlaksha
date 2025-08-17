import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettings {
  dailyReminders: boolean;
  budgetAlerts: boolean;
  weeklyReports: boolean;
  timezone: string;
  reminderTime: string;
  pushToken?: string;
}

export default function PushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    dailyReminders: true,
    budgetAlerts: true,
    weeklyReports: true,
    timezone: 'Asia/Kolkata',
    reminderTime: '19:00'
  });
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      checkSubscriptionStatus();
      loadSettings();
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setIsSubscribed(!!data.pushToken);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const urlB64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToNotifications = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Check current permission status first
      const currentPermission = Notification.permission;
      console.log('Current notification permission:', currentPermission);
      
      if (currentPermission === 'denied') {
        toast({
          title: "Notifications Blocked",
          description: "Please enable notifications in your browser settings manually.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Request notification permission
      const permission = await Notification.requestPermission();
      console.log('Permission request result:', permission);
      
      if (permission !== 'granted') {
        let message = "Please allow notifications to receive reminders.";
        if (permission === 'denied') {
          message = "Notifications were blocked. Please enable them in browser settings: ⋮ > Site settings > Notifications > Allow";
        }
        toast({
          title: "Permission Denied",
          description: message,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID public key from server
      const vapidResponse = await fetch('/api/notifications/vapid-key');
      const { publicKey } = await vapidResponse.json();

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(publicKey)
      });

      // Send subscription to server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription })
      });

      if (response.ok) {
        setIsSubscribed(true);
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive daily reminders and budget alerts.",
        });
      } else {
        throw new Error('Failed to subscribe to notifications');
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      toast({
        title: "Subscription Failed",
        description: "Failed to enable notifications. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromNotifications = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove subscription from server
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      setIsSubscribed(false);
      toast({
        title: "Notifications Disabled",
        description: "You will no longer receive push notifications.",
      });
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      toast({
        title: "Error",
        description: "Failed to disable notifications. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = async () => {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        toast({
          title: "Test Sent",
          description: "A test notification has been sent to your device.",
        });
      } else {
        throw new Error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Test Failed",
        description: "Failed to send test notification.",
        variant: "destructive"
      });
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BellOff className="w-5 h-5" />
            <span>Push Notifications</span>
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {isSubscribed ? (
            <Bell className="w-5 h-5 text-green-600" />
          ) : (
            <BellOff className="w-5 h-5 text-gray-400" />
          )}
          <span>Push Notifications</span>
        </CardTitle>
        <CardDescription>
          Get daily reminders and budget alerts sent directly to your device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              Status: {isSubscribed ? 'Enabled' : 'Disabled'}
            </p>
            <p className="text-sm text-gray-500">
              {isSubscribed 
                ? 'You\'ll receive notifications for daily reminders and budget alerts'
                : 'Enable notifications to get helpful reminders'
              }
            </p>
          </div>
          <div className="flex space-x-2">
            {isSubscribed ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testNotification}
                  disabled={isLoading}
                >
                  Test
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={unsubscribeFromNotifications}
                  disabled={isLoading}
                >
                  <X className="w-4 h-4 mr-1" />
                  Disable
                </Button>
              </>
            ) : (
              <Button
                onClick={subscribeToNotifications}
                disabled={isLoading}
                size="sm"
              >
                <Check className="w-4 h-4 mr-1" />
                Enable
              </Button>
            )}
          </div>
        </div>

        {isSubscribed && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Notification Types</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Daily spending reminders (7:00 PM IST)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Budget threshold alerts</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-600" />
                <span>Weekly financial reports</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}