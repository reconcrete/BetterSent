import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "~/shared/lib/treaty";
import { useSession } from "~/shared/lib";

import type { SendHistoryPage } from "../types";

export const DEFAULT_PAGE_SIZE = 10;

export const sendHistoryKeys = {
  all: ["sendHistory"] as const,
  list: (params: { page: number; pageSize: number }) => ["sendHistory", "list", params] as const,
};

const emptyPage = (page: number, pageSize: number): SendHistoryPage => ({
  items: [],
  page,
  pageSize,
  total: 0,
  totalPages: 0,
});

export const useSendHistory = ({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: { page?: number; pageSize?: number } = {}) => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: sendHistoryKeys.list({ page, pageSize }),
    queryFn: async () => {
      const response = await api.history.get({ query: { page, pageSize } });
      if (response.error) return emptyPage(page, pageSize);
      return (response.data?.data ?? emptyPage(page, pageSize)) as SendHistoryPage;
    },
    enabled: !!session,
    // keep the previous page on screen while the next one loads instead of flashing a skeleton
    placeholderData: keepPreviousData,
  });
};
