import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, PieChart, Calendar, IndianRupee } from "lucide-react";
import Navigation from "@/components/navigation";
import CategoryBreakdown from "@/components/category-breakdown";
import { formatCurrency } from "@/lib/currency";
import { forceScrollRefresh } from "@/utils/mobileScrollFix";
import { useEffect } from "react";

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics/spending"],
  });

  const { data: expenses } = useQuery({
    queryKey: ["/api/expenses"],
  });

  // Force scroll fix on component mount
  useEffect(() => {
    forceScrollRefresh();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white min-h-screen">
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalSpent = (analytics as any)?.totalSpent || 0;
  const categorySpending = (analytics as any)?.categorySpending || {};
  const recentExpenses = (expenses as any)?.slice(0, 5) || [];

  return (
    <div className="bg-white">
      {/* Header - Clean GitHub-style */}
      <header className="bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="text-lg font-medium text-gray-900">Analytics</div>
          </div>
        </div>
      </header>

      {/* Analytics Content - Optimized for mobile scrolling */}
      <div className="p-6 space-y-6 pb-32"
           style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {/* Total Spending */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 font-semibold">
                <TrendingUp className="w-5 h-5" />
                This Month's Spending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(totalSpent)}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Total expenses across all categories
              </p>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 font-semibold">
                <PieChart className="w-5 h-5" />
                Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryBreakdown />
            </CardContent>
          </Card>

          {/* Recent Expenses */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 font-semibold">
                <Calendar className="w-5 h-5" />
                Recent Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentExpenses.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No expenses recorded yet
                </p>
              ) : (
                <div className="space-y-3">
                  {recentExpenses.map((expense: any) => (
                    <div key={expense.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{expense.description}</p>
                        <p className="text-sm text-gray-600">{expense.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{expense.amount}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
}