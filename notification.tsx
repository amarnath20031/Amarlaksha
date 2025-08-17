import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

interface NotificationProps {
  title: string;
  message: string;
  type?: 'warning' | 'success' | 'error';
  duration?: number;
  onClose?: () => void;
}

export default function Notification({ 
  title, 
  message, 
  type = 'warning', 
  duration = 4000,
  onClose 
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const bgColor = {
    warning: 'bg-accent',
    success: 'bg-secondary',
    error: 'bg-destructive'
  }[type];

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-full max-w-sm px-6 z-50 animate-fade-in">
      <Card className={`${bgColor} text-white p-4 shadow-lg`}>
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">{title}</p>
            <p className="text-sm opacity-90">{message}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
