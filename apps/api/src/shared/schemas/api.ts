import { t, type TSchema } from "elysia";

export const baseResponseSchema = <T extends TSchema>(dataSchema: T) => ({
  200: t.Object({
    success: t.Literal(true),
    data: dataSchema,
  }),
  403: t.Object({
    success: t.Literal(false),
    error: t.String(),
  }),
  429: t.Object({
    success: t.Literal(false),
    error: t.String(),
  }),
  500: t.Object({
    success: t.Literal(false),
    error: t.String(),
  }),
});
