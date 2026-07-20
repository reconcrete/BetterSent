import type { HistoryItem } from "../types";

/**
 * Reconciles an optimistic send-history item (keyed by a client-side temp id)
 * with the real id returned by the server.
 *
 * The history websocket may push the real row before the HTTP response
 * resolves. In that case remapping the temp id would leave two rows with the
 * same id, so the optimistic item is dropped in favor of the fresher server
 * row instead.
 */
export const reconcileOptimisticSend = (
  items: HistoryItem[],
  tempId: string,
  historyId: string
): HistoryItem[] => {
  const serverRowExists = items.some((item) => item.id === historyId);
  if (serverRowExists) {
    return items.filter((item) => item.id !== tempId);
  }
  return items.map((item) => (item.id === tempId ? { ...item, id: historyId } : item));
};
