import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/components/hero-section";
import { CategoryGrid } from "@/components/category-grid";
import { CodeGrid } from "@/components/code-grid";
import { SubmitModal } from "@/components/submit-modal";
import { Footer } from "@/components/footer";
import type { Code } from "@shared/schema";

export default function Home() {
  const [submitOpen, setSubmitOpen] = useState(false);

  const { data: codesData, isLoading } = useQuery<{ codes: Code[]; counts: Record<string, number> }>({
    queryKey: ["/api/codes"],
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
      />
    </div>
  );
}
