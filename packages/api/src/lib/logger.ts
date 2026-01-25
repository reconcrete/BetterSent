import { createPinoLogger } from "@bogeychan/elysia-logger";

export const log = createPinoLogger({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});
