import { CodeCardAdvanced } from "./code-card-advanced";
import { Skeleton } from "@/components/ui/skeleton";
import { FileCode2 } from "lucide-react";
import type { Code } from "@shared/schema";

interface CodeGridProps {
  codes: Code[];
  isLoading?: boolean;
  onCopy?: (codeId: string) => void;
  emptyMessage?: string;
  showStatus?: boolean;
  isAdvertising?: boolean;
}

export function CodeGrid({ codes, isLoading, onCopy, emptyMessage, showStatus, isAdvertising }: CodeGridProps) {
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
            <Skeleton className="h-10 w-full mb-3" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (codes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileCode2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No codes found</h3>
        <p className="text-muted-foreground max-w-sm">
          {emptyMessage || "There are no codes matching your criteria. Try adjusting your filters or check back later."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {codes.map((code) => (
        <CodeCardAdvanced key={code.id} code={code} onCopy={onCopy} showStatus={showStatus} isAdvertising={isAdvertising} />
      ))}
    </div>
  );
}
