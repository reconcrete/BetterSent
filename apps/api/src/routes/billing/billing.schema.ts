import { t } from "elysia";
import { baseResponseSchema } from "../../shared/schemas/api";

export const checkoutOutputSchema = baseResponseSchema(
  t.Object({
    url: t.String(),
  })
);

export const portalOutputSchema = baseResponseSchema(
  t.Object({
    url: t.String(),
  })
);

export const billingStatusOutputSchema = baseResponseSchema(
  t.Object({
    plan: t.Union([t.Literal("free"), t.Literal("pro")]),
    status: t.String(),
    usage: t.Object({
      extractionCount: t.Number(),
      extractionLimit: t.Number(),
      topicCount: t.Number(),
      topicLimit: t.Number(),
    }),
    currentPeriodEnd: t.Nullable(t.String()),
    cancelAtPeriodEnd: t.Boolean(),
  })
);
