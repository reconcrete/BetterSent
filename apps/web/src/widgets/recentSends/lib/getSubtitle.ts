import type { HistoryItem } from "~/widgets/historyCard";

export const getSubtitle = (item: HistoryItem): string => {
  if (item.type === "url" || item.type === "youtube") {
    try {
      return new URL(item.content).hostname.replace(/^www\./, "");
    } catch {
      return item.content;
    }
  }
  if (item.type === "file") return "File upload";
  return item.content.length > 40
    ? item.content.slice(0, 40) + "..."
    : item.content;
};
