import { Elysia } from "elysia";

import { cors } from "@elysiajs/cors";

import { extractorRouter, userRouter, kindleRouter, historyRouter, billingRouter, billingWebhookRouter, cliRouter } from "./routes";
import { authMiddleware } from "./lib/auth";
import { wsRouter } from "./lib/ws";
import { log } from "./lib/logger";

const app = new Elysia()
  .use(log.into({ autoLogging: true }))
  .use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }))
  .use(authMiddleware)
  .get("/health", () => ({ status: "ok" }))
  .use(wsRouter)
  .use(billingWebhookRouter)
  .use(extractorRouter)
  .use(userRouter)
  .use(kindleRouter)
  .use(historyRouter)
  .use(billingRouter)
  .use(cliRouter)
  .listen(process.env.PORT || 8080);

log.info({ hostname: app.server?.hostname, port: app.server?.port }, "Content Extractor API running");

export type Api = typeof app;
