import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndianRupee } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("India");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Pre-fill email from localStorage if coming from landing page
    const savedEmail = localStorage.getItem('signupEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      localStorage.removeItem('signupEmail');
    }
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          username, 
          country 
        }),
      });

      if (response.ok) {
        // Auto-login after successful signup
        const loginResponse = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ emailOrUsername: email, password }),
        });

        if (loginResponse.ok) {
          window.location.href = '/';
        } else {
          // If auto-login fails, redirect to signin
          toast({
            title: "Account created successfully",
            description: "Please sign in with your new account",
          });
          window.location.href = '/signin';
        }
      } else {
        const data = await response.json();
        toast({
          title: "Sign up failed",
          description: data.message || "Failed to create account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper bg-slate-50">
      <div className="auth-card">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <IndianRupee className="w-10 h-10 text-slate-700" />
            <h1 className="text-2xl font-bold text-slate-900">Laksha</h1>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Create your Laksha account</h2>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 shadow-lg">
          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-900">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-900">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Create a password"
                required
              />
              <p className="text-xs text-gray-600">
                Password should be at least 8 characters including a number and a lowercase letter.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-slate-900">
                Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter a username"
                required
              />
              <p className="text-xs text-gray-600">
                Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium text-slate-900">
                Your Country/Region <span className="text-red-500">*</span>
              </Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="India">India</SelectItem>
                  <SelectItem value="United States">United States</SelectItem>
                  <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600">
                For compliance reasons, we're required to collect country information to send you occasional updates and announcements.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white h-11 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/signin">
              <span className="text-blue-600 hover:underline">Sign in</span>
            </Link>
          </div>

          <div className="mt-6 text-xs text-gray-500 text-center">
            By creating an account, you agree to the{" "}
            <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>.
            For more information about Laksha's privacy practices, see the{" "}
            <a href="/privacy" className="text-blue-600 hover:underline">Laksha Privacy Statement</a>.
            We'll occasionally send you account-related emails.
          </div>
        </div>
      </div>
    </div>
  );
}