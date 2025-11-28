import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Mail, Lock, User, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }

    if (formData.password.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response: any = await apiRequest("POST", "/api/auth/signup", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });

      if (response.success) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setUserEmail(formData.email);
        setShowVerificationMessage(true);
        toast({ title: "Success", description: "Account created! Please verify your email." });
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Signup failed", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await apiRequest("POST", "/api/auth/resend-verification", {});
      toast({ title: "Sent", description: "Verification email resent. Check your inbox." });
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to resend email", 
        variant: "destructive" 
      });
    } finally {
      setResending(false);
    }
  };

  if (showVerificationMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500/5 to-purple-600/5 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-600/20 mb-6">
            <Mail className="h-10 w-10 text-pink-500" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
          <p className="text-muted-foreground mb-6">
            We've sent a verification link to <span className="font-medium text-foreground">{userEmail}</span>
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Check your inbox
            </h3>
            <p className="text-sm text-muted-foreground">
              Click the verification link in the email to complete your registration.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => setLocation("/")}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              data-testid="button-continue-home"
            >
              Continue to Alpha Source
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Didn't receive the email?{" "}
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="text-pink-500 hover:text-pink-600 font-medium disabled:opacity-50"
                data-testid="button-resend-verification"
              >
                {resending ? "Sending..." : "Resend"}
              </button>
            </div>
          </div>
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
          <p className="text-muted-foreground">Create your account</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName" className="text-xs">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  placeholder="John"
                  className="pl-10"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                  disabled={loading}
                  data-testid="input-signup-firstname"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="lastName" className="text-xs">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
                disabled={loading}
                data-testid="input-signup-lastname"
              />
            </div>
          </div>

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
                data-testid="input-signup-email"
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
                placeholder="At least 8 characters"
                className="pl-10"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                disabled={loading}
                minLength={8}
                data-testid="input-signup-password"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-xs">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                className="pl-10"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
                disabled={loading}
                minLength={8}
                data-testid="input-signup-confirm-password"
              />
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            disabled={loading}
            data-testid="button-signup-submit"
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-pink-500 hover:text-pink-600 font-medium">
              Login
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
