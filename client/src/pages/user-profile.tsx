import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, FileCode, Megaphone, Calendar, Mail } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { SubmitModal } from "@/components/submit-modal";
import { Footer } from "@/components/footer";
import { CodeGrid } from "@/components/code-grid";
import { AdvertisementGrid } from "@/components/advertisement-grid";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { User, Code, Advertisement } from "@shared/schema";
import { userTags } from "@shared/schema";
import { format } from "date-fns";

export default function UserProfile() {
  const [, params] = useRoute("/user/:id");
  const userId = params?.id;
  const [submitOpen, setSubmitOpen] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users", userId, "profile"],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/profile`);
      if (!response.ok) throw new Error("User not found");
      return response.json();
    },
    enabled: !!userId,
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

  const getUserTags = () => {
    if (!user?.tags || user.tags.length === 0) return [];
    return user.tags.map(tagId => userTags.find(t => t.id === tagId)).filter(Boolean);
  };

  const getTagColor = (color: string) => {
    const colors: Record<string, string> = {
      red: "bg-red-500/10 text-red-500 border-red-500/20",
      blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      green: "bg-green-500/10 text-green-500 border-green-500/20",
      purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      yellow: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      pink: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    };
    return colors[color] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation onSubmitClick={() => setSubmitOpen(true)} />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Card className="p-6 mb-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navigation onSubmitClick={() => setSubmitOpen(true)} />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 max-w-md text-center">
            <h2 className="text-xl font-bold mb-2">User Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This user doesn't exist or has been removed.
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

  const tags = getUserTags();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation onSubmitClick={() => setSubmitOpen(true)} />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>

          <Card className="p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-2">
                  <h1 className="text-2xl font-bold" data-testid="text-user-name">
                    {user.firstName ? `${user.firstName} ${user.lastName || ""}` : "Anonymous User"}
                  </h1>
                  {tags.map((tag: any) => (
                    <Badge 
                      key={tag.id} 
                      variant="outline" 
                      className={`text-xs ${getTagColor(tag.color)}`}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
                {user.bio && (
                  <p className="text-muted-foreground mb-2">{user.bio}</p>
                )}
                {user.createdAt && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center sm:justify-start">
                    <Calendar className="h-3 w-3" />
                    Joined {format(new Date(user.createdAt), "MMMM yyyy")}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <div className="text-center py-12">
            <p className="text-muted-foreground">
              User profile information is private.
            </p>
          </div>
        </div>
      </main>

      <Footer />

      <SubmitModal open={submitOpen} onOpenChange={setSubmitOpen} />
    </div>
  );
}
