import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const quotes = [
  // Financial Wisdom - Hindi & English Mix
  "छोटी बचत, बड़ा फायदा! Small savings, big benefits! 💰",
  "Track today, prosper tomorrow! आज ट्रैक करें, कल समृद्ध हों! 📈",
  "Budget wisely, live happily! बुद्धिमानी से बजट बनाएं! 😊",
  "Every rupee saved is a rupee earned! हर रुपया बचा हुआ कमाया हुआ! 💪",
  
  // Indian Context
  "Smart spending leads to financial freedom! 🎯",
  "आपका भविष्य आपकी आज की बचत में है! Your future is in today's savings! 🌟",
  "Track expenses like a boss, save like a king! 👑",
  "पैसे की कीमत जानो, waste न करो! Know the value of money! 💡",
  
  // Motivational
  "Financial discipline = Financial freedom! 🚀",
  "बजट बनाना सीखें, अमीर बनना सीखें! Learn budgeting, learn wealth! 💎",
  "Small expenses add up to big amounts! छोटे खर्च मिलकर बड़ी रकम! 📊",
  "Your future self will thank you for budgeting today! 🙏",
  
  // Success Mindset
  "Invest in tracking, invest in your future! निवेश करें! 🎯",
  "सोच-समझकर खर्च करें! Spend thoughtfully, save wisely! 🧠",
  "Budget today for a better tomorrow! कल के लिए आज बचत! ⭐",
  "Every tracked expense is a step towards financial success! 🎖️"
];

export default function MotivationalQuote() {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    // Get date-based quote that changes daily
    const today = new Date().toDateString();
    const quoteIndex = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % quotes.length;
    setQuote(quotes[quoteIndex]);
  }, []);

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Quote className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Daily Financial Wisdom
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {quote}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}