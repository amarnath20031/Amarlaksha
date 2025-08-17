import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, Target } from "lucide-react";
import { MissionManager, type UserMission } from "@/lib/missions";
import { SoundManager } from "@/lib/sounds";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface DailyMissionCardProps {
  selectedDate?: Date;
}

export default function DailyMissionCard({ selectedDate }: DailyMissionCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userMission, setUserMission] = useState<UserMission | null>(null);
  
  // Get date string for the selected date (default to today)
  const dateStr = selectedDate ? 
    selectedDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) :
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  
  // Fetch expenses for the selected date to calculate progress
  const { data: expenses = [] } = useQuery({
    queryKey: ['/api/expenses', dateStr],
    queryFn: async () => {
      const response = await fetch(`/api/expenses?date=${dateStr}`);
      if (!response.ok) throw new Error('Failed to fetch expenses');
      return response.json();
    },
    enabled: !!((user as any)?.email),
  });

  useEffect(() => {
    if ((user as any)?.email) {
      const mission = MissionManager.getUserMission((user as any).email, dateStr);
      setUserMission(mission);
    }
  }, [(user as any)?.email, dateStr]);

  const calculateProgress = () => {
    if (!(user as any)?.email || !userMission) return 0;
    return MissionManager.getMissionProgress((user as any).email, expenses, dateStr);
  };

  const handleCompleteMission = () => {
    if (!(user as any)?.email || !userMission || userMission.completed) return;

    const progress = calculateProgress();
    if (progress >= 100) {
      const success = MissionManager.completeMission((user as any).email);
      if (success) {
        // Play success sound
        const soundManager = SoundManager.getInstance();
        soundManager.playMissionComplete();
        
        // Update local state
        setUserMission(prev => prev ? { ...prev, completed: true } : null);
        
        // Show celebration
        toast({
          title: "Mission Complete! 🎉",
          description: `You've earned your daily mission streak! Keep it up!`,
          duration: 4000,
        });
      }
    } else {
      toast({
        title: "Mission Not Ready",
        description: `You're ${Math.round(progress)}% there! Keep going!`,
        variant: "default",
      });
    }
  };

  if (!userMission) return null;

  const progress = calculateProgress();
  const isComplete = userMission.completed || progress >= 100;
  const completionStreak = (user as any)?.email ? MissionManager.getCompletionStreak((user as any).email) : 0;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Target className="h-5 w-5" />
          Today's Mission
          {completionStreak > 0 && (
            <span className="text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full ml-auto">
              🔥 {completionStreak} streak
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{userMission.mission.emoji}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {userMission.mission.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {userMission.mission.description}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Button
            onClick={handleCompleteMission}
            disabled={!isComplete || userMission.completed}
            className={`w-full ${
              isComplete
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
            size="sm"
          >
            {userMission.completed ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Completed!
              </>
            ) : isComplete ? (
              'Mark Complete'
            ) : (
              'In Progress...'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}