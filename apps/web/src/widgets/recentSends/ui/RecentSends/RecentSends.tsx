import type { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";

import { api } from "~/shared/lib/treaty";
import { useSession } from "~/shared/lib";

import { PreviewExtraction } from "~/features/previewExtraction";
import { ViewReferences } from "~/features/viewReferences";
import type { HistoryItem } from "~/entities/sendHistory";

import { RecentSendRow } from "../RecentSendRow/RecentSendRow";
import { RecentSendsSkeleton } from "../RecentSendsSkeleton/RecentSendsSkeleton";

export const RecentSends: FC = () => {
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

  const recentItems = historyItems?.slice(0, 3);

  if (isLoading) return <RecentSendsSkeleton />;
  if (!recentItems || recentItems.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 px-3 md:px-[30px] mt-4">
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-semibold uppercase tracking-[0.5px] text-[#929495]">
          Recent sends
        </p>
        <div className="rounded-xl">
          {recentItems.map((item, i) => (
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
      </div>

      <RouterLink
        to="/history"
        className="flex items-center justify-center w-full py-3 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium text-foreground hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
      >
        Full history
      </RouterLink>
    </div>
  );
};
