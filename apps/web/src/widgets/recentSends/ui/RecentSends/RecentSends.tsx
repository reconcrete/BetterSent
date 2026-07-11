import type { FC } from "react";
import { Link as RouterLink } from "react-router-dom";

import { PreviewExtraction } from "~/features/previewExtraction";
import { ViewReferences } from "~/features/viewReferences";
import { useSendHistory } from "~/entities/sendHistory";

import { RecentSendRow } from "../RecentSendRow/RecentSendRow";
import { RecentSendsSkeleton } from "../RecentSendsSkeleton/RecentSendsSkeleton";

const RECENT_SENDS_COUNT = 3;

export const RecentSends: FC = () => {
  const { data: historyPage, isLoading } = useSendHistory({ pageSize: RECENT_SENDS_COUNT });

  const recentItems = historyPage?.items;

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
