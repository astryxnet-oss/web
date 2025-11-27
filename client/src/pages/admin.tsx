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
  Loader2,
  Shield,
  Trash2,
  Code,
  Megaphone,
  ExternalLink
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { categories, type Code as CodeType, type Advertisement } from "@shared/schema";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

type ContentType = "codes" | "advertisements";

export default function Admin() {
  const [submitOpen, setSubmitOpen] = useState(false);
  const [contentType, setContentType] = useState<ContentType>("codes");
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: allCodes = [], isLoading: codesLoading } = useQuery<CodeType[]>({
    queryKey: ["/api/admin/codes"],
    enabled: isAuthenticated && user?.isAdmin,
  });

  const { data: allAds = [], isLoading: adsLoading } = useQuery<Advertisement[]>({
    queryKey: ["/api/admin/advertisements"],
    enabled: isAuthenticated && user?.isAdmin,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation onSubmitClick={() => setSubmitOpen(true)} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation onSubmitClick={() => setSubmitOpen(true)} />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 max-w-md text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You need admin privileges to access this page.
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600">
                Back to Home
              </Button>
            </Link>
          </Card>
        </main>
        <Footer />
        <SubmitModal open={submitOpen} onOpenChange={setSubmitOpen} />
      </div>
    );
  }

  const approveCodeMutation = useMutation({
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

  const rejectCodeMutation = useMutation({
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

  const verifyCodeMutation = useMutation({
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

  const deleteCodeMutation = useMutation({
    mutationFn: async (codeId: string) => {
      return apiRequest("DELETE", `/api/admin/codes/${codeId}`, {});
    },
    onSuccess: () => {
      toast({ title: "Code deleted", description: "The code has been permanently deleted." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/codes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/codes"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete code.", variant: "destructive" });
    },
  });

  const approveAdMutation = useMutation({
    mutationFn: async (adId: string) => {
      return apiRequest("POST", `/api/admin/advertisements/${adId}/approve`, {});
    },
    onSuccess: () => {
      toast({ title: "Listing approved", description: "The listing is now visible to everyone." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve listing.", variant: "destructive" });
    },
  });

  const rejectAdMutation = useMutation({
    mutationFn: async (adId: string) => {
      return apiRequest("POST", `/api/admin/advertisements/${adId}/reject`, {});
    },
    onSuccess: () => {
      toast({ title: "Listing rejected", description: "The listing has been rejected." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject listing.", variant: "destructive" });
    },
  });

  const verifyAdMutation = useMutation({
    mutationFn: async (adId: string) => {
      return apiRequest("POST", `/api/admin/advertisements/${adId}/verify`, {});
    },
    onSuccess: () => {
      toast({ title: "Listing verified", description: "The listing is now marked as verified." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to verify listing.", variant: "destructive" });
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (adId: string) => {
      return apiRequest("DELETE", `/api/admin/advertisements/${adId}`, {});
    },
    onSuccess: () => {
      toast({ title: "Listing deleted", description: "The listing has been permanently deleted." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete listing.", variant: "destructive" });
    },
  });

  const pendingCodes = allCodes.filter((code) => code.status === "pending");
  const approvedCodes = allCodes.filter((code) => code.status === "approved");
  const rejectedCodes = allCodes.filter((code) => code.status === "rejected");

  const pendingAds = allAds.filter((ad) => ad.status === "pending");
  const approvedAds = allAds.filter((ad) => ad.status === "approved");
  const rejectedAds = allAds.filter((ad) => ad.status === "rejected");

  const getCodesForTab = () => {
    switch (activeTab) {
      case "pending": return pendingCodes;
      case "approved": return approvedCodes;
      case "rejected": return rejectedCodes;
      default: return pendingCodes;
    }
  };

  const getAdsForTab = () => {
    switch (activeTab) {
      case "pending": return pendingAds;
      case "approved": return approvedAds;
      case "rejected": return rejectedAds;
      default: return pendingAds;
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || categoryId;
  };

  const isLoading = contentType === "codes" ? codesLoading : adsLoading;
  const pending = contentType === "codes" ? pendingCodes : pendingAds;
  const approved = contentType === "codes" ? approvedCodes : approvedAds;
  const rejected = contentType === "codes" ? rejectedCodes : rejectedAds;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation onSubmitClick={() => setSubmitOpen(true)} />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Review and manage submissions
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={contentType === "codes" ? "default" : "outline"}
              onClick={() => { setContentType("codes"); setActiveTab("pending"); }}
              className={contentType === "codes" ? "bg-gradient-to-r from-pink-500 to-purple-600" : ""}
              data-testid="button-view-codes"
            >
              <Code className="h-4 w-4 mr-2" />
              Codes ({allCodes.length})
            </Button>
            <Button
              variant={contentType === "advertisements" ? "default" : "outline"}
              onClick={() => { setContentType("advertisements"); setActiveTab("pending"); }}
              className={contentType === "advertisements" ? "bg-gradient-to-r from-purple-500 to-pink-600" : ""}
              data-testid="button-view-ads"
            >
              <Megaphone className="h-4 w-4 mr-2" />
              Listings ({allAds.length})
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pending.length}</p>
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
                  <p className="text-2xl font-bold">{approved.length}</p>
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
                  <p className="text-2xl font-bold">{rejected.length}</p>
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
                    Pending ({pending.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="data-[state=active]:bg-muted">
                    Approved ({approved.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="data-[state=active]:bg-muted">
                    Rejected ({rejected.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="m-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : contentType === "codes" ? (
                  getCodesForTab().length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Code className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No {activeTab} codes</p>
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
                                  <BadgeCheck className="inline h-4 w-4 ml-1 text-pink-500" />
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
                                        onClick={() => approveCodeMutation.mutate(code.id)}
                                        disabled={approveCodeMutation.isPending}
                                        data-testid={`button-approve-${code.id}`}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => rejectCodeMutation.mutate(code.id)}
                                        disabled={rejectCodeMutation.isPending}
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
                                      onClick={() => verifyCodeMutation.mutate(code.id)}
                                      disabled={verifyCodeMutation.isPending}
                                      data-testid={`button-verify-${code.id}`}
                                    >
                                      <BadgeCheck className="h-4 w-4 mr-1" />
                                      Verify
                                    </Button>
                                  )}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Code</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{code.title}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteCodeMutation.mutate(code.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )
                ) : (
                  getAdsForTab().length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No {activeTab} listings</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Link</TableHead>
                            <TableHead>Submitter</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getAdsForTab().map((ad) => (
                            <TableRow key={ad.id} data-testid={`row-ad-${ad.id}`}>
                              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                {ad.createdAt
                                  ? format(new Date(ad.createdAt), "MMM d, yyyy")
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="bg-purple-500/10">
                                  {getCategoryName(ad.category)}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium max-w-[200px] truncate">
                                {ad.title}
                                {ad.isVerified && (
                                  <BadgeCheck className="inline h-4 w-4 ml-1 text-purple-500" />
                                )}
                              </TableCell>
                              <TableCell>
                                {ad.inviteLink ? (
                                  <a 
                                    href={ad.inviteLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    View
                                  </a>
                                ) : (
                                  <span className="text-sm text-muted-foreground">None</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {ad.submitterName || "Anonymous"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-2">
                                  {activeTab === "pending" && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => approveAdMutation.mutate(ad.id)}
                                        disabled={approveAdMutation.isPending}
                                        data-testid={`button-approve-ad-${ad.id}`}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => rejectAdMutation.mutate(ad.id)}
                                        disabled={rejectAdMutation.isPending}
                                        data-testid={`button-reject-ad-${ad.id}`}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  {activeTab === "approved" && !ad.isVerified && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => verifyAdMutation.mutate(ad.id)}
                                      disabled={verifyAdMutation.isPending}
                                      data-testid={`button-verify-ad-${ad.id}`}
                                    >
                                      <BadgeCheck className="h-4 w-4 mr-1" />
                                      Verify
                                    </Button>
                                  )}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{ad.title}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteAdMutation.mutate(ad.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )
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
