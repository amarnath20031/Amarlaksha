// Daily motivational quotes for financial wellness
export interface MotivationalQuote {
  text: string;
  author?: string;
  category: 'saving' | 'budgeting' | 'investing' | 'mindset' | 'success';
}

export const motivationalQuotes: MotivationalQuote[] = [
  // Saving Quotes
  { text: "Every rupee saved is a rupee earned.", category: 'saving' },
  { text: "Small amounts saved consistently create big wealth.", category: 'saving' },
  { text: "Your future self will thank you for every rupee you save today.", category: 'saving' },
  { text: "Saving money is not about sacrificing today, it's about securing tomorrow.", category: 'saving' },
  { text: "The habit of saving is itself an education.", author: "T.T. Munger", category: 'saving' },
  
  // Budgeting Quotes
  { text: "A budget is telling your money where to go instead of wondering where it went.", author: "Dave Ramsey", category: 'budgeting' },
  { text: "Budgeting isn't about limiting yourself—it's about making the things that excite you possible.", category: 'budgeting' },
  { text: "Every financial goal starts with knowing where your money goes.", category: 'budgeting' },
  { text: "Track your expenses, master your finances.", category: 'budgeting' },
  { text: "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make.", author: "Dave Ramsey", category: 'budgeting' },
  
  // Investing & Growth
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", category: 'investing' },
  { text: "Compound interest is the eighth wonder of the world.", author: "Albert Einstein", category: 'investing' },
  { text: "Don't save what is left after spending; spend what is left after saving.", author: "Warren Buffett", category: 'investing' },
  { text: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett", category: 'investing' },
  
  // Mindset Quotes
  { text: "It's not how much money you make, but how much money you keep.", author: "Robert Kiyosaki", category: 'mindset' },
  { text: "Rich people have small TVs and big libraries. Poor people have big TVs and small libraries.", author: "Zig Ziglar", category: 'mindset' },
  { text: "The real measure of your wealth is how much you'd be worth if you lost all your money.", category: 'mindset' },
  { text: "Financial freedom is not about having more money, but about having more choices.", category: 'mindset' },
  { text: "Your net worth to the network is your net worth.", category: 'mindset' },
  
  // Success & Achievement
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: 'success' },
  { text: "The journey of a thousand miles begins with a single step.", category: 'success' },
  { text: "You're not just tracking expenses, you're building financial awareness.", category: 'success' },
  { text: "Every expense you track brings you closer to financial freedom.", category: 'success' },
  { text: "Consistency in small actions leads to extraordinary results.", category: 'success' },
  
  // Indian Financial Wisdom
  { text: "पैसा पैसे को खींचता है - Money attracts money.", category: 'mindset' },
  { text: "आज का बचा हुआ कल का कमाया हुआ है - Today's savings are tomorrow's earnings.", category: 'saving' },
  { text: "Financial discipline today creates financial freedom tomorrow.", category: 'budgeting' },
  { text: "Track every rupee, respect every paisa.", category: 'budgeting' },
  { text: "Smart spending is the first step to smart earning.", category: 'mindset' }
];

export class QuoteManager {
  private static readonly STORAGE_KEY = 'laksha-daily-quote';

  static getTodaysQuote(userEmail: string): MotivationalQuote {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const stored = localStorage.getItem(`${this.STORAGE_KEY}-${userEmail}-${today}`);
    
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Generate consistent daily quote based on user email and date
    const seed = this.hashCode(userEmail + today);
    const quoteIndex = Math.abs(seed) % motivationalQuotes.length;
    const todaysQuote = motivationalQuotes[quoteIndex];
    
    // Store today's quote
    localStorage.setItem(`${this.STORAGE_KEY}-${userEmail}-${today}`, JSON.stringify(todaysQuote));
    
    return todaysQuote;
  }

  static getRandomQuote(): MotivationalQuote {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    return motivationalQuotes[randomIndex];
  }

  static getQuotesByCategory(category: string): MotivationalQuote[] {
    return motivationalQuotes.filter(quote => quote.category === category);
  }

  private static hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
}