import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/components/hero-section";
import { CategoryGrid } from "@/components/category-grid";
import { CodeGrid } from "@/components/code-grid";
import { SubmitModal } from "@/components/submit-modal";
import { Footer } from "@/components/footer";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Code, SubmitCode } from "@shared/schema";

export default function Home() {
  const [submitOpen, setSubmitOpen] = useState(false);
  const { toast } = useToast();

  const { data: codesData, isLoading } = useQuery<{ codes: Code[]; counts: Record<string, number> }>({
    queryKey: ["/api/codes"],
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmitCode) => {
      return apiRequest("POST", "/api/codes/submit", data);
    },
    onSuccess: () => {
      toast({
        title: "Code submitted!",
        description: "Your code has been submitted for review. Thank you!",
      });
      setSubmitOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/codes"] });
    },
    onError: () => {
      toast({
        title: "Submission failed",
        description: "There was an error submitting your code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const codes = codesData?.codes || [];
  const counts = codesData?.counts || {};
  const totalCodes = codes.length;
  const recentCodes = codes.slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation 
        onSubmitClick={() => setSubmitOpen(true)}
      />
      
      <main className="flex-1">
        <HeroSection 
          totalCodes={totalCodes} 
          onSubmitClick={() => setSubmitOpen(true)} 
        />
        
        <CategoryGrid codeCounts={counts} />
        
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Recent Codes</h2>
                <p className="text-muted-foreground">
                  The latest codes shared by our community
                </p>
              </div>
            </div>
            
            <CodeGrid 
              codes={recentCodes} 
              isLoading={isLoading}
              emptyMessage="Be the first to submit a code!"
            />
          </div>
        </section>
      </main>

      <Footer />

      <SubmitModal
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        onSubmit={(data) => submitMutation.mutate(data)}
        isSubmitting={submitMutation.isPending}
      />
    </div>
  );
}
