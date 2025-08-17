import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/currency";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit } from "lucide-react";

export default function BudgetOverview() {
  const { data: budget, isLoading: budgetLoading } = useQuery({
    queryKey: ['/api/budget'],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/analytics/spending', (budget as any)?.type || 'monthly', 'cumulative'],
    queryFn: async () => {
      const budgetType = (budget as any)?.type || 'monthly';
      let url;
      
      if (budgetType === 'daily') {
        // For daily budget, only show today's spending
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        url = `/api/analytics/spending?period=day&date=${today}`;
      } else {
        // For monthly budget, show ALL TIME spending (cumulative) to fix persistence issue
        url = '/api/analytics/spending?period=all';
      }
      
      console.log('📊 Fetching analytics from:', url);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      console.log('📊 Analytics data received:', data);
      return data;
    },
    enabled: !!budget,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    staleTime: 5000 // Consider data stale after 5 seconds for immediate updates
  });

  if (budgetLoading || analyticsLoading) {
    return (
      <Card className="gradient-primary text-white p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Skeleton className="h-4 w-24 mb-2 bg-white/20" />
            <Skeleton className="h-8 w-32 bg-white/20" />
          </div>
          <Skeleton className="h-10 w-10 bg-white/20 rounded-xl" />
        </div>
        <Skeleton className="h-3 w-full mb-2 bg-white/20" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20 bg-white/20" />
          <Skeleton className="h-4 w-20 bg-white/20" />
        </div>
      </Card>
    );
  }

  const budgetAmount = budget ? parseFloat((budget as any).amount) : 25000;
  const totalSpent = analytics?.totalSpent || 0;
  const remaining = budgetAmount - totalSpent;
  const usedPercentage = (totalSpent / budgetAmount) * 100;

  return (
    <Card 
      data-onboarding="budget-card"
      className="bg-gradient-to-r from-blue-600 to-green-500 text-white p-6 mb-6 border border-gray-200 shadow-sm"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-blue-100 text-sm">
            {(budget as any)?.type === 'daily' ? 'Daily Budget' : 'Monthly Budget'}
          </p>
          <p className="text-3xl font-bold">{formatCurrency(budgetAmount)}</p>
        </div>
        <Link href="/budget">
          <Button variant="ghost" size="icon" className="bg-white/20 hover:bg-white/30 text-white rounded-lg">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <Progress 
            value={Math.min(usedPercentage, 100)} 
            className="flex-1 h-3 bg-white/20"
          />
          <span className="text-sm font-medium">{Math.round(usedPercentage)}%</span>
        </div>
        
        <div className="flex justify-between text-sm text-blue-100">
          <span>Used: {formatCurrency(totalSpent)}</span>
          <span>Left: {formatCurrency(remaining)}</span>
        </div>
      </div>
    </Card>
  );
}
