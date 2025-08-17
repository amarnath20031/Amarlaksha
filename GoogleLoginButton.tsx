import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

export default function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    // Redirect to backend Google auth route
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  return (
    <Button
      onClick={handleGoogleLogin}
      variant="outline"
      className="w-full flex items-center justify-center space-x-2"
    >
      <FcGoogle className="w-5 h-5" />
      <span>Continue with Google</span>
    </Button>
  );
}