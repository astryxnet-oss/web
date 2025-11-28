import { useState } from "react";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Moon,
  Sun,
  Check,
  Copy,
  Loader2,
  AlertTriangle,
  Smartphone,
  Key
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { SubmitModal } from "@/components/submit-modal";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { apiRequest } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";

export default function Settings() {
  const [submitOpen, setSubmitOpen] = useState(false);
  const { user, isAuthenticated, isLoading, refetch } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [codeApprovalNotifications, setCodeApprovalNotifications] = useState(true);
  
  const [twoFactorSetupOpen, setTwoFactorSetupOpen] = useState(false);
  const [twoFactorDisableOpen, setTwoFactorDisableOpen] = useState(false);
  const [setupData, setSetupData] = useState<{ qrCodeUrl: string; backupCodes: string[]; secret: string } | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [backupCodesVisible, setBackupCodesVisible] = useState(false);
  const [verifying, setVerifying] = useState(false);

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

  const handleSaveProfile = () => {
    toast({
      title: "Profile updated",
      description: "Your profile settings have been saved."
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notifications updated",
      description: "Your notification preferences have been saved."
    });
  };

  const handleSetup2FA = async () => {
    setSetupLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/2fa/setup", {});
      const response: any = await res.json();
      setSetupData({
        qrCodeUrl: response.qrCodeUrl,
        backupCodes: response.backupCodes,
        secret: response.secret
      });
      setTwoFactorSetupOpen(true);
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to setup 2FA", 
        variant: "destructive" 
      });
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    setVerifying(true);
    try {
      const res = await apiRequest("POST", "/api/auth/2fa/verify", { code: verifyCode });
      await res.json();
      toast({ title: "Success", description: "Two-factor authentication enabled!" });
      setTwoFactorSetupOpen(false);
      setSetupData(null);
      setVerifyCode("");
      refetch();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Invalid code", 
        variant: "destructive" 
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    setVerifying(true);
    try {
      const res = await apiRequest("POST", "/api/auth/2fa/disable", { code: disableCode });
      await res.json();
      toast({ title: "Success", description: "Two-factor authentication disabled" });
      setTwoFactorDisableOpen(false);
      setDisableCode("");
      refetch();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Invalid code", 
        variant: "destructive" 
      });
    } finally {
      setVerifying(false);
    }
  };

  const copyBackupCodes = () => {
    if (setupData) {
      navigator.clipboard.writeText(setupData.backupCodes.join("\n"));
      toast({ title: "Copied", description: "Backup codes copied to clipboard" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation onSubmitClick={() => setSubmitOpen(true)} />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation onSubmitClick={() => setSubmitOpen(true)} />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 max-w-md text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to be logged in to access account settings.
            </p>
            <Button onClick={() => window.location.href = "/api/login"} className="bg-gradient-to-r from-pink-500 to-purple-600">
              Login to Continue
            </Button>
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
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Profile
              </Button>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
            <p className="text-muted-foreground">
              Manage your account preferences and settings
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 gap-1">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                    <AvatarFallback className="text-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">
                      {user.firstName} {user.lastName}
                    </h4>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.emailVerifiedAt && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <Check className="h-3 w-3" />
                        Email verified
                      </span>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" defaultValue={user.firstName || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" defaultValue={user.lastName || ""} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user.email || ""} disabled />
                    <p className="text-xs text-muted-foreground">Email is managed through your account</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSaveProfile} className="bg-gradient-to-r from-pink-500 to-purple-600">
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-600/10">
                        <Smartphone className="h-5 w-5 text-pink-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account by requiring a verification code in addition to your password.
                        </p>
                        {user.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                            <Check className="h-3 w-3" />
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                            <AlertTriangle className="h-3 w-3" />
                            Not enabled
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      {user.twoFactorEnabled ? (
                        <Button 
                          variant="outline" 
                          onClick={() => setTwoFactorDisableOpen(true)}
                          data-testid="button-disable-2fa"
                        >
                          Disable
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleSetup2FA}
                          disabled={setupLoading}
                          className="bg-gradient-to-r from-pink-500 to-purple-600"
                          data-testid="button-enable-2fa"
                        >
                          {setupLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Setting up...
                            </>
                          ) : (
                            "Enable"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-600/10">
                      <Key className="h-5 w-5 text-pink-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Password</h4>
                      <p className="text-sm text-muted-foreground">
                        Your account is secured with a password. You can change it anytime.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about your activity
                      </p>
                    </div>
                    <Switch 
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Code Approval Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when your submitted codes are reviewed
                      </p>
                    </div>
                    <Switch 
                      checked={codeApprovalNotifications}
                      onCheckedChange={setCodeApprovalNotifications}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSaveNotifications} className="bg-gradient-to-r from-pink-500 to-purple-600">
                    <Check className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="appearance">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Appearance Settings</h3>
                
                <div className="space-y-6">
                  <div>
                    <Label className="text-base mb-4 block">Theme</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => theme === "dark" && toggleTheme()}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          theme === "light" 
                            ? "border-pink-500 bg-pink-500/5" 
                            : "border-border hover:border-pink-500/50"
                        }`}
                        data-testid="button-theme-light"
                      >
                        <Sun className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-sm font-medium">Light</p>
                      </button>
                      <button
                        onClick={() => theme === "light" && toggleTheme()}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          theme === "dark" 
                            ? "border-pink-500 bg-pink-500/5" 
                            : "border-border hover:border-pink-500/50"
                        }`}
                        data-testid="button-theme-dark"
                      >
                        <Moon className="h-6 w-6 mx-auto mb-2" />
                        <p className="text-sm font-medium">Dark</p>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      <SubmitModal open={submitOpen} onOpenChange={setSubmitOpen} />

      <Dialog open={twoFactorSetupOpen} onOpenChange={setTwoFactorSetupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app
            </DialogDescription>
          </DialogHeader>
          
          {setupData && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>Can't scan? Enter this code manually:</p>
                <code className="block mt-1 p-2 bg-muted rounded text-xs font-mono break-all">
                  {setupData.secret}
                </code>
              </div>

              <div>
                <Label className="text-sm">Enter verification code</Label>
                <div className="flex justify-center mt-2">
                  <InputOTP
                    maxLength={6}
                    value={verifyCode}
                    onChange={setVerifyCode}
                    disabled={verifying}
                    data-testid="input-2fa-verify"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <div>
                <button
                  onClick={() => setBackupCodesVisible(!backupCodesVisible)}
                  className="text-sm text-pink-500 hover:text-pink-600"
                >
                  {backupCodesVisible ? "Hide" : "Show"} backup codes
                </button>
                
                {backupCodesVisible && (
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">Backup Codes</span>
                      <Button size="sm" variant="ghost" onClick={copyBackupCodes}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Save these codes somewhere safe. Each can only be used once.
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {setupData.backupCodes.map((code, i) => (
                        <code key={i} className="text-xs font-mono p-1 bg-background rounded">
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setTwoFactorSetupOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleVerify2FA}
              disabled={verifyCode.length !== 6 || verifying}
              className="bg-gradient-to-r from-pink-500 to-purple-600"
              data-testid="button-2fa-confirm"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Enable 2FA"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={twoFactorDisableOpen} onOpenChange={setTwoFactorDisableOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your authentication code to disable 2FA
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                Disabling 2FA will make your account less secure. Are you sure?
              </p>
            </div>

            <div>
              <Label className="text-sm">Enter verification code</Label>
              <div className="flex justify-center mt-2">
                <InputOTP
                  maxLength={6}
                  value={disableCode}
                  onChange={setDisableCode}
                  disabled={verifying}
                  data-testid="input-2fa-disable"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTwoFactorDisableOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={disableCode.length !== 6 || verifying}
              data-testid="button-2fa-disable-confirm"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable 2FA"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
