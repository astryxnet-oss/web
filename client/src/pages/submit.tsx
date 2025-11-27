import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Send, Code, Megaphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { categories, submitCodeSchema, submitAdvertisementSchema, type SubmitCode, type SubmitAdvertisement } from "@shared/schema";

type SubmissionType = "code" | "advertisement" | null;

export default function Submit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submissionType, setSubmissionType] = useState<SubmissionType>(null);

  const codeCategories = categories.filter(c => c.type === "codes");
  const adCategories = categories.filter(c => c.type === "advertising");

  const codeForm = useForm<SubmitCode>({
    resolver: zodResolver(submitCodeSchema),
    defaultValues: {
      title: "",
      code: "",
      description: "",
      category: "" as any,
      submitterName: "",
      submitterEmail: "",
    },
  });

  const adForm = useForm<SubmitAdvertisement>({
    resolver: zodResolver(submitAdvertisementSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "" as any,
      inviteLink: "",
      imageUrl: "",
      submitterName: "",
      submitterEmail: "",
    },
  });

  const submitCodeMutation = useMutation({
    mutationFn: async (data: SubmitCode) => {
      const response = await apiRequest("POST", "/api/codes/submit", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Code submitted!",
        description: "Your code has been submitted for review.",
      });
      codeForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/codes"] });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const submitAdMutation = useMutation({
    mutationFn: async (data: SubmitAdvertisement) => {
      const response = await apiRequest("POST", "/api/advertisements/submit", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Listing submitted!",
        description: "Your listing has been submitted for review.",
      });
      adForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const handleCodeSubmit = (data: SubmitCode) => {
    submitCodeMutation.mutate(data);
  };

  const handleAdSubmit = (data: SubmitAdvertisement) => {
    submitAdMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation onSubmitClick={() => {}} />
      
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
              Submit Content
            </h1>
            <p className="text-muted-foreground">
              Share free codes or advertise your Discord bots, servers, and Minecraft addons
            </p>
          </div>

          {!submissionType ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card 
                className="p-6 cursor-pointer hover:border-pink-500/50 transition-all"
                onClick={() => setSubmissionType("code")}
                data-testid="card-select-code"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 flex items-center justify-center mb-4">
                    <Code className="h-8 w-8 text-pink-500" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Submit a Code</h2>
                  <p className="text-muted-foreground text-sm">
                    Share free codes, promo codes, discount codes, and more with the community
                  </p>
                </div>
              </Card>

              <Card 
                className="p-6 cursor-pointer hover:border-purple-500/50 transition-all"
                onClick={() => setSubmissionType("advertisement")}
                data-testid="card-select-advertisement"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 flex items-center justify-center mb-4">
                    <Megaphone className="h-8 w-8 text-purple-500" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Submit a Listing</h2>
                  <p className="text-muted-foreground text-sm">
                    Advertise your Discord bots, servers, Minecraft addons, and more
                  </p>
                </div>
              </Card>
            </div>
          ) : submissionType === "code" ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 flex items-center justify-center">
                    <Code className="h-5 w-5 text-pink-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Submit a Code</h2>
                    <p className="text-sm text-muted-foreground">Fill in the details below</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSubmissionType(null)}
                  data-testid="button-change-type"
                >
                  Change
                </Button>
              </div>

              <Form {...codeForm}>
                <form onSubmit={codeForm.handleSubmit(handleCodeSubmit)} className="space-y-4">
                  <FormField
                    control={codeForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-code-category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {codeCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={codeForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Discord Nitro Free Trial" 
                            {...field} 
                            data-testid="input-code-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={codeForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., NITRO-FREE-2024" 
                            className="font-mono"
                            {...field} 
                            data-testid="input-code-value"
                          />
                        </FormControl>
                        <FormDescription>The actual code users will copy</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={codeForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what this code offers..."
                            className="min-h-[100px]"
                            {...field} 
                            data-testid="input-code-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={codeForm.control}
                      name="submitterName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Optional" 
                              {...field} 
                              data-testid="input-code-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={codeForm.control}
                      name="submitterEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="Optional" 
                              {...field} 
                              data-testid="input-code-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600"
                    disabled={submitCodeMutation.isPending}
                    data-testid="button-submit-code"
                  >
                    {submitCodeMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Code for Review
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                    <Megaphone className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Submit a Listing</h2>
                    <p className="text-sm text-muted-foreground">Fill in the details below</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSubmissionType(null)}
                  data-testid="button-change-type-ad"
                >
                  Change
                </Button>
              </div>

              <Form {...adForm}>
                <form onSubmit={adForm.handleSubmit(handleAdSubmit)} className="space-y-4">
                  <FormField
                    control={adForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-ad-category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {adCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={adForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., My Awesome Discord Bot" 
                            {...field} 
                            data-testid="input-ad-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={adForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your bot, server, or addon..."
                            className="min-h-[100px]"
                            {...field} 
                            data-testid="input-ad-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={adForm.control}
                    name="inviteLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invite / Download Link</FormLabel>
                        <FormControl>
                          <Input 
                            type="url"
                            placeholder="https://discord.gg/..." 
                            {...field} 
                            data-testid="input-ad-link"
                          />
                        </FormControl>
                        <FormDescription>Link to invite your bot, join your server, or download your addon</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={adForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input 
                            type="url"
                            placeholder="https://..." 
                            {...field} 
                            data-testid="input-ad-image"
                          />
                        </FormControl>
                        <FormDescription>Optional: Add an image to make your listing stand out</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={adForm.control}
                      name="submitterName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Optional" 
                              {...field} 
                              data-testid="input-ad-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={adForm.control}
                      name="submitterEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="Optional" 
                              {...field} 
                              data-testid="input-ad-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
                    disabled={submitAdMutation.isPending}
                    data-testid="button-submit-ad"
                  >
                    {submitAdMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Listing for Review
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
