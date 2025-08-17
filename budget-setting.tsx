import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBudgetSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { categoryIcons, getDefaultCategories } from "@/lib/categories";
import { formatAmount, parseCurrency } from "@/lib/currency";

// Smart budget recommendations based on income
const getBudgetRecommendations = (monthlyIncome: number) => {
  return {
    "Food & Dining": Math.round(monthlyIncome * 0.25), // 25%
    "Transport": Math.round(monthlyIncome * 0.15), // 15%
    "Groceries": Math.round(monthlyIncome * 0.20), // 20%
    "Entertainment": Math.round(monthlyIncome * 0.10), // 10%
    "Health": Math.round(monthlyIncome * 0.10), // 10%
    "Shopping": Math.round(monthlyIncome * 0.10), // 10%
    "Petrol": Math.round(monthlyIncome * 0.08), // 8%
    "Mobile": Math.round(monthlyIncome * 0.02), // 2%
  };
};

const budgetFormSchema = insertBudgetSchema.extend({
  amount: z.string()
    .min(1, "Budget amount is required")
    .refine((val) => {
      const num = parseInt(val) || 0;
      return num >= 1000 && num <= 100000;
    }, "Budget must be between ₹1,000 and ₹1,00,000"),
});

type BudgetFormData = z.infer<typeof budgetFormSchema>;

export default function BudgetSetting() {
  const [location, setLocation] = useLocation();
  const [budgetType, setBudgetType] = useState<'monthly'>('monthly');
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existingBudget } = useQuery({
    queryKey: ['/api/budget'],
  });

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      type: 'monthly',
      amount: existingBudget ? existingBudget.amount : "25000",
      categoryBudgets: existingBudget ? existingBudget.categoryBudgets : "{}",
    },
  });

  // Initialize category budgets based on main budget
  const mainBudgetAmount = parseInt(form.watch("amount") || "0");
  
  // Use smart recommendations instead of simple percentages
  const getDefaultCategoryBudgets = (totalBudget: number) => getBudgetRecommendations(totalBudget);

  // Update category budgets when existing budget loads
  useEffect(() => {
    if (existingBudget) {
      setBudgetType(existingBudget.type as 'monthly' | 'daily');
      // Set form amount to existing budget amount (without formatting)
      const budgetAmount = Math.round(parseFloat(existingBudget.amount)).toString();
      form.setValue("amount", budgetAmount);
      // Always recalculate category budgets based on current budget amount
      setCategoryBudgets(getDefaultCategoryBudgets(parseInt(budgetAmount)));
    }
  }, [existingBudget]);

  const saveBudgetMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      console.log('🚀 Submitting budget data:', data);
      console.log('📊 Category budgets:', categoryBudgets);
      
      const budgetData = {
        type: budgetType,
        amount: data.amount, // Send the raw amount without parsing
        categoryBudgets: JSON.stringify(categoryBudgets),
      };
      
      console.log('📤 Final budget payload:', budgetData);
      
      const method = existingBudget ? "PUT" : "POST";
      return apiRequest(method, "/api/budget", budgetData);
    },
    onSuccess: () => {
      console.log('✅ Budget saved successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/budget'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/spending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily-limit'] });
      toast({
        title: "Budget Updated!",
        description: "Your budget has been saved successfully.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      console.error('❌ Budget save failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save budget. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BudgetFormData) => {
    console.log('🔥 FORM SUBMITTED!', data);
    console.log('🔥 Category budgets:', categoryBudgets);
    saveBudgetMutation.mutate(data);
  };

  const handleCategoryBudgetChange = (category: string, value: string) => {
    const amount = parseInt(value) || 0;
    setCategoryBudgets(prev => ({
      ...prev,
      [category]: amount
    }));
  };

  const handleMainBudgetChange = (value: string) => {
    const amount = parseInt(value) || 0;
    
    // Update category budgets proportionally when budget amount changes
    if (amount > 0) {
      setCategoryBudgets(getDefaultCategoryBudgets(amount));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Clean GitHub-style */}
      <header className="bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <button className="text-gray-600 hover:text-gray-900 rounded-md p-1">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </Link>
            <div className="text-lg font-medium text-gray-900">Set Budget</div>
          </div>
        </div>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col bg-white">
        <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-6">
          {/* Budget Type */}
          <div className="mb-8">
            <Label className="block text-sm font-medium text-gray-700 mb-3">
              Budget Period
            </Label>
            <div className="grid grid-cols-1 gap-4">
              <Button
                type="button"
                variant="default"
                className="p-4 font-medium h-auto border border-gray-200"
                disabled
              >
                Monthly
              </Button>
            </div>
          </div>

          {/* Budget Amount */}
          <div className="mb-8">
            <Label className="block text-sm font-medium text-neutral-700 mb-2">
              Budget Amount
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl font-semibold text-neutral-600">
                ₹
              </span>
              <Input
                {...form.register("amount")}
                type="text"
                placeholder="50000"
                className="pl-12 pr-4 py-4 text-2xl font-semibold bg-neutral-50 rounded-2xl border-2 h-auto"
                value={form.watch("amount") || ""}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/[^\d]/g, ''); // Only allow digits
                  form.setValue("amount", rawValue);
                  handleMainBudgetChange(rawValue);
                }}
              />
            </div>
            <p className="text-sm text-neutral-500 mt-2">
              Recommended: ₹1,000 - ₹1,00,000 per month
            </p>
          </div>

          {/* Category Budgets */}
          <div className="mb-8">
            <Label className="block text-sm font-medium text-neutral-700 mb-3">
              Category Wise Budget
            </Label>
            <div className="space-y-4">
              {getDefaultCategories().slice(0, 6).map((category) => {
                const categoryInfo = categoryIcons[category];
                const budgetAmount = categoryBudgets[category] || 0;
                
                return (
                  <div
                    key={category}
                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl"
                  >
                    <div className="flex items-center space-x-3">
                      <i className={`${categoryInfo.icon} ${categoryInfo.color}`}></i>
                      <span className="font-medium">{category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-neutral-600">₹</span>
                      <Input
                        type="text"
                        value={budgetAmount.toString()}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/[^\d]/g, ''); // Only allow digits
                          handleCategoryBudgetChange(category, rawValue);
                        }}
                        className="w-24 text-right bg-transparent border-none p-0 font-semibold focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-2xl">
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-900">Total Allocated:</span>
                <span className="font-bold text-blue-900">
                  ₹{Object.values(categoryBudgets).reduce((sum, val) => sum + val, 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-blue-700">Remaining:</span>
                <span className="text-sm text-blue-700">
                  ₹{(parseInt(form.watch("amount") || "0") - Object.values(categoryBudgets).reduce((sum, val) => sum + val, 0)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-6 py-6 border-t border-neutral-200">
          <Button
            type="button"
            className="w-full py-4 rounded-2xl font-semibold text-lg h-auto"
            disabled={saveBudgetMutation.isPending}
            onClick={() => {
              console.log('🔥 MANUAL BUTTON CLICK!');
              const formData = {
                type: budgetType,
                amount: form.getValues("amount") || "3000",
                categoryBudgets: JSON.stringify(categoryBudgets)
              };
              console.log('🔥 SUBMITTING DATA:', formData);
              saveBudgetMutation.mutate(formData);
            }}
          >
            {saveBudgetMutation.isPending ? "Saving..." : "Save Budget"}
          </Button>
        </div>
      </form>
    </div>
  );
}
