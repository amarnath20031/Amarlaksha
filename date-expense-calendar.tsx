import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/currency";
import { categoryIcons } from "@/lib/categories";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DateExpenseCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export default function DateExpenseCalendar({ selectedDate, onDateSelect }: DateExpenseCalendarProps) {
  // Initialize with current IST month
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    const istDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return new Date(istDateStr + 'T00:00:00.000+05:30');
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: number) => {
      console.log('🗑️ Deleting expense from calendar:', expenseId);
      return await apiRequest("DELETE", `/api/expenses/${expenseId}`);
    },
    onSuccess: (response, expenseId) => {
      console.log('✅ Calendar delete success:', response);
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/spending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/month-summary'] });
      toast({
        title: "Expense Deleted",
        description: "Your expense has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      console.error('❌ Calendar delete error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  // Use IST date in YYYY-MM-DD format for proper date queries
  const dateStr = selectedDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  // Get expenses for the selected date
  const { data: dayExpenses } = useQuery({
    queryKey: ['/api/expenses', dateStr],
    queryFn: async () => {
      const response = await fetch(`/api/expenses?date=${dateStr}`);
      if (!response.ok) throw new Error('Failed to fetch expenses');
      return response.json();
    }
  });
  
  console.log('📅 Calendar Debug:', {
    selectedDate: dateStr,
    originalDate: selectedDate,
    istDate: selectedDate,
    dayExpenses,
    expensesCount: dayExpenses?.length || 0,
    url: `/api/expenses?date=${dateStr}`
  });

  // Get expense summary for the month to show dots on calendar
  const { data: monthSummary } = useQuery({
    queryKey: ['/api/analytics/month-summary', currentMonth.getFullYear(), currentMonth.getMonth()],
    queryFn: async () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const response = await fetch(`/api/analytics/month-summary?year=${year}&month=${month}`);
      if (!response.ok) throw new Error('Failed to fetch month summary');
      return response.json();
    }
  });

  const today = new Date();
  const isToday = (date: Date) => {
    const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const dateIST = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return dateIST === todayIST;
  };

  const isSelected = (date: Date) => {
    // Compare IST date strings for proper selection
    const dateISTStr = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const selectedISTStr = selectedDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return dateISTStr === selectedISTStr;
  };

  const hasExpenses = (date: Date) => {
    // Convert date to IST for proper comparison
    const istDateStr = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return monthSummary?.expenseDates?.includes(istDateStr);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const totalDayExpenses = dayExpenses?.reduce((total: number, expense: any) => total + parseFloat(expense.amount), 0) || 0;

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-neutral-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(currentMonth).map((date, index) => (
              <div key={index} className="aspect-square">
                {date && (
                  <button
                    onClick={() => onDateSelect(date)}
                    className={`w-full h-full rounded-lg flex flex-col items-center justify-center text-sm relative transition-colors border-2 ${
                      isSelected(date)
                        ? 'bg-primary text-white border-primary'
                        : isToday(date)
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : hasExpenses(date)
                        ? 'bg-neutral-100 hover:bg-neutral-200 border-transparent'
                        : 'hover:bg-neutral-50 border-transparent'
                    }`}
                  >
                    <span>{date.getDate()}</span>
                    {hasExpenses(date) && (
                      <div className={`w-1 h-1 rounded-full mt-1 ${
                        isSelected(date) ? 'bg-white' : 'bg-primary'
                      }`} />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {selectedDate.toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                timeZone: 'Asia/Kolkata'
              })}
              {isToday(selectedDate) && (
                <span className="ml-2 text-sm font-normal text-blue-600">(Today)</span>
              )}
            </span>
            {totalDayExpenses > 0 && (
              <span className="text-lg font-semibold text-primary">
                {formatCurrency(totalDayExpenses)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dayExpenses && dayExpenses.length > 0 ? (
            <div className="space-y-3">
              {dayExpenses.map((expense: any) => {
                const categoryInfo = categoryIcons[expense.category] || {
                  icon: "fas fa-tag",
                  emoji: "🏷️",
                  color: "text-purple-600",
                  bgColor: "bg-purple-100"
                };
                
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg group">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${categoryInfo.bgColor}`}>
                        <span className="text-lg">{categoryInfo.emoji}</span>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-800">{expense.category}</p>
                        {expense.description && (
                          <p className="text-sm text-neutral-500">{expense.description}</p>
                        )}
                        <p className="text-xs text-neutral-400">
                          {new Date(expense.date).toLocaleString('en-IN', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'Asia/Kolkata'
                          })} IST • {expense.method}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-neutral-800">
                        {formatCurrency(parseFloat(expense.amount))}
                      </p>
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
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
              <p>No expenses recorded for this date</p>
              <p className="text-sm">
                {isToday(selectedDate) 
                  ? "Start adding expenses to track your spending" 
                  : "Select today's date to add new expenses"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}