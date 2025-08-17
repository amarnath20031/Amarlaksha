import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Camera, Mic, Plus, Calendar, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { categoryIcons, getDefaultCategories } from "@/lib/categories";
import { formatAmount, parseCurrency } from "@/lib/currency";
import VoiceInput from "@/components/voice-input";
import { useCamera } from "@/hooks/use-camera";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SoundManager } from "@/lib/sounds";
import { getExpenseReaction } from "@/lib/reactions";
import { StreakTracker } from "@/lib/streaks";

const expenseFormSchema = insertExpenseSchema.extend({
  amount: z.union([z.string(), z.number()]).refine(
    (val) => {
      const num = typeof val === 'string' ? parseCurrency(val) : val;
      return num > 0;
    },
    "Amount must be greater than 0"
  ),
}).omit({
  userEmail: true, // userEmail will be added server-side
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

export default function ExpenseForm() {
  const [location, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  // Initialize with current device local date and time
  const [selectedDate, setSelectedDate] = useState(() => {
    // Create today's date in user's local timezone
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;
    console.log('🗓️ Date initialization:', { now: now.toString(), localDateStr, today: day });
    return new Date(localDateStr + 'T00:00:00.000');
  });
  const [selectedTime, setSelectedTime] = useState(() => {
    // Use device's local timezone directly
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  const { 
    isOpen: isCameraOpen,
    capturedImage,
    videoRef,
    openCamera,
    capturePhoto,
    closeCamera,
    reset: resetCamera
  } = useCamera();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: "",
      category: "",
      description: "",
      method: "manual",
      date: new Date(),
    },
  });

  // Parse voice input from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const voiceText = urlParams.get('voice');
    
    if (voiceText) {
      parseVoiceInput(voiceText);
    }
  }, [location]);

  const parseVoiceInput = (text: string) => {
    console.log('🎤 Parsing voice input:', text);
    
    // Extract amount (numbers with optional currency)
    const amountMatch = text.match(/(\d+)\s*(rupees?|rs\.?|₹)?/i);
    if (amountMatch) {
      form.setValue("amount", amountMatch[1]);
    }
    
    // Smart category detection with more keywords
    const lowerText = text.toLowerCase();
    let detectedCategory = "";
    
    if (lowerText.includes('food') || lowerText.includes('eat') || lowerText.includes('restaurant') || lowerText.includes('lunch') || lowerText.includes('dinner') || lowerText.includes('breakfast') || lowerText.includes('cafe')) {
      detectedCategory = "Food & Dining";
    } else if (lowerText.includes('petrol') || lowerText.includes('fuel') || lowerText.includes('gas')) {
      detectedCategory = "Petrol";
    } else if (lowerText.includes('transport') || lowerText.includes('bus') || lowerText.includes('taxi') || lowerText.includes('metro') || lowerText.includes('auto') || lowerText.includes('uber')) {
      detectedCategory = "Transport";
    } else if (lowerText.includes('grocery') || lowerText.includes('groceries') || lowerText.includes('vegetables') || lowerText.includes('fruits') || lowerText.includes('market')) {
      detectedCategory = "Groceries";
    } else if (lowerText.includes('shopping') || lowerText.includes('clothes') || lowerText.includes('buy')) {
      detectedCategory = "Shopping";
    } else if (lowerText.includes('health') || lowerText.includes('medicine') || lowerText.includes('doctor') || lowerText.includes('hospital')) {
      detectedCategory = "Health";
    } else if (lowerText.includes('mobile') || lowerText.includes('phone') || lowerText.includes('recharge')) {
      detectedCategory = "Mobile";
    } else if (lowerText.includes('entertainment') || lowerText.includes('movie') || lowerText.includes('cinema') || lowerText.includes('game') || lowerText.includes('fun')) {
      detectedCategory = "Entertainment";
    }
    
    if (detectedCategory) {
      setSelectedCategory(detectedCategory);
      console.log('🏷️ Auto-detected category:', detectedCategory);
    }
    
    form.setValue("description", text);
    form.setValue("method", "voice");
    
    // Show success message
    toast({
      title: "Voice Input Processed",
      description: `Amount: ₹${amountMatch?.[1] || 'Not detected'}, Category: ${detectedCategory || 'Please select manually'}`,
    });
  };

  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      console.log('🚀 Submitting expense:', data);
      
      // Create proper IST datetime
      const [hours, minutes] = selectedTime.split(':').map(Number);
      
      // Get the IST date string in YYYY-MM-DD format
      const istDateStr = selectedDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const hourStr = String(hours).padStart(2, '0');
      const minuteStr = String(minutes).padStart(2, '0');
      
      // Create IST datetime string and parse it
      const istDateTimeStr = `${istDateStr}T${hourStr}:${minuteStr}:00.000+05:30`;
      const istDateTime = new Date(istDateTimeStr);
      
      console.log('📅 Expense form date processing:', {
        selectedDate: selectedDate.toISOString(),
        selectedTime,
        istDateTimeStr,
        finalDateTime: istDateTime.toISOString(),
        istDisplay: istDateTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      });
      
      const expenseData = {
        ...data,
        amount: parseCurrency(data.amount).toString(),
        date: istDateTime,
      };
      
      console.log('💰 Processed expense data with IST:', {
        selectedDate,
        selectedTime,
        istDateTime,
        expenseData
      });
      
      const response = await apiRequest("POST", "/api/expenses", expenseData);
      console.log('✅ API Response:', response);
      return response;
    },
    onSuccess: (response) => {
      console.log('🎉 Success! Response:', response);
      
      // Play success sound
      const soundManager = SoundManager.getInstance();
      soundManager.playExpenseAdded();
      
      // Get reaction for the expense
      const amount = parseCurrency(form.getValues().amount);
      const category = selectedCategory || form.getValues().category;
      const reaction = getExpenseReaction(amount, category);
      
      // Update streak
      if (user?.email) {
        const oldStreakData = StreakTracker.getStreakData(user.email);
        const newStreakData = StreakTracker.updateStreak(user.email);
        
        // Check for celebration
        if (StreakTracker.shouldShowCelebration(oldStreakData.currentStreak, newStreakData.currentStreak)) {
          soundManager.playStreakMilestone();
          toast({
            title: StreakTracker.getCelebrationMessage(newStreakData.currentStreak),
            description: `${reaction.emoji} ${reaction.message}`,
            duration: 4000,
          });
        } else {
          toast({
            title: "Expense Added!",
            description: `${reaction.emoji} ${reaction.message}`,
            duration: 3000,
          });
        }
      } else {
        toast({
          title: "Expense Added!",
          description: `${reaction.emoji} ${reaction.message}`,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/spending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/daily-limit'] });
      queryClient.invalidateQueries({ queryKey: ['/api/budget'] });
      setLocation("/");
    },
    onError: (error) => {
      console.error('❌ Error saving expense:', error);
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Not logged in",
          description: "Please log in to save expenses.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
        return;
      }
      
      toast({
        title: "Error",
        description: `Failed to save expense: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    console.log('📝 Form submission started:', data);
    console.log('🏷️ Selected category:', selectedCategory);
    console.log('💵 Amount:', data.amount, 'Parsed:', parseCurrency(data.amount));
    console.log('👤 User authenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('❌ User not authenticated');
      toast({
        title: "Not logged in",
        description: "Please log in to save expenses.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
    
    if (!selectedCategory) {
      console.log('❌ No category selected');
      toast({
        title: "Category Required",
        description: "Please select a category for your expense.",
        variant: "destructive",
      });
      return;
    }
    
    const amountValue = typeof data.amount === 'string' ? parseCurrency(data.amount) : parseFloat(data.amount.toString());
    if (!data.amount || amountValue <= 0 || isNaN(amountValue)) {
      console.log('❌ Invalid amount:', data.amount, 'Parsed:', amountValue);
      toast({
        title: "Amount Required",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('🚀 Starting mutation...');
    
    const submissionData = {
      ...data,
      category: selectedCategory,
      amount: amountValue.toString(),
      method: 'manual'
    };
    console.log('📤 Final submission data:', submissionData);
    createExpenseMutation.mutate(submissionData);
  };

  const handleVoiceInput = (text: string) => {
    console.log('🎤 Voice input received:', text);
    parseVoiceInput(text);
    form.setValue("method", "voice");
    setShowVoiceInput(false);
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const cleaned = value.replace(/[^\d.]/g, '');
    form.setValue("amount", cleaned);
  };

  const handleAddCustomCategory = () => {
    if (newCategoryName.trim()) {
      const categoryName = newCategoryName.trim();
      if (!customCategories.includes(categoryName) && !getDefaultCategories().includes(categoryName)) {
        setCustomCategories(prev => [...prev, categoryName]);
        setSelectedCategory(categoryName);
        setNewCategoryName("");
        setShowAddCategory(false);
        toast({
          title: "Category Added!",
          description: `"${categoryName}" has been added to your categories.`,
        });
      } else {
        toast({
          title: "Category exists",
          description: "This category already exists.",
          variant: "destructive",
        });
      }
    }
  };

  const getAllCategories = () => [...getDefaultCategories(), ...customCategories];

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
            <div className="text-lg font-medium text-gray-900">Add Expense</div>
          </div>
        </div>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-screen bg-white">
        <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-6">
          {/* Amount Input */}
          <div className="mb-8">
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl font-semibold text-gray-600">
                ₹
              </span>
              <Input
                type="text"
                placeholder="0"
                className="pl-12 pr-4 py-4 text-2xl font-semibold bg-gray-50 border border-gray-200 rounded-lg h-auto focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.watch("amount")}
                onChange={(e) => handleAmountChange(e.target.value)}
              />
            </div>
          </div>

          {/* Category Selection */}
          <div className="mb-6">
            <Label className="block text-sm font-medium text-gray-700 mb-3">
              Category
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {getAllCategories().map((category) => {
                const categoryInfo = categoryIcons[category] || {
                  icon: "fas fa-tag",
                  emoji: "🏷️",
                  color: "text-purple-600"
                };
                const isSelected = selectedCategory === category;
                
                return (
                  <button
                    key={category}
                    type="button"
                    className={`p-4 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-300 text-blue-700' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <span className="text-2xl">{categoryInfo.emoji}</span>
                    <span className="text-sm font-medium text-center">
                      {category.length > 8 ? category.split(' ')[0] : category}
                    </span>
                  </button>
                );
              })}
              
              {/* Add Custom Category Button */}
              <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="p-4 rounded-2xl flex flex-col items-center space-y-2 transition-colors bg-neutral-100 hover:bg-neutral-200 border-2 border-dashed border-neutral-300"
                  >
                    <Plus className="w-6 h-6 text-neutral-500" />
                    <span className="text-sm font-medium text-neutral-500">Add</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Custom Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="categoryName">Category Name</Label>
                      <Input
                        id="categoryName"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g., WiFi Recharge, Insurance, etc."
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddCategory(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddCustomCategory}
                        className="flex-1"
                      >
                        Add Category
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <Label className="block text-sm font-medium text-neutral-700 mb-2">
              Description (Optional)
            </Label>
            <Input
              type="text"
              placeholder="Where did you spend?"
              className="w-full px-4 py-4 bg-neutral-50 rounded-2xl border-2 h-auto"
              {...form.register("description")}
            />
          </div>

          {/* Date and Time Selection */}
          <div className="mb-6">
            <Label className="block text-sm font-medium text-neutral-700 mb-3">
              Date & Time
            </Label>
            <div className="grid grid-cols-2 gap-4">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label className="text-xs text-neutral-600">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <Input
                    type="date"
                    value={`${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`}
                    onChange={(e) => {
                      console.log('📅 Date picker changed:', e.target.value);
                      setSelectedDate(new Date(e.target.value + 'T00:00:00.000'));
                    }}
                    className="pl-10 bg-neutral-50 rounded-lg border-2 h-auto py-3"
                  />
                </div>
              </div>
              
              {/* Time Picker */}
              <div className="space-y-2">
                <Label className="text-xs text-neutral-600">Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="pl-10 bg-neutral-50 rounded-lg border-2 h-auto py-3"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Today: {new Date().toLocaleDateString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} • {new Date().toLocaleTimeString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>



          {/* Captured Image Preview */}
          {capturedImage && (
            <div className="mb-6">
              <Label className="block text-sm font-medium text-neutral-700 mb-2">
                Receipt Photo
              </Label>
              <Card>
                <CardContent className="p-4">
                  <img 
                    src={capturedImage} 
                    alt="Receipt" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={resetCamera}
                  >
                    Remove Photo
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Camera Modal */}
        {isCameraOpen && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <div className="flex-1 relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeCamera}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    capturePhoto();
                    closeCamera();
                  }}
                >
                  Capture
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="px-6 py-6 border-t border-neutral-200">
          <Button
            type="submit"
            className="w-full py-4 rounded-2xl font-semibold text-lg h-auto"
            disabled={createExpenseMutation.isPending}
            onClick={(e) => {
              console.log('🔘 Save button clicked');
              console.log('Form values:', form.getValues());
              console.log('Selected category:', selectedCategory);
              console.log('Form errors:', form.formState.errors);
            }}
          >
            {createExpenseMutation.isPending ? "Saving..." : "Save Expense"}
          </Button>
        </div>
      </form>

      {/* Voice Input Modal */}
      {showVoiceInput && (
        <VoiceInput
          isOpen={showVoiceInput}
          onClose={() => setShowVoiceInput(false)}
          onConfirm={handleVoiceInput}
        />
      )}
    </div>
  );
}
