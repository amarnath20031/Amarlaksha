import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X, AlertTriangle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BudgetNotification {
  id: number;
  userId: string;
  budgetId: number;
  notificationType: string;
  triggered: boolean;
  triggerDate: string;
  message: string;
  createdAt: string;
}

export default function BudgetNotifications() {
  const queryClient = useQueryClient();
  
  const { data: notifications = [] } = useQuery<BudgetNotification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("POST", `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'budget_50':
        return <Bell className="w-5 h-5 text-blue-500" />;
      case '80_percent':
      case 'budget_80':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case '100_percent':
      case 'budget_100':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'daily_limit':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'budget_50':
        return 'border-blue-200 bg-blue-50';
      case '80_percent':
      case 'budget_80':
        return 'border-yellow-200 bg-yellow-50';
      case '100_percent':
      case 'budget_100':
        return 'border-red-200 bg-red-50';
      case 'daily_limit':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <Card key={notification.id} className={`${getNotificationColor(notification.notificationType)} border-l-4`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {getNotificationIcon(notification.notificationType)}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.triggerDate).toLocaleString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAsReadMutation.mutate(notification.id)}
                disabled={markAsReadMutation.isPending}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}