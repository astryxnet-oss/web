import { useState } from "react";
import { useLocation } from "wouter";
import { Mail, Lock, User, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"choice" | "signup" | "login">("choice");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleGoogleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }

    if (formData.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/signup", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });

      if (response.success) {
        toast({ title: "Success", description: "Account created! Logging you in..." });
        setTimeout(() => setLocation("/"), 1500);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      if (response.success) {
        toast({ title: "Success", description: "Logged in successfully!" });
        setTimeout(() => setLocation("/"), 1500);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500/5 to-purple-600/5 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
            Alpha Source
          </h1>
          <p className="text-muted-foreground">Join our community</p>
        </div>

        {mode === "choice" && (
          <div className="space-y-4">
            <Button 
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-white hover:bg-gray-50 text-black border border-gray-200"
            >
              <Chrome className="h-5 w-5 mr-2" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or</span>
              </div>
            </div>

            <Button 
              onClick={() => setMode("signup")}
              className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              Create Account
            </Button>

            <Button 
              onClick={() => setMode("login")}
              variant="outline"
              className="w-full h-12"
            >
              Login with Email
            </Button>
          </div>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName" className="text-xs">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                  disabled={loading}
                />
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
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-xs">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-xs">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button 
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            <Button 
              type="button"
              variant="ghost"
              onClick={() => setMode("choice")}
              className="w-full"
              disabled={loading}
            >
              Back
            </Button>
          </form>
        )}

        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="loginEmail" className="text-xs">Email</Label>
              <Input
                id="loginEmail"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="loginPassword" className="text-xs">Password</Label>
              <Input
                id="loginPassword"
                type="password"
                placeholder="••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                disabled={loading}
              />
            </div>

            <Button 
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <Button 
              type="button"
              variant="ghost"
              onClick={() => setMode("choice")}
              className="w-full"
              disabled={loading}
            >
              Back
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
