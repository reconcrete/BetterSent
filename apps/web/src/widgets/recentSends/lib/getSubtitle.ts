import type { HistoryItem } from "~/widgets/historyCard";

const typeLabels: Record<HistoryItem["type"], string> = {
  file: "File",
  url: "Link content",
  text: "Text",
  youtube: "YouTube content",
  topic: "Topic",
};

export const getSubtitle = (item: HistoryItem): string => {
  const typeLabel = typeLabels[item.type];
  return `${typeLabel} sent to ${item.kindleLabel || "Kindle"}`;
};
