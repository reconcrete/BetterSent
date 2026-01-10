import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "../db";
import Elysia from "elysia";

export const auth = betterAuth({
  basePath: "/",
  trustedOrigins: ["http://localhost:5173"],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
});

export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });

        if (!session) return status(401);

        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });
