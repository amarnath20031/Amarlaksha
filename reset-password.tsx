import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Get token from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
      setToken(urlToken);
      verifyToken(urlToken);
    } else {
      navigate('/forgot-password');
    }
  }, [navigate]);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch(`/api/auth/verify-reset-token?token=${tokenToVerify}`, {
        credentials: 'include'
      });
      if (response.ok) {
        setIsValidToken(true);
      } else {
        setIsValidToken(false);
      }
    } catch (error) {
      setIsValidToken(false);
      toast({
        title: "Invalid or expired link",
        description: "This password reset link is invalid or has expired.",
        variant: "destructive",
      });
    }
  };

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password reset successful!",
        description: "You can now log in with your new password.",
      });
      navigate("/signin");
    },
    onError: (error: any) => {
      toast({
        title: "Reset failed",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) return;
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate({
      token,
      newPassword
    });
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="auth-wrapper bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="auth-card bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">₹</span>
              </div>
              <span className="font-bold text-gray-900">Laksha</span>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Invalid Reset Link
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
            
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                This password reset link is invalid or has expired. Reset links are only valid for 10 minutes.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Link href="/forgot-password">
                <Button className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600">
                  Request New Reset Link
                </Button>
              </Link>
              
              <Link href="/signin">
                <Button variant="outline" className="w-full h-11">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="auth-wrapper bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Card className="auth-card bg-white/95 backdrop-blur-sm shadow-2xl">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">₹</span>
            </div>
            <span className="font-bold text-gray-900">Laksha</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-gray-900">
            Set New Password
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-600 mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-600 font-medium">Reset link verified</span>
            </div>
            <Lock className="w-12 h-12 mx-auto mb-2 text-purple-600" />
            Choose a strong password for your Laksha Coach account.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">New Password</label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11"
                minLength={6}
                required
              />
              {newPassword && newPassword.length < 6 && (
                <p className="text-xs text-red-600">Password must be at least 6 characters</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Confirm Password</label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11"
                minLength={6}
                required
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-600">Passwords don't match</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={
                resetPasswordMutation.isPending || 
                !newPassword || 
                !confirmPassword || 
                newPassword !== confirmPassword ||
                newPassword.length < 6
              }
            >
              {resetPasswordMutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </form>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              Remember your password?{" "}
              <Link href="/signin" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in instead
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}