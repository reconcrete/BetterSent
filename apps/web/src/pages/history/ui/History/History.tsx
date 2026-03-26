import type { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

import { Button, Card } from "~/shared/ui";
import { api } from "~/shared/lib/treaty";
import { useSession } from "~/shared/lib";

import { HistoryCard, type HistoryItem } from "~/widgets/historyCard";

const HistoryCardSkeleton: FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <Card key={i}>
        <div className="p-4 space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-5 w-16 rounded-full bg-muted" />
            <div className="h-5 w-20 rounded-full bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="flex justify-between">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
          </div>
          <div className="pt-1 border-t border-border">
            <div className="h-3 w-32 rounded bg-muted" />
          </div>
        </div>
      </Card>
    ))}
  </div>
);

const EmptyHistoryState: FC = () => (
  <div className="text-center py-16 space-y-4">
    <BookOpen className="size-12 mx-auto text-muted-foreground/50" />
    <div className="space-y-2">
      <h2 className="text-lg font-medium text-foreground">No history yet</h2>
      <p className="text-sm text-muted-foreground">
        Content you send to your Kindle will appear here.
      </p>
    </div>
    <Button asChild>
      <Link to="/">Send your first article</Link>
    </Button>
  </div>
);

export const History: FC = () => {
  const { data: session } = useSession();

  const { data: historyItems, isLoading } = useQuery({
    queryKey: ["sendHistory"],
    queryFn: async () => {
      const response = await api.history.get();
      if (response.error) return [];
      return (response.data?.data ?? []) as HistoryItem[];
    },
    enabled: !!session,
    refetchInterval: 5000,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Send History</h1>
        <p className="text-muted-foreground">Track what you've sent to your Kindle device</p>
      </div>

      {isLoading && <HistoryCardSkeleton />}

      {!isLoading && historyItems?.length === 0 && <EmptyHistoryState />}

      {!isLoading && historyItems && historyItems.length > 0 && (
        <div className="space-y-3">
          {historyItems.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};
