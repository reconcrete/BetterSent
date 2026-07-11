import { t } from "elysia";
import { baseResponseSchema } from "../../shared/schemas/api";

export const deviceCodeInputSchema = t.Object({
  hostname: t.Optional(t.String({ maxLength: 100 })),
});

export const deviceCodeOutputSchema = baseResponseSchema(
  t.Object({
    deviceCode: t.String(),
    userCode: t.String(),
    verificationUrl: t.String(),
    verificationUrlComplete: t.String(),
    expiresIn: t.Number(),
    interval: t.Number(),
  })
);

export const deviceTokenInputSchema = t.Object({
  deviceCode: t.String({ minLength: 1, maxLength: 256 }),
});

export const deviceTokenOutputSchema = {
  ...baseResponseSchema(
    t.Object({
      token: t.String(),
      user: t.Object({
        id: t.String(),
        email: t.String(),
        name: t.String(),
      }),
    })
  ),
  // The CLI keeps polling on 202 and gives up on 400/404.
  202: t.Object({
    success: t.Literal(false),
    error: t.String(),
  }),
  400: t.Object({
    success: t.Literal(false),
    error: t.String(),
  }),
  404: t.Object({
    success: t.Literal(false),
    error: t.String(),
  }),
};

export const deviceStatusOutputSchema = {
  ...baseResponseSchema(
    t.Object({
      userCode: t.String(),
      hostname: t.Nullable(t.String()),
      status: t.Union([t.Literal("pending"), t.Literal("approved"), t.Literal("denied")]),
      expiresAt: t.String(),
    })
  ),
  400: t.Object({
    success: t.Literal(false),
    error: t.String(),
  }),
  404: t.Object({
    success: t.Literal(false),
    error: t.String(),
  }),
};

export const deviceDecisionOutputSchema = {
  ...baseResponseSchema(
    t.Object({
      userCode: t.String(),
      status: t.Union([t.Literal("approved"), t.Literal("denied")]),
    })
  ),
  400: t.Object({
    success: t.Literal(false),
    error: t.String(),
  }),
  404: t.Object({
    success: t.Literal(false),
    error: t.String(),
  }),
};

export const logoutOutputSchema = baseResponseSchema(
  t.Object({
    revoked: t.Boolean(),
  })
);
