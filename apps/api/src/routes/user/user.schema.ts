import { t } from "elysia";
import { baseResponseSchema } from "../../shared/schemas/api";

export const userProfileSchema = t.Object({
  id: t.String(),
  email: t.String(),
  name: t.String(),
  createdAt: t.String(),
});

export const updateProfileInputSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
});

export const userProfileOutputSchema = baseResponseSchema(userProfileSchema);
