import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setStatus("error");
        setMessage("No verification token provided");
        return;
      }

      try {
        const response: any = await apiRequest("POST", "/api/auth/verify-email", { token });
        if (response.success) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
          await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        } else {
          setStatus("error");
          setMessage(response.error || "Verification failed");
        }
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "Verification failed. The link may be expired.");
      }
    };

    verifyToken();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500/5 to-purple-600/5 p-4">
      <Card className="w-full max-w-md p-8 text-center">
        {status === "loading" && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-600/20 mb-6">
              <Loader2 className="h-10 w-10 text-pink-500 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Verifying Email</h1>
            <p className="text-muted-foreground">Please wait while we verify your email address...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Email Verified</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button 
              onClick={() => setLocation("/")}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              data-testid="button-go-home"
            >
              Go to Alpha Source
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
              <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            
            <div className="space-y-3">
              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600" data-testid="button-login">
                  Login to Request New Link
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full" data-testid="button-home">
                  Back to Home
                </Button>
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
