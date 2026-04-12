import { Elysia } from "elysia";
import { listObjects, getObject } from "./s3";
import path from "path";

const PORT = process.env.PORT ?? 3500;

const app = new Elysia()
  .get("/", () => {
    return new Response(Bun.file(path.join(import.meta.dir, "../public/index.html")));
  })
  .get("/favicon.svg", () => {
    return new Response(Bun.file(path.join(import.meta.dir, "../public/favicon.svg")));
  })
  .get("/api/list", async ({ query }) => {
    const prefix = (query.prefix as string) ?? "";
    return listObjects(prefix);
  })
  .get("/api/file/*", async ({ params }) => {
    const key = params["*"];
    if (!key) return new Response("Missing key", { status: 400 });

    const { body, contentType, contentLength } = await getObject(key);
    if (!body) return new Response("Not found", { status: 404 });

    const fileName = key.split("/").pop() ?? "download";

    return new Response(body as ReadableStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        ...(contentLength != null && {
          "Content-Length": String(contentLength),
        }),
      },
    });
  })
  .get("/api/preview/*", async ({ params }) => {
    const key = params["*"];
    if (!key) return new Response("Missing key", { status: 400 });

    const { body, contentType } = await getObject(key);
    if (!body) return new Response("Not found", { status: 404 });

    const isText =
      key.endsWith(".md") ||
      key.endsWith(".txt") ||
      key.endsWith(".json") ||
      key.endsWith(".csv") ||
      key.endsWith(".log") ||
      contentType.startsWith("text/");

    return new Response(body as ReadableStream, {
      headers: {
        "Content-Type": isText ? "text/plain; charset=utf-8" : contentType,
        "Content-Disposition": "inline",
      },
    });
  })
  .listen(PORT);

console.log(`Storage browser running at http://localhost:${PORT}`);
