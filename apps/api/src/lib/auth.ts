import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, deviceAuthorization, magicLink } from "better-auth/plugins";

import { db } from "../db";
import { user as userTable } from "@bettersent/db/schema";
import { eq } from "drizzle-orm";
import Elysia from "elysia";
import { createEmailService } from "../services/email";
import { isProduction } from "../shared/env";

// Pinned via the manifest "key" in apps/extension/wxt.config.ts
const EXTENSION_ORIGIN = "chrome-extension://fbimedfnalioofncdcpcojjfkdfknlol";

const trustedOrigins = [
  ...(process.env.TRUSTED_ORIGINS
    ? process.env.TRUSTED_ORIGINS.split(",")
    : ["http://localhost:5173"]),
  EXTENSION_ORIGIN,
];

// Web app origin — hosts the /device approval page for the CLI login flow
const WEB_APP_URL = process.env.WEB_APP_URL || trustedOrigins[0];

export const CLI_CLIENT_ID = "bettersent-cli";

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
    // CLI login: OAuth 2.0 Device Authorization Grant (bettersent login)
    deviceAuthorization({
      expiresIn: "10m",
      interval: "5s",
      verificationUri: `${WEB_APP_URL}/device`,
      validateClient: (clientId) => clientId === CLI_CLIENT_ID,
    }),
    // Lets the CLI call the API with Authorization: Bearer <session token>
    bearer(),
    // Magic-link sign-in: always on outside production, and in production only
    // when switched on explicitly. Self-hosted, it is the way in when Google
    // OAuth is not configured for the deployment's domain.
    ...(!isProduction || process.env.ENABLE_MAGIC_LINK === "1"
      ? [
          magicLink({
            // better-auth defaults to 5 minutes, which is tight when the link
            // has to be fetched out of the logs and handed over by a person.
            expiresIn: Number(process.env.MAGIC_LINK_TTL ?? 3600),
            sendMagicLink: async ({ email, url }) => {
              // A magic-link URL grants a session, so printing one is a
              // deliberate escape hatch for hosts with no mail delivery
              // configured. Off unless asked for.
              const logLink = process.env.MAGIC_LINK_LOG === "1";
              if (logLink) {
                console.log(`[magic-link] ${email} -> ${url}`);
              }
              try {
                const emailService = createEmailService();
                await emailService.sendEmail(
                  email,
                  "Sign in to Bettersent",
                  `Click here to sign in: ${url}`,
                  []
                );
              } catch (error) {
                // When the link has been logged there is still a usable way in,
                // so a mail failure should not fail the request.
                if (!logLink) throw error;
                console.error("[magic-link] email delivery failed:", error);
              }
            },
          }),
        ]
      : []),
  ],
  advanced: {
    // The web app and the API live on sibling hostnames (bettersent.holod.dev
    // and bettersent-api.holod.dev). Left to itself better-auth scopes the
    // session cookie to the API's own hostname, which a sibling host never
    // receives — so the app could never see the session. COOKIE_DOMAIN is the
    // shared parent to scope it to instead.
    //
    // That parent is shared with other services, so the cookie is also given a
    // distinct name: the default prefix would collide with any other
    // better-auth app on the same domain.
    cookiePrefix: "bettersent",
    crossSubDomainCookies: {
      enabled: isProduction,
      ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
    },
    defaultCookieAttributes: {
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
    },
  },
});

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

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
