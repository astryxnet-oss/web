import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Navigation } from "@/components/navigation";
import { SearchFilter } from "@/components/search-filter";
import { CodeGrid } from "@/components/code-grid";
import { SubmitModal } from "@/components/submit-modal";
import { Footer } from "@/components/footer";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Code, SubmitCode } from "@shared/schema";

export default function Browse() {
  const searchParams = useSearch();
  const urlQuery = new URLSearchParams(searchParams).get("q") || "";
  
  const [submitOpen, setSubmitOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const { toast } = useToast();
  
  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);

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
    let result = [...codes];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (code) =>
          code.title.toLowerCase().includes(query) ||
          code.code.toLowerCase().includes(query) ||
          code.description?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter((code) => code.category === selectedCategory);
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
  }, [codes, searchQuery, selectedCategory, selectedStatus, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation 
        onSubmitClick={() => setSubmitOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Browse Codes</h1>
            <p className="text-muted-foreground">
              Search and filter through all available codes
            </p>
          </div>

          <div className="mb-6">
            <SearchFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
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

          <CodeGrid codes={filteredCodes} isLoading={isLoading} />
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
