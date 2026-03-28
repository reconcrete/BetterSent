import Elysia from "elysia";

import { authMiddleware } from "../../lib/auth";
import { log } from "../../lib/logger";
import {
  createCheckoutSession,
  createPortalSession,
  getSubscriptionStatus,
  handleWebhookEvent,
} from "./billing.service";
import {
  checkoutOutputSchema,
  portalOutputSchema,
  billingStatusOutputSchema,
} from "./billing.schema";

export const billingRouter = new Elysia({ prefix: "/billing" })
  .use(authMiddleware)
  .post(
    "/checkout",
    async ({ user, set }) => {
      try {
        const url = await createCheckoutSession(user.id, user.email);
        return { success: true, data: { url } };
      } catch (error) {
        log.error({ error }, "Checkout session error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, response: checkoutOutputSchema }
  )
  .post(
    "/portal",
    async ({ user, set }) => {
      try {
        const url = await createPortalSession(user.id);
        return { success: true, data: { url } };
      } catch (error) {
        log.error({ error }, "Portal session error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, response: portalOutputSchema }
  )
  .get(
    "/status",
    async ({ user, set }) => {
      try {
        const status = await getSubscriptionStatus(user.id);
        return { success: true, data: status };
      } catch (error) {
        log.error({ error }, "Billing status error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, response: billingStatusOutputSchema }
  );

export const billingWebhookRouter = new Elysia({ prefix: "/billing" })
  .onParse(async ({ request }) => {
    return await request.text();
  })
  .post("/webhook", async ({ body, request, set }) => {
    try {
      const rawBody = body as string;
      const signature = request.headers.get("stripe-signature");

      if (!signature) {
        set.status = 400;
        return { error: "Missing stripe-signature header" };
      }

      await handleWebhookEvent(rawBody, signature);
      return { received: true };
    } catch (error) {
      log.error({ error: error instanceof Error ? error.message : error }, "Webhook error");
      set.status = 400;
      return { error: "Webhook processing failed" };
    }
  });
