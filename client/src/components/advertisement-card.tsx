import { useState } from "react";
import { ExternalLink, BadgeCheck, Clock, Eye, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { categories, type Advertisement } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface AdvertisementCardProps {
  advertisement: Advertisement;
  showStatus?: boolean;
}

export function AdvertisementCard({ advertisement, showStatus }: AdvertisementCardProps) {
  const [localViewCount, setLocalViewCount] = useState(advertisement.viewCount || 0);
  const { toast } = useToast();

  const categoryInfo = categories.find((c) => c.id === advertisement.category);
  const isNew = advertisement.createdAt && 
    new Date(advertisement.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;

  const handleVisit = async () => {
    if (advertisement.inviteLink) {
      setLocalViewCount((prev) => prev + 1);
      apiRequest("POST", `/api/advertisements/${advertisement.id}/view`, {}).catch(() => {});
      window.open(advertisement.inviteLink, "_blank");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: advertisement.title,
        text: advertisement.description || `Check out ${advertisement.title}`,
        url: window.location.href,
      });
    } catch (err) {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!", description: "Share link copied to clipboard" });
    }
  };

  return (
    <Card 
      className="p-4 flex flex-col h-full group hover:border-purple-500/30 transition-all duration-300"
      data-testid={`card-ad-${advertisement.id}`}
    >
      {advertisement.imageUrl && (
        <div className="mb-3 rounded-lg overflow-hidden aspect-video bg-muted">
          <img 
            src={advertisement.imageUrl} 
            alt={advertisement.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            {categoryInfo?.name || advertisement.category}
          </Badge>
          {advertisement.isVerified && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="default" className="text-xs gap-1 bg-gradient-to-r from-purple-500 to-pink-600">
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </Badge>
              </TooltipTrigger>
              <TooltipContent>This listing has been verified by our team</TooltipContent>
            </Tooltip>
          )}
          {isNew && (
            <Badge variant="outline" className="text-xs gap-1 border-green-500 text-green-500">
              <Clock className="h-3 w-3" />
              New
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

      <h3 className="font-semibold text-base mb-2 line-clamp-1" data-testid="text-ad-title">
        {advertisement.title}
      </h3>

      {advertisement.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {advertisement.description}
        </p>
      )}

      <div className="mt-auto space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {localViewCount.toLocaleString()} views
            </span>
            {advertisement.createdAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(advertisement.createdAt), "MMM d")}
              </span>
            )}
          </div>
          
          {advertisement.inviteLink && (
            <Button
              size="sm"
              onClick={handleVisit}
              className="bg-gradient-to-r from-purple-500 to-pink-600"
              data-testid="button-visit-ad"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Visit
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
