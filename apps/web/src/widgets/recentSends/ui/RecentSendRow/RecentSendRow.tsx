import type { FC, ReactNode } from "react";

import type { HistoryItem } from "~/widgets/historyCard";

import { typeIcons } from "../../config/typeIcons";
import { statusConfig } from "../../config/statusConfig";
import { formatRelativeTime } from "../../lib/formatRelativeTime";
import { getSubtitle } from "../../lib/getSubtitle";

interface RecentSendRowProps {
  item: HistoryItem;
  isFirst: boolean;
  action?: ReactNode;
}

export const RecentSendRow: FC<RecentSendRowProps> = ({ item, isFirst, action }) => {
  const TypeIcon = typeIcons[item.type];
  const status = statusConfig[item.status];
  const StatusIcon = status.icon;

  const title = item.title || item.content;
  const titleWithAuthor = item.author ? `${title} by ${item.author}` : title;

  return (
    <div
      className={`flex items-center gap-3.5 py-4 ${
        !isFirst ? "border-t border-black/[0.04] dark:border-white/[0.04]" : ""
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="shrink-0 size-[34px] rounded-lg bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center">
          <TypeIcon className="size-3.5 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate">
              {titleWithAuthor}
            </p>
            {action}
          </div>
          <p className="text-[11px] text-[#747474] dark:text-[#555] truncate">
            {getSubtitle(item)}
          </p>
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className={`flex items-center gap-[3px] ${status.className}`}>
          <StatusIcon
            className={`size-[9px] ${
              item.status === "processing" ? "animate-spin" : ""
            }`}
          />
          <span className="text-[11px]">{status.label}</span>
        </span>
        <span className="text-[10px] text-[#747474] dark:text-[#555]">
          {formatRelativeTime(item.createdAt)}
        </span>
      </div>
    </div>
  );
};
