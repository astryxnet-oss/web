import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Shield, 
  Code,
  Megaphone,
  ArrowLeft,
  Search,
  Check,
  X,
  Trash2,
  Loader2,
  AlertTriangle,
  Eye,
  Filter
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { SubmitModal } from "@/components/submit-modal";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Code as CodeType, Advertisement } from "@shared/schema";

export default function StaffDashboard() {
  const [submitOpen, setSubmitOpen] = useState(false);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "code" | "ad"; id: string; title: string } | null>(null);

  const { data: codes, isLoading: codesLoading } = useQuery<CodeType[]>({
    queryKey: ["/api/staff/codes"],
    enabled: user?.role === "owner" || user?.role === "staff",
  });

  const { data: ads, isLoading: adsLoading } = useQuery<Advertisement[]>({
    queryKey: ["/api/staff/advertisements"],
    enabled: user?.role === "owner" || user?.role === "staff",
  });

  const approveCodeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/staff/codes/${id}/approve`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Code approved" });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/codes"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectCodeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/staff/codes/${id}/reject`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Code rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/codes"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteCodeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/staff/codes/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Code deleted" });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/staff/codes"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const approveAdMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/staff/advertisements/${id}/approve`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Advertisement approved" });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/advertisements"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectAdMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/staff/advertisements/${id}/reject`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Advertisement rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/advertisements"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/staff/advertisements/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Advertisement deleted" });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/staff/advertisements"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const filteredCodes = codes?.filter(c => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (!searchQuery) return true;
    return c.title.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  const filteredAds = ads?.filter(a => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (!searchQuery) return true;
    return a.title.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  const pendingCodes = codes?.filter(c => c.status === "pending").length || 0;
  const pendingAds = ads?.filter(a => a.status === "pending").length || 0;

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

  if (!isAuthenticated || (user?.role !== "owner" && user?.role !== "staff")) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation onSubmitClick={() => setSubmitOpen(true)} />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 max-w-md text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-blue-500" />
            <h2 className="text-xl font-bold mb-2">Staff Access Required</h2>
            <p className="text-muted-foreground mb-4">
              This dashboard is only accessible to staff members.
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600">
                Go Home
              </Button>
            </Link>
          </Card>
        </main>
        <Footer />
        <SubmitModal open={submitOpen} onOpenChange={setSubmitOpen} />
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
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/20 to-indigo-500/20">
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Staff Dashboard</h1>
                <p className="text-muted-foreground">Review and moderate content</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Code className="h-8 w-8 text-pink-500" />
                <div>
                  <p className="text-2xl font-bold">{codes?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Codes</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Megaphone className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{ads?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Ads</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Eye className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{pendingCodes + pendingAds}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-content"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="codes" className="space-y-6">
            <TabsList>
              <TabsTrigger value="codes" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Codes
                {pendingCodes > 0 && (
                  <Badge variant="secondary" className="ml-1">{pendingCodes}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="ads" className="flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                Advertisements
                {pendingAds > 0 && (
                  <Badge variant="secondary" className="ml-1">{pendingAds}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="codes">
              <Card className="p-6">
                {codesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredCodes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No codes found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Copies</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCodes.map((code) => (
                        <TableRow key={code.id} data-testid={`row-code-${code.id}`}>
                          <TableCell className="font-medium">{code.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{code.category}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(code.status)}</TableCell>
                          <TableCell>{code.copyCount}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {code.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => approveCodeMutation.mutate(code.id)}
                                    disabled={approveCodeMutation.isPending}
                                    data-testid={`button-approve-${code.id}`}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => rejectCodeMutation.mutate(code.id)}
                                    disabled={rejectCodeMutation.isPending}
                                    data-testid={`button-reject-${code.id}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setItemToDelete({ type: "code", id: code.id, title: code.title });
                                  setDeleteDialogOpen(true);
                                }}
                                data-testid={`button-delete-${code.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="ads">
              <Card className="p-6">
                {adsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredAds.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No advertisements found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAds.map((ad) => (
                        <TableRow key={ad.id} data-testid={`row-ad-${ad.id}`}>
                          <TableCell className="font-medium">{ad.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{ad.category}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(ad.status)}</TableCell>
                          <TableCell>{ad.viewCount}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {ad.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => approveAdMutation.mutate(ad.id)}
                                    disabled={approveAdMutation.isPending}
                                    data-testid={`button-approve-ad-${ad.id}`}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => rejectAdMutation.mutate(ad.id)}
                                    disabled={rejectAdMutation.isPending}
                                    data-testid={`button-reject-ad-${ad.id}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setItemToDelete({ type: "ad", id: ad.id, title: ad.title });
                                  setDeleteDialogOpen(true);
                                }}
                                data-testid={`button-delete-ad-${ad.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      <SubmitModal open={submitOpen} onOpenChange={setSubmitOpen} />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {itemToDelete?.type === "code" ? "Code" : "Advertisement"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.title}"?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                This action cannot be undone.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (itemToDelete?.type === "code") {
                  deleteCodeMutation.mutate(itemToDelete.id);
                } else if (itemToDelete?.type === "ad") {
                  deleteAdMutation.mutate(itemToDelete.id);
                }
              }}
              disabled={deleteCodeMutation.isPending || deleteAdMutation.isPending}
            >
              {(deleteCodeMutation.isPending || deleteAdMutation.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
