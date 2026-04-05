import type { FC } from "react";

import { Skeleton } from "~/shared/ui";

const RowSkeleton: FC<{ isFirst: boolean }> = ({ isFirst }) => (
  <div
    className={`flex items-center gap-3.5 py-4 ${
      !isFirst ? "border-t border-black/4 dark:border-white/4" : ""
    }`}
  >
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <Skeleton className="shrink-0 size-[34px] rounded-lg" />
      <div className="flex flex-col gap-1 min-w-0">
        <Skeleton className="h-[13px] w-28 rounded" />
        <Skeleton className="h-[11px] w-20 rounded" />
      </div>
    </div>
    <div className="shrink-0 flex flex-col items-end gap-1">
      <Skeleton className="h-[11px] w-14 rounded" />
      <Skeleton className="h-[10px] w-10 rounded" />
    </div>
  </div>
);

export const RecentSendsSkeleton: FC = () => (
  <div className="flex flex-col gap-2.5 px-3 md:px-[30px] mt-4">
    <div className="flex flex-col gap-0.5">
      <p className="text-xs font-semibold uppercase tracking-[0.5px] text-[#929495]">
        Recent sends
      </p>
      <div className="rounded-xl">
        {[0, 1, 2].map((i) => (
          <RowSkeleton key={i} isFirst={i === 0} />
        ))}
      </div>
    </div>
    <Skeleton className="h-[46px] w-full rounded-xl" />
  </div>
);
