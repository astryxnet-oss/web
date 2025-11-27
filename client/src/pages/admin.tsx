import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Check, 
  X, 
  BadgeCheck, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Loader2 
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { SubmitModal } from "@/components/submit-modal";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { categories, type Code } from "@shared/schema";
import { format } from "date-fns";

export default function Admin() {
  const [submitOpen, setSubmitOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();

  const { data: allCodes = [], isLoading } = useQuery<Code[]>({
    queryKey: ["/api/admin/codes"],
  });

  const approveMutation = useMutation({
    mutationFn: async (codeId: string) => {
      return apiRequest("POST", `/api/admin/codes/${codeId}/approve`, {});
    },
    onSuccess: () => {
      toast({ title: "Code approved", description: "The code is now visible to everyone." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/codes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/codes"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve code.", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (codeId: string) => {
      return apiRequest("POST", `/api/admin/codes/${codeId}/reject`, {});
    },
    onSuccess: () => {
      toast({ title: "Code rejected", description: "The code has been rejected." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/codes"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject code.", variant: "destructive" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (codeId: string) => {
      return apiRequest("POST", `/api/admin/codes/${codeId}/verify`, {});
    },
    onSuccess: () => {
      toast({ title: "Code verified", description: "The code is now marked as verified." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/codes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/codes"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to verify code.", variant: "destructive" });
    },
  });

  const pendingCodes = allCodes.filter((code) => code.status === "pending");
  const approvedCodes = allCodes.filter((code) => code.status === "approved");
  const rejectedCodes = allCodes.filter((code) => code.status === "rejected");

  const getCodesForTab = () => {
    switch (activeTab) {
      case "pending":
        return pendingCodes;
      case "approved":
        return approvedCodes;
      case "rejected":
        return rejectedCodes;
      default:
        return pendingCodes;
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || categoryId;
  };

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
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Review and manage code submissions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCodes.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedCodes.length}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rejectedCodes.length}</p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b border-border px-4">
                <TabsList className="h-12 bg-transparent">
                  <TabsTrigger value="pending" className="data-[state=active]:bg-muted">
                    Pending ({pendingCodes.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="data-[state=active]:bg-muted">
                    Approved ({approvedCodes.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="data-[state=active]:bg-muted">
                    Rejected ({rejectedCodes.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="m-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : getCodesForTab().length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No {activeTab} submissions</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Submitter</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getCodesForTab().map((code) => (
                          <TableRow key={code.id} data-testid={`row-code-${code.id}`}>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                              {code.createdAt
                                ? format(new Date(code.createdAt), "MMM d, yyyy")
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {getCategoryName(code.category)}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {code.title}
                              {code.isVerified && (
                                <BadgeCheck className="inline h-4 w-4 ml-1 text-primary" />
                              )}
                            </TableCell>
                            <TableCell>
                              <code className="px-2 py-1 bg-muted rounded text-xs font-mono max-w-[150px] truncate block">
                                {code.code}
                              </code>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {code.submitterName || "Anonymous"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                {activeTab === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => approveMutation.mutate(code.id)}
                                      disabled={approveMutation.isPending}
                                      data-testid={`button-approve-${code.id}`}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => rejectMutation.mutate(code.id)}
                                      disabled={rejectMutation.isPending}
                                      data-testid={`button-reject-${code.id}`}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {activeTab === "approved" && !code.isVerified && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => verifyMutation.mutate(code.id)}
                                    disabled={verifyMutation.isPending}
                                    data-testid={`button-verify-${code.id}`}
                                  >
                                    <BadgeCheck className="h-4 w-4 mr-1" />
                                    Verify
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
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
