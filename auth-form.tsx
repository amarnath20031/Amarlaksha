import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query"; 
import DemoInfo from "@/components/demo-info";

interface AuthFormProps {
  onSuccess: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to login");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Login successful!",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    },
  });

  const handleLogin = () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate({ email });
  };

  const handleGoogleLogin = () => {
    // Redirect to your backend Google OAuth route
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  return (
    <div className="auth-wrapper bg-gradient-to-b from-primary/10 to-secondary/10">
      <Card className="auth-card">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="text-white w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Laksha</CardTitle>
          <p className="text-neutral-600">Enter your email to get started</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <DemoInfo />

          {/* Email Login */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Email Address</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email to continue"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={loginMutation.isPending}
              className="w-full"
            >
              {loginMutation.isPending ? "Logging in..." : "Continue with Email"}
            </Button>
          </div>

          {/* Google Login */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <img
                src="https://www.svgrepo.com/show/355037/google.svg"
                alt="Google"
                className="w-5 h-5"
              />
              Continue with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}