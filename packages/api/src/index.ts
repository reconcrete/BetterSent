import { Elysia } from "elysia";

import { cors } from "@elysiajs/cors";

import { extractorRouter } from "./routes";

const app = new Elysia()
  .use(cors())
  .get("/health", () => ({ status: "ok" }))
  .use(extractorRouter)
  .listen(process.env.PORT || 8080);

console.log(`🦊 Content Extractor API running at ${app.server?.hostname}:${app.server?.port}`);

export type Api = typeof app;
