import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "~/shared/lib/treaty";
import { useSession } from "~/shared/lib/auth";
import type { HistoryItem } from "~/entities/sendHistory";

const MAX_RECONNECT_DELAY = 30_000;
const BASE_RECONNECT_DELAY = 1_000;

export const useHistoryWebSocket = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const reconnectAttempt = useRef(0);
  const wsRef = useRef<{ close: () => void } | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!session) return;

    const connect = () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ws = (api.ws as any).subscribe();
        wsRef.current = ws;

        ws.subscribe((message: MessageEvent) => {
          const parsed = typeof message.data === "string" ? JSON.parse(message.data) : message.data;
          if (parsed.type === "history:updated") {
            const updated = parsed.data as HistoryItem;
            queryClient.setQueryData<HistoryItem[]>(["sendHistory"], (old = []) => {
              const exists = old.some((item) => item.id === updated.id);
              if (exists) {
                return old.map((item) => (item.id === updated.id ? updated : item));
              }
              return [updated, ...old];
            });
          }
        });

        ws.on("open", () => {
          reconnectAttempt.current = 0;
        });

        ws.on("close", () => {
          wsRef.current = null;
          const delay = Math.min(
            BASE_RECONNECT_DELAY * 2 ** reconnectAttempt.current,
            MAX_RECONNECT_DELAY
          );
          reconnectAttempt.current++;
          reconnectTimer.current = setTimeout(connect, delay);
        });

        ws.on("error", () => {
          ws.close();
        });
      } catch {
        const delay = Math.min(
          BASE_RECONNECT_DELAY * 2 ** reconnectAttempt.current,
          MAX_RECONNECT_DELAY
        );
        reconnectAttempt.current++;
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [session, queryClient]);
};
