import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Target, Plus, CreditCard, User } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm lg:max-w-md bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 z-40 shadow-lg" style={{ touchAction: 'auto' }}>
      <div className="flex justify-between items-center">
        {/* Home */}
        <Link href="/">
          <div className="flex flex-col items-center space-y-1">
            <Home 
              className={`w-5 h-5 ${
                location === "/" || location === "/home" ? 'text-blue-600' : 'text-gray-400'
              }`} 
            />
            <span className={`text-xs font-medium ${
              location === "/" || location === "/home" ? 'text-blue-600' : 'text-gray-400'
            }`}>
              Home
            </span>
          </div>
        </Link>
        
        {/* Missions */}
        <Link href="/missions">
          <div className="flex flex-col items-center space-y-1">
            <Target 
              className={`w-5 h-5 ${
                location === "/missions" ? 'text-blue-600' : 'text-gray-400'
              }`} 
            />
            <span className={`text-xs font-medium ${
              location === "/missions" ? 'text-blue-600' : 'text-gray-400'
            }`}>
              Missions
            </span>
          </div>
        </Link>
        
        {/* Add Expense Button - In the middle */}
        <div className="flex flex-col items-center space-y-1">
          <Link href="/expense">
            <Button 
              data-onboarding="add-expense-button"
              size="icon" 
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full shadow-md border-2 border-white"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </Link>
        </div>
        
        {/* Transactions */}
        <Link href="/transactions">
          <div className="flex flex-col items-center space-y-1">
            <CreditCard 
              className={`w-5 h-5 ${
                location === "/transactions" ? 'text-blue-600' : 'text-gray-400'
              }`} 
            />
            <span className={`text-xs font-medium ${
              location === "/transactions" ? 'text-blue-600' : 'text-gray-400'
            }`}>
              Transactions
            </span>
          </div>
        </Link>
        
        {/* Profile */}
        <Link href="/profile">
          <div className="flex flex-col items-center space-y-1">
            <User 
              className={`w-5 h-5 ${
                location === "/profile" ? 'text-blue-600' : 'text-gray-400'
              }`} 
            />
            <span className={`text-xs font-medium ${
              location === "/profile" ? 'text-blue-600' : 'text-gray-400'
            }`}>
              Profile
            </span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
