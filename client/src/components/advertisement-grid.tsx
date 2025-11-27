import { AdvertisementCard } from "./advertisement-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone } from "lucide-react";
import type { Advertisement } from "@shared/schema";

interface AdvertisementGridProps {
  advertisements: Advertisement[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function AdvertisementGrid({ advertisements, isLoading, emptyMessage }: AdvertisementGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border border-card-border bg-card">
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (advertisements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Megaphone className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No listings found</h3>
        <p className="text-muted-foreground max-w-sm">
          {emptyMessage || "There are no listings matching your criteria. Be the first to submit one!"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {advertisements.map((ad) => (
        <AdvertisementCard key={ad.id} advertisement={ad} />
      ))}
    </div>
  );
}
