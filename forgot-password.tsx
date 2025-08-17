import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, Lock, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Step 1: Request password reset
  const requestResetMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", { email });
      return response.json();
    },
    onSuccess: (data) => {
      setStep("otp");
      setResetToken(data.token);
      toast({
        title: "Reset email sent!",
        description: "Check your email for the OTP and reset link.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Step 2 & 3: Reset password (with OTP or token)
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { otp?: string; token?: string; newPassword: string }) => {
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

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    requestResetMutation.mutate(email);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) return;
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate({
      otp,
      newPassword
    });
  };

  const handleTokenReset = (token: string) => {
    if (!newPassword || !confirmPassword) {
      setStep("reset");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate({
      token,
      newPassword
    });
  };

  return (
    <div className="auth-wrapper bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Card className="auth-card bg-white/95 backdrop-blur-sm shadow-2xl">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between">
            <Link href="/signin">
              <Button variant="ghost" size="sm" className="p-1">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">₹</span>
              </div>
              <span className="font-bold text-gray-900">Laksha</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-gray-900">
            {step === "email" && "Forgot Password"}
            {step === "otp" && "Enter OTP"}
            {step === "reset" && "Set New Password"}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="text-center text-sm text-gray-600 mb-4">
                <Mail className="w-12 h-12 mx-auto mb-2 text-blue-600" />
                Enter your registered email address and we'll send you a reset link with OTP.
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={requestResetMutation.isPending || !email}
              >
                {requestResetMutation.isPending ? "Sending..." : "Send Reset Email"}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="text-center text-sm text-gray-600 mb-4">
                <Shield className="w-12 h-12 mx-auto mb-2 text-green-600" />
                Check your email for a 6-digit OTP. Enter it below along with your new password.
              </div>

              <Alert>
                <AlertDescription>
                  OTP expires in 10 minutes. Check your spam folder if you don't see the email.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">6-Digit OTP</label>
                <Input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-11 text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

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
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                disabled={resetPasswordMutation.isPending || !otp || !newPassword || !confirmPassword}
              >
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={(e) => { e.preventDefault(); handleTokenReset(resetToken); }} className="space-y-4">
              <div className="text-center text-sm text-gray-600 mb-4">
                <Lock className="w-12 h-12 mx-auto mb-2 text-purple-600" />
                Enter your new password below.
              </div>
              
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
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={resetPasswordMutation.isPending || !newPassword || !confirmPassword}
              >
                {resetPasswordMutation.isPending ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}

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