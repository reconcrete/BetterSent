import type { FC } from "react";

import { Skeleton } from "~/shared/ui";

export const ChooseDeviceSkeleton: FC = () => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center w-full">
      <span className="text-xs font-semibold uppercase tracking-[0.5px] text-muted-foreground">
        Send to
      </span>
    </div>
    <div className="flex w-full flex-col sm:flex-row sm:flex-wrap gap-2">
      {[0, 1].map((i) => (
        <Skeleton key={i} className="flex-1 h-[50px] rounded-xl" />
      ))}
    </div>
  </div>
);
