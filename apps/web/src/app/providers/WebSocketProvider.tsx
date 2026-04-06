import type { ReactNode } from "react";
import { useHistoryWebSocket } from "~/shared/lib/ws";

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  useHistoryWebSocket();
  return <>{children}</>;
};
