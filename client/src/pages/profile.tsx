import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { CodeGrid } from "@/components/code-grid";
import { SubmitModal } from "@/components/submit-modal";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Code } from "@shared/schema";
import { FileCode, CheckCircle, Clock, XCircle } from "lucide-react";

export default function Profile() {
  const [submitOpen, setSubmitOpen] = useState(false);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to view your profile.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [authLoading, isAuthenticated, toast]);

  const { data: userCodes = [], isLoading: codesLoading } = useQuery<Code[]>({
    queryKey: ["/api/user/codes"],
    enabled: isAuthenticated,
  });

  const getUserInitials = () => {
    if (!user) return "?";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const pendingCodes = userCodes.filter(c => c.status === "pending");
  const approvedCodes = userCodes.filter(c => c.status === "approved");
  const rejectedCodes = userCodes.filter(c => c.status === "rejected");
  const totalCopies = approvedCodes.reduce((sum, c) => sum + (c.copyCount || 0), 0);

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
          <Card className="p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-2xl font-bold" data-testid="text-profile-name">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : user?.email || "User"}
                </h1>
                {user?.email && (
                  <p className="text-muted-foreground">{user.email}</p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{userCodes.length}</div>
                  <div className="text-xs text-muted-foreground">Submissions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{approvedCodes.length}</div>
                  <div className="text-xs text-muted-foreground">Approved</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalCopies}</div>
                  <div className="text-xs text-muted-foreground">Total Copies</div>
                </div>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all" className="gap-2">
                <FileCode className="h-4 w-4" />
                All ({userCodes.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Approved ({approvedCodes.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Pending ({pendingCodes.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                <XCircle className="h-4 w-4" />
                Rejected ({rejectedCodes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {codesLoading ? (
                <div className="text-center text-muted-foreground py-8">Loading...</div>
              ) : userCodes.length === 0 ? (
                <Card className="p-8 text-center">
                  <FileCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Submissions Yet</h3>
                  <p className="text-muted-foreground mb-4">You haven't submitted any codes yet.</p>
                </Card>
              ) : (
                <CodeGrid codes={userCodes} showStatus />
              )}
            </TabsContent>

            <TabsContent value="approved">
              {approvedCodes.length === 0 ? (
                <Card className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Approved Codes</h3>
                  <p className="text-muted-foreground">Your approved codes will appear here.</p>
                </Card>
              ) : (
                <CodeGrid codes={approvedCodes} />
              )}
            </TabsContent>

            <TabsContent value="pending">
              {pendingCodes.length === 0 ? (
                <Card className="p-8 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Codes</h3>
                  <p className="text-muted-foreground">Codes awaiting review will appear here.</p>
                </Card>
              ) : (
                <CodeGrid codes={pendingCodes} showStatus />
              )}
            </TabsContent>

            <TabsContent value="rejected">
              {rejectedCodes.length === 0 ? (
                <Card className="p-8 text-center">
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Rejected Codes</h3>
                  <p className="text-muted-foreground">Rejected codes will appear here.</p>
                </Card>
              ) : (
                <CodeGrid codes={rejectedCodes} showStatus />
              )}
            </TabsContent>
          </Tabs>
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
