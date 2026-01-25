import { Elysia } from "elysia";

import { cors } from "@elysiajs/cors";

import { extractorRouter, userRouter, kindleRouter } from "./routes";
import { authMiddleware } from "./lib/auth";

const app = new Elysia()
  .use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }))
  .use(authMiddleware)
  .get("/health", () => ({ status: "ok" }))
  .use(extractorRouter)
  .use(userRouter)
  .use(kindleRouter)
  .listen(process.env.PORT || 8080);

console.log(`🦊 Content Extractor API running at ${app.server?.hostname}:${app.server?.port}`);

export type Api = typeof app;
