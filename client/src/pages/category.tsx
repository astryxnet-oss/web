import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { SearchFilter } from "@/components/search-filter";
import { CodeGrid } from "@/components/code-grid";
import { SubmitModal } from "@/components/submit-modal";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { categories, type Code, type SubmitCode } from "@shared/schema";

export default function Category() {
  const { id } = useParams<{ id: string }>();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const { toast } = useToast();

  const categoryInfo = categories.find((c) => c.id === id);

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

  const filteredCodes = useMemo(() => {
    let result = codes.filter((code) => code.category === id);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (code) =>
          code.title.toLowerCase().includes(query) ||
          code.code.toLowerCase().includes(query) ||
          code.description?.toLowerCase().includes(query)
      );
    }

    if (selectedStatus !== "all") {
      const now = Date.now();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

      switch (selectedStatus) {
        case "verified":
          result = result.filter((code) => code.isVerified);
          break;
        case "new":
          result = result.filter(
            (code) => code.createdAt && new Date(code.createdAt).getTime() > weekAgo
          );
          break;
        case "popular":
          result = result.filter((code) => (code.copyCount || 0) >= 50);
          break;
      }
    }

    switch (sortBy) {
      case "recent":
        result.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case "popular":
        result.sort((a, b) => (b.copyCount || 0) - (a.copyCount || 0));
        break;
      case "alphabetical":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [codes, id, searchQuery, selectedStatus, sortBy]);

  if (!categoryInfo) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation onSubmitClick={() => setSubmitOpen(true)} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Category not found</h1>
            <p className="text-muted-foreground mb-4">
              The category you're looking for doesn't exist.
            </p>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation onSubmitClick={() => setSubmitOpen(true)} />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl font-bold mb-2">{categoryInfo.name} Codes</h1>
            <p className="text-muted-foreground">{categoryInfo.description}</p>
          </div>

          <div className="mb-6">
            <SearchFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={id || "all"}
              onCategoryChange={() => {}}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>

          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredCodes.length} {filteredCodes.length === 1 ? "code" : "codes"}
            </p>
          </div>

          <CodeGrid 
            codes={filteredCodes} 
            isLoading={isLoading}
            emptyMessage={`No ${categoryInfo.name} codes yet. Be the first to submit one!`}
          />
        </div>
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
