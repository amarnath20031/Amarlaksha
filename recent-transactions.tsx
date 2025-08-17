import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryIcons } from "@/lib/categories";
import { formatCurrency } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { Link } from "wouter";

interface RecentTransactionsProps {
  selectedDate?: Date;
}

export default function RecentTransactions({ selectedDate }: RecentTransactionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get date string for filtering (default to recent if no date selected)
  const dateStr = selectedDate ? 
    selectedDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : 
    undefined;
  
  const { data: expenses, isLoading } = useQuery({
    queryKey: ['/api/expenses', dateStr],
    queryFn: async () => {
      const url = dateStr ? `/api/expenses?date=${dateStr}` : '/api/expenses?limit=10';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch expenses');
      return response.json();
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: number) => {
      console.log('🗑️ Deleting expense:', expenseId);
      return await apiRequest("DELETE", `/api/expenses/${expenseId}`);
    },
    onSuccess: (response, expenseId) => {
      console.log('✅ Delete success:', response);
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/spending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily-limit'] });
      queryClient.invalidateQueries({ queryKey: ['/api/budget'] });
      toast({
        title: "Expense Deleted",
        description: "Your expense has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      console.error('❌ Delete error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="mb-20">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Transactions</CardTitle>
            <Skeleton className="h-4 w-16" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <Card className="mb-20">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Transactions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No transactions yet.</p>
            <p className="text-sm">Add your first expense to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-20">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Recent Transactions</CardTitle>
          <Link href="/analytics">
            <Button variant="ghost" size="sm" className="text-primary">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {expenses.map((expense: any) => {
          const categoryInfo = categoryIcons[expense.category];
          const expenseDate = new Date(expense.date);
          
          // Get current IST date string and expense IST date string
          const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD format
          const expenseIST = expenseDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD format
          
          // Calculate yesterday's date in IST
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayIST = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
          
          const isToday = expenseIST === todayIST;
          const isYesterday = expenseIST === yesterdayIST;
          
          return (
            <div key={expense.id} className="flex items-center justify-between group">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  categoryInfo ? categoryInfo.bgColor : 'bg-gray-100'
                }`}>
                  <span className="text-lg">
                    {categoryInfo?.emoji || '🏷️'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-neutral-800">
                    {expense.description || expense.category}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {isToday 
                      ? `Today, ${expenseDate.toLocaleString('en-IN', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true,
                          timeZone: 'Asia/Kolkata'
                        })} IST` 
                      : isYesterday 
                        ? `Yesterday, ${expenseDate.toLocaleString('en-IN', { 
                            hour: 'numeric', 
                            minute: '2-digit', 
                            hour12: true,
                            timeZone: 'Asia/Kolkata'
                          })} IST` 
                        : expenseDate.toLocaleString('en-IN', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: 'numeric', 
                            minute: '2-digit', 
                            hour12: true,
                            timeZone: 'Asia/Kolkata'
                          }) + ' IST'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-neutral-800">
                  {formatCurrency(expense.amount)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => deleteExpenseMutation.mutate(expense.id)}
                  disabled={deleteExpenseMutation.isPending}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
