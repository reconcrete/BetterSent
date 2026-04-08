import type { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

import { Button } from "~/shared/ui";
import { api } from "~/shared/lib/treaty";
import { useSession } from "~/shared/lib";

import { PreviewExtraction } from "~/features/previewExtraction";
import { ViewReferences } from "~/features/viewReferences";
import type { HistoryItem } from "~/widgets/historyCard";
import { RecentSendRow, RecentSendsSkeleton } from "~/widgets/recentSends";

const EmptyHistoryState: FC = () => (
  <div className="text-center py-16 space-y-4">
    <BookOpen className="size-12 mx-auto text-muted-foreground/50" />
    <div className="space-y-2">
      <h2 className="text-lg font-medium text-foreground">No history yet</h2>
      <p className="text-sm text-muted-foreground">Content you send to your Kindle will appear here.</p>
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
  });

  return (
    <div className="max-w-2xl mx-auto pt-6 space-y-6">
      <h1 className="text-[22px] font-bold leading-snug text-foreground md:hidden">Send History</h1>

      {isLoading && <RecentSendsSkeleton />}

      {!isLoading && historyItems?.length === 0 && <EmptyHistoryState />}

      {!isLoading && historyItems && historyItems.length > 0 && (
        <div>
          {historyItems.map((item, i) => (
            <RecentSendRow
              key={item.id}
              item={item}
              isFirst={i === 0}
              action={
                (item.hasPreview || item.references.length > 0) ? (
                  <>
                    {item.hasPreview && <PreviewExtraction historyId={item.id} />}
                    {item.references.length > 0 && <ViewReferences references={item.references} />}
                  </>
                ) : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};
