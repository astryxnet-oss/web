import { useState } from "react";
import { Check, Copy, BadgeCheck, Flame, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categories, type Code } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface CodeCardProps {
  code: Code;
  onCopy?: (codeId: string) => void;
}

export function CodeCard({ code, onCopy }: CodeCardProps) {
  const [copied, setCopied] = useState(false);
  const [localCopyCount, setLocalCopyCount] = useState(code.copyCount || 0);

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

  return (
    <Card 
      className="p-4 flex flex-col h-full"
      data-testid={`card-code-${code.id}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {categoryInfo?.name || code.category}
          </Badge>
          {code.isVerified && (
            <Badge variant="default" className="text-xs gap-1" title="This code has been verified by our team">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </Badge>
          )}
          {isNew && (
            <Badge variant="outline" className="text-xs gap-1 border-chart-2 text-chart-2">
              <Clock className="h-3 w-3" />
              New
            </Badge>
          )}
          {isPopular && (
            <Badge variant="outline" className="text-xs gap-1 border-chart-4 text-chart-4">
              <Flame className="h-3 w-3" />
              Popular
            </Badge>
          )}
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

      <div className="mt-auto">
        <div className="flex items-center gap-2 mb-3">
          <code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
            {code.code}
          </code>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {localCopyCount.toLocaleString()} copies
          </span>
          <Button
            size="sm"
            variant={copied ? "default" : "secondary"}
            onClick={handleCopy}
            className="min-w-[100px] transition-all"
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
    </Card>
  );
}
