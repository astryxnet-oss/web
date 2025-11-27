import { useState } from "react";
import { Check, Copy, BadgeCheck, Flame, Clock, CheckCircle, XCircle, Loader, ExternalLink, Heart, Flag, ThumbsUp, ThumbsDown, Eye, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { categories, type Code } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface CodeCardAdvancedProps {
  code: Code;
  onCopy?: (codeId: string) => void;
  showStatus?: boolean;
}

export function CodeCardAdvanced({ code, onCopy, showStatus }: CodeCardAdvancedProps) {
  const [copied, setCopied] = useState(false);
  const [localCopyCount, setLocalCopyCount] = useState(code.copyCount || 0);
  const [showDetails, setShowDetails] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const categoryInfo = categories.find((c) => c.id === code.category);
  const isNew = code.createdAt && 
    new Date(code.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
  const isPopular = localCopyCount >= 50;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.code);
      setCopied(true);
      setLocalCopyCount((prev) => prev + 1);
      onCopy?.(code.id);
      apiRequest("POST", `/api/codes/${code.id}/copy`, {}).catch(() => {});
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: code.title,
        text: `Check out this code: ${code.code}`,
        url: window.location.href,
      });
    } catch (err) {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!", description: "Share link copied to clipboard" });
    }
  };

  return (
    <Card 
      className="p-4 flex flex-col h-full group hover:border-pink-500/30 transition-all duration-300"
      data-testid={`card-code-${code.id}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-pink-500/10 to-purple-500/10">
            {categoryInfo?.name || code.category}
          </Badge>
          {code.isVerified && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="default" className="text-xs gap-1 bg-gradient-to-r from-pink-500 to-purple-600">
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </Badge>
              </TooltipTrigger>
              <TooltipContent>This code has been verified by our team</TooltipContent>
            </Tooltip>
          )}
          {isNew && (
            <Badge variant="outline" className="text-xs gap-1 border-green-500 text-green-500">
              <Clock className="h-3 w-3" />
              New
            </Badge>
          )}
          {isPopular && (
            <Badge variant="outline" className="text-xs gap-1 border-orange-500 text-orange-500">
              <Flame className="h-3 w-3" />
              Popular
            </Badge>
          )}
          {showStatus && code.status === "pending" && (
            <Badge variant="outline" className="text-xs gap-1 border-yellow-500 text-yellow-500">
              <Loader className="h-3 w-3" />
              Pending
            </Badge>
          )}
          {showStatus && code.status === "approved" && (
            <Badge variant="outline" className="text-xs gap-1 border-green-500 text-green-500">
              <CheckCircle className="h-3 w-3" />
              Approved
            </Badge>
          )}
          {showStatus && code.status === "rejected" && (
            <Badge variant="outline" className="text-xs gap-1 border-red-500 text-red-500">
              <XCircle className="h-3 w-3" />
              Rejected
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleShare}>
                <Share2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <h3 className="font-semibold text-base mb-2 line-clamp-1" data-testid="text-code-title">
        {code.title}
      </h3>

      {code.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {code.description}
        </p>
      )}

      <div className="mt-auto space-y-3">
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2.5 bg-gradient-to-r from-pink-500/5 to-purple-500/5 border border-pink-500/10 rounded-lg font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
            {code.code}
          </code>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Copy className="h-3 w-3" />
              {localCopyCount.toLocaleString()}
            </span>
            {code.createdAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(code.createdAt), "MMM d")}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8">
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {code.title}
                    {code.isVerified && <BadgeCheck className="h-5 w-5 text-primary" />}
                  </DialogTitle>
                  <DialogDescription>
                    {categoryInfo?.name} • Added {code.createdAt ? format(new Date(code.createdAt), "MMMM d, yyyy") : "recently"}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {code.description && (
                    <p className="text-sm text-muted-foreground">{code.description}</p>
                  )}
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Code</p>
                    <code className="font-mono text-base break-all">{code.code}</code>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Copy className="h-4 w-4" />
                        {localCopyCount.toLocaleString()} copies
                      </span>
                    </div>
                    {code.submitterName && (
                      <span className="text-muted-foreground">
                        Submitted by {code.submitterName}
                      </span>
                    )}
                  </div>
                  
                  <Button onClick={handleCopy} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button
              size="sm"
              variant={copied ? "default" : "secondary"}
              onClick={handleCopy}
              className={`min-w-[90px] transition-all ${copied ? "bg-gradient-to-r from-pink-500 to-purple-600" : ""}`}
              data-testid="button-copy-code"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
