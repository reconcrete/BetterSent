import type { FC } from "react";
import { Mail } from "lucide-react";

import { Card, CardContent } from "~/shared/ui";

import { StatusBadge, TypeBadge } from "~/entities/extraction";

import { PreviewExtraction } from "~/features/previewExtraction";

export type HistoryItem = {
  id: string;
  type: "url" | "text" | "file" | "youtube" | "topic";
  content: string;
  title: string | null;
  author: string | null;
  status: "pending" | "processing" | "completed" | "error";
  errorMessage: string | null;
  kindleLabel: string | null;
  hasPreview: boolean;
  createdAt: string;
  updatedAt: string;
};

interface HistoryCardProps {
  item: HistoryItem;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const HistoryCard: FC<HistoryCardProps> = ({ item }) => {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Top row: type + status */}
        <div className="flex items-center justify-between">
          <TypeBadge type={item.type} />
          <StatusBadge status={item.status} errorMessage={item.errorMessage} />
        </div>

        {/* Title + author + date */}
        <div>
          <h3 className="font-medium text-foreground line-clamp-2" title={item.title || item.content}>
            {item.title || item.content}
          </h3>
          <div className="flex items-center justify-between mt-1">
            {item.author ? (
              <p className="text-xs text-muted-foreground truncate">by {item.author}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-muted-foreground shrink-0">{formatDate(item.createdAt)}</p>
          </div>
        </div>

        {/* Bottom row: kindle label + actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          {item.kindleLabel ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground truncate max-w-[200px]">
              <Mail className="size-3 shrink-0" />
              {item.kindleLabel}
            </span>
          ) : (
            <span />
          )}
          {item.hasPreview && <PreviewExtraction historyId={item.id} />}
        </div>
      </CardContent>
    </Card>
  );
};
