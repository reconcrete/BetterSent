import { eq, and, sql } from "drizzle-orm";

import { db } from "../../db";
import { subscription, usageRecord } from "@bettersent/db/schema";
import { stripe } from "../../lib/stripe";
import { log } from "../../lib/logger";
import { UsageLimitError, FeatureLockedError } from "./billing.errors";

const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!;
const FRONTEND_URL = process.env.CORS_ORIGIN || "http://localhost:5173";

const FREE_EXTRACTION_LIMIT = 5;
const PRO_EXTRACTION_LIMIT = 500;
const PRO_TOPIC_LIMIT = 50;

type Plan = "free" | "pro";
type ExtractionType = "url" | "text" | "file" | "youtube" | "topic";

// --- Stripe Customer ---

export const getOrCreateStripeCustomer = async (userId: string, email: string): Promise<string> => {
  const existing = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (existing) return existing.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await db.insert(subscription).values({
    id: crypto.randomUUID(),
    userId,
    stripeCustomerId: customer.id,
    status: "inactive",
  });

  log.info({ userId, stripeCustomerId: customer.id }, "Stripe customer created");

  return customer.id;
};

// --- Checkout & Portal ---

export const createCheckoutSession = async (userId: string, email: string): Promise<string> => {
  const stripeCustomerId = await getOrCreateStripeCustomer(userId, email);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: STRIPE_PRO_PRICE_ID, quantity: 1 }],
    success_url: `${FRONTEND_URL}/settings?checkout=success`,
    cancel_url: `${FRONTEND_URL}/settings?checkout=cancel`,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session");
  }

  log.info({ userId }, "Checkout session created");
  return session.url;
};

export const createPortalSession = async (userId: string): Promise<string> => {
  const sub = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!sub) {
    throw new Error("No subscription found");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${FRONTEND_URL}/settings`,
  });

  return session.url;
};

// --- Helpers ---

const getSubscriptionPeriod = (stripeSubscription: { items: { data: Array<{ current_period_start: number; current_period_end: number }> } }) => {
  const item = stripeSubscription.items.data[0];
  if (!item) throw new Error("Subscription has no items");
  return {
    start: new Date(item.current_period_start * 1000),
    end: new Date(item.current_period_end * 1000),
  };
};

// --- Webhook ---

export const handleWebhookEvent = async (rawBody: string, signature: string): Promise<void> => {
  const event = await stripe.webhooks.constructEventAsync(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );

  log.info({ type: event.type }, "Stripe webhook received");

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;

      if (!stripeSubscriptionId) break;

      const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      const period = getSubscriptionPeriod(stripeSubscription);

      await db
        .update(subscription)
        .set({
          stripeSubscriptionId,
          stripePriceId: stripeSubscription.items.data[0]?.price.id,
          status: "active",
          currentPeriodStart: period.start,
          currentPeriodEnd: period.end,
        })
        .where(eq(subscription.stripeCustomerId, stripeCustomerId));

      // Create initial usage record
      const sub = await db
        .select()
        .from(subscription)
        .where(eq(subscription.stripeCustomerId, stripeCustomerId))
        .limit(1)
        .then((rows) => rows[0]);

      if (sub) {
        await getOrCreateUsageRecord(sub.userId, period.start, period.end);
      }

      log.info({ stripeCustomerId, stripeSubscriptionId }, "Subscription activated");
      break;
    }

    case "customer.subscription.updated": {
      const stripeSubscription = event.data.object;
      const stripeCustomerId = stripeSubscription.customer as string;
      const updatedPeriod = getSubscriptionPeriod(stripeSubscription);

      await db
        .update(subscription)
        .set({
          status: stripeSubscription.status,
          stripePriceId: stripeSubscription.items.data[0]?.price.id,
          currentPeriodStart: updatedPeriod.start,
          currentPeriodEnd: updatedPeriod.end,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        })
        .where(eq(subscription.stripeCustomerId, stripeCustomerId));

      // Create new usage record if period changed (renewal)
      const sub = await db
        .select()
        .from(subscription)
        .where(eq(subscription.stripeCustomerId, stripeCustomerId))
        .limit(1)
        .then((rows) => rows[0]);

      if (sub) {
        await getOrCreateUsageRecord(sub.userId, updatedPeriod.start, updatedPeriod.end);
      }

      log.info({ stripeCustomerId, status: stripeSubscription.status }, "Subscription updated");
      break;
    }

    case "customer.subscription.deleted": {
      const stripeSubscription = event.data.object;
      const stripeCustomerId = stripeSubscription.customer as string;

      await db
        .update(subscription)
        .set({
          status: "canceled",
          cancelAtPeriodEnd: false,
        })
        .where(eq(subscription.stripeCustomerId, stripeCustomerId));

      log.info({ stripeCustomerId }, "Subscription canceled");
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const stripeCustomerId = invoice.customer as string;

      await db
        .update(subscription)
        .set({ status: "past_due" })
        .where(eq(subscription.stripeCustomerId, stripeCustomerId));

      log.warn({ stripeCustomerId }, "Payment failed");
      break;
    }
  }
};

// --- Usage ---

const getFreePeriod = (): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
};

const getOrCreateUsageRecord = async (
  userId: string,
  periodStart: Date,
  periodEnd: Date,
) => {
  const existing = await db
    .select()
    .from(usageRecord)
    .where(
      and(
        eq(usageRecord.userId, userId),
        eq(usageRecord.periodStart, periodStart),
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (existing) return existing;

  const id = crypto.randomUUID();
  const [created] = await db
    .insert(usageRecord)
    .values({ id, userId, periodStart, periodEnd })
    .onConflictDoNothing()
    .returning();

  // In case of race condition, re-fetch
  if (!created) {
    return db
      .select()
      .from(usageRecord)
      .where(
        and(
          eq(usageRecord.userId, userId),
          eq(usageRecord.periodStart, periodStart),
        )
      )
      .limit(1)
      .then((rows) => rows[0]!);
  }

  return created;
};

const getUserPlan = async (userId: string): Promise<{ plan: Plan; sub: typeof subscription.$inferSelect | null }> => {
  const sub = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (sub && sub.status === "active") {
    return { plan: "pro", sub };
  }

  return { plan: "free", sub };
};

export const getSubscriptionStatus = async (userId: string) => {
  const { plan, sub } = await getUserPlan(userId);

  let periodStart: Date;
  let periodEnd: Date;

  if (plan === "pro" && sub?.currentPeriodStart && sub?.currentPeriodEnd) {
    periodStart = sub.currentPeriodStart;
    periodEnd = sub.currentPeriodEnd;
  } else {
    const freePeriod = getFreePeriod();
    periodStart = freePeriod.start;
    periodEnd = freePeriod.end;
  }

  const record = await getOrCreateUsageRecord(userId, periodStart, periodEnd);

  return {
    plan,
    status: sub?.status ?? "inactive",
    usage: {
      extractionCount: record.extractionCount,
      extractionLimit: plan === "pro" ? PRO_EXTRACTION_LIMIT : FREE_EXTRACTION_LIMIT,
      topicCount: record.topicCount,
      topicLimit: plan === "pro" ? PRO_TOPIC_LIMIT : 0,
    },
    currentPeriodEnd: periodEnd.toISOString(),
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
  };
};

export const checkAndIncrementUsage = async (
  userId: string,
  extractionType: ExtractionType,
): Promise<void> => {
  const { plan, sub } = await getUserPlan(userId);

  // Feature gating
  if (plan === "free" && (extractionType === "youtube" || extractionType === "topic")) {
    throw new FeatureLockedError(
      `${extractionType === "youtube" ? "YouTube" : "Topic"} extraction requires a Pro subscription.`
    );
  }

  // Determine period
  let periodStart: Date;
  let periodEnd: Date;

  if (plan === "pro" && sub?.currentPeriodStart && sub?.currentPeriodEnd) {
    periodStart = sub.currentPeriodStart;
    periodEnd = sub.currentPeriodEnd;
  } else {
    const freePeriod = getFreePeriod();
    periodStart = freePeriod.start;
    periodEnd = freePeriod.end;
  }

  const record = await getOrCreateUsageRecord(userId, periodStart, periodEnd);
  const limit = plan === "pro" ? PRO_EXTRACTION_LIMIT : FREE_EXTRACTION_LIMIT;

  // Check extraction limit
  if (record.extractionCount >= limit) {
    throw new UsageLimitError(
      `You've reached your monthly limit of ${limit} extractions.${plan === "free" ? " Upgrade to Pro for 500 extractions/month." : ""}`,
      limit,
      record.extractionCount,
    );
  }

  // Check topic sub-limit
  if (extractionType === "topic" && record.topicCount >= PRO_TOPIC_LIMIT) {
    throw new UsageLimitError(
      `You've reached your monthly limit of ${PRO_TOPIC_LIMIT} topic generations.`,
      PRO_TOPIC_LIMIT,
      record.topicCount,
    );
  }

  // Atomically increment
  const isTopic = extractionType === "topic";
  await db
    .update(usageRecord)
    .set({
      extractionCount: sql`${usageRecord.extractionCount} + 1`,
      ...(isTopic && { topicCount: sql`${usageRecord.topicCount} + 1` }),
    })
    .where(eq(usageRecord.id, record.id));
};
