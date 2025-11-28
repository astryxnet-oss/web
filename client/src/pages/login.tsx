import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Mail, Lock, Chrome, ArrowLeft, Shield, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const handleGoogleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiRequest("POST", "/api/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      const response: any = await res.json();

      if (response.requiresTwoFactor) {
        setTwoFactorRequired(true);
        setChallengeToken(response.challengeToken);
        toast({ title: "2FA Required", description: "Enter your authentication code" });
      } else if (response.success) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({ title: "Success", description: "Logged in successfully!" });
        setTimeout(() => setLocation("/"), 1000);
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Login failed", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiRequest("POST", "/api/auth/login", {
        challengeToken,
        twoFactorCode,
      });

      const response: any = await res.json();

      if (response.success) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({ title: "Success", description: "Logged in successfully!" });
        setTimeout(() => setLocation("/"), 1000);
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Invalid 2FA code", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (twoFactorRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500/5 to-purple-600/5 p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-600/20 mb-4">
              <Shield className="h-8 w-8 text-pink-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Two-Factor Authentication</h1>
            <p className="text-muted-foreground">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <form onSubmit={handleTwoFactorSubmit} className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={twoFactorCode}
                onChange={setTwoFactorCode}
                disabled={loading}
                data-testid="input-2fa-code"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button 
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              disabled={loading || twoFactorCode.length !== 6}
              data-testid="button-2fa-submit"
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Lost your authenticator? Use a backup code
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setTwoFactorRequired(false)}
                data-testid="button-back-login"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500/5 to-purple-600/5 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2 cursor-pointer">
              Alpha Source
            </h1>
          </Link>
          <p className="text-muted-foreground">Welcome back</p>
        </div>

        <div className="space-y-4 mb-6">
          <Button 
            onClick={handleGoogleLogin}
            className="w-full h-12 bg-white hover:bg-gray-50 text-black border border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-600"
            data-testid="button-google-login"
          >
            <Chrome className="h-5 w-5 mr-2" />
            Continue with Replit
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Or continue with email</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-xs">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                disabled={loading}
                data-testid="input-login-email"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-xs">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="pl-10"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                disabled={loading}
                data-testid="input-login-password"
              />
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            disabled={loading}
            data-testid="button-login-submit"
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-pink-500 hover:text-pink-600 font-medium">
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-4">
          <Link href="/">
            <Button variant="ghost" className="w-full" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
