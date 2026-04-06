import { Elysia, t } from "elysia";
import { historyItemSchema } from "../routes/history/history.schema";
import { auth } from "./auth";
import { log } from "./logger";

const wsResponseSchema = t.Union([
  t.Object({
    type: t.Literal("history:updated"),
    data: historyItemSchema,
  }),
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const connections = new Map<string, Set<any>>();

const addConnection = (userId: string, ws: unknown) => {
  let userConnections = connections.get(userId);
  if (!userConnections) {
    userConnections = new Set();
    connections.set(userId, userConnections);
  }
  userConnections.add(ws);
  log.debug({ userId, count: userConnections.size }, "WebSocket connection added");
};

const removeConnection = (userId: string, ws: unknown) => {
  const userConnections = connections.get(userId);
  if (!userConnections) return;
  userConnections.delete(ws);
  if (userConnections.size === 0) {
    connections.delete(userId);
  }
  log.debug({ userId, count: userConnections?.size ?? 0 }, "WebSocket connection removed");
};

type WsMessage = { type: "history:updated"; data: unknown };

export const sendToUser = (userId: string, data: WsMessage) => {
  const userConnections = connections.get(userId);
  if (!userConnections || userConnections.size === 0) return;
  for (const ws of userConnections) {
    ws.send(data);
  }
  log.debug({ userId, type: data.type, connections: userConnections.size }, "WebSocket message sent");
};

export const wsRouter = new Elysia()
  .ws("/ws", {
    response: wsResponseSchema,
    async open(ws) {
      const headers = new Headers(ws.data.headers as Record<string, string>);
      const session = await auth.api.getSession({ headers });
      if (!session) {
        ws.close();
        return;
      }
      (ws.data as any).userId = session.user.id;
      addConnection(session.user.id, ws);
      log.debug({ userId: session.user.id }, "WebSocket connected");
    },
    close(ws) {
      const userId = (ws.data as any).userId;
      if (userId) {
        removeConnection(userId, ws);
        log.debug({ userId }, "WebSocket disconnected");
      }
    },
    message() {},
  });
