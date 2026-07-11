import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";

import { db } from "../db";
import { user as userTable } from "@bettersent/db/schema";
import { eq } from "drizzle-orm";
import Elysia from "elysia";
import { createEmailService } from "../services/email";
import { isProduction } from "../shared/env";
import { resolveCliToken } from "../routes/cli/cli.service";

const trustedOrigins = process.env.TRUSTED_ORIGINS
  ? process.env.TRUSTED_ORIGINS.split(",")
  : ["http://localhost:5173"];

export const auth = betterAuth({
  basePath: "/api/auth",
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    ...(!isProduction
      ? [
          magicLink({
            sendMagicLink: async ({ email, url }) => {
              const emailService = createEmailService();
              await emailService.sendEmail(
                email,
                "Sign in to Bettersent",
                `Click here to sign in: ${url}`,
                []
              );
            },
          }),
        ]
      : []),
  ],
  advanced: {
    crossSubDomainCookies: {
      enabled: isProduction,
    },
    defaultCookieAttributes: {
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
    },
  },
});

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

export const getBearerToken = (headers: Headers): string | null => {
  const header = headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim() || null;
};

export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        // Allow internal API key auth (e.g. from telegram bot)
        const apiKey = headers.get("x-internal-api-key");
        const userId = headers.get("x-user-id");
        if (apiKey && userId && INTERNAL_API_KEY && apiKey === INTERNAL_API_KEY) {
          const dbUser = await db.query.user.findFirst({
            where: eq(userTable.id, userId),
          });
          if (!dbUser) return status(401);
          return {
            user: dbUser as any,
            session: null as any,
          };
        }

        // Allow CLI access tokens issued by the device authorization flow
        const bearerToken = getBearerToken(headers);
        if (bearerToken) {
          const cliUser = await resolveCliToken(bearerToken);
          if (!cliUser) return status(401);
          return {
            user: cliUser as any,
            session: null as any,
          };
        }

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
