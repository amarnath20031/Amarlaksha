import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IndianRupee } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function Landing() {
  const [email, setEmail] = useState("");

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Store email in localStorage to pre-fill signup form
      localStorage.setItem('signupEmail', email);
      window.location.href = '/signup';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="flex justify-between items-center p-4 md:p-6">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-8 h-8 text-white" />
          <span className="text-xl font-bold text-white">Laksha</span>
        </div>
        <Link href="/signin">
          <Button variant="ghost" className="text-white hover:bg-white/10 border border-gray-600">
            Sign in
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-2xl mx-auto">
          {/* Logo and Title */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <IndianRupee className="w-16 h-16 text-white" />
            <h1 className="text-5xl md:text-6xl font-bold text-white">Laksha</h1>
          </div>
          
          {/* Subtitle */}
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 border-b border-purple-300 inline-block pb-2">
            Your AI Financial Coach
          </h2>
          
          {/* Description */}
          <p className="text-xl text-gray-300 mb-12">
            Track your expenses, budget smartly & reach your money goals.
          </p>

          {/* Signup Form */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 max-w-md mx-auto">
            <form onSubmit={handleSignUp} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-12 text-lg"
                required
              />
              <Button 
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold"
              >
                Sign up for Laksha
              </Button>
            </form>
          </div>
        </div>



        {/* Why We Built Laksha Section */}
        <div className="mt-16 mb-16 max-w-4xl mx-auto px-4">
          <div 
            className="relative bg-gradient-to-br from-purple-900 to-violet-900 rounded-xl p-10 shadow-2xl backdrop-blur-sm border border-white/10"
            style={{
              background: 'linear-gradient(135deg, #370056 0%, #5a0099 50%, #370056 100%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl"></div>
            
            <div className="relative">
              {/* Title */}
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
                <span className="text-white">Why We Built </span>
                <span style={{ color: '#FF9933' }}>Laksha</span>
                <span className="text-2xl ml-2">🇮🇳</span>
              </h2>
              
              {/* Mission Statement */}
              <p className="text-xl text-gray-300 text-center mb-10 max-w-2xl mx-auto leading-relaxed">
                Because <span style={{ fontFamily: 'Times New Roman, serif' }}>Indian</span> financial habits deserve an app that truly understands our culture, currency, and lifestyle.
              </p>
              
              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-2xl font-bold">₹</span>
                  </div>
                  <h3 className="font-bold mb-2 text-lg">
                    <span style={{ color: '#FF9933' }}>For</span>
                    <span className="text-white mx-1" style={{ fontFamily: 'Times New Roman, serif' }}>Indian</span>
                    <span style={{ color: '#138808' }}>Users</span>
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Students, professionals, and families who think in rupees and live the <span style={{ fontFamily: 'Times New Roman, serif' }}>Indian</span> lifestyle
                  </p>
                </div>
                
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-2xl">🧠</span>
                  </div>
                  <h3 className="font-bold mb-2 text-lg text-white">Smart AI Coach</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Understands <span style={{ fontFamily: 'Times New Roman, serif' }}>Indian</span> spending patterns, festivals, and financial goals like education and family support
                  </p>
                </div>
                
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="font-bold mb-2 text-lg text-white" style={{ fontFamily: 'Times New Roman, serif' }}>Indian Categories</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    From chai and auto rides to EMIs and festival shopping - categories that make sense to us
                  </p>
                </div>
                
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-2xl">📱</span>
                  </div>
                  <h3 className="font-bold mb-2 text-lg text-white">Mobile First</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Built for the way <span style={{ fontFamily: 'Times New Roman, serif' }}>Indians</span> use money - quick UPI payments, mobile banking, and on-the-go tracking
                  </p>
                </div>
                
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <h3 className="font-bold mb-2 text-lg text-white">Student Friendly</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Special features for students and young professionals starting their financial journey
                  </p>
                </div>
                
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-2xl">🕒</span>
                  </div>
                  <h3 className="font-bold mb-2 text-lg text-white" style={{ fontFamily: 'Times New Roman, serif' }}>IST Timezone</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Perfect timing for <span style={{ fontFamily: 'Times New Roman, serif' }}>Indian</span> users with accurate date tracking and festival reminders
                  </p>
                </div>
              </div>
              
              {/* Bottom highlight */}
              <div className="mt-10 text-center">
                <p className="text-lg text-gray-200 font-medium bg-white/10 rounded-full px-6 py-3 inline-block">
                  <span className="text-yellow-400">✨</span>
                  <span className="mx-2" style={{ fontFamily: 'Times New Roman, serif' }}>Made in India, for India</span>
                  <span className="text-yellow-400">✨</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}