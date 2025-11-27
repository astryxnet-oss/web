import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { CodeGrid } from "@/components/code-grid";
import { SubmitModal } from "@/components/submit-modal";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Code } from "@shared/schema";
import { Heart } from "lucide-react";

export default function Favorites() {
  const [submitOpen, setSubmitOpen] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to view your favorites.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [authLoading, isAuthenticated, toast]);

  const { data: favoriteCodes = [], isLoading: codesLoading } = useQuery<Code[]>({
    queryKey: ["/api/user/favorites"],
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation onSubmitClick={() => setSubmitOpen(true)} />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation onSubmitClick={() => setSubmitOpen(true)} />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="text-favorites-title">
              Your Favorites
            </h1>
            <p className="text-muted-foreground">
              Codes you've saved for quick access
            </p>
          </div>

          {codesLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          ) : favoriteCodes.length === 0 ? (
            <Card className="p-8 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3>
              <p className="text-muted-foreground mb-4">
                Click the heart icon on any code to add it to your favorites.
              </p>
            </Card>
          ) : (
            <CodeGrid codes={favoriteCodes} />
          )}
        </div>
      </main>

      <Footer />

      <SubmitModal 
        open={submitOpen} 
        onOpenChange={setSubmitOpen} 
      />
    </div>
  );
}
