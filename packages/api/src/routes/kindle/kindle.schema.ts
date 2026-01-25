import { t } from "elysia";
import { baseResponseSchema } from "../../shared/schemas/api";

export const kindleEmailSchema = t.Object({
  id: t.String(),
  email: t.String(),
  label: t.Nullable(t.String()),
  isDefault: t.Boolean(),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export const kindleEmailArraySchema = t.Array(kindleEmailSchema);

export const createKindleEmailInputSchema = t.Object({
  email: t.String({ format: "email" }),
  label: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  isDefault: t.Optional(t.Boolean()),
});

export const updateKindleEmailInputSchema = t.Object({
  email: t.Optional(t.String({ format: "email" })),
  label: t.Optional(t.Nullable(t.String({ minLength: 1, maxLength: 100 }))),
});

export const kindleEmailOutputSchema = baseResponseSchema(kindleEmailSchema);
export const kindleEmailArrayOutputSchema = baseResponseSchema(kindleEmailArraySchema);
