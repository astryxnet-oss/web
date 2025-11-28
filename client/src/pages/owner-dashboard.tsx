import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Users, 
  Shield, 
  Crown,
  UserPlus,
  Ban,
  UserMinus,
  History,
  Settings,
  ArrowLeft,
  Search,
  Check,
  X,
  Loader2,
  AlertTriangle,
  RefreshCcw
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { SubmitModal } from "@/components/submit-modal";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export default function OwnerDashboard() {
  const [submitOpen, setSubmitOpen] = useState(false);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [newRole, setNewRole] = useState<"user" | "staff">("user");

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery<{ users: User[], total: number }>({
    queryKey: ["/api/owner/users"],
    enabled: user?.role === "owner",
  });

  const { data: staffUsers, isLoading: staffLoading } = useQuery<User[]>({
    queryKey: ["/api/owner/staff"],
    enabled: user?.role === "owner",
  });

  const { data: auditLogs, isLoading: logsLoading } = useQuery<any[]>({
    queryKey: ["/api/owner/audit-logs"],
    enabled: user?.role === "owner",
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiRequest("POST", `/api/owner/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User role updated" });
      setRoleDialogOpen(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/owner/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/staff"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const banMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      return apiRequest("POST", `/api/owner/users/${userId}/ban`, { reason });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User has been banned" });
      setBanDialogOpen(false);
      setSelectedUser(null);
      setBanReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/owner/users"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/owner/users/${userId}/unban`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User has been unbanned" });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/users"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getUserInitials = (u: User) => {
    if (u.firstName && u.lastName) {
      return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    }
    if (u.email) return u.email[0].toUpperCase();
    return "?";
  };

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500"><Crown className="h-3 w-3 mr-1" />Owner</Badge>;
      case "staff":
        return <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500"><Shield className="h-3 w-3 mr-1" />Staff</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  const filteredUsers = usersData?.users.filter(u => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.email?.toLowerCase().includes(query) ||
      u.firstName?.toLowerCase().includes(query) ||
      u.lastName?.toLowerCase().includes(query)
    );
  }) || [];

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

  if (!isAuthenticated || user?.role !== "owner") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation onSubmitClick={() => setSubmitOpen(true)} />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 max-w-md text-center">
            <Crown className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-bold mb-2">Owner Access Required</h2>
            <p className="text-muted-foreground mb-4">
              This dashboard is only accessible to the site owner.
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
              <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20">
                <Crown className="h-8 w-8 text-amber-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Owner Dashboard</h1>
                <p className="text-muted-foreground">Manage users, staff, and site settings</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-pink-500" />
                <div>
                  <p className="text-2xl font-bold">{usersData?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{staffUsers?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Staff Members</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Ban className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {usersData?.users.filter(u => u.isBanned).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Banned Users</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <History className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{auditLogs?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Audit Logs</p>
                </div>
              </div>
            </Card>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Staff
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Audit Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card className="p-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search-users"
                    />
                  </div>
                  <Button variant="outline" onClick={() => refetchUsers()}>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={u.profileImageUrl || undefined} />
                                <AvatarFallback className="text-xs">{getUserInitials(u)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {u.firstName} {u.lastName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>{getRoleBadge(u.role)}</TableCell>
                          <TableCell>
                            {u.isBanned ? (
                              <Badge variant="destructive">Banned</Badge>
                            ) : u.emailVerifiedAt ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <Check className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-600">
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {u.role !== "owner" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setNewRole(u.role === "staff" ? "user" : "staff");
                                      setRoleDialogOpen(true);
                                    }}
                                    data-testid={`button-role-${u.id}`}
                                  >
                                    <UserPlus className="h-4 w-4" />
                                  </Button>
                                  {u.isBanned ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => unbanMutation.mutate(u.id)}
                                      disabled={unbanMutation.isPending}
                                      data-testid={`button-unban-${u.id}`}
                                    >
                                      <UserMinus className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedUser(u);
                                        setBanDialogOpen(true);
                                      }}
                                      data-testid={`button-ban-${u.id}`}
                                    >
                                      <Ban className="h-4 w-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="staff">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Staff Members</h3>
                
                {staffLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : staffUsers?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No staff members yet</p>
                    <p className="text-sm">Promote users to staff from the Users tab</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {staffUsers?.map((s) => (
                      <Card key={s.id} className="p-4" data-testid={`card-staff-${s.id}`}>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={s.profileImageUrl || undefined} />
                            <AvatarFallback>{getUserInitials(s)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{s.firstName} {s.lastName}</p>
                            <p className="text-sm text-muted-foreground">{s.email}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(s);
                              setNewRole("user");
                              setRoleDialogOpen(true);
                            }}
                            data-testid={`button-demote-${s.id}`}
                          >
                            Demote
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="logs">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Audit Logs</h3>
                
                {logsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {auditLogs?.map((log, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="p-1.5 rounded-full bg-background">
                          <History className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{log.action}</span>
                            {" on "}
                            <span className="text-muted-foreground">{log.targetType}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!auditLogs || auditLogs.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">No audit logs yet</p>
                    )}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      <SubmitModal open={submitOpen} onOpenChange={setSubmitOpen} />

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select value={newRole} onValueChange={(v: "user" | "staff") => setNewRole(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => selectedUser && changeRoleMutation.mutate({ userId: selectedUser.id, role: newRole })}
              disabled={changeRoleMutation.isPending}
              className="bg-gradient-to-r from-pink-500 to-purple-600"
            >
              {changeRoleMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Are you sure you want to ban {selectedUser?.firstName} {selectedUser?.lastName}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg mb-4">
              <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                This user will not be able to log in until unbanned.
              </p>
            </div>
            <Textarea
              placeholder="Reason for ban (optional)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && banMutation.mutate({ userId: selectedUser.id, reason: banReason })}
              disabled={banMutation.isPending}
            >
              {banMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Banning...
                </>
              ) : (
                "Ban User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
