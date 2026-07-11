import type { QueryClient, QueryKey } from "@tanstack/react-query";

import { sendHistoryKeys } from "../api";
import type { HistoryItem, SendHistoryPage } from "../types";

export type SendHistorySnapshot = [QueryKey, SendHistoryPage | undefined][];

const allPages = { queryKey: sendHistoryKeys.all };

const patchItem = (
  queryClient: QueryClient,
  id: string,
  patch: (item: HistoryItem) => HistoryItem,
) => {
  queryClient.setQueriesData<SendHistoryPage>(allPages, (cached) =>
    cached
      ? { ...cached, items: cached.items.map((item) => (item.id === id ? patch(item) : item)) }
      : cached,
  );
};

const isCached = (queryClient: QueryClient, id: string) =>
  queryClient
    .getQueriesData<SendHistoryPage>(allPages)
    .some(([, cached]) => cached?.items.some((item) => item.id === id));

export const snapshotSendHistory = (queryClient: QueryClient): SendHistorySnapshot =>
  queryClient.getQueriesData<SendHistoryPage>(allPages);

export const restoreSendHistory = (queryClient: QueryClient, snapshot: SendHistorySnapshot) => {
  snapshot.forEach(([queryKey, cached]) => queryClient.setQueryData(queryKey, cached));
};

/**
 * Optimistically add a just-sent item. It only belongs on the first page — later pages
 * shift by one and are left to refetch when they are next visited.
 */
export const prependHistoryItem = (queryClient: QueryClient, item: HistoryItem) => {
  queryClient.setQueriesData<SendHistoryPage>(allPages, (cached) => {
    if (!cached || cached.page !== 1) return cached;

    const total = cached.total + 1;
    return {
      ...cached,
      items: [item, ...cached.items].slice(0, cached.pageSize),
      total,
      totalPages: Math.ceil(total / cached.pageSize),
    };
  });
};

/** Swap the optimistic temp id for the id the API assigned. */
export const replaceHistoryItemId = (queryClient: QueryClient, tempId: string, id: string) => {
  patchItem(queryClient, tempId, (item) => ({ ...item, id }));
};

/**
 * Apply a live update pushed over the websocket. An item already on a cached page is patched
 * in place; anything else (a send started elsewhere) can land on any page, so refetch instead.
 */
export const applyHistoryUpdate = (queryClient: QueryClient, updated: HistoryItem) => {
  if (!isCached(queryClient, updated.id)) {
    queryClient.invalidateQueries(allPages);
    return;
  }

  patchItem(queryClient, updated.id, () => updated);
};
