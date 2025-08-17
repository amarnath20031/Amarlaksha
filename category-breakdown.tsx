import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryIcons } from "@/lib/categories";
import { formatCurrency } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function CategoryBreakdown() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics/spending', 'day', new Date().toISOString().split('T')[0]],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/analytics/spending?period=day&date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  const { data: budget } = useQuery({
    queryKey: ['/api/budget'],
  });

  // Get expenses by category for expanded categories
  const { data: expenses } = useQuery({
    queryKey: ['/api/expenses', 'recent'],
    queryFn: async () => {
      const response = await fetch('/api/expenses?limit=50');
      if (!response.ok) throw new Error('Failed to fetch expenses');
      return response.json();
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: number) => {
      return await apiRequest("DELETE", `/api/expenses/${expenseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/spending'] });
      toast({
        title: "Expense Deleted",
        description: "Your expense has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getExpensesForCategory = (category: string) => {
    if (!expenses) return [];
    return expenses.filter((expense: any) => expense.category === category);
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const categorySpending = analytics?.categorySpending || {};
  const budgetAmount = budget ? parseFloat(budget.amount) : 25000;
  
  // Calculate category budgets (default distribution if not set)
  const defaultCategoryBudgets = {
    "Food & Dining": budgetAmount * 0.15,
    "Transport": budgetAmount * 0.09,
    "Groceries": budgetAmount * 0.12,
    "Entertainment": budgetAmount * 0.06,
    "Health": budgetAmount * 0.06,
    "Shopping": budgetAmount * 0.06,
    "Petrol": budgetAmount * 0.072,
    "Mobile Recharge": budgetAmount * 0.018,
    "Rent": budgetAmount * 0.45,
  };

  const categoryBudgets = budget?.categoryBudgets 
    ? JSON.parse(budget.categoryBudgets) 
    : defaultCategoryBudgets;

  const sortedCategories = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6); // Show top 6 categories

  if (sortedCategories.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No expenses recorded yet.</p>
            <p className="text-sm">Start adding expenses to see breakdown.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedCategories.map(([category, amount]) => {
          const categoryInfo = categoryIcons[category] || {
            icon: "fas fa-tag",
            color: "text-purple-600",
            bgColor: "bg-purple-100"
          };
          const categoryBudget = categoryBudgets[category] || 0;
          const percentage = categoryBudget > 0 ? (amount / categoryBudget) * 100 : 0;
          const isOverBudget = percentage > 80;
          
          const categoryExpenses = getExpensesForCategory(category);
          const isExpanded = expandedCategories.has(category);
          
          return (
            <div key={category} className="border rounded-lg p-3 bg-neutral-50">
              <div 
                className="flex items-center justify-between cursor-pointer" 
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${categoryInfo.bgColor}`}>
                    <span className="text-lg">{categoryInfo.emoji}</span>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800">{category}</p>
                    <p className="text-sm text-neutral-500">
                      {categoryBudget > 0 ? `Budget: ${formatCurrency(categoryBudget)}` : 'No budget set'} • {categoryExpenses.length} expense{categoryExpenses.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="font-semibold text-neutral-800">{formatCurrency(amount)}</p>
                    <p className={`text-sm ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.round(percentage)}% of budget
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </Button>
                </div>
              </div>
              
              {/* Expanded expenses list */}
              {isExpanded && categoryExpenses.length > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-200 space-y-2">
                  {categoryExpenses.map((expense: any) => {
                    const expenseDate = new Date(expense.date);
                    
                    // Get current IST date string and expense IST date string
                    const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD format
                    const expenseIST = expenseDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD format
                    
                    // Calculate yesterday's date in IST
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayIST = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
                    
                    const daysDiff = todayIST === expenseIST ? 0 : 
                                    yesterdayIST === expenseIST ? 1 : 
                                    Math.floor((new Date(todayIST).getTime() - new Date(expenseIST).getTime()) / (1000 * 60 * 60 * 24));
                    const istDate = expenseDate;
                    
                    return (
                      <div key={expense.id} className="flex items-center justify-between p-2 bg-white rounded-lg group">
                        <div className="flex-1">
                          <p className="font-medium text-neutral-800 text-sm">
                            {expense.description || expense.category}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {daysDiff === 0 
                              ? `Today, ${istDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}` 
                              : daysDiff === 1
                                ? `Yesterday, ${istDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}` 
                                : istDate.toLocaleString('en-IN', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    hour: 'numeric', 
                                    minute: '2-digit', 
                                    hour12: true,
                                    timeZone: 'Asia/Kolkata'
                                  })
                            } • {expense.method}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-neutral-800 text-sm">
                            {formatCurrency(parseFloat(expense.amount))}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteExpenseMutation.mutate(expense.id);
                            }}
                            disabled={deleteExpenseMutation.isPending}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {isExpanded && categoryExpenses.length === 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-200 text-center text-neutral-500 text-sm">
                  No expenses in this category today
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
