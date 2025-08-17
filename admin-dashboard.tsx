import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Calendar, Activity } from "lucide-react";

export default function AdminDashboard() {
  const { data: userStats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: todayActiveUsers } = useQuery({
    queryKey: ["/api/activity/daily-users"],
    queryFn: async () => {
      const response = await fetch('/api/activity/daily-users');
      if (!response.ok) throw new Error('Failed to fetch daily users');
      return response.json();
    }
  });

  const { data: activityStats } = useQuery({
    queryKey: ["/api/activity/stats"],
    queryFn: async () => {
      const response = await fetch('/api/activity/stats?days=30');
      if (!response.ok) throw new Error('Failed to fetch activity stats');
      return response.json();
    }
  });

  if (!userStats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Laksha Budget App Analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{userStats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Today</p>
                  <p className="text-3xl font-bold text-gray-900">{todayActiveUsers?.activeUsers || 0}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Logins</p>
                  <p className="text-3xl font-bold text-gray-900">{activityStats?.totalLogins || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expenses Added</p>
                  <p className="text-3xl font-bold text-gray-900">{activityStats?.totalExpenses || 0}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Signups */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent User Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userStats.recentSignups.map((signup: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{signup.email}</p>
                    <p className="text-sm text-gray-500">New user</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{signup.signupDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Usage (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityStats?.dailyUsage && Object.entries(activityStats.dailyUsage).map(([date, count]) => (
                <div key={date} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{date}</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="bg-blue-500 h-2 rounded"
                      style={{ width: `${Math.max((count as number) * 10, 10)}px` }}
                    />
                    <span className="text-sm font-medium">{count} activities</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}