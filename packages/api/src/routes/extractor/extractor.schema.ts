import { t } from "elysia";
import { baseResponseSchema } from "../../shared/schemas/api";

export const extractTextInputSchema = t.Object({
  textContent: t.String({ minLength: 1 }),
});

export const extractUrlInputSchema = t.Object({
  url: t.String({ minLength: 1 }),
});

export const extractOutputSchema = baseResponseSchema(
  t.Object({
    markdown: t.String(),
    filename: t.String(),
    savedAt: t.String(),
  })
);
